# Tower Defense

A browser-based 3D Tower Defense game built with Three.js. Defend your tower against endless waves of increasingly difficult enemies by strategically placing turrets on a dynamically expanding map.

## Features

### Gameplay
- **Endless Waves** — Infinite waves with progressive difficulty scaling. Each wave introduces more and tougher enemies.
- **Dynamic Path Generation** — Enemy paths change every wave using 4 algorithms: Straight, Winding, Branching, and Maze. Paths always connect left-to-right across the map.
- **Expanding Map** — The map starts at 8×8 tiles and grows by 2 tiles in each direction after every boss wave (every 5 waves), providing more strategic space.
- **Boss Waves** — Every 5th wave features a powerful boss enemy with significantly more health and damage.

### Dynamic Map & Environment
- **Expanding Territory** — The map starts at 8×8 tiles and grows by 2 tiles in each direction after every boss wave (every 5 waves). Border walls dynamically expand to contain the new territory.
- **Rich Terrain Details** — Every new tile receives environmental details: pine trees, oak trees, bushes with berries, mushrooms, rock clusters, flower patches, and water puddles. All rendered in blocky Minecraft-style voxel aesthetics.
- **Interactive Hazards** — Gas barrels explode when damaged (area damage), brick walls are destructible obstacles, statues are indestructible landmarks, and rivers slow enemies passing through them.
- **Evolving Paths** — 8 path generation algorithms (Serpentine, Spiral, Zigzag, River, Switchback, Maze, Tendril, Chaos) create unique routes each wave. Complex types unlock progressively: Maze at wave 3+, Tendril at 6+, Chaos at 10+.

### Tower Types
| Tower | Cost | Description | Placement |
|-------|------|-------------|-----------|
| **Basic** (AUTO) | 20⚡ | Auto-firing turret with balanced range and damage | Grass only |
| **Sniper** (LONG) | 40⚡ | Long-range, high-damage, slow fire rate | Grass only |
| **Cannon** (AOE) | 60⚡ | Area-of-effect damage hitting multiple enemies | **Path or grass** |
| **Trap** (TRAP) | 35⚡ | Pressure-plate mine: enemies stepping on it trigger AOE spike burst (40 dmg, 2-tile radius), then enters 2.5s cooldown. Retractable spikes + red glow ring show armed/disarmed state | **Path or grass** |
| **Slow** (SLOW) | 45⚡ | Reduces enemy speed by 50% within range | Grass only |

### Enemy Types
- **Basic Mole** — Standard enemy with balanced stats
- **Fast Mole** — 1.8× speed, lower health
- **Tank Mole** — 2× health, slower movement
- **Sniper Mole** — High damage, moderate speed
- **Burrowing Mole** — Immune to ground-based turret effects
- **Spawner Mole** — Spawns 3 minion moles on death
- **Boss Mole** — Massive health and damage, appears every 5 waves

### Tower Blocking
Enemies cannot pass through turrets placed on their path. When an enemy encounters a turret, it stops and attacks it. The turret has health and will be destroyed if the enemy deals enough damage. This creates a strategic layer: place turrets as roadblocks to delay enemies, but they may be sacrificed in the process.

### Camera Controls
- **Scroll** — Zoom in/out
- **Click + Drag** — Rotate camera horizontally (when no tower selected)
- **Drag Up/Down** — Tilt camera vertically
- **Q/E** — Rotate left/right
- **W/S** — Zoom in/out
- **R/F** — Tilt up/down

### Resources
- **Energy (⚡)** — Used to build turrets. Regenerates over time. Earned by killing enemies.
- **Lives (❤)** — Start with 15. Lost when enemies reach the end of the path. Game over at 0.

## Getting Started

### Prerequisites
- A modern web browser (Chrome 80+, Firefox 75+, Edge 80+, Safari 13+)
- WebGL support

### How to Play
1. **Enter Name** — Type your name and click "START GAME"
2. **Main Menu** — Click "PLAY" to start
3. **Preparation Phase** — You have 60 seconds to place towers
4. **Start Wave** — Click "START WAVE" to spawn enemies
5. **Defend** — Towers automatically shoot enemies
6. **Survive** — Don't let enemies reach the end!

### Running Locally

**Quick start (game only, no AI taunts):**
```bash
python -m http.server 8080
# Then open http://localhost:8080/tower-defense.html
```

**Full experience with Seraph AI vision taunts:**
```bash
node server.js
# Then open http://localhost:8080/tower-defense.html
```
The Node server auto-starts a local llama.cpp vision model (port 9999) that analyzes the board in real-time and generates contextual taunts. Model files are cached in `models/` after first download. Seraph also uses your login name in taunts when the AI is active.

## Project Structure
```
opencode-test/
├── tower-defense.html    # Main game file (single-file application)
├── bootstrap/            # Coordinate database and agent workflow scripts
│   ├── session_start.py
│   ├── agent_context.py
│   ├── query_graph.py
│   ├── record_event.py
│   └── GOALS.md          # Development roadmap and progress tracking
└── AGENTS.md             # Agent workflow documentation
```

## Tech Stack
- **Three.js** (v0.128.0 via jsdelivr/cdnjs CDN) — 3D rendering
- **Vanilla JavaScript** (ES6+) — Game logic
- **HTML/CSS** — UI overlay with frosted glass design

## Recent Updates
- **Trap Tower Redesign** — Complete overhaul: flat pressure-plate mine with retractable spikes and red glow ring. Enemies stepping on it trigger AOE spike burst (40 dmg, 2-tile radius), then enters 2.5s cooldown with visual rearm animation. No longer one-time use.
- **Seraph Visual Refresh** — Orbiting rings now vex-white (matching sclera), orbiting eyes moved closer (radius 16-24), wing bones changed to purple (iris color), wing feathers changed to white (sclera color)
- **Seraph Personal Taunts** — AI-generated and fallback taunts now address the player by their login name naturally throughout the game
- **Three.js Stability** — Fixed critical rendering error where disposed status-visual meshes (slow rings, burn flames, ice shells, poison bubbles) remained in the scene graph and caused `Cannot read properties of undefined` console spam every frame
- **WebGL Optimization** — Added `preserveDrawingBuffer` to renderer to eliminate GPU stall warnings during screenshot capture for Seraph vision

## Development Workflow
This project uses a coordinate database system for agent memory and workflow tracking. See `AGENTS.md` for details.

## Game Balance
- Start: 80⚡ energy, 15 lives
- Energy regen: +1⚡/sec (max 80)
- Kill rewards: Basic=10, Fast=8, Tank=15, Sniper=12, Burrowing=15, Spawner=20, Boss=30
- Wave completion bonus: +20 energy
- Preparation phase: 45 seconds between waves

## Features
- ✓ Endless wave system with scaling difficulty
- ✓ 5 tower types with unique abilities
- ✓ 7 enemy types with varied behavior
- ✓ 8 path generation algorithms
- ✓ Minecraft-style voxel terrain
- ✓ Login & main menu
- ✓ Leaderboard & achievements system
- ✓ Save/load game progress
- ✓ Animated UI and effects

---

*Built as a single HTML file. No build tools, no dependencies to install.*
