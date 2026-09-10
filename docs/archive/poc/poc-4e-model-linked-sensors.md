# POC 4E: Model-Linked Sensors

## Purpose

POC 4E lets a model annotation point link to an existing measurement point.
This turns a model pin from a read-only inspection note into a spatial entry
point for sensor data.

This version intentionally keeps the sensor model simple. It reuses the
existing measurement point fields instead of adding a generic sensor engine.

In beginner terms, the model pin is a visual shortcut. The actual sensor data
still lives in an existing measurement point such as `MP-02`. The config field
`measurementPointId` tells the app which measurement point should open when a
model pin is selected.

## What It Demonstrates

Current model annotations already show where an inspection point sits on the
model. POC 4E adds an optional link:

```json
{
  "id": "truck-front",
  "modelAssetId": "mock-reconstruction-milk-truck",
  "measurementPointId": "MP-02",
  "label": "Front inspection",
  "localPosition": { "x": 3, "y": 0, "z": 0.8 }
}
```

When the user clicks that model annotation, the side panel shows:

- model annotation details
- linked sensor details
- editable dose rate, contamination, and last reading
- belief recalculation
- manual belief override
- audit log entries

The selected map marker is highlighted so the user can tell which point is
currently active. Linked model annotation labels also show the linked
measurement point ID, belief state, and dose-rate reading.

## Demo Mapping

The current demo links the milk-truck annotations to existing measurement
points:

- `truck-roof` -> `MP-01`
- `truck-front` -> `MP-02`
- `truck-side` -> `MP-03`

## How To Test

1. Run `npm run dev`.
2. Select `Open existing demo`.
3. Click each milk-truck annotation marker.
4. Confirm the panel shows both model annotation details and linked sensor data.
5. Confirm the selected annotation marker becomes visually highlighted.
6. Confirm linked annotation labels show the linked point ID, belief, and dose rate.
7. Edit dose rate or contamination and select `Apply readings`.
8. Confirm the belief state recalculates and the audit log records the update.
9. Use manual belief override and confirm the audit log updates.
10. Click a normal measurement point and confirm the original behavior still works.

## Current Limits

- Links are config-driven and read from `measurementPointId`.
- Only existing measurement point data is reused.
- No new temperature, vibration, camera, or visual-inspection sensor forms are added yet.
- No backend, real sensor API, persistence, LLM, or reconstruction changes are included.
- New projects from the mock reconstruction workflow still produce only a model asset.
