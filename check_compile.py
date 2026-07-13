import py_compile
import os
import sys

d = r"c:\Users\atooz\Programming\NEOS\neos-operating-system\agent\src\neos_agent\db\models_pkg"
py_files = sorted(f for f in os.listdir(d) if f.endswith(".py"))
errors = []
for f in py_files:
    path = os.path.join(d, f)
    try:
        py_compile.compile(path, doraise=True)
        print(f"  OK: {f}")
    except py_compile.PyCompileError as e:
        print(f"  FAIL: {f} -> {e}")
        errors.append(f)

print(f"\n{len(py_files)} files checked, {len(errors)} errors")
if errors:
    sys.exit(1)
