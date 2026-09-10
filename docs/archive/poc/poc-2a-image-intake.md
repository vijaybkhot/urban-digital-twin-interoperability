# POC 2A: Browser Image Intake

## Purpose

POC 2A adds a browser-only image intake panel for early reconstruction readiness checks. It helps a user understand whether a selected image set is likely sufficient for an initial reconstruction test.

This is a rule-based mock assistant. It does not call an LLM, upload files, run COLMAP, or create a 3D model.

## What It Checks

- usable image count
- unsupported file count
- unreadable image count
- total image size
- average resolution
- average megapixels
- low-resolution image count
- GPS/EXIF availability
- basic reconstruction readiness status

Files stay on the user's machine. The browser reads image dimensions and
GPS/EXIF availability locally.

## Readiness Statuses

- `Not Ready`: fewer than 20 usable images, or no usable image set.
- `Review Recommended`: 20-39 usable images. A rough reconstruction test may be possible, but more images or human review is recommended.
- `Ready for Initial Test`: 40 or more usable images with acceptable basic resolution checks.

These checks are intentionally simple. Final reconstruction quality should come from the reconstruction pipeline itself.

## How To Run Locally

Start the app:

```bash
npm run dev
```

Open the Vite URL, usually:

```text
http://localhost:5173/
```

## How To Test

1. Open the `Image Intake / Mock Assistant` panel.
2. Select 1 image and confirm the status is `Not Ready`.
3. Select 20-39 images and confirm the status is `Review Recommended`.
4. Select 40 or more good-resolution images and confirm the status is `Ready for Initial Test`.
5. Confirm the panel shows image count, total size, average resolution, average megapixels, low-resolution count, and GPS coverage.
6. With GPS-tagged images, confirm the panel can show the distance between image GPS and the selected project site.

Good test sources include phone photos of one site/object or public photogrammetry datasets such as COLMAP sample images. Keep large datasets outside the repository.

## Current Limits

- No cloud upload.
- No backend handoff.
- GPS/EXIF checks and site-distance warnings are advisory only and do not prove reconstruction quality.
- No computer vision quality analysis.
- No COLMAP or reconstruction execution yet.
- The file picker currently accepts image files only, so unsupported-file testing may require future UI changes.
