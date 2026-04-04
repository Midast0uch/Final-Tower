# AGENTS.md — Tower Defense Game

Primary instructions for AI agents working on the Tower Defense project.  
This file never needs manual updates — hooks and bootstrap scripts fetch live state from the coordinate database where applicable.

## WHAT THIS PROJECT IS
A browser-based 3D Tower Defense game built as a single `tower-defense.html` file.  
It uses Three.js (via CDN) for rendering, with a **full voxel art style** — all terrain, enemies, towers, environmental details, and paths are constructed from box-based voxel meshes with PBR materials, edge outlines, and atmospheric effects.

**Visual Design: Voxel Aesthetic**
- **Terrain**: Layered grass/dirt/stone voxel blocks with visible edge lines (`EdgesGeometry` + `LineSegments`)
- **Enemies**: 7 distinct voxel enemy types (basic, fast, tank, sniper, burrowing, spawner, boss) built from 5-15 voxel boxes each with integrated voxel eyes/mouth
- **Towers**: 5 voxel tower types (BASIC, SNIPER, CANNON, SLOW, TRAP) with PBR materials and barrel tracking
- **Environment**: Voxel pine/oak trees, bushes with berries, mushrooms, gas barrels, statues, rocks, flowers
- **Paths**: Voxel path tiles with edge lines and directional arrow indicators
- **Lighting**: PBR `MeshStandardMaterial` throughout, ACES filmic tone mapping, PCF soft shadows, exponential fog
- **UI**: Pixel-art tower card icons, voxel 3D text for title/game-over screens, yellow wave announcements

**Build objective**: Deliver a **fully functional Tower Defense game** with **all features implemented** and **complete UI/UX design working** (tower selection, placement validation, wave system, resource management, enemy AI, combat, win/loss conditions, visual feedback, and polished player experience).

Full roadmap and goals live in: `bootstrap/GOALS.md` (if present) or defined in this document.

**Project Locations**
- Main game: `opencode-test/tower defense`
- Bootstrap scripts & coordinate system: `opencode-test/bootstrap`

## STEP 0 — RUN THIS BEFORE ANYTHING ELSE
```bash
python bootstrap/session_start.py
```
Reads the live coordinate database. Tells you current gate/phase, permanent landmarks, gradient warnings, active tasks, and where the last session left off.

**Do not plan, do not edit files, do not read code until you have run this.**

## STEP 1 — CHECK AVAILABLE WORK
```bash
python bootstrap/agent_context.py
```
Shows what's available to build, what other agents are currently working on, and relevant warnings. Use this to decide what to work on this session.

## STEP 1.5 — NAVIGATE THE GRAPH BEFORE TOUCHING ANY FILE
The coordinate database is a navigation instrument with semantic, pheromone, and episodic layers.

**Semantic layer (what IS true — always current):**
```bash
python bootstrap/query_graph.py --file tower-defense.html
```
Shows topology, trajectory, confidence, and reinforced edges for the file.

**Pheromone routes (where to go):**
```bash
python bootstrap/query_graph.py --routes
```

**High-signal failures (what not to repeat):**
```bash
python bootstrap/query_graph.py --failures
```

**Episodic layer:**
```bash
python bootstrap/query_graph.py --recent
python bootstrap/query_graph.py --summary
```

## PLATFORM NOTES
- Primary development: Windows + browser (Chrome/Firefox recommended)
- Use local HTTP server for testing:
  ```bash
  python -m http.server 8080
  ```
  Then open: http://localhost:8080/tower-defense.html
- Alternatively, use VS Code Live Server extension.

## DEVELOPMENT WORKFLOW

### Getting Started
1. Run `python bootstrap/session_start.py` — this auto-records a new session if none exists for today
2. Check available work with `python bootstrap/agent_context.py`
3. Navigate to `opencode-test/tower defense`
4. Open `tower-defense.html` in browser (via local server)

### Making Changes
- Edit `tower-defense.html` directly
- Refresh browser to see changes
- Use browser developer tools (F12) for debugging
- Check console for error messages and logs

### Testing
- Manual testing through gameplay
- No automated test suite currently exists
- Test specific features:
  - Wave progression: Click "START WAVE" button
  - Tower placement: Select tower type and click on grass tiles
  - Enemy behavior: Observe path following and combat
  - UI updates: Watch energy, seals, lives, and wave counters

### Debugging
- Use `console.log()` statements throughout the code for tracing
- Breakpoints can be set in browser dev tools
- Common issues:
  - Three.js initialization errors
  - Pathfinding logic
  - Tower placement validation
  - Enemy spawning and movement

## HOW TO BUILD / MODIFY ANYTHING
1. Read relevant section of this file + coordinate graph for the file/area
2. Make minimal, focused change
3. Refresh browser and manually test the affected feature
4. Record the action to build the pheromone trail

After any edit:
```bash
python bootstrap/record_event.py --type file_edit --file tower-defense.html --desc "what changed and why"
```

After creating new functionality or fixing a bug:
```bash
python bootstrap/record_event.py --type note --desc "reasoning for the change"
```

## CODE STYLE GUIDELINES

### JavaScript/ES6 Standards
- Use ES6+ features (const, let, arrow functions, destructuring)
- Prefer `const` for variables that won't be reassigned
- Use `let` for variables that will change
- Avoid `var` entirely
- Use template literals, arrow functions, and destructuring

### Formatting
- Indentation: 2 spaces
- Line length: max 100 characters (prefer 80)
- Braces: opening on same line, closing on its own line
- Semicolons: required
- Quotes: single quotes for strings (double only for HTML attributes)
- Space around operators and after commas

### Naming Conventions
- Variables & functions: camelCase (`gameState`, `spawnEnemy`)
- Constants: UPPER_SNAKE_CASE (`CONFIG`, `TOWER_TYPES`)
- Boolean variables: prefix with `is`, `has`, `should`
- Files: kebab-case

### Three.js Specific Guidelines
- Set `castShadow` / `receiveShadow` appropriately
- Use `MeshStandardMaterial` for PBR shading (roughness/metalness)
- Use `EdgesGeometry` + `LineSegments` for voxel edge outlines on terrain and path tiles
- Dispose geometries and materials when removing objects
- Keep render loop lean
- Renderer: `PCFSoftShadowMap`, `ACESFilmicToneMapping`, exposure ~1.35
- Scene: `FogExp2` for depth, brighter ambient/directional/hemisphere lights

### Performance & Error Handling
- Minimize DOM updates
- Reuse objects (object pooling where possible)
- Use try/catch in game loop to prevent crashes
- Validate inputs and check for null/undefined

(Full detailed code style, commenting with JSDoc, game state shape, color palette, and agent-specific instructions for @designer / @fixer / @explorer are maintained in the coordinate database and this document.)

## AGENT-SPECIFIC INSTRUCTIONS

### @designer
Focus on visual aesthetics, UI/UX, cartoon/vibrant style, color blindness friendliness, and visual feedback. Follow the established color palette.

### @fixer
Prioritize stability, bug fixes, edge cases, memory leaks, and pathfinding/tower placement validation.

### @explorer
Consider browser compatibility, performance, readability, and existing code patterns when researching solutions.

## PROJECT-SPECIFIC CONVENTIONS
- Wave numbering starts at 1
- Energy is primary resource for tower placement
- Seals earned from boss waves unlock new towers
- Lives = enemies that reach the end (0 lives = game over)
- Victory when all waves completed
- Towers only on non-path, non-occupied grass tiles
- Paths change each wave; new path options every 6 waves

## COMMIT & RECORDING GUIDELINES
Make small, focused changes.  
After meaningful work, always record to the coordinate database so the next agent (or future session) benefits from the pheromone trail and semantic updates.

**Critical Rule**: Never make large unrecorded changes. The coordinate graph is how agents coordinate and avoid repeating mistakes.

## SAFETY RAILS
- Never delete or overwrite large sections without reading the full current state via the graph
- Test changes manually in browser after every edit
- Record every significant action (edit, fix, design decision)
- Re-run `session_start.py` when switching contexts or after major sessions
- Run `python bootstrap/update_coordinates.py --auto --tasks "summary of what was done"` at the end of each session to finalize session recording
- Run `python bootstrap/update_coordinates.py --auto --tasks "summary of what was done"` at the end of each session to finalize session recording

**What "Done" Looks Like for a Task**
- Change works smoothly in browser
- No console errors
- Visuals and feedback feel good
- Action properly recorded in coordinate database

The coordinate database + bootstrap scripts keep agent memory alive across sessions.  
Read the graph. Build/test small. Record what works. Improve the trail.

**Final Anchor**: The project is complete when the game is **fully functional** with **all features and UI/UX design working** as a polished, playable Tower Defense experience.

Run `python bootstrap/session_start.py` now.
```