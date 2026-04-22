# MCM SDK Local API Setup Plan
## Project: final-tower (C:\Users\midas\Desktop\Apps\final-tower)

---

## Phase 1: Understand Current State

### What Exists in final-tower Now

```
final-tower/
├── bootstrap/                  ← OLD MCM SYSTEM (to be removed)
│   ├── coordinates.py          ← old monolithic store (125KB)
│   ├── coordinates.db          ← YOUR DATA (409KB) — KEEP THIS
│   ├── kyudo.py               ← old health checks
│   ├── pin.py                 ← old pin CLI
│   ├── session_start.py       ← old session entry
│   ├── agent_context.py       ← old context builder
│   ├── debug.py               ← old debug tools
│   ├── query_graph.py         ← old graph queries
│   ├── record_event.py        ← old event recorder
│   ├── update_coordinates.py  ← old updater
│   └── signals/               ← old signal files
├── mcp-server/                ← OLD Node.js MCP server (to be removed)
│   ├── index.js
│   └── package.json
├── data/
│   ├── databases/
│   │   └── coordinates.db     ← backup DB (233KB) — KEEP
│   ├── iris.log
│   └── kyudo.log
└── tower-defense/             ← your actual project code
```

### The DB Compatibility Check

Your existing `coordinates.db` has 16 tables. The new SDK schema has 18 tables (added `checkpoints` and `memory_chain`).

**Good news:** The SDK uses `CREATE TABLE IF NOT EXISTS` — on first connection, it will automatically add the 2 missing tables and run all migrations (adding missing columns like `activation_count`, `z_trajectory`, `compound_count`, etc.).

**Your data is safe.** Nothing gets deleted. The DB just grows to match the new schema.

---

## Phase 2: Local API Architecture

### Goal
A FastAPI server running locally that wraps `MCMClient`. This proves the SDK works in a real project before you build the production API.

```
final-tower/
├── api/                        ← NEW: Local API server
│   ├── server.py              ← FastAPI app with endpoints
│   ├── auth.py                ← API key middleware
│   ├── config.py              ← Settings (DB path, key file)
│   └── keys.json              ← Local API keys (gitignored)
├── mcm_sdk/                   ← NEW: SDK installed here
│   └── (pip install from GitHub or local path)
├── coordinates.db             ← YOUR EXISTING DB (moved to root)
├── requirements.txt           ← NEW: dependencies
└── tower-defense/             ← your project
```

### API Endpoints (v0.1 Local)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Server + MCM health check |
| GET | `/state` | Full NBL state |
| POST | `/events/record` | Record a code event |
| GET | `/pins` | List/search pins |
| POST | `/pins` | Add a new pin |
| GET | `/topology/{file_path}` | Classify a file |
| GET | `/folders/tree` | Get folder tree |
| POST | `/kyudo/run` | Run health gate |
| GET | `/license` | Check current license tier |

### API Key Flow (Local Testing)

```
1. You generate a key:    mcm_pro_test_abc123
2. Store it in keys.json: {"mcm_pro_test_abc123": {"tier": "pro", "expires": null}}
3. Client sends header:   X-API-Key: mcm_pro_test_abc123
4. Server validates:      prefix matches → tier = pro → allow all endpoints
```

**For local testing:** Keys are stored in a JSON file. No database, no Stripe, no network calls.

**For production:** Replace `keys.json` with a database table + Stripe webhook integration.

---

## Phase 3: Scaling to Production (The Path)

### v0.1 — Local (What We're Building Now)
- FastAPI server on `localhost:8000`
- Keys in `api/keys.json`
- One project, one DB
- Purpose: Prove the SDK works, test the API shape

### v0.2 — Multi-Project Local
- Same server, but `project_id` in every request
- Each project gets its own SQLite file
- Keys still in JSON
- Purpose: Test multi-tenancy

### v0.3 — Production API (Stripe Integration)
- Deploy to VPS / cloud (Railway, Render, Fly.io)
- PostgreSQL instead of SQLite per project
- Stripe Checkout for payments
- Stripe webhook → creates API key in DB
- Key validation hits the server on every request
- Rate limiting per key
- Purpose: Real customers, real money

### v0.4 — Layer 2 (IRIS)
- Encrypted `mycelium.db` per user
- Multi-agent swarm support
- Priority queue for yearly subscribers
- Purpose: The full vision

---

## Phase 4: Step-by-Step Setup (What I Will Do)

### Step 1: Backup & Clean
```bash
# Rename old bootstrap (don't delete yet, just in case)
mv bootstrap bootstrap_old_mcm

# Keep the DB
mv bootstrap_old_mcm/coordinates.db ./coordinates.db

# Remove old MCP server
rm -rf mcp-server
```

### Step 2: Install SDK
```bash
# Option A: From your GitHub repo
pip install git+https://github.com/Midast0uch/MCM-SDK.git

# Option B: From local path (if you're editing SDK)
pip install -e /mnt/c/Users/midas/mcm-sdk
```

### Step 3: Create API Server
```bash
mkdir api
cat > api/server.py << 'EOF'
from fastapi import FastAPI, Depends, HTTPException, Header
from mcm import MCMClient
# ... endpoints
EOF
```

### Step 4: Generate Test Key
```python
# api/generate_key.py
import uuid
key = f"mcm_pro_test_{uuid.uuid4().hex[:12]}"
print(key)
# → mcm_pro_test_a1b2c3d4e5f6
```

### Step 5: Test
```bash
cd final-tower
python -m api.server
# → Server running at http://localhost:8000

# In another terminal:
curl -H "X-API-Key: mcm_pro_test_abc123" http://localhost:8000/health
curl -H "X-API-Key: mcm_pro_test_abc123" http://localhost:8000/state
```

---

## Key Design Decisions

### 1. Why FastAPI?
- Automatic OpenAPI docs at `/docs`
- Native async support
- Easy dependency injection (perfect for API key middleware)
- Python-native — same language as the SDK

### 2. Why Keep SQLite for Local?
- Your existing DB is SQLite
- Zero setup — just point to the file
- Proves the SDK's DB layer works
- Easy to migrate to PostgreSQL later (just change connection string)

### 3. API Key Format (Same as SDK)
```
mcm_free_xxx       → free tier (50 sessions, 100 pins)
mcm_trial_xxx      → 3-day trial
mcm_early_xxx      → 3-month early supporter
mcm_pro_xxx        → unlimited monthly
mcm_yearly_xxx     → unlimited yearly + priority
```

Local testing uses the same format. Production will validate against a server.

### 4. DB Ownership Model (Same as SDK)
- User owns their `coordinates.db`
- But the API provides the intelligence
- If they stop paying, their DB still works with the free tier locally
- This creates the dependency without being hostile

---

## What You'll Need to Do Manually

1. **GitHub auth** — The SDK pip install from GitHub requires your SSH key or a token
2. **Stripe account** — Only for v0.3 production (not needed now)
3. **VPS / cloud** — Only for v0.3 production (not needed now)

---

## Questions Before I Build

1. **Do you want me to proceed with the local API setup now?**
2. **Should I use the GitHub SDK or the local SDK path?** (GitHub = what users will use; local = easier if you're editing SDK)
3. **Should I keep the old bootstrap folder as backup or remove it entirely?**

Once you confirm, I'll execute Steps 1-5 in the final-tower project.
