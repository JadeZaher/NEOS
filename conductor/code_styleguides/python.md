# Python Style Guide — NEOS

## General
- Python >=3.12 for agent service, 3.14 for scripts
- Use `async/await` throughout the Sanic service
- Scripts in neos-core/ use stdlib only, zero external dependencies

## Formatting
- 4-space indentation
- Max line length: 100 characters
- Use f-strings for string formatting
- Type hints on all function signatures

## Structure
- One script per file, clear single responsibility
- `if __name__ == "__main__":` guard on all scripts
- Docstring on every public function
- Exit codes: 0 = success, 1 = validation failure, 2 = error

## Naming
- `snake_case` for files, functions, variables
- `UPPER_CASE` for constants
- `PascalCase` for classes
- Descriptive names — `validate_skill_structure()` not `check()`

## API Endpoints (Sanic)
- RESTful naming: `/api/v1/<resource>`
- Use pydantic models for request/response validation
- Return consistent JSON shape: `{"data": ..., "error": ...}`
- Async handlers throughout
