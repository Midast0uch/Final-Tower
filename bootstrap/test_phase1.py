#!/usr/bin/env python3
"""
Phase 1 Test Suite for Final Tower
Tests all core game logic features + regression guards
"""

import json
import os
import sys
import time
import re
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "bootstrap"))

try:
    import requests
except ImportError:
    print("Installing requests...")
    os.system("pip install requests -q")
    import requests

BASE_URL = "http://localhost:8080"


class TestResult:
    def __init__(self, name, passed, message=""):
        self.name = name
        self.passed = passed
        self.message = message

    def __str__(self):
        status = "✅ PASS" if self.passed else "❌ FAIL"
        return f"{status} {self.name}: {self.message}"


def read_game_html():
    """Read the game HTML file and extract game logic"""
    with open("tower-defense.html", "r", encoding="utf-8") as f:
        return f.read()


def test_config_values():
    """Test 1.1: CONFIG values are correct"""
    results = []
    html = read_game_html()

    if re.search(r"BASE_LIVES:\s*15", html):
        results.append(TestResult("CONFIG.BASE_LIVES=15", True, "Base lives is 15"))
    else:
        results.append(
            TestResult("CONFIG.BASE_LIVES=15", False, "Base lives not set to 15")
        )

    if re.search(r"MAX_ENERGY:\s*80", html):
        results.append(TestResult("CONFIG.MAX_ENERGY=80", True, "Max energy is 80"))
    else:
        results.append(
            TestResult("CONFIG.MAX_ENERGY=80", False, "Max energy not set to 80")
        )

    if re.search(r"ENERGY_REGEN:\s*1", html):
        results.append(
            TestResult("CONFIG.ENERGY_REGEN=1", True, "Energy regen is 1/sec")
        )
    else:
        results.append(
            TestResult("CONFIG.ENERGY_REGEN=1", False, "Energy regen not set to 1")
        )

    if re.search(r"PREPARATION_TIME:\s*45", html):
        results.append(
            TestResult("CONFIG.PREPARATION_TIME=45", True, "Preparation time is 45s")
        )
    else:
        results.append(
            TestResult(
                "CONFIG.PREPARATION_TIME=45", False, "Preparation time not set to 45"
            )
        )

    return results


def test_game_state():
    """Test 1.2: gameState has correct properties"""
    results = []
    html = read_game_html()

    if re.search(r"gamePhase:\s*['\"]PREPARATION['\"]", html):
        results.append(
            TestResult("gameState.gamePhase", True, "gamePhase property exists")
        )
    else:
        results.append(
            TestResult("gameState.gamePhase", False, "gamePhase property missing")
        )

    if re.search(r"preparationTimer:", html):
        results.append(
            TestResult(
                "gameState.preparationTimer", True, "preparationTimer property exists"
            )
        )
    else:
        results.append(
            TestResult(
                "gameState.preparationTimer", False, "preparationTimer property missing"
            )
        )

    if re.search(r"pathGrid:\s*\[\]", html):
        results.append(
            TestResult("gameState.pathGrid", True, "pathGrid property exists")
        )
    else:
        results.append(
            TestResult("gameState.pathGrid", False, "pathGrid property missing")
        )

    if re.search(r"maxWaveReached:", html):
        results.append(
            TestResult(
                "gameState.maxWaveReached", True, "maxWaveReached property exists"
            )
        )
    else:
        results.append(
            TestResult(
                "gameState.maxWaveReached", False, "maxWaveReached property missing"
            )
        )

    return results


def test_path_generator():
    """Test 1.3: PathGenerator class exists with correct methods"""
    results = []
    html = read_game_html()

    if re.search(r"class PathGenerator", html):
        results.append(
            TestResult("PathGenerator class", True, "PathGenerator class exists")
        )
    else:
        results.append(
            TestResult("PathGenerator class", False, "PathGenerator class missing")
        )

    if re.search(r"static createPath", html):
        results.append(
            TestResult("PathGenerator.createPath", True, "createPath method exists")
        )
    else:
        results.append(
            TestResult("PathGenerator.createPath", False, "createPath method missing")
        )

    path_types = ["STRAIGHT", "WINDING", "BRANCHING", "MAZE"]
    for ptype in path_types:
        if re.search(rf"['\"]?{ptype}['\"]?", html):
            results.append(
                TestResult(f"Path type: {ptype}", True, f"{ptype} path type found")
            )
        else:
            results.append(
                TestResult(f"Path type: {ptype}", False, f"{ptype} path type not found")
            )

    if re.search(r"static validatePath", html):
        results.append(
            TestResult("PathGenerator.validatePath", True, "validatePath method exists")
        )
    else:
        results.append(
            TestResult(
                "PathGenerator.validatePath", False, "validatePath method missing"
            )
        )

    return results


def test_wave_scaling():
    """Test 1.4: Wave scaling formula exists"""
    results = []
    html = read_game_html()

    if re.search(r"function calculateWaveDifficulty", html):
        results.append(
            TestResult(
                "calculateWaveDifficulty", True, "Wave difficulty formula exists"
            )
        )
    else:
        results.append(
            TestResult(
                "calculateWaveDifficulty", False, "Wave difficulty formula missing"
            )
        )

    if re.search(r"function calculateEnemyCount", html):
        results.append(
            TestResult("calculateEnemyCount", True, "Enemy count formula exists")
        )
    else:
        results.append(
            TestResult("calculateEnemyCount", False, "Enemy count formula missing")
        )

    if re.search(r"function calculatePathLength", html):
        results.append(
            TestResult("calculatePathLength", True, "Path length formula exists")
        )
    else:
        results.append(
            TestResult("calculatePathLength", False, "Path length formula missing")
        )

    if re.search(r"Math\.pow\(1\.15", html):
        results.append(
            TestResult(
                "Difficulty scaling (1.15)", True, "15% difficulty increase per wave"
            )
        )
    else:
        results.append(
            TestResult(
                "Difficulty scaling (1.15)", False, "15% difficulty increase not found"
            )
        )

    return results


def test_enemy_types():
    """Test 1.5: All 6 enemy types exist"""
    results = []
    html = read_game_html()

    enemy_types = {
        "basic": "Basic mole (green sphere)",
        "fast": "Fast mole (yellow small)",
        "tank": "Tank mole (blue cube)",
        "sniper": "Sniper mole (purple octahedron)",
        "burrowing": "Burrowing mole (brown cylinder)",
        "spawner": "Spawner mole (pink icosahedron)",
        "boss": "Boss mole (red large)",
    }

    for etype, desc in enemy_types.items():
        if re.search(rf"case ['\"]?{etype}['\"]?:", html):
            results.append(TestResult(f"Enemy type: {etype}", True, desc))
        else:
            results.append(
                TestResult(f"Enemy type: {etype}", False, f"{desc} not found")
            )

    return results


def test_preparation_phase():
    """Test 1.6: Preparation phase functionality"""
    results = []
    html = read_game_html()

    if re.search(r"function startGame\(\)", html):
        results.append(
            TestResult("startGame function", True, "startGame function exists")
        )
    else:
        results.append(
            TestResult("startGame function", False, "startGame function missing")
        )

    if re.search(r"function startPreparationPhase", html):
        results.append(
            TestResult(
                "startPreparationPhase", True, "Preparation phase function exists"
            )
        )
    else:
        results.append(
            TestResult(
                "startPreparationPhase", False, "Preparation phase function missing"
            )
        )

    if re.search(r"function startWaveActive\(\)", html):
        results.append(
            TestResult("startWaveActive", True, "Wave active function exists")
        )
    else:
        results.append(
            TestResult("startWaveActive", False, "Wave active function missing")
        )

    if re.search(r"gameState\.gamePhase === ['\"]PREPARATION['\"]", html):
        results.append(
            TestResult("Preparation timer in animate", True, "Timer logic in game loop")
        )
    else:
        results.append(
            TestResult(
                "Preparation timer in animate", False, "Timer logic not in game loop"
            )
        )

    return results


def test_turret_destruction():
    """Test 1.7: Turret destruction when path overlaps"""
    results = []
    html = read_game_html()

    if re.search(r"function destroyOverlappingTurrets", html):
        results.append(
            TestResult(
                "destroyOverlappingTurrets", True, "Turret destruction function exists"
            )
        )
    else:
        results.append(
            TestResult(
                "destroyOverlappingTurrets",
                False,
                "Turret destruction function missing",
            )
        )

    if re.search(r"\* 0\.8", html):
        results.append(
            TestResult(
                "Energy refund (80%)", True, "80% energy refund on turret destruction"
            )
        )
    else:
        results.append(
            TestResult(
                "Energy refund (80%)", False, "Energy refund calculation missing"
            )
        )

    if re.search(r"pathGrid\[tower\.gridX\]\[tower\.gridY\]", html):
        results.append(
            TestResult(
                "pathGrid collision check", True, "Collision detection using pathGrid"
            )
        )
    else:
        results.append(
            TestResult(
                "pathGrid collision check", False, "pathGrid collision check missing"
            )
        )

    return results


def test_energy_regen():
    """Test 1.8: Energy regeneration"""
    results = []
    html = read_game_html()

    if re.search(r"lastEnergyRegen", html):
        results.append(
            TestResult("Energy regen variable", True, "Energy regen tracking exists")
        )
    else:
        results.append(
            TestResult("Energy regen variable", False, "Energy regen tracking missing")
        )

    if re.search(r"energy \+ CONFIG\.ENERGY_REGEN", html):
        results.append(
            TestResult("Energy +1 per second", True, "Energy adds every second")
        )
    else:
        results.append(
            TestResult("Energy +1 per second", False, "Energy regen logic not found")
        )

    if re.search(r"Math\.min\(CONFIG\.MAX_ENERGY", html):
        results.append(TestResult("MAX_ENERGY cap", True, "Energy capped at max"))
    else:
        results.append(
            TestResult("MAX_ENERGY cap", False, "Energy cap not implemented")
        )

    return results


def test_wave_completion():
    """Test 1.9: Wave completion and transition"""
    results = []
    html = read_game_html()

    if re.search(r"function waveComplete\(\)", html):
        results.append(
            TestResult("waveComplete function", True, "Wave completion function exists")
        )
    else:
        results.append(
            TestResult(
                "waveComplete function", False, "Wave completion function missing"
            )
        )

    if re.search(r"energy \+ 20", html):
        results.append(
            TestResult("Wave completion bonus", True, "+20 energy on wave complete")
        )
    else:
        results.append(
            TestResult("Wave completion bonus", False, "Wave bonus not found")
        )

    if re.search(r"startPreparationPhase\(\)", html):
        results.append(
            TestResult(
                "Transition to preparation", True, "Next wave enters preparation"
            )
        )
    else:
        results.append(
            TestResult("Transition to preparation", False, "Transition logic missing")
        )

    return results


def test_ui_updates():
    """Test 1.10: UI shows correct game state"""
    results = []
    html = read_game_html()

    if re.search(r"wave-timer-val", html):
        results.append(
            TestResult("Wave timer UI element", True, "Timer display in HTML")
        )
    else:
        results.append(
            TestResult("Wave timer UI element", False, "Timer display missing")
        )

    if re.search(r"preparationTimer", html):
        results.append(
            TestResult("Preparation timer display", True, "Timer shown in UI")
        )
    else:
        results.append(
            TestResult("Preparation timer display", False, "Timer not in UI")
        )

    if re.search(r"WAVE \$\{gameState\.wave\}", html):
        results.append(
            TestResult("Dynamic wave button", True, "Button shows wave number")
        )
    else:
        results.append(
            TestResult("Dynamic wave button", False, "Button doesn't show wave")
        )

    return results


# ============================================================
# REGRESSION GUARDS — catch bugs we've already fixed
# ============================================================


def test_no_duplicate_functions():
    """REGRESSION: Duplicate function definitions overwrite each other silently.
    Bug: removeEnemy was defined twice — second version lacked kill tracking."""
    results = []
    html = read_game_html()

    # Find all function definitions
    func_pattern = r"function\s+(\w+)\s*\("
    all_funcs = re.findall(func_pattern, html)

    # Check for duplicates
    from collections import Counter

    func_counts = Counter(all_funcs)
    duplicates = {name: count for name, count in func_counts.items() if count > 1}

    if not duplicates:
        results.append(
            TestResult("No duplicate functions", True, "All functions defined once")
        )
    else:
        dup_list = ", ".join(f"{name}({count}x)" for name, count in duplicates.items())
        results.append(
            TestResult("No duplicate functions", False, f"Duplicates found: {dup_list}")
        )

    return results


def test_no_undefined_config_refs():
    """REGRESSION: CONFIG.TOTAL_WAVES was referenced but never defined.
    Bug: undefined CONFIG refs cause runtime errors."""
    results = []
    html = read_game_html()

    # Extract CONFIG keys that are actually defined
    defined_keys = set(re.findall(r"CONFIG\.(\w+)\s*[:=]", html))
    # Also check inside the CONFIG = { } block
    config_block = re.search(r"const CONFIG\s*=\s*\{([^}]+)\}", html, re.DOTALL)
    if config_block:
        block_keys = set(re.findall(r"(\w+)\s*:", config_block.group(1)))
        defined_keys.update(block_keys)

    # Find all CONFIG.X references
    all_refs = set(re.findall(r"CONFIG\.(\w+)", html))

    # Check for undefined refs (exclude known safe ones)
    safe_refs = {
        "MAP_WIDTH",
        "MAP_HEIGHT",
        "TILE_SIZE",
        "PATH_COLOR",
        "TERRAIN_COLOR",
        "BASE_ENERGY",
        "BASE_LIVES",
        "ENERGY_REGEN",
        "MAX_ENERGY",
        "PREPARATION_TIME",
    }
    undefined = all_refs - defined_keys - safe_refs

    if not undefined:
        results.append(
            TestResult("No undefined CONFIG refs", True, "All CONFIG refs are defined")
        )
    else:
        ref_list = ", ".join(f"CONFIG.{k}" for k in sorted(undefined))
        results.append(
            TestResult("No undefined CONFIG refs", False, f"Undefined: {ref_list}")
        )

    return results


def test_no_double_script_tags():
    """REGRESSION: Double </script></script> tag broke script loading."""
    results = []
    html = read_game_html()

    if "</script></script>" in html:
        results.append(
            TestResult("No double script tags", False, "Found </script></script>")
        )
    else:
        results.append(
            TestResult("No double script tags", True, "Script tags are clean")
        )

    return results


def test_no_extra_css_braces():
    """REGRESSION: Extra } closing brace in CSS broke all styles after it.
    Bug: Line 190 had `}\n        }` — a stray closing brace that broke all subsequent CSS."""
    results = []
    html = read_game_html()

    # Extract the <style> block
    style_match = re.search(r"<style>(.*?)</style>", html, re.DOTALL)
    if style_match:
        css = style_match.group(1)
        # Remove @keyframes blocks entirely (they have nested braces that confuse the check)
        # Use a more robust approach: track brace depth
        cleaned = []
        depth = 0
        in_keyframes = False
        for line in css.split("\n"):
            stripped = line.strip()
            if stripped.startswith("@keyframes"):
                in_keyframes = True
            if in_keyframes:
                depth += stripped.count("{") - stripped.count("}")
                if depth <= 0:
                    in_keyframes = False
                    depth = 0
                continue
            cleaned.append(line)

        css_no_kf = "\n".join(cleaned)
        # Now look for the specific bug pattern: }\n        } (closing brace followed by another closing brace)
        if re.search(r"\}\s*\n\s+\}", css_no_kf):
            results.append(
                TestResult(
                    "No extra CSS braces", False, "Found double closing braces in CSS"
                )
            )
        else:
            results.append(
                TestResult("No extra CSS braces", True, "CSS braces are balanced")
            )
    else:
        results.append(
            TestResult("No extra CSS braces", False, "Could not find <style> block")
        )

    return results


def test_enemy_death_cleanup():
    """REGRESSION: Dead enemies stayed on map — filter without scene.remove().
    Bug: gameState.enemies.filter() silently dropped dead enemies from array
    but never called scene.remove(), leaving 3D meshes in the scene forever."""
    results = []
    html = read_game_html()

    # Check that enemy death properly removes from scene
    # Look for scene.remove near enemy health check or death logic
    has_scene_remove_on_death = bool(
        re.search(r"(health\s*<=\s*0|health\s*<\s*1).*?scene\.remove", html, re.DOTALL)
    )
    # Also check for the pattern: createExplosion + scene.remove together (proper cleanup)
    has_explosion_cleanup = bool(
        re.search(r"createExplosion.*?scene\.remove.*?enemy", html, re.DOTALL)
    )
    # Make sure there's NO silent filter without cleanup
    has_silent_filter = bool(re.search(r"enemies\s*=\s*enemies\.filter.*?health", html))

    if (has_scene_remove_on_death or has_explosion_cleanup) and not has_silent_filter:
        results.append(
            TestResult("Enemy death cleanup", True, "Dead enemies removed from scene")
        )
    else:
        reasons = []
        if has_silent_filter:
            reasons.append("silent filter without scene.remove")
        if not has_scene_remove_on_death and not has_explosion_cleanup:
            reasons.append("no scene.remove on death")
        results.append(TestResult("Enemy death cleanup", False, "; ".join(reasons)))

    return results


def test_projectile_has_target():
    """REGRESSION: Projectiles created with target: null — never hit anything.
    Bug: createProjectile set target: null and updateProjectiles had a broken
    cooldown that prevented targeting logic from ever running."""
    results = []
    html = read_game_html()

    # Check that projectiles get a target assigned (not null)
    # Look for pattern: target: closestEnemy or target = enemy (not target: null)
    has_target_assignment = bool(
        re.search(
            r"target:\s*closestEnemy|target:\s*targetEnemy|target\s*=\s*closestEnemy|target\s*=\s*targetEnemy",
            html,
        )
    )
    # Make sure there's no "target: null" in the projectile creation
    has_null_target = bool(re.search(r"target:\s*null", html))

    if has_target_assignment and not has_null_target:
        results.append(
            TestResult("Projectile targeting", True, "Projectiles lock onto enemies")
        )
    else:
        reasons = []
        if has_null_target:
            reasons.append("target: null found")
        if not has_target_assignment:
            reasons.append("no target assignment")
        results.append(TestResult("Projectile targeting", False, "; ".join(reasons)))

    return results


def test_tower_tracking_barrel_only():
    """REGRESSION: tower.mesh.lookAt() rotated entire tower, not just barrel.
    Bug: The whole tower mesh rotated toward enemies instead of just the barrel."""
    results = []
    html = read_game_html()

    # Check that barrel.lookAt is used, not mesh.lookAt for targeting
    has_barrel_lookat = bool(re.search(r"barrel\.lookAt", html))
    has_mesh_lookat_targeting = bool(re.search(r"tower\.mesh\.lookAt", html))

    if has_barrel_lookat and not has_mesh_lookat_targeting:
        results.append(
            TestResult(
                "Barrel-only tracking", True, "Only barrel rotates toward target"
            )
        )
    elif has_mesh_lookat_targeting:
        results.append(
            TestResult(
                "Barrel-only tracking", False, "tower.mesh.lookAt rotates entire tower"
            )
        )
    else:
        results.append(
            TestResult("Barrel-only tracking", False, "No barrel.lookAt found")
        )

    return results


def run_all_tests():
    """Run all Phase 1 tests"""
    print("=" * 60)
    print("FINAL TOWER - PHASE 1 TEST SUITE")
    print("=" * 60)
    print()

    all_results = []

    test_groups = [
        ("1.1 CONFIG Values", test_config_values),
        ("1.2 Game State", test_game_state),
        ("1.3 Path Generator", test_path_generator),
        ("1.4 Wave Scaling", test_wave_scaling),
        ("1.5 Enemy Types", test_enemy_types),
        ("1.6 Preparation Phase", test_preparation_phase),
        ("1.7 Turret Destruction", test_turret_destruction),
        ("1.8 Energy Regeneration", test_energy_regen),
        ("1.9 Wave Completion", test_wave_completion),
        ("1.10 UI Updates", test_ui_updates),
        (
            "1.11 REGRESSION: Code Quality Guards",
            lambda: [
                *test_no_duplicate_functions(),
                *test_no_undefined_config_refs(),
                *test_no_double_script_tags(),
                *test_no_extra_css_braces(),
                *test_enemy_death_cleanup(),
                *test_projectile_has_target(),
                *test_tower_tracking_barrel_only(),
            ],
        ),
    ]

    for group_name, test_func in test_groups:
        print(f"\n--- {group_name} ---")
        results = test_func()
        all_results.extend(results)
        for r in results:
            print(f"  {r}")

    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)

    passed = sum(1 for r in all_results if r.passed)
    failed = sum(1 for r in all_results if not r.passed)
    total = len(all_results)

    print(f"Total: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {passed / total * 100:.1f}%")
    print()

    if failed > 0:
        print("FAILED TESTS:")
        for r in all_results:
            if not r.passed:
                print(f"  - {r.name}")
        print()
        print("❌ Phase 1 NOT verified - fix failed tests before proceeding")
        sys.exit(1)
    else:
        print("✅ ALL TESTS PASSED - Phase 1 verified!")
        print()
        print("Next steps:")
        print("  1. Test in browser: http://localhost:8080/tower-defense.html")
        print("  2. Verify gameplay manually")
        print("  3. Proceed to Phase 2 (New Enemy Types)")
        sys.exit(0)


if __name__ == "__main__":
    run_all_tests()
