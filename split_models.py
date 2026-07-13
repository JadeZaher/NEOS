import os, re, pathlib, textwrap

old_path = r"c:\\Users\\atooz\\Programming\\NEOS\\neos-operating-system\\agent\\src\\neos_agent\\db\\models.py"
new_dir = r"c:\\Users\\atooz\\Programming\\NEOS\\neos-operating-system\\agent\\src\\neos_agent\\db\\models"
os.makedirs(new_dir, exist_ok=True)

content = pathlib.Path(old_path).read_text(encoding='utf-8')
# Capture all import/header lines before the first class definition
header_match = re.search(r'^(.*?)(?=^class\s)', content, flags=re.DOTALL | re.MULTILINE)
header = header_match.group(1) if header_match else ''
# Regex to capture each top-level class definition including its body (indented lines)
class_blocks = re.finditer(r'^(class\s+\w+\(.*?\):\n(?:[ \t]+.*\n)+)', content, flags=re.MULTILINE)
for match in class_blocks:
    block = match.group(1)
    name_match = re.search(r'class\s+(\w+)', block)
    if not name_match:
        continue
    class_name = name_match.group(1)
    file_path = pathlib.Path(new_dir) / f"{class_name.lower()}.py"
    # Write header plus class block
    file_path.write_text(header + "\n" + block + "\n", encoding='utf-8')
    print(f"Created {file_path}")
