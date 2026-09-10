# POC 4D: PLY Conversion Spike

## Purpose

POC 4D tests the practical bridge between Ehsan's current pipeline output and
the current Cesium viewer.

The expected real pipeline output is:

```text
PLY point cloud or reconstructed geometry
```

The current direct Cesium viewer output is:

```text
GLB model asset
```

This POC adds a local conversion script and testing notes for:

```text
PLY -> GLB
```

It does not add raw PLY rendering, 3D Tiles rendering, file upload, backend
execution, real COLMAP execution, or committed sample model binaries.

## Beginner Explanation

- `PLY` is a common format from reconstruction and scanning tools.
- `GLB` is a web-friendly 3D model format that the current Cesium viewer can
  already display.
- `3D Tiles` is still the likely future target for large point clouds or large
  geospatial reconstructions.

For now, the safest experiment is:

```text
Can we convert a small PLY into GLB and then view that GLB in Cesium?
```

## Local Conversion Command

Install Blender locally, then run:

```bash
blender --background --factory-startup --python tools/convert-ply-to-glb.py -- input.ply output.glb
```

Example local-only paths:

```bash
blender --background --factory-startup --python tools/convert-ply-to-glb.py -- \
  public/models/local-sample-bunny.ply \
  public/models/local-sample-bunny.glb
```

The repo ignores:

```text
public/models/*.ply
public/models/*.glb
!public/models/CesiumMilkTruck.glb
```

This keeps downloaded PLY samples and generated GLB test files out of Git by
default.

## Suggested Sample

Use a small, clearly licensed public sample for local testing.

Recommended source:

- Stanford 3D Scanning Repository: https://graphics.stanford.edu/data/3Dscanrep/
- Example: Stanford Bunny PLY

Do not commit downloaded sample files unless the license and attribution are
documented in the repository.

## Local Test Checklist

1. Download a small PLY sample.
2. Place it at an ignored local path such as
   `public/models/local-sample-bunny.ply`.
3. Run the Blender conversion command.
4. Confirm `public/models/local-sample-bunny.glb` is created locally.
5. Confirm Git does not stage the local PLY or generated local GLB.
6. Optionally test the generated GLB in the app by temporarily pointing a local
   config copy at the generated file.
7. Do not commit the temporary config change or generated GLB unless a later
   license/attribution decision is made.

## Current Validation Note

This repository includes the conversion script and documentation, but it does
not commit Blender, downloaded sample PLY files, or generated GLB files.

Local testing with the Stanford Bunny showed an important distinction:

- Single scan/range-grid PLY files such as `bun270.ply` can import into Blender
  but may export an empty GLB because they do not contain exportable mesh
  primitives.
- Reconstructed mesh PLY files such as `bun_zipper.ply`, which include both
  vertices and faces, convert successfully to GLB through the Blender command
  line.

The successful local command used the selected mesh PLY and produced a GLB of
about 5.55 MB:

```bash
/Applications/Blender.app/Contents/MacOS/Blender \
  --background \
  --factory-startup \
  --python tools/convert-ply-to-glb.py -- \
  public/models/bun_zipper.ply \
  public/models/local-bun-zipper.glb
```

The converted local GLB rendered in Cesium when used as a temporary
`modelAssets[].assetUrl`. That temporary asset and config change should remain
local-only unless the sample license and attribution are documented.

## Decision From This Spike

Use this POC to compare:

- `PLY -> GLB`: likely good for small demonstrations and early advisor demos.
- `PLY -> 3D Tiles`: likely better for larger point clouds, larger sites, or
  geospatially tiled output.

The next implementation should be chosen after testing with Ehsan's real sample
PLY file.
