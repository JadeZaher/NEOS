"""Split models.py into per-model files under models/ package.

Strategy:
1. Read the entire models.py
2. Extract the header (imports) and foundation classes (GUID, Base, TimestampMixin) into _base.py
3. Split each remaining top-level class into its own file
4. Each per-model file imports from ._base
5. Generate __init__.py that re-exports everything
"""

import re
import os
import shutil
import textwrap

SRC = r"c:\Users\atooz\Programming\NEOS\neos-operating-system\agent\src\neos_agent\db\models.py"
OUT_DIR = r"c:\Users\atooz\Programming\NEOS\neos-operating-system\agent\src\neos_agent\db\models_pkg"

# Read source
with open(SRC, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")

# --- Step 1: Find all top-level class definitions and their line ranges ---
class_defs = []  # list of (class_name, start_line_idx, bases_str)

for i, line in enumerate(lines):
    m = re.match(r'^class\s+(\w+)\s*\(([^)]*)\)\s*:', line)
    if m:
        class_defs.append((m.group(1), i, m.group(2).strip()))

# For each class, find where its body ends (next top-level class or end of file)
class_blocks = []
for idx, (name, start, bases) in enumerate(class_defs):
    if idx + 1 < len(class_defs):
        end = class_defs[idx + 1][1]
    else:
        end = len(lines)
    # Walk backwards from end to trim trailing blank lines
    while end > start and lines[end - 1].strip() == "":
        end -= 1
    # Also include any section comment lines above the class (lines starting with #)
    actual_start = start
    j = start - 1
    while j >= 0 and (lines[j].strip().startswith("#") or lines[j].strip() == ""):
        if lines[j].strip().startswith("#"):
            actual_start = j
        j -= 1
    class_blocks.append((name, actual_start, end, bases))

# --- Step 2: Identify foundation classes vs model classes ---
FOUNDATION_CLASSES = {"GUID", "Base", "TimestampMixin"}
foundation_blocks = [(n, s, e, b) for n, s, e, b in class_blocks if n in FOUNDATION_CLASSES]
model_blocks = [(n, s, e, b) for n, s, e, b in class_blocks if n not in FOUNDATION_CLASSES]

# --- Step 3: Extract the import header (everything before first class def) ---
first_class_line = class_blocks[0][1] if class_blocks else len(lines)
header_lines = lines[:first_class_line]
# Strip trailing blank lines from header
while header_lines and header_lines[-1].strip() == "":
    header_lines.pop()
header = "\n".join(header_lines)

# --- Step 4: Build _base.py ---
foundation_body_parts = []
for name, start, end, bases in foundation_blocks:
    foundation_body_parts.append("\n".join(lines[start:end]))

base_content = header + "\n\n\n" + "\n\n\n".join(foundation_body_parts) + "\n"

# --- Step 5: Prepare output directory ---
if os.path.exists(OUT_DIR):
    shutil.rmtree(OUT_DIR)
os.makedirs(OUT_DIR, exist_ok=True)

# Write _base.py
with open(os.path.join(OUT_DIR, "_base.py"), "w", encoding="utf-8", newline="\n") as f:
    f.write(base_content)
print(f"Wrote _base.py ({len(foundation_blocks)} foundation classes)")

# --- Step 6: Figure out which sqlalchemy imports each model needs ---
# Instead of trying to figure out minimal imports per file, each model file will:
#   - Import everything from _base (Base, GUID, TimestampMixin)
#   - Import the same sqlalchemy set as the header
# This is simple and correct. We can optimize later.

model_file_header = '''"""NEOS model: {class_name}."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import JSON, TypeDecorator, CHAR
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
)

from ._base import Base, GUID, TimestampMixin
'''

# --- Step 7: Write each model file ---
all_model_names = []
for name, start, end, bases in model_blocks:
    filename = name.lower() + ".py"
    class_body = "\n".join(lines[start:end])
    file_content = model_file_header.format(class_name=name) + "\n\n" + class_body + "\n"
    filepath = os.path.join(OUT_DIR, filename)
    with open(filepath, "w", encoding="utf-8", newline="\n") as f:
        f.write(file_content)
    all_model_names.append((name, filename))
    print(f"Wrote {filename} (lines {start+1}-{end})")

# --- Step 8: Write __init__.py ---
init_lines = [
    '"""Re-export all ORM model classes for convenient imports.',
    '',
    'Existing code using `from neos_agent.db.models import X` continues to work',
    'after the split into per-model files.',
    '"""',
    '',
    '# Foundation',
    'from ._base import Base, GUID, TimestampMixin  # noqa: F401',
    '',
    '# Models',
]
for class_name, filename in all_model_names:
    module_name = filename.replace(".py", "")
    init_lines.append(f"from .{module_name} import {class_name}  # noqa: F401")

init_lines.append("")
init_lines.append("__all__ = [")
init_lines.append('    "Base",')
init_lines.append('    "GUID",')
init_lines.append('    "TimestampMixin",')
for class_name, _ in all_model_names:
    init_lines.append(f'    "{class_name}",')
init_lines.append("]")
init_lines.append("")

init_content = "\n".join(init_lines)
with open(os.path.join(OUT_DIR, "__init__.py"), "w", encoding="utf-8", newline="\n") as f:
    f.write(init_content)
print(f"\nWrote __init__.py ({len(all_model_names)} model re-exports + 3 foundation)")
print(f"\nTotal files: {len(all_model_names) + 2} (1 _base + {len(all_model_names)} models + 1 __init__)")
