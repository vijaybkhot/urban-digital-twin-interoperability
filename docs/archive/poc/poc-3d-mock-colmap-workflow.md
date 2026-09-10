# POC 3D: Mock COLMAP Reconstruction Workflow

## Purpose

POC 3D demonstrates the expected user journey around a future reconstruction
pipeline:

```text
Create project
-> choose a site
-> select local images
-> review readiness
-> start mock reconstruction
-> display the returned model in Cesium
```

This is a browser-only simulation. It does not upload images or run COLMAP.

## Run Locally

```bash
npm install
npm run dev
```

Open the Vite URL, usually `http://localhost:5173/`.

For Cesium ion imagery, add a token to `.env.local`:

```text
VITE_CESIUM_ION_ACCESS_TOKEN=your_token
```

## Test The Workflow

1. Enter a project name.
2. Type valid latitude and longitude, or choose `Select on globe` and click the ground.
3. Confirm the blue site marker appears at the selected location.
4. Select `Create project`.
5. Choose at least 20 readable images.
6. Confirm the readiness review is `Review Recommended` or `Ready for Initial Test`.
7. Select `Start mock reconstruction`.
8. Observe the job move from `queued` to `running` to `completed`.
9. Confirm the milk-truck GLB appears at the selected site only after completion.
10. Select `New project` and confirm the workflow is cleared.

Use `Open existing demo` to verify the facility, sensors, belief-state controls,
image intake panel, model, and model annotations from the earlier POCs.

## Current Limits

- Images remain in browser memory and are not uploaded.
- Readiness is based on simple deterministic rules.
- The reconstruction job uses timers and always succeeds.
- The returned model is the existing Cesium Milk Truck sample.
- Refreshing the browser clears the new-project workflow.
- No backend, database, cloud storage, real COLMAP process, or LLM is used.
