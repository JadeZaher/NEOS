## MuleRouter pi Configuration
*2026-05-05 00:14:51* **Tags:** #pi #config #mulerouter #qwen

Configured MuleRouter as a custom provider in pi via `~/.pi/agent/models.json`.

- **Base URL**: `https://api.mulerouter.ai/vendors/openai/v1`
- **API**: `openai-completions`
- **Auth**: Bearer token via `MULEROUTER_API_KEY` env var
- **Models added**:
  - `qwen3.6-plus` (primary coding model)
  - `qwen3.6-max-preview`
  - `qwen3-max`
  - `qwen3-max-thinking`
  - `grok-code-fast-1`

Config file: `C:/Users/atooz/.pi/agent/models.json`

To select a model in pi: use `/model` and pick from the MuleRouter models.


---
