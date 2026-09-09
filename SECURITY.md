# Security Policy

## Supported versions

This repository is an early research prototype and does not yet have a stable
release series. Security corrections currently target the `main` branch.
Older branches, commits, tags, demonstrations, and generated artifacts do not
receive guaranteed backports or ongoing support.

This policy does not promise a specific acknowledgment, investigation,
resolution, or disclosure timeline.

## Report a vulnerability privately

Do not disclose a suspected vulnerability, exposed credential, or sensitive
research-data concern in a public issue, discussion, pull request, or commit.

Use the repository's
[private vulnerability reporting form](https://github.com/vijaybkhot/urban-digital-twin-interoperability/security/advisories/new).
GitHub will create a private repository-security-advisory conversation visible
to the reporter and repository maintainers.

A useful report should include, when available:

- the affected file, feature, version, branch, or commit;
- a clear description of the concern and its potential impact;
- minimal reproduction steps or a proof of concept that does not expose
  private or restricted data;
- relevant browser, operating-system, and Node.js versions;
- suggested mitigations or references;
- whether the concern is already public.

Do not include live credentials or unnecessary personal, facility, or research
data in the report. Redact active secret values. If a credential has been
exposed, revoke or rotate it immediately rather than waiting for repository
review.

## Sensitive-data and credential concerns

The following material must not be posted publicly in this repository:

- passwords, API keys, access tokens, authorization headers, or `.env.local`;
- private residential addresses linked to identifiable people;
- participant, resident, or other personal information;
- non-public facility-security, access-control, or infrastructure details;
- raw private photographs or image-intake files;
- restricted point clouds, reconstructions, meshes, or facility models;
- ignored raw service caches;
- restricted or live operational emergency information.

If such material is accidentally committed, do not reproduce its value in an
issue or follow-up commit. Revoke affected credentials where applicable and
use private vulnerability reporting to coordinate containment and Git-history
remediation.

Properly attributed public OSM, FEMA, USGS, or similar government/open-data
records are not treated as private merely because they describe a real place.
They must still be minimized to the research scope and used consistently with
their source terms and the project's scientific limitations.

## Rotating viewer credentials

Every environment variable this project reads is **optional in the sense that
nothing crashes without it**: no data-acquisition script requires a
credential (the OpenStreetMap Overpass, FEMA National Flood Hazard Layer, and
USGS 3DEP endpoints used by the `fetch:*` scripts are all unauthenticated
public services), and `npm run dev`, `npm run build`, and `npm run validate`
all succeed with no environment file present.

`VITE_CESIUM_ION_ACCESS_TOKEN` is the one exception worth calling out
precisely: without it, the viewer does not fail or go blank, but its
fallback base imagery (Cesium's bundled `NaturalEarthII` layer) only has
three zoom levels. At the site-level camera framing this application uses by
default, that fallback has no usable detail to show and renders as a flat,
near-uniform color field with no visible coastline, roads, or structures --
in practice indistinguishable from a broken globe even though the viewer is
working correctly. A Cesium ion token is therefore effectively required for
a usable map view, not merely a cosmetic upgrade.

| Variable | Used for | Without it |
| --- | --- | --- |
| `VITE_CESIUM_ION_ACCESS_TOKEN` | Cesium ion world imagery and the optional OSM Buildings tileset | Viewer loads, but the fallback basemap is too low-resolution to render anything recognizable at the default zoom (see above); the optional 3D-buildings tileset is skipped entirely |
| `VITE_ENABLE_URBAN_OSM_BUILDINGS` | Opt-in 3D building context in the urban-resilience demo | Defaults to `false` |
| `VITE_ARCGIS_API_KEY` | Satellite basemap and world elevation in the isolated ArcGIS SceneView experiment | Falls back to an OpenStreetMap basemap and a flat colored ground |

Because no data pipeline or `npm` command depends on these values, prefer
revoking a suspect credential immediately over investigating first — no
script will break. Revoking `VITE_CESIUM_ION_ACCESS_TOKEN` does temporarily
degrade the local map view as described above; reissue and drop in a
replacement once you have one.

To rotate:

- **Cesium ion** — revoke and reissue the access token from the
  [ion access-tokens page](https://ion.cesium.com/tokens). Grant only the
  asset-read scopes the viewer needs.
- **ArcGIS Location Platform** — revoke and reissue the key from the
  [ArcGIS Location Platform dashboard](https://location.arcgis.com/). Grant only
  Basemap styles and Elevation service privileges, and restrict it to approved
  HTTP referrers.

Store replacements only in a local environment file. Every `.env` variant is
ignored by `.gitignore`, with `.env.example` as the single tracked placeholder;
never paste a live value into `.env.example`, a commit message, an issue, a pull
request, or a screenshot. Treat any credential that has been readable by a shared
workstation, a screen recording, or an automated coding agent as exposed, and
rotate it.

## Prototype limitations

The application has no production backend, authentication, database, service
availability guarantee, or operational security program. It must not be used
for emergency guidance, facility operation, resident safety decisions, or
protection of sensitive infrastructure information.

A security report does not create a support contract or imply LSU ownership,
sponsorship, certification, or institutional incident-response support.
