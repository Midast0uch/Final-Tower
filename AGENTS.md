# Agent Guidelines for Tower Defense Game

## Overview
This document provides guidelines for AI agents working on the Tower Defense game project.
It covers development workflows, code standards, and project-specific practices.

## Project Structure
- `tower-defense.html`: Main game file containing HTML, CSS, and JavaScript
- No build system - the game runs directly in a browser
- Uses Three.js library via CDN for 3D rendering

## Development Workflow

### Getting Started
1. Open `tower-defense.html` in a web browser to play
2. For development, use a local HTTP server to avoid file:// restrictions:
   ```bash
   # Python 3
   python -m http.server 8080
   # Then visit: http://localhost:8080/tower-defense.html
   ```
3. Alternatively, use VS Code Live Server extension

### Making Changes
1. Edit `tower-defense.html` directly
2. Refresh browser to see changes
3. Use browser developer tools (F12) for debugging
4. Check console for error messages and logs

### Testing
- Manual testing through gameplay
- No automated test suite currently exists
- To test specific features:
  - Wave progression: Click "START WAVE" button
  - Tower placement: Select tower type and click on grass tiles
  - Enemy behavior: Observe path following and combat
  - UI updates: Watch energy, seals, lives, and wave counters

### Debugging
- Use `console.log()` statements throughout the code for tracing
- Breakpoints can be set in browser dev tools
- Common issues to check:
  - Three.js initialization errors
  - Pathfinding logic
  - Tower placement validation
  - Enemy spawning and movement

## Code Style Guidelines

### JavaScript/ES6 Standards
- Use ES6+ features (const, let, arrow functions, destructuring)
- Prefer `const` for variables that won't be reassigned
- Use `let` for variables that will change
- Avoid `var` entirely
- Use template literals for string concatenation
- Use arrow functions for concise callbacks
- Use destructuring for object/array access

### Formatting
- Indentation: 2 spaces
- Line length: Maximum 100 characters (prefer 80)
- Braces: Opening brace on same line, closing brace on its own line
- Semicolons: Required (use semicolons consistently)
- Quotes: Single quotes for strings, double quotes only for HTML attributes
- Comma spacing: No space before comma, one space after
- Operator spacing: Space around operators (`=`, `+`, `-`, etc.)
- Function spacing: Space between function name and parentheses

### Naming Conventions
- Variables: camelCase (e.g., `gameState`, `currentWave`)
- Functions: camelCase (e.g., `spawnEnemy`, `updateTowers`)
- Constants: UPPER_SNAKE_CASE (e.g., `CONFIG`, `TOWER_TYPES`)
- Classes: PascalCase (none currently, but follow if added)
- Files: kebab-case (only `tower-defense.html` currently)
- Boolean variables: Prefix with `is`, `has`, `should` (e.g., `isActive`, `hasTower`)

### Import/Dependency Guidelines
- All dependencies loaded via CDN in HTML head:
  - Three.js: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
  - Google Fonts: `https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@600;700;800&display=swap`
- No local imports or modules - everything in single file
- If adding new CDN dependencies, place in `<head>` section

### Types and Data Structures
- Use JSDoc comments for complex objects and functions
- Define complex objects with clear structure comments
- For game state, maintain consistent shape:
  ```javascript
  let gameState = {
    energy: number,
    seals: number,
    lives: number,
    wave: number,
    waveActive: boolean,
    selectedTower: string|null,
    towers: Array,
    enemies: Array,
    projectiles: Array,
    particles: Array,
    gameOver: boolean,
    victory: boolean
  };
  ```
- Use Map or Set for lookups when appropriate (e.g., path validation)

### Error Handling
- Use try/catch for asynchronous operations (though minimal in this game)
- Validate inputs to functions
- Check for null/undefined before accessing object properties
- Provide user feedback via `alert()` or UI updates for recoverable errors
- Log unexpected errors to console for debugging
- In game loop, catch errors to prevent crashing:
  ```javascript
  function update(time) {
    try {
      // game logic
    } catch (error) {
      console.error('Game loop error:', error);
      // Optionally show error to user
    }
  }
  ```

### Performance Considerations
- Minimize DOM updates - batch UI changes
- Reuse objects when possible (object pooling for particles, etc.)
- Limit Three.js object creation in render loop
- Use requestAnimationFrame for game loop
- Dispose of Three.js objects when removing from scene
- Check for memory leaks in long-running sessions

### Commenting
- Use JSDoc for function definitions:
  ```javascript
  /**
   * Spawns an enemy with given properties
   * @param {string} type - Enemy type identifier
   * @param {Object} variant - Enemy variant configuration
   * @param {number} waveNum - Current wave number for scaling
   * @returns {Object} Enemy object
   */
  function spawnEnemy(type, variant, waveNum) {
    // ...
  }
  ```
- Use inline comments for complex logic
- Remove commented-out code before finalizing
- Keep comments up-to-date with code changes

### Three.js Specific Guidelines
- Always set `castShadow` and `receiveShadow` appropriately for performance
- Use `MeshBasicMaterial` for unlit objects, `MeshLambertMaterial` for lit
- Dispose of geometries and materials when removing objects:
  ```javascript
  function removeObject(obj) {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
    scene.remove(obj);
  }
  ```
- Keep render loop lean - avoid expensive calculations in update function
- Use appropriate camera settings for orthographic view:
  - Set up frustum to match canvas aspect ratio
  - Position camera to look straight down for 2.5D effect

## Existing Rules
### Cursor Rules
No `.cursor/rules/` or `.cursorrules` files found in repository.

### Copilot Instructions
No `.github/copilot-instructions.md` file found.

## Agent-Specific Instructions

### @designer
- Focus on visual aesthetics, UI/UX, and player experience
- Maintain consistent cartoon/vibrant art style
- Ensure color blindness friendliness in enemy variants
- Optimize visual feedback (tower placement highlights, enemy hit effects)
- Follow established color palette:
  - Primary: #FF6B6B (coral)
  - Secondary: #4ECDC4 (teal)
  - Accent: #FFE66D (yellow)
  - Dark: #2C3E50 (dark blue)
  - Light: #ECF0F1 (off-white)
  - Energy: #A8E6CF (mint)
  - Seal: #DDA0DD (plum)
  - Danger: #E74C3C (red)

### @fixer
- Prioritize bug fixes and stability
- Ensure game loop doesn't crash
- Validate all user inputs and edge cases
- Test tower placement boundaries
- Verify pathfinding and enemy movement
- Check for memory leaks in long play sessions
- Maintain backward compatibility with existing saves (if any)

### @explorer
- When searching for solutions, consider:
  - Browser compatibility (test in Chrome, Firefox, Safari)
  - Mobile responsiveness (though primarily desktop)
  - Performance on lower-end devices
  - Code readability and maintainability
  - Following existing code patterns in the file

## Commit Guidelines
- Make small, focused commits
- Write clear commit messages:
  - Fix: [description] (for bug fixes)
  - Add: [description] (for new features)
  - Refactor: [description] (for code improvements)
  - Update: [description] (for dependency or asset changes)
- Include what was changed and why
- Reference any relevant issues or discussions

## Project-Specific Conventions
- Wave numbering starts at 1
- Energy is primary resource for tower placement
- Seals are earned from boss waves and unlock new towers
- Lives represent how many enemies can reach the end
- Game ends when lives reach 0 (loss) or all waves completed (win)
- Tower placement only allowed on non-path, non-occupied grass tiles
- Enemies follow predetermined paths that change each wave
- Every 6 waves, new path options are added for variety
