# POC 4A: Reconstruction Handoff Contract

## Purpose

POC 4A defines how the Cesium/intake side should talk to a future
reconstruction pipeline. It is a discussion contract for Prof. Lee, Ehsan, and
future implementation work.

This is not a backend implementation. It does not upload images, call COLMAP,
call an LLM, or store files in the cloud.

## Intended Flow

```text
project setup
-> image intake
-> reconstruction request
-> job status polling
-> output model asset
-> Cesium renders the returned asset
```

The current POC 3D simulates this flow in the browser. POC 4A documents the
shape that a real reconstruction handoff should follow.

## Responsibilities

### Cesium / Intake Side

- collect project name, description, and site location
- inspect image count, size, and resolution
- prepare a stable `projectId`
- send reconstruction input metadata
- receive job status and model asset metadata
- add the returned asset to `project_config.json` or in-memory project config
- render the model through the existing Cesium viewer

### Reconstruction Pipeline Side

- receive or locate the image set
- run COLMAP, NeRF, Gaussian splatting, or another reconstruction process
- create a model output
- provide a path or URL to the model asset
- provide placement metadata: location, scale, orientation, and coordinate frame
- report job status and useful failure messages

## Proposed Request Shape

A reconstruction request should describe the project, image set, desired output,
and coordinate contract.

See: `docs/examples/reconstruction_request.example.json`

Important fields:

- `projectId`: stable project identifier
- `projectName`: human-readable name
- `siteAnchor`: approximate real-world location for the model
- `imageSet`: where the reconstruction pipeline can find images
- `requestedOutput`: preferred output type, such as `glb`, `3d-tiles`, or `point-cloud`
- `coordinateFrame`: expected normalized coordinate system
- `metadata`: optional notes from the intake workflow

## Proposed Job Status Shape

The reconstruction side should return a job ID immediately, then allow the app
to poll job status.

See: `docs/examples/reconstruction_job_status.example.json`

Supported statuses:

```text
queued
running
completed
failed
```

The status response should include a plain `progressMessage` so a user can
understand what is happening without reading technical logs.

## Proposed Output Shape

When reconstruction completes, the pipeline should return a model asset that
the Cesium viewer can load from config.

See: `docs/examples/reconstruction_output.example.json`

The most important output is `asset`, which should include:

- `assetId`
- `assetType`: `glb`, `3d-tiles`, `point-cloud`, or `mesh`
- `assetUrl`
- `sourcePipeline`
- `spatialAnchor`
- `scale`
- `orientation`
- `coordinateFrame`
- optional `quality`

## Error Shape

If the job fails, the pipeline should return an error that is useful for a
student, advisor, or developer.

See: `docs/examples/reconstruction_error.example.json`

Useful failures include:

- too few matching images
- insufficient overlap
- blurry images
- missing camera metadata
- unsupported image format
- output conversion failed

POC 4C adds a separate PLY output example at
`docs/examples/reconstruction_output_ply.example.json`. That example represents
pipeline-native point-cloud output, not a directly rendered Cesium asset.

## Coordinate Contract

The recommended normalized coordinate contract is:

```text
unit = meters
x = east/right
y = north/forward
z = up
origin = spatialAnchor
```

If a reconstruction tool uses a different internal unit, origin, or axis system,
the pipeline should either convert the output or report the transform needed to
place it in this standard frame.

This matters because Cesium needs a clear real-world anchor to place the model
on the globe.

## LLM Position

POC 4A does not integrate an LLM.

The future AI role should be a screening and explanation layer, not decorative
text and not a replacement for reconstruction quality checks.

Recommended future sequence:

```text
rule-based metadata checks
-> optional CV/LLM image review
-> reconstruction pipeline
-> reconstruction quality feedback
```

Possible useful LLM tasks:

- explain missing image coverage
- detect blurry or repetitive image samples
- summarize whether the image set is worth reconstructing
- generate structured project config from conversation
- explain reconstruction failure logs in simple language

The final technical quality decision should still come from the reconstruction
pipeline and human review.

## Questions For Ehsan

- What input format does the pipeline prefer: folder, zip, image list, or API upload?
- What output format does it currently produce: PLY, OBJ, mesh, point cloud, GLB, or 3D Tiles?
- Can it provide scale, orientation, and location metadata?
- Can it normalize output to meters and local ENU coordinates?
- Can it return job status and error messages?
- Can the output be converted to GLB or 3D Tiles?

## What Comes After This

After this contract is reviewed, the next implementation step can be a small
mock backend adapter. That backend can keep the same request, status, and output
shapes while still returning the current sample GLB. The real reconstruction
pipeline can then replace the mock backend later.
