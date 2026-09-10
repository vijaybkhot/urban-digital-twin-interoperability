# POC 1: Config-Driven Cesium Viewer

## Purpose

POC 1 demonstrates a reusable Cesium viewer that renders a project from structured configuration instead of hardcoded scene code. The current runtime config is `public/project_config.json`.

This keeps the viewer stable while future tools, agents, or backend services generate or update project data.

## What It Shows

- Cesium globe scene
- mock facility building
- controlled-area boundary
- measurement points
- Low / Medium / High belief states
- editable readings and manual belief overrides
- recommendation text
- audit log
- project metadata in the side panel

## How It Works

The local runtime path is:

```text
public/project_config.json
  -> StaticJsonProjectConfigRepository
  -> validateProjectConfig
  -> useProjectState
  -> CesiumScene
  -> CesiumViewerAdapter
  -> Cesium entities
```

The important design idea is that Cesium rendering is isolated from domain logic. The viewer receives validated project data and renders it; it does not decide how the project was created.

## How To Run Locally

Install dependencies:

```bash
npm install
```

Optional but recommended for sharper imagery:

```bash
cp .env.example .env.local
```

Then add your Cesium ion token to `.env.local`:

```bash
VITE_CESIUM_ION_ACCESS_TOKEN=your_token_here
```

Start the app:

```bash
npm run dev
```

Open the Vite URL, usually:

```text
http://localhost:5173/
```

If `localhost` does not work on your machine, try:

```text
http://127.0.0.1:5173/
```

## How To Test

1. Confirm the globe loads.
2. Confirm the mock facility box, boundary, and three measurement points appear.
3. Click each measurement point and confirm the side panel updates.
4. Edit dose rate or contamination and confirm belief state recalculates.
5. Use a manual belief override and confirm the audit log records it.
6. Edit `public/project_config.json`, refresh the browser, and confirm config changes appear.

## Current Limits

- No backend.
- No database.
- No real sensor feed.
- Config reload currently requires a browser refresh.
- Local GLB model assets are handled in POC 3A; real reconstruction outputs are not integrated yet.
