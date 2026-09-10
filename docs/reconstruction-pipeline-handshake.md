# Proposed Handshake with Reconstruction Pipeline

## Purpose

This defines how the Cesium/config side can connect with an external NeRF/COLMAP/image-to-3D reconstruction pipeline without tightly coupling the systems. The goal is a small shared contract: the intake side prepares project data and consumes model asset references; the reconstruction side produces model assets and metadata.

POC 3D now exercises this boundary with a browser-only
`MockColmapReconstructionProvider`. It accepts a typed request, reports
`queued`, `running`, and `completed` states, and returns the bundled milk-truck
GLB. It does not execute COLMAP or transfer files.

POC 4A expands this into a more complete discussion contract for the real
pipeline handoff. See `docs/archive/poc/poc-4a-reconstruction-handoff-contract.md`.

POC 4B records the current reconstruction pipeline details discussed with
Ehsan, including JPG/JPEG input, GPS metadata importance, and PLY point cloud
output. See `docs/archive/poc/poc-4b-ehsan-reconstruction-pipeline.md`.

POC 4C adds PLY output awareness while keeping raw PLY rendering out of scope.
PLY point-cloud output is treated as pipeline-native data that should be
converted to GLB or 3D Tiles before Cesium rendering. See
`docs/archive/poc/poc-4c-ply-output-awareness.md`.

POC 4D adds a local Blender-based PLY-to-GLB conversion spike. It is a local
tooling experiment only; it does not add backend upload, real COLMAP execution,
raw PLY rendering, or 3D Tiles rendering. See
`docs/archive/poc/poc-4d-ply-conversion-spike.md`.

POC 4H adds browser-only GPS/EXIF readiness checks to image intake. It reports
GPS coverage and a simple image-GPS-to-site distance warning as advisory signals
before reconstruction handoff, but does not upload images or run a real
feasibility check. See
`docs/archive/poc/poc-4h-image-gps-exif-readiness.md`.

## Responsibilities

### Cesium / Agent Intake Side

- collect user inputs
- collect uploaded images in future
- inspect metadata, including GPS/EXIF availability
- create project ID
- generate or update `project_config.json`
- consume model asset references

### Reconstruction Pipeline Side

- receive image set or project folder
- run reconstruction
- generate model asset
- provide output path/URL and metadata

## Request Lifecycle

```text
ReconstructionRequest
-> startReconstruction
-> poll getReconstructionStatus
-> getReconstructionOutput
-> add returned asset to ProjectConfig.modelAssets
```

A future backend adapter can replace the mock provider while preserving this
application flow.

Example request, status, output, PLY output, and error payloads live in
`docs/examples/`.

Future request metadata can include image GPS coverage and image-GPS-to-site
distance from POC 4H so the reconstruction side knows whether GPS was available
and roughly aligned before running heavier pipeline steps.

## Shared Output Contract

```json
{
  "projectId": "mock-dnd-facility",
  "jobId": "recon-job-001",
  "status": "completed",
  "asset": {
    "assetId": "mock-dnd-facility-recon-001",
    "assetType": "3d-tiles",
    "assetUrl": "/tilesets/mock-dnd-facility/tileset.json",
    "sourcePipeline": "external-reconstruction-pipeline",
    "status": "ready",
    "spatialAnchor": {
      "lat": 40.03883,
      "lon": -75.59777,
      "height": 0
    },
    "orientation": {
      "heading": 0,
      "pitch": 0,
      "roll": 0
    },
    "scale": 1,
    "quality": {
      "status": "unknown",
      "notes": "Placeholder until reconstruction quality metrics are available."
    },
    "coordinateFrame": {
      "convention": "local-enu",
      "unit": "meters",
      "origin": "spatialAnchor"
    }
  }
}
```

## Coordinate Normalization

Reconstruction providers should normalize model handoff metadata to:

- meters
- local east/right (`x`)
- local north/forward (`y`)
- local up (`z`)
- a documented origin represented by `spatialAnchor`

If a pipeline produces a different internal frame, it should convert the asset
or provide the transform into this standard frame. This lets GLB and future 3D
Tiles assets use the same model-local annotation contract.

## GLB vs 3D Tiles

GLB may be enough for small/simple models. It is straightforward to load and useful for early experiments.

3D Tiles should be the long-term target for larger geospatial scenes in Cesium. It supports tiled, geospatially anchored, scalable visualization better than a single monolithic model.

PLY point clouds are useful pipeline output, but they are not the current direct
Cesium rendering path in this app. Keep PLY as the native reconstruction output,
then test conversion to GLB for small demos or 3D Tiles for larger point clouds.

The current local conversion spike uses Blender to test PLY to GLB conversion.
Generated local GLB samples should stay uncommitted until their source license
and attribution are documented.

The architecture should support GLB, 3D Tiles, and pipeline-native assets
through `modelAssets` in config.

## Open Questions

- Which PLY-to-viewer conversion path works best with Ehsan's sample output?
- Does the output have scale/orientation/location metadata?
- Can the pipeline normalize scale, axes, and origin into local ENU meters?
- Can output be converted to GLB or 3D Tiles?
- Should Cesium load assets directly from local storage first or from cloud storage later?
