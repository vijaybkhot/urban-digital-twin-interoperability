# POC 3A: GLB Model Assets

## Purpose

POC 3A proves that the Cesium viewer can render a reconstructed-model placeholder from `project_config.json`.

The current model is not a real reconstruction. It is a sample GLB used to validate the path from config to Cesium rendering:

```text
project_config.json -> modelAssets -> Cesium model entity
```

## What It Shows

- a local GLB model loaded from `public/models`
- config-driven model placement with latitude, longitude, height, scale, and orientation
- Cesium rendering of a model asset alongside the existing facility, boundary, and measurement points

## Runtime Config

The model is configured in `public/project_config.json` under `modelAssets`:

```json
{
  "assetId": "mock-reconstruction-milk-truck",
  "assetType": "glb",
  "assetUrl": "/models/CesiumMilkTruck.glb",
  "sourcePipeline": "mock-reconstruction-placeholder",
  "status": "ready",
  "spatialAnchor": {
    "lat": 40.03818,
    "lon": -75.59755,
    "height": 2
  },
  "scale": 2,
  "orientation": {
    "heading": 90,
    "pitch": 0,
    "roll": 0
  }
}
```

Only `glb` assets with `status: "ready"` are rendered in this POC.

## How To Test

Start the app:

```bash
npm run dev
```

Open the Vite URL, usually:

```text
http://localhost:5173/
```

Then verify:

1. The Cesium globe loads.
2. The facility box, boundary, and measurement points still appear.
3. The milk truck model appears near the mock facility.
4. Clicking the model shows its Cesium entity details.
5. Editing `modelAssets[0].scale`, `spatialAnchor.height`, or `orientation.heading` in `public/project_config.json` changes placement after browser refresh.

## Current Limits

- GLB only.
- No 3D Tiles rendering yet.
- No real COLMAP/reconstruction output yet.
- Placement is manually tuned through config.
- Config changes still require a browser refresh.

## Sample Model Attribution

`CesiumMilkTruck.glb` is from the Khronos glTF Sample Models repository. It was donated by Cesium for glTF testing and is licensed under Creative Commons Attribution 4.0.
