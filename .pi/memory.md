## Admin Quiz & Shares/Needs Management
*2026-05-09 05:14:02* **Tags:** #admin #quiz #shares-needs #management

**Admin Quiz & Shares/Needs Management Enhancement Plan**

### Backend (neos-operating-system/agent/src/neos_agent/api/discover.py)
- Add PUT `/discover/shares-needs/<id>` - update share/need
- Add POST `/discover/shares-needs/<id>/status` - change status (active→fulfilled/withdrawn)
- Add DELETE `/discover/shares-needs/<id>` - hard delete
- Add GET `/discover/shares-needs/admin` - list ALL items (admin view, not filtered by visibility/status)

### Frontend (charting-the-course/client/)
1. **API Client** (lib/api-client.ts) - Add update, delete, status update, admin list for shares/needs
2. **Hooks** (hooks/use-discover.ts) - Add mutations for update/delete/status
3. **AdminPanel.tsx** - Add new "Shares & Needs" tab with CRUD, stats cards, filters
4. **AdminPanel.tsx** - Enhance "Quizzes" tab with completion counts, entry quiz badge, publish toggle, link to results
5. **AppSidebar.tsx** - Add "Manage Shares & Needs" link in sidebar under Quiz Management group (rename to "Content Management")
6. **Routes** (App.tsx) - Add route for standalone shares-needs admin page if needed
7. **Seed data** - Already exists (8 items in seed_omnione.py), no changes needed

---
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
