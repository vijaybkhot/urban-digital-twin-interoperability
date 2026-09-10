# POC 4B: Ehsan Reconstruction Pipeline Notes

## Purpose

POC 4B records the reconstruction pipeline details discussed with Ehsan so the
Cesium/intake workflow can be aligned with the real pipeline before backend,
PLY rendering, or conversion work begins.

This is a planning and compatibility note. It does not implement file upload,
run COLMAP, render PLY files, or connect to a real reconstruction service.

## Confirmed Pipeline Details

Ehsan's current reconstruction workflow is based on photogrammetry and COLMAP.
The pipeline takes ordinary site images, performs feature extraction and feature
matching, generates a point cloud, and then applies semantic processing to group
parts of the scene such as walls, windows, doors, and facade elements.

The longer-term direction may include a fuller 3D model, CAD, or BREP-style
outputs, but the current concrete output for integration planning is a PLY point
cloud.

## Input

- Current input is JPG/JPEG images.
- A folder of JPG/JPEG images is enough for the current pipeline.
- GPS metadata inside the images is strongly preferred.
- There is no strict image-count requirement yet, but image sequence, overlap,
  and GPS metadata strongly affect whether reconstruction succeeds.

For the Cesium app, this means the image intake step should check JPG/JPEG
compatibility and GPS/EXIF availability before sending images to the real
pipeline. POC 4H now adds the first browser-only GPS/EXIF advisory check.

## Current Output

The current output is:

```text
PLY point cloud with local coordinates
```

This output is not currently GLB or 3D Tiles. For Cesium viewing, a later step
will likely need one of these paths:

- convert PLY to GLB for small model demonstrations
- convert PLY or a derived model to 3D Tiles for larger geospatial scenes
- keep PLY as pipeline-native output and store converted viewer assets
  separately

Ehsan also noted that GPS information from the images can help convert local
coordinates into a global placement.

## Runtime And Status

The pipeline may take several hours for a full reconstruction workflow. The
rough runtime discussed was around five to six hours depending on the processing
stage.

Ehsan is also working on a dashboard that can show stages such as point clouds,
semantic outputs, and rendered views. In a future integration, the Cesium app
should consume simple job status and progress messages instead of requiring the
user to inspect technical logs.

## Image Feasibility

COLMAP feature matching is the important technical pre-check. If COLMAP cannot
extract and match enough features across the image set, reconstruction can fail.

Common risk factors include:

- images without GPS metadata
- images taken randomly without a useful sequence
- weak image overlap
- not enough useful shared features between images

For image readiness work, the app should treat browser-only checks such as image
count, resolution, GPS/EXIF availability, and GPS distance from the selected
site as an early guide. COLMAP feature matching remains the stronger feasibility
signal.

## How This Affects The Cesium App

The current app already simulates this high-level flow:

```text
project setup
-> image intake
-> readiness review
-> mock reconstruction
-> model appears in Cesium
```

POC 4B clarifies that the real pipeline handoff should initially plan around:

- JPG/JPEG image input
- browser-only GPS/EXIF metadata checks as an advisory signal
- PLY point cloud output
- placement metadata or conversion from local coordinates to global location
- future conversion to GLB or 3D Tiles for Cesium rendering

## Next Technical Questions

- What exact folder or transfer format should the real backend use for images?
- Can the pipeline return a stable output folder/path for each job?
- What metadata is available with the PLY output?
- Can local point cloud coordinates be transformed into meters and a site
  anchor?
- Which conversion path should be tested first: PLY to GLB or PLY to 3D Tiles?
- What progress/status messages can be exposed from the pipeline dashboard?

## Next Recommended POCs

- Use POC 4H GPS/EXIF intake results in the future real handoff metadata.
- Add a PLY handoff example to the reconstruction contract.
- Use a licensed local sample PLY for handoff testing without committing the binary.
- Wait for Ehsan's sample PLY file, then run a focused conversion/rendering spike.
- Keep the existing mock GLB workflow stable until real output conversion is
  tested.
