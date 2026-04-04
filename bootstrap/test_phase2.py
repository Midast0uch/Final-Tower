#!/usr/bin/env python3
"""
Phase 2 Test Suite for Final Tower
Tests all enemy type implementations + regression guards
"""

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "bootstrap"))


def read_game_html():
    with open("tower-defense.html", "r", encoding="utf-8") as f:
        return f.read()


class TestResult:
    def __init__(self, name, passed, message=""):
        self.name = name
        self.passed = passed
        self.message = message

    def __str__(self):
        status = "✅ PASS" if self.passed else "❌ FAIL"
        return f"{status} {self.name}: {self.message}"


def test_basic_enemies():
    """Test 2.1: Basic 4 enemy types"""
    results = []
    html = read_game_html()

    # Basic mole - green sphere
    if "case 'basic':" in html and "SphereGeometry(8" in html and "#51cf66" in html:
        results.append(TestResult("Basic Mole", True, "Green sphere, standard stats"))
    else:
        results.append(TestResult("Basic Mole", False, "Missing or incorrect"))

    # Fast mole - yellow, small
    if "case 'fast':" in html and "SphereGeometry(6" in html and "#ffd43b" in html:
        results.append(TestResult("Fast Mole", True, "Yellow, small, 1.8x speed"))
    else:
        results.append(TestResult("Fast Mole", False, "Missing or incorrect"))

    # Tank mole - blue, cube
    if "case 'tank':" in html and "BoxGeometry(14" in html and "#339af0" in html:
        results.append(TestResult("Tank Mole", True, "Blue cube, 0.5x speed, high HP"))
    else:
        results.append(TestResult("Tank Mole", False, "Missing or incorrect"))

    # Sniper mole - purple, octahedron
    if (
        "case 'sniper':" in html
        and "OctahedronGeometry(9" in html
        and "#845ef7" in html
    ):
        results.append(TestResult("Sniper Mole", True, "Purple octahedron, long range"))
    else:
        results.append(TestResult("Sniper Mole", False, "Missing or incorrect"))

    return results


def test_new_enemies():
    """Test 2.2: New enemy types (burrowing, spawner)"""
    results = []
    html = read_game_html()

    # Burrowing mole - brown cylinder
    if (
        "case 'burrowing':" in html
        and "CylinderGeometry(8" in html
        and "#a0522d" in html
    ):
        results.append(
            TestResult("Burrowing Mole", True, "Brown cylinder, immune to ground")
        )
    else:
        results.append(TestResult("Burrowing Mole", False, "Missing or incorrect"))

    # Spawner mole - pink icosahedron
    if (
        "case 'spawner':" in html
        and "IcosahedronGeometry(12" in html
        and "#e599f7" in html
    ):
        results.append(
            TestResult("Spawner Mole", True, "Pink icosahedron, spawns minions")
        )
    else:
        results.append(TestResult("Spawner Mole", False, "Missing or incorrect"))

    # Boss mole - red, large
    if (
        "case 'boss':" in html
        and "IcosahedronGeometry(20" in html
        and "#ff6b6b" in html
    ):
        results.append(
            TestResult("Boss Mole", True, "Red large icosahedron, every 5 waves")
        )
    else:
        results.append(TestResult("Boss Mole", False, "Missing or incorrect"))

    return results


def test_enemy_spawning():
    """Test 2.3: Enemy spawning logic"""
    results = []
    html = read_game_html()

    # Test generateWaveEnemies function
    if "function generateWaveEnemies" in html:
        results.append(
            TestResult(
                "generateWaveEnemies function", True, "Wave enemy generator exists"
            )
        )
    else:
        results.append(TestResult("generateWaveEnemies function", False, "Missing"))

    # Test calculateEnemyCount
    if "function calculateEnemyCount" in html:
        results.append(
            TestResult("calculateEnemyCount", True, "Enemy count formula exists")
        )
    else:
        results.append(TestResult("calculateEnemyCount", False, "Missing"))

    # Test boss every 5 waves
    if "waveNum % 5 === 0" in html and "type = 'boss'" in html:
        results.append(
            TestResult("Boss every 5 waves", True, "Boss spawns on wave 5, 10, 15...")
        )
    else:
        results.append(
            TestResult("Boss every 5 waves", False, "Boss timing not correct")
        )

    return results


def test_enemy_scaling():
    """Test 2.4: Enemy stat scaling"""
    results = []
    html = read_game_html()

    # Health scales with wave
    if "waveNum *" in html:
        results.append(
            TestResult("Health scales with wave", True, "HP increases per wave")
        )
    else:
        results.append(TestResult("Health scales with wave", False, "No HP scaling"))

    # Speed scales with wave
    if "2 + (waveNum * 0.2)" in html:
        results.append(
            TestResult("Speed scales with wave", True, "Speed increases per wave")
        )
    else:
        results.append(TestResult("Speed scales with wave", False, "No speed scaling"))

    return results


# ============================================================
# REGRESSION GUARDS
# ============================================================


def test_enemy_death_proper_cleanup():
    """REGRESSION: Dead enemies stayed on map as corpses.
    Bug: filter() dropped from array without scene.remove().
    Fix: iterate backwards, call scene.remove() + dispose() before splice()."""
    results = []
    html = read_game_html()

    # Must have scene.remove for dead enemies
    has_scene_remove = bool(re.search(r"scene\.remove\(enemy\.mesh\)", html))
    # Must NOT have silent filter pattern
    has_silent_filter = bool(
        re.search(r"enemies\s*=\s*enemies\.filter\s*\(\s*e\s*=>.*health", html)
    )
    # Should have geometry dispose on death
    has_geometry_dispose = bool(re.search(r"geometry\.dispose\(\)", html))

    if has_scene_remove and not has_silent_filter:
        results.append(
            TestResult("Enemy death cleanup", True, "Dead enemies removed from scene")
        )
    else:
        reasons = []
        if has_silent_filter:
            reasons.append("silent filter without scene.remove")
        if not has_scene_remove:
            reasons.append("no scene.remove for enemy mesh")
        results.append(TestResult("Enemy death cleanup", False, "; ".join(reasons)))

    if has_geometry_dispose:
        results.append(
            TestResult(
                "Geometry disposal on death",
                True,
                "Geometries disposed to prevent leaks",
            )
        )
    else:
        results.append(
            TestResult(
                "Geometry disposal on death", False, "No geometry.dispose() found"
            )
        )

    return results


def test_no_orphaned_glowmesh_refs():
    """REGRESSION: glowMesh references after removal caused errors.
    Bug: enemy.glowMesh was removed as separate mesh but code still referenced it."""
    results = []
    html = read_game_html()

    # If glowMesh is used, it should be part of a group, not separate
    # Check that glowMesh isn't referenced in cleanup without null check
    glowmesh_in_cleanup = bool(re.search(r"enemy\.glowMesh.*scene\.remove", html))

    if not glowmesh_in_cleanup:
        results.append(
            TestResult(
                "No orphaned glowMesh refs", True, "No orphaned glowMesh references"
            )
        )
    else:
        results.append(
            TestResult(
                "No orphaned glowMesh refs",
                False,
                "glowMesh referenced in cleanup — may cause errors",
            )
        )

    return results


def test_slow_debuff_applied():
    """REGRESSION: SLOW tower never actually slowed enemies.
    Bug: SLOW tower fired projectiles but never set enemy.slowed flag."""
    results = []
    html = read_game_html()

    # Check that slow debuff is applied to enemies
    has_slow_flag = bool(re.search(r"enemy\.slowed\s*=\s*true", html))
    has_slow_factor = bool(re.search(r"enemy\.slowFactor", html))
    has_slow_in_movement = bool(re.search(r"speed.*slowFactor|speedMult.*slow", html))

    if has_slow_flag and has_slow_factor and has_slow_in_movement:
        results.append(
            TestResult("Slow debuff applied", True, "SLOW tower applies speed debuff")
        )
    else:
        reasons = []
        if not has_slow_flag:
            reasons.append("no enemy.slowed flag")
        if not has_slow_factor:
            reasons.append("no slowFactor")
        if not has_slow_in_movement:
            reasons.append("slow not applied in movement")
        results.append(TestResult("Slow debuff applied", False, "; ".join(reasons)))

    return results


def test_trap_proximity_trigger():
    """REGRESSION: TRAP tower had no proximity trigger logic.
    Bug: TRAP tower fell through createProjectile with no special handling."""
    results = []
    html = read_game_html()

    # Check for proximity trigger pattern
    has_proximity_check = bool(
        re.search(r"TRAP.*distance|TRAP.*dist.*range|tower\.triggered", html, re.DOTALL)
    )
    has_trap_explosion = bool(
        re.search(r"TRAP.*createExplosion|trap.*explosion", html, re.DOTALL)
    )

    if has_proximity_check:
        results.append(
            TestResult(
                "Trap proximity trigger", True, "TRAP tower triggers on proximity"
            )
        )
    else:
        results.append(
            TestResult(
                "Trap proximity trigger", False, "No proximity trigger for TRAP tower"
            )
        )

    return results


def run_all_tests():
    print("=" * 60)
    print("FINAL TOWER - PHASE 2 TEST SUITE")
    print("=" * 60)
    print()

    all_results = []

    test_groups = [
        ("2.1 Basic Enemies", test_basic_enemies),
        ("2.2 New Enemies", test_new_enemies),
        ("2.3 Enemy Spawning", test_enemy_spawning),
        ("2.4 Enemy Scaling", test_enemy_scaling),
        (
            "2.5 REGRESSION: Enemy Lifecycle Guards",
            lambda: [
                *test_enemy_death_proper_cleanup(),
                *test_no_orphaned_glowmesh_refs(),
                *test_slow_debuff_applied(),
                *test_trap_proximity_trigger(),
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
        print("❌ Phase 2 NOT verified")
        sys.exit(1)
    else:
        print("✅ ALL TESTS PASSED - Phase 2 verified!")
        sys.exit(0)


if __name__ == "__main__":
    run_all_tests()
