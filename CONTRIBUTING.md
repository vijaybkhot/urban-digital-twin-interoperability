# Contributing

Thank you for considering a contribution to the Urban Digital Twin
Interoperability research prototype. Contributions may include code,
documentation, tests, reproducibility improvements, data-processing safeguards,
or focused research experiments.

This repository is an early research prototype, not a production digital-twin
or emergency-management system. Contributions must keep implemented, mock,
experimental, external, and planned capabilities clearly distinguishable.

## Before starting

1. Search the existing issues and pull requests for related work.
2. Open or comment on an issue before making a large architectural, data, or
   dependency change.
3. Keep changes focused on one issue or research question.
4. Review the [Code of Conduct](CODE_OF_CONDUCT.md),
   [Security Policy](SECURITY.md), and
   [Third-Party Notices](THIRD_PARTY_NOTICES.md).

Do not place security vulnerabilities, credentials, private data, or
restricted research material in a public issue. Follow `SECURITY.md` instead.

New to this repository? The [developer onboarding guide](docs/handoff/onboarding.md)
covers the 15-minute setup path, a classification of every application mode,
the one architectural rule that matters most, and where to read next.

## Development setup

Requirements:

- Git
- Node.js `20.19.0` or newer; Node.js `22.12.0` is the repository's pinned
  development version
- npm
- A browser with WebGL support for viewer testing

The repository pins Node `22.12.0` in `.nvmrc`. On macOS or Linux with `nvm`:

```bash
nvm use
npm ci
npm run dev
```

NVM for Windows does not automatically read `.nvmrc`; select the version
explicitly before installing dependencies:

```powershell
nvm use 22.12.0
npm ci
npm run dev
```

The main application normally opens at `http://localhost:5173/`. The isolated
ArcGIS experiment is available at
`http://localhost:5173/experiments/arcgis-urban-resilience/`.

Private tokens are optional. If an experiment needs one, copy `.env.example`
to the ignored `.env.local` file and use a restricted development credential.
Never commit credentials or `.env.local`.

## Branches, commits, and pull requests

- Create a descriptive branch from current `main`.
- Use focused commits with clear imperative messages.
- Do not rewrite a shared branch without coordinating with its contributors.
- Preserve existing Git history; do not replace or flatten prior project
  history to clean up a contribution.
- Link the relevant issue in the pull request.
- Explain the outcome, motivation, scope boundaries, and validation performed.
- Include a manual walkthrough when behavior or visualization changes.
- Keep generated build output, local caches, private inputs, and development
  credentials out of the commit.

Small, reviewable pull requests are preferred. New dependencies require a
clear justification, license review, and an explanation of bundle or
maintenance impact.

## Required validation

Run the complete current validation sequence before requesting review:

```bash
npm run validate
git diff --check
```

The npm command runs the elevation-sample, urban-resilience, facility,
LA-1/FEMA, and fictional disaster-data validators, followed by the TypeScript
and Vite production build. It validates committed local artifacts and does
not fetch OSM, FEMA, USGS, Cesium ion, or ArcGIS source responses. It requires
no API key or repository secret.

GitHub Actions runs the same command from a clean checkout for every pull
request and push to `main`. Existing protobuf dynamic-evaluation and Vite
bundle-size notices are documented non-blocking warnings; do not suppress
real validator, TypeScript, or build failures.

If a command cannot be run, state that limitation in the pull request rather
than marking it as passed. When viewer behavior changes, manually exercise all
affected modes and check the browser console for new errors.

## Data and provenance requirements

Source acquisition and scientific processing belong upstream of the viewers.
Do not move OSM, FEMA, USGS, or other scientific processing into Cesium or
ArcGIS frontend code merely to simplify a visualization.

When adding or regenerating a public-data artifact, document and review:

- the source organization and dataset;
- the source endpoint or query interface;
- applicable attribution or license terms;
- the retrieval date and study/query window where relevant;
- preserved source identifiers and useful source attributes;
- every material transformation or derived classification;
- coverage failures, missing values, and uncertainty;
- the generated local artifact and its validator.

Raw responses belong under the ignored `scripts/.cache/` directory. Generated
GeoJSON must be validated and reviewed before being committed. Upstream data
can change, so regenerated output is not assumed to be a mechanical update.

## Scientific and safety language

Contributions must preserve these interpretation boundaries:

- `Unknown` coverage or classification must never be converted to `Low`.
- A mapped non-intersection must not be described as no flood risk.
- OSM/FEMA intersection means only a geographic relationship with available
  mapped hazard information.
- Do not infer current flooding, road closure or passability, safe travel,
  evacuation guidance, facility availability or operation, structural
  vulnerability, or emergency-service availability.
- Ground elevation is not building height, floor or finished-floor elevation,
  structural elevation, flood depth, FEMA Base Flood Elevation, or a survey.
- OSM building footprints are not legal parcels, and absence from OSM does not
  prove real-world absence.
- Mock and fictional scenarios must remain conspicuously identified and must
  not be presented as validated predictions or emergency guidance.

Document uncertainty and unavailable coverage directly. Do not make a result
appear more conclusive for visual simplicity.

## Prohibited public submissions

Do not commit, attach to issues, or include in pull requests:

- passwords, API keys, access tokens, authorization headers, or `.env.local`;
- private residential addresses linked to identifiable people;
- participant, resident, or other personal information;
- non-public facility-security, access-control, or infrastructure details;
- raw private photographs or local image-intake files;
- restricted point clouds, reconstructions, meshes, or facility models;
- ignored raw service caches;
- restricted or live operational emergency information.

Properly attributed public OSM, FEMA, USGS, or similar government/open-data
records may be proposed when they are necessary, minimized to the research
scope, validated, and consistent with their source terms. Public provenance
does not remove the need for scientific interpretation limits.

## Documentation and user-facing changes

Update documentation when a change affects setup, validation, architecture,
data provenance, limitations, or user-visible behavior. Screenshots and sample
outputs must not expose tokens, private addresses, browser profiles, local
paths containing personal information, or restricted research inputs.

User-facing disaster or resilience features must retain their applicable
research and emergency-use disclaimers.

## License

Unless explicitly stated otherwise, contributions intentionally submitted for
inclusion in this project are provided under the
[Apache License 2.0](LICENSE), consistent with section 5 of that license.
Third-party material retains its original terms and must not be relicensed as
project-authored work.
