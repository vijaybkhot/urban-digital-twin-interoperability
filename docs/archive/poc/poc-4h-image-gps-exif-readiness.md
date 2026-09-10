# POC 4H: Image GPS/EXIF Readiness Check

## Purpose

POC 4H adds a browser-only GPS/EXIF check to the image intake flow. The goal is
to warn the user when selected images may not contain GPS metadata before the
image set is sent to a reconstruction pipeline.

This is an advisory check only. Missing GPS does not block the current mock
reconstruction workflow.

## What It Checks

For each usable image, the browser now records one GPS status:

- `present`: readable GPS latitude and longitude were found.
- `missing`: the image was readable, but no GPS coordinates were found.
- `unknown`: GPS could not be checked reliably, such as for non-JPEG images or
  EXIF parsing errors.

The intake summary shows:

- images with GPS
- images without GPS
- GPS coverage percentage
- GPS unknown count
- average distance from image GPS to the selected project site, when both are
  available

The assistant message also summarizes GPS availability.

## Why This Matters

Ehsan noted that GPS metadata can help the reconstruction pipeline place local
coordinates into a real-world location. Images without GPS can still be useful,
especially when the user provides a site anchor, but GPS makes the future
handoff easier.

The app keeps the user-selected site location as the main anchor. Image GPS is
used as supporting evidence. If the average image GPS location is more than
about 1 km from the selected project site, the app shows a warning so the user
can confirm the site before running a real reconstruction.

If only one image has GPS, the app says the distance check is based on limited
GPS data.

## Local-Only Behavior

All inspection happens in the browser:

- no image upload
- no backend storage
- no COLMAP execution
- no LLM or computer vision analysis
- no EXIF data leaves the user's machine

## How To Test

Start the app:

```bash
npm run dev
```

Then test the image intake panel with:

1. JPEG images known to include GPS metadata.
2. JPEG images without GPS metadata.
3. A mixed image set with some GPS and some non-GPS images.
4. PNG, WebP, or HEIC images, where GPS may show as unknown.
5. GPS-tagged images from a different location than the selected project site.

Confirm that:

- image count and resolution checks still behave as before
- GPS counts appear in the summary
- missing GPS adds advisory text
- far-away image GPS adds an advisory site mismatch warning
- `Review Recommended` and `Ready for Initial Test` can still start mock
  reconstruction

## Current Limits

- This does not prove that COLMAP reconstruction will succeed.
- This does not check overlap, blur, camera angles, or feature matching.
- This does not extract full camera pose or image sequence quality.
- GPS is helpful, but the user-provided site location remains the main spatial
  anchor in the current app.

## Future Work

A stronger pre-check should combine:

```text
browser metadata checks
-> optional image quality / CV checks
-> lightweight COLMAP feature matching
-> full reconstruction
```

POC 4H only covers the first step.
