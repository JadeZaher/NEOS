"""
Phase 2: Update all 54 SKILL.md files with expanded YAML frontmatter.

Reads ToolDef entries from governance_tools.py via AST, reads skill->tool
aliases from manifest.toml, and updates each SKILL.md with a target_tool
block in the YAML frontmatter.

This makes the codegen pipeline deterministic: the YAML IS the spec.
"""

import ast
import os
import re
import sys
import tomllib
from pathlib import Path

GOVERNANCE_TOOLS_PATH = Path(
    r"c:\Users\atooz\Programming\NEOS\neos-operating-system\agent\src\neos_agent\agent\governance_tools.py"
)
MANIFEST_PATH = Path(
    r"c:\Users\atooz\Programming\NEOS\neos-operating-system\agent\scratch\codegen\manifest.toml"
)
NEOS_CORE_PATH = Path(
    r"c:\Users\atooz\Programming\NEOS\neos-operating-system\neos-core"
)

# --- ORM model mapping (tool_name -> primary ORM model) ---
TOOL_MODEL_MAP = {
    "search_agreements": "Agreement",
    "get_agreement": "Agreement",
    "create_agreement_draft": "Agreement",
    "update_agreement_status": "Agreement",
    "check_authority": "Domain",
    "get_member_roles": "Member",
    "create_proposal": "Proposal",
    "record_advice": "AdviceEntry",
    "record_consent_position": "ConsentRecord",
    "check_quorum": "ConsentParticipant",
    "create_decision_record": "DecisionRecord",
    "search_precedents": "DecisionRecord",
    "get_domain": "Domain",
    "get_active_members": "Member",
    "create_conflict_case": "ConflictCase",
    "triage_conflict": "ConflictCase",
    "get_emergency_state": "EmergencyState",
    "declare_emergency": "EmergencyState",
    "create_exit_record": "ExitRecord",
    "create_domain_draft": "Domain",
    "create_ecosystem": "Ecosystem",
    "create_safeguard_audit": "GovernanceHealthAudit",
    "create_repair_agreement": "RepairAgreementRecord",
    "list_ecosystems": "Ecosystem",
    "get_ecosystem": "Ecosystem",
    "search_proposals": "Proposal",
    "get_proposal": "Proposal",
    "update_proposal_status": "Proposal",
    "list_domains": "Domain",
}

# --- Action type mapping ---
TOOL_ACTION_MAP = {
    "search_agreements": "search",
    "get_agreement": "read",
    "create_agreement_draft": "create",
    "update_agreement_status": "update",
    "check_authority": "read",
    "get_member_roles": "read",
    "create_proposal": "create",
    "record_advice": "create",
    "record_consent_position": "create",
    "check_quorum": "read",
    "create_decision_record": "create",
    "search_precedents": "search",
    "get_domain": "read",
    "get_active_members": "read",
    "create_conflict_case": "create",
    "triage_conflict": "update",
    "get_emergency_state": "read",
    "declare_emergency": "create",
    "create_exit_record": "create",
    "create_domain_draft": "create",
    "create_ecosystem": "create",
    "create_safeguard_audit": "create",
    "create_repair_agreement": "create",
    "list_ecosystems": "read",
    "get_ecosystem": "read",
    "search_proposals": "search",
    "get_proposal": "read",
    "update_proposal_status": "update",
    "list_domains": "read",
}


def extract_tooldefs_from_ast(filepath: Path) -> dict[str, dict]:
    """Extract ToolDef entries from governance_tools.py using AST."""
    with open(filepath, "r", encoding="utf-8") as f:
        source = f.read()
    
    tree = ast.parse(source)
    tools = {}
    
    for node in ast.walk(tree):
        # Find: GOVERNANCE_TOOLS: list[ToolDef] = [...]
        if isinstance(node, (ast.Assign, ast.AnnAssign)):
            targets = []
            if isinstance(node, ast.Assign):
                targets = node.targets
            elif isinstance(node, ast.AnnAssign) and node.target:
                targets = [node.target]
            
            for target in targets:
                if isinstance(target, ast.Name) and target.id == "GOVERNANCE_TOOLS":
                    value = node.value
                    if isinstance(value, ast.List):
                        for elt in value.elts:
                            tool = _parse_tooldef_call(elt, source)
                            if tool:
                                tools[tool["name"]] = tool
    return tools


def _parse_tooldef_call(node, source: str) -> dict | None:
    """Parse a single ToolDef(...) call node."""
    if not isinstance(node, ast.Call):
        return None
    
    result = {}
    for kw in node.keywords:
        key = kw.arg
        if key == "handler":
            # handler is a function reference, just get the name
            if isinstance(kw.value, ast.Name):
                result["handler_name"] = kw.value.id
            elif isinstance(kw.value, ast.Attribute):
                result["handler_name"] = kw.value.attr
        elif key == "name":
            try:
                result["name"] = ast.literal_eval(kw.value)
            except (ValueError, TypeError):
                return None
        elif key == "description":
            try:
                result["description"] = ast.literal_eval(kw.value)
            except (ValueError, TypeError):
                # Try extracting from source
                result["description"] = ""
        elif key == "parameters":
            try:
                result["parameters"] = ast.literal_eval(kw.value)
            except (ValueError, TypeError):
                result["parameters"] = {}
    
    return result if "name" in result else None


def load_aliases(manifest_path: Path) -> dict[str, str]:
    """Load skill->tool aliases from manifest.toml (manual parse to avoid Windows path issues)."""
    with open(manifest_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Extract just the [aliases] section
    aliases = {}
    in_aliases = False
    for line in content.split("\n"):
        line = line.strip()
        if line == "[aliases]":
            in_aliases = True
            continue
        if in_aliases:
            if line.startswith("[") or line.startswith("[["):
                break  # Next section
            if "=" in line and not line.startswith("#"):
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                aliases[key] = value
    return aliases


def find_skill_path(skill_id: str, neos_core: Path) -> Path | None:
    """Find the SKILL.md file for a given skill_id."""
    for layer_dir in sorted(neos_core.iterdir()):
        if layer_dir.is_dir() and layer_dir.name.startswith("layer-"):
            skill_dir = layer_dir / skill_id
            skill_file = skill_dir / "SKILL.md"
            if skill_file.exists():
                return skill_file
    return None


def build_yaml_frontmatter(
    existing_yaml: dict,
    tool_name: str,
    tooldef: dict,
    model_name: str,
    action: str,
) -> str:
    """Build the updated YAML frontmatter string."""
    lines = []
    lines.append("---")
    
    # Original fields
    lines.append(f"name: {existing_yaml.get('name', 'unknown')}")
    desc = existing_yaml.get('description', '')
    lines.append(f'description: "{desc}"')
    lines.append(f"layer: {existing_yaml.get('layer', 0)}")
    lines.append(f"version: {existing_yaml.get('version', '0.1.0')}")
    
    deps = existing_yaml.get('depends_on', [])
    if deps:
        lines.append(f"depends_on: [{', '.join(deps)}]")
    else:
        lines.append("depends_on: []")
    
    lines.append("")
    lines.append("# === Codegen v2: deterministic tool generation ===")
    lines.append("target_tool:")
    lines.append(f"  name: {tool_name}")
    
    # Description (escape for YAML)
    tool_desc = tooldef.get("description", "").replace('"', '\\"')
    lines.append(f'  description: "{tool_desc}"')
    
    lines.append(f"  handler: governance_tools.{tooldef.get('handler_name', tool_name)}")
    lines.append(f"  model: models.{model_name}")
    lines.append(f"  action: {action}")
    
    # Parameters
    params_def = tooldef.get("parameters", {})
    properties = params_def.get("properties", {})
    required_fields = set(params_def.get("required", []))
    
    if properties:
        lines.append("  parameters:")
        for param_name, param_spec in properties.items():
            is_required = param_name in required_fields
            param_type = param_spec.get("type", "string")
            param_desc = param_spec.get("description", "").replace('"', '\\"')
            
            # Handle array types
            if param_type == "array":
                items = param_spec.get("items", {})
                item_type = items.get("type", "string")
                param_type = f"array[{item_type}]"
            
            lines.append(f"    - name: {param_name}")
            lines.append(f"      type: {param_type}")
            lines.append(f"      required: {'true' if is_required else 'false'}")
            lines.append(f'      description: "{param_desc}"')
    else:
        lines.append("  parameters: []")
    
    lines.append("---")
    return "\n".join(lines)


def parse_existing_yaml(content: str) -> tuple[dict, str]:
    """Parse existing YAML frontmatter and return (yaml_dict, body)."""
    if not content.startswith("---"):
        return {}, content
    
    # Find closing ---
    end_idx = content.index("---", 3)
    yaml_block = content[3:end_idx].strip()
    body = content[end_idx + 3:].lstrip("\n")
    
    # Simple YAML parsing (fields we care about)
    result = {}
    for line in yaml_block.split("\n"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" in line:
            key, _, value = line.partition(":")
            key = key.strip()
            value = value.strip()
            
            # Strip quotes
            if value.startswith('"') and value.endswith('"'):
                value = value[1:-1]
            elif value.startswith("'") and value.endswith("'"):
                value = value[1:-1]
            
            # Parse lists
            if value.startswith("[") and value.endswith("]"):
                inner = value[1:-1].strip()
                if inner:
                    value = [s.strip().strip("'\"") for s in inner.split(",")]
                else:
                    value = []
            
            # Parse numbers
            elif value.isdigit():
                value = int(value)
            
            result[key] = value
    
    return result, body


def main():
    print("=== Phase 2: YAML Frontmatter Update ===\n")
    
    # 1. Extract ToolDefs from governance_tools.py
    print("Extracting ToolDefs from governance_tools.py...")
    tooldefs = extract_tooldefs_from_ast(GOVERNANCE_TOOLS_PATH)
    print(f"  Found {len(tooldefs)} ToolDef entries")
    
    # 2. Load skill->tool aliases
    print("Loading skill->tool aliases from manifest.toml...")
    aliases = load_aliases(MANIFEST_PATH)
    print(f"  Found {len(aliases)} aliases")
    
    # 3. Process each skill
    updated = 0
    skipped = 0
    errors = []
    
    for skill_id, tool_name in sorted(aliases.items()):
        skill_path = find_skill_path(skill_id, NEOS_CORE_PATH)
        if skill_path is None:
            errors.append(f"  SKIP: {skill_id} -- SKILL.md not found")
            skipped += 1
            continue
        
        if tool_name not in tooldefs:
            errors.append(f"  SKIP: {skill_id} -> {tool_name} -- tool not in governance_tools.py")
            skipped += 1
            continue
        
        tooldef = tooldefs[tool_name]
        model_name = TOOL_MODEL_MAP.get(tool_name, "Unknown")
        action = TOOL_ACTION_MAP.get(tool_name, "read")
        
        # Read existing content
        with open(skill_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Parse existing YAML
        existing_yaml, body = parse_existing_yaml(content)
        
        # Build new frontmatter
        new_frontmatter = build_yaml_frontmatter(
            existing_yaml, tool_name, tooldef, model_name, action
        )
        
        # Write updated file
        new_content = new_frontmatter + "\n\n" + body
        with open(skill_path, "w", encoding="utf-8", newline="\n") as f:
            f.write(new_content)
        
        param_count = len(tooldef.get("parameters", {}).get("properties", {}))
        print(f"  OK: {skill_id} -> {tool_name} ({param_count} params)")
        updated += 1
    
    print(f"\n=== Summary ===")
    print(f"  Updated: {updated}")
    print(f"  Skipped: {skipped}")
    if errors:
        print(f"\n  Errors/Skips:")
        for e in errors:
            print(f"    {e}")
    
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
