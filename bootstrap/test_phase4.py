#!/usr/bin/env python3
"""
Phase 4 Test Suite for Final Tower
Tests terrain and visual implementations + regression guards
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


def test_voxel_terrain():
    """Test 4.1: Minecraft-style voxel terrain"""
    results = []
    html = read_game_html()

    # Test voxel block generation
    if "BoxGeometry(blockSize - 1" in html or "BoxGeometry(tileSize" in html:
        results.append(
            TestResult("Voxel blocks", True, "Using BoxGeometry for terrain")
        )
    else:
        results.append(TestResult("Voxel blocks", False, "Not using blocks"))

    # Test dirt layer
    if "dirtColors" in html and "0x8B4513" in html:
        results.append(TestResult("Dirt layer", True, "Dirt blocks present"))
    else:
        results.append(TestResult("Dirt layer", False, "No dirt"))

    # Test stone layer
    if "stoneColors" in html and "0x696969" in html:
        results.append(TestResult("Stone layer", True, "Stone blocks present"))
    else:
        results.append(TestResult("Stone layer", False, "No stone"))

    # Test grass layer
    if "grassColors" in html and "0x228B22" in html:
        results.append(TestResult("Grass layer", True, "Grass blocks present"))
    else:
        results.append(TestResult("Grass layer", False, "No grass"))

    return results


def test_path_visuals():
    """Test 4.2: Path tunnel visuals"""
    results = []
    html = read_game_html()

    # Test dark dirt path colors
    if "pathColors" in html and "0x3d2817" in html:
        results.append(
            TestResult("Dark path colors", True, "Path uses dark dirt tones")
        )
    else:
        results.append(TestResult("Dark path colors", False, "No dark path"))

    # Test glowing path edges
    if "emissive: 0x1a1008" in html or ("emissive" in html and "0x3d2817" in html):
        results.append(TestResult("Path glow effect", True, "Path has glow/emission"))
    else:
        results.append(TestResult("Path glow effect", False, "No glow"))

    # Test arrow markers
    if "ConeGeometry" in html and "arrow" in html:
        results.append(TestResult("Directional arrows", True, "Arrows on path"))
    else:
        results.append(TestResult("Directional arrows", False, "No arrows"))

    return results


def test_color_palette():
    """Test 4.3: PRD color palette"""
    results = []
    html = read_game_html()

    # Check PRD colors are used
    colors = {
        "Terrain": ["0x8B4513", "0xF4A460", "0x2E8B57"],
        "Path": ["0x556B2F", "0x6B8E23", "0xFFD700"],
        "Turrets": ["0xA9A9A9", "0xD3D3D3", "0xFF6347"],
        "Enemies": ["0x808080", "0xA9A9A9", "0xFF0000"],
        "UI": ["0x2F4F4F", "0x708090", "0x00BFFF"],
    }

    terrain_colors_found = sum(1 for c in colors["Terrain"] if c in html)
    if terrain_colors_found >= 1:
        results.append(
            TestResult(
                "Terrain colors (PRD)",
                True,
                f"{terrain_colors_found}/3 PRD colors found",
            )
        )
    else:
        results.append(
            TestResult("Terrain colors (PRD)", False, "PRD colors not found")
        )

    return results


def test_decor():
    """Test 4.4: Decorative elements"""
    results = []
    html = read_game_html()

    # Test decorative stones
    if "decorGeo" in html and "decorMat" in html:
        results.append(
            TestResult("Decorative stones", True, "Decorative elements present")
        )
    else:
        results.append(TestResult("Decorative stones", False, "No decor"))

    return results


# ============================================================
# REGRESSION GUARDS
# ============================================================


def test_mesh_standard_material():
    """REGRESSION: All terrain used MeshLambertMaterial — flat, no depth.
    Bug: Lambert material doesn't show edges/depth well, tiles looked like cardboard.
    Fix: Use MeshStandardMaterial with roughness/metalness for PBR-like depth."""
    results = []
    html = read_game_html()

    has_standard_material = bool(re.search(r"MeshStandardMaterial", html))
    has_roughness = bool(re.search(r"roughness:", html))

    if has_standard_material and has_roughness:
        results.append(
            TestResult(
                "PBR materials", True, "MeshStandardMaterial with roughness for depth"
            )
        )
    else:
        reasons = []
        if not has_standard_material:
            reasons.append("no MeshStandardMaterial")
        if not has_roughness:
            reasons.append("no roughness values")
        results.append(TestResult("PBR materials", False, "; ".join(reasons)))

    return results


def test_tile_edge_lines():
    """REGRESSION: Tiles had no visible edges — looked like flat cardboard.
    Bug: No edge geometry on terrain blocks, no visual separation between tiles.
    Fix: Add EdgesGeometry + LineSegments for dark outlines on each tile."""
    results = []
    html = read_game_html()

    has_edges_geometry = bool(re.search(r"EdgesGeometry", html))
    has_line_segments = bool(re.search(r"LineSegments", html))

    if has_edges_geometry and has_line_segments:
        results.append(
            TestResult(
                "Tile edge lines", True, "EdgesGeometry + LineSegments for tile depth"
            )
        )
    else:
        reasons = []
        if not has_edges_geometry:
            reasons.append("no EdgesGeometry")
        if not has_line_segments:
            reasons.append("no LineSegments")
        results.append(TestResult("Tile edge lines", False, "; ".join(reasons)))

    return results


def test_tile_gap_spacing():
    """REGRESSION: Tiles touched each other exactly — no visible gap for depth.
    Bug: blockSize - 1 left tiles nearly touching, no visual separation.
    Fix: Use tileSize = blockSize - tileGap for visible gaps between tiles."""
    results = []
    html = read_game_html()

    has_tile_gap = bool(re.search(r"tileGap|tileSize", html))

    if has_tile_gap:
        results.append(
            TestResult("Tile gap spacing", True, "Visible gaps between tiles for depth")
        )
    else:
        results.append(
            TestResult("Tile gap spacing", False, "No tile gap — tiles may look flat")
        )

    return results


def test_lighting_setup():
    """REGRESSION: Lighting was flat — no shadows, no fog, no atmosphere.
    Bug: Only basic directional light, no shadow maps, no fog."""
    results = []
    html = read_game_html()

    has_shadow_map = bool(re.search(r"shadow\.mapSize", html))
    has_fog = bool(re.search(r"scene\.fog|FogExp2|Fog", html))
    has_hemi_light = bool(re.search(r"HemisphereLight", html))

    if has_shadow_map and has_fog:
        results.append(
            TestResult("Advanced lighting", True, "Shadow maps + fog for depth")
        )
    else:
        reasons = []
        if not has_shadow_map:
            reasons.append("no shadow map config")
        if not has_fog:
            reasons.append("no fog")
        results.append(TestResult("Advanced lighting", False, "; ".join(reasons)))

    if has_hemi_light:
        results.append(TestResult("Hemisphere light", True, "Sky/ground color bounce"))
    else:
        results.append(TestResult("Hemisphere light", False, "No hemisphere light"))

    return results


def test_enemy_distinct_features():
    """REGRESSION: Enemies were generic colored shapes — no distinct features.
    Bug: Each enemy was just a single colored mesh with no identifying features."""
    results = []
    html = read_game_html()

    # Check for enemy feature additions (eyes, armor, horns, etc.)
    has_enemy_features = bool(
        re.search(
            r"(eyeGeo|pupilGeo|visorGeo|hornGeo|drillGeo|armor|speed.*line|pulsing.*core)",
            html,
        )
    )

    if has_enemy_features:
        results.append(
            TestResult(
                "Enemy distinct features", True, "Enemies have unique visual features"
            )
        )
    else:
        results.append(
            TestResult("Enemy distinct features", False, "Enemies are generic shapes")
        )

    return results


def run_all_tests():
    print("=" * 60)
    print("FINAL TOWER - PHASE 4 TEST SUITE")
    print("=" * 60)
    print()

    all_results = []

    test_groups = [
        ("4.1 Voxel Terrain", test_voxel_terrain),
        ("4.2 Path Visuals", test_path_visuals),
        ("4.3 Color Palette", test_color_palette),
        ("4.4 Decorations", test_decor),
        (
            "4.5 REGRESSION: Visual Quality Guards",
            lambda: [
                *test_mesh_standard_material(),
                *test_tile_edge_lines(),
                *test_tile_gap_spacing(),
                *test_lighting_setup(),
                *test_enemy_distinct_features(),
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
        print("❌ Phase 4 NOT verified")
        sys.exit(1)
    else:
        print("✅ ALL TESTS PASSED - Phase 4 verified!")
        sys.exit(0)


if __name__ == "__main__":
    run_all_tests()
