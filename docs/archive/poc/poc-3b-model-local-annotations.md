# POC 3B: Model-Local Inspection Annotations

## Purpose

POC 3B adds clickable inspection points that are attached to a model asset rather than fixed directly to latitude and longitude.

The points are configured in `project_config.json` and follow the model when its location, rotation, or scale changes.

## Coordinate Contract

Model annotations use a standardized local ENU coordinate frame:

```text
x = east/right
y = north/forward
z = up
unit = meters
origin = model asset spatialAnchor
```

Annotation coordinates are defined before the model asset scale is applied. For example, an `x` value of `2` with an asset scale of `2` produces a four-meter displayed offset from the model origin.

This contract avoids depending directly on the internal axes or units of an individual GLB file. A future reconstruction pipeline should provide an asset that is normalized to this documented frame, or provide the transform needed to reach it.

## Runtime Config

The model asset declares its coordinate frame:

```json
"coordinateFrame": {
  "convention": "local-enu",
  "unit": "meters",
  "origin": "spatialAnchor"
}
```

Annotations reference the asset:

```json
{
  "id": "truck-roof",
  "modelAssetId": "mock-reconstruction-milk-truck",
  "label": "Roof inspection",
  "description": "Mock inspection point above the truck roof.",
  "localPosition": {
    "x": 0,
    "y": 0,
    "z": 3
  }
}
```

The demonstration offsets are deliberately placed slightly outside the opaque
milk-truck surface so all three markers can be inspected. This sample GLB was not
exported by the future normalized reconstruction pipeline, so its visually
meaningful front and side directions were calibrated manually for the demo.

## How To Test

Start the app:

```bash
npm run dev
```

Then verify:

1. Three cyan annotation markers appear around the milk truck.
2. Clicking roof, front, or side markers opens read-only annotation details in the movable side panel.
3. Selecting a measurement point returns the panel to measurement and belief controls.
4. Annotation and measurement selections are recorded in the audit log.
5. The camera angle and zoom remain unchanged when either point type is selected.
6. Markers behind the opaque model are hidden by normal depth testing and reappear from visible viewpoints.
7. `Clear selection` clears the selected item without moving the panel.
8. `Move to top-left` returns a dragged panel to the upper-left and scrolls it to the top.
9. Changing the truck anchor moves the model and annotations together.
10. Changing heading rotates annotation offsets around the model.
11. Changing scale changes both model size and annotation offsets.

## Current Limits

- Read-only config-driven annotations.
- GLB assets only in the current renderer.
- No browser surface picking.
- No annotation coordinate editing.
- No real reconstruction pipeline connection yet.
- Future 3D Tiles support must apply the tileset root transform to the same local ENU coordinates.
