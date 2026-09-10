# POC 4C: PLY Output Awareness

## Purpose

POC 4C prepares the project for Ehsan's current reconstruction output without
trying to render raw PLY files in Cesium yet.

The current real pipeline direction is:

```text
JPG/JPEG images -> COLMAP/reconstruction -> PLY point cloud
```

The current Cesium demo rendering path is still:

```text
viewer-ready GLB -> Cesium model entity
```

This POC keeps those two ideas separate. A PLY file can be recognized as
pipeline-native output, but it must be converted before the current Cesium
viewer can display it.

## Beginner Explanation

- `PLY` is often used for point clouds or scanned 3D geometry. It is a useful
  output from reconstruction tools.
- `GLB` is a compact web-friendly 3D model format. This is what the current
  Cesium demo renders directly.
- `3D Tiles` is a Cesium-friendly format for large geospatial models or point
  clouds. This is likely the better future path for large reconstruction output.

So the short version is:

```text
PLY is useful pipeline output.
GLB or 3D Tiles is useful viewer output.
```

## Current Behavior

- GLB model assets continue to render exactly as before.
- PLY or `point-cloud` assets are recognized in the contract and UI.
- The app shows that PLY output requires conversion before Cesium rendering.
- No raw PLY parser, Three.js viewer, backend, or real reconstruction process is
  added.

## Local Sample PLY Test

Use a known public sample only for local testing unless the license and
attribution are documented clearly enough to commit it.

Recommended source:

- Stanford 3D Scanning Repository: https://graphics.stanford.edu/data/3Dscanrep/
- Example model: Stanford Bunny PLY

Suggested local-only test:

1. Download a small Stanford Bunny PLY file.
2. Place it locally at `public/models/local-sample-bunny.ply`.
3. Keep it uncommitted. The repo ignores `public/models/*.ply`.
4. Compare it with `docs/examples/reconstruction_output_ply.example.json`.

This verifies the handoff shape without claiming that Cesium renders raw PLY.

## Next Step

After Ehsan shares a sample PLY, run a focused conversion spike:

- PLY to GLB for small model demos.
- PLY to 3D Tiles for larger point clouds or geospatial scenes.

POC 4D starts this path with a local Blender-based PLY-to-GLB conversion script
and testing notes. See `docs/archive/poc/poc-4d-ply-conversion-spike.md`.

The better long-term path should be chosen after testing with real pipeline
output.
