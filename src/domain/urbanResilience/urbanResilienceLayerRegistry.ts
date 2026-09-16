import type { UrbanResilienceScenario } from "../../types/urbanResilience";
import { urbanResilienceVisualColors } from "../../theme/urbanResilienceVisualTokens";

/**
 * The declarative, panel/AppShell-side description of every urban-resilience
 * layer: what it is, where it came from, and how it is presented. This is
 * NOT a rendering abstraction and NOT part of the `ViewerAdapter` boundary --
 * `CesiumViewerAdapter`, `CesiumScene`, and every `src/cesium/*.ts` styler
 * remain the only place Cesium is actually driven. This module has zero
 * consumers as of Issue #115 (HO-18); Issue #116 (HO-19) is what wires
 * `AppShell` to read layer visibility and data URLs from here instead of
 * from two hand-written booleans.
 *
 * See `docs/data/urban-resilience-layers.md` (HO-09) for the full narrative
 * per layer and `docs/data/data-register.md` (HO-05) for dataset provenance.
 * Every `provenance` string below is copied from one of those two documents
 * or from ADR 006, not invented here.
 */

/** One of the seven things a user of the urban-resilience mode can think of
 * as "a layer" -- not all of them are literally a Cesium layer; see
 * `renderTarget` below. */
export type UrbanLayerId =
  | "buildings-properties"
  | "flood-hazard"
  | "response-routes"
  | "community-facilities"
  | "ground-elevation"
  | "la1-fema-experiment"
  | "osm-3d-context";

/**
 * Core layers are part of the primary Grand Isle / Port Fourchon deliverable
 * and are documented in `docs/data/urban-resilience-layers.md` as
 * "IMPLEMENTED, core". Experimental layers are explicitly opt-in research
 * add-ons, off by default. `osm-3d-context` is also opt-in but is gated by
 * an environment variable rather than an in-app toggle -- it is classified
 * here as "experimental" too because the type only distinguishes these two
 * categories; its env-gated nature is captured by `toggleable: false` and
 * its own `renderTarget`, not by a third category value.
 */
export type UrbanLayerCategory = "core" | "experimental";

/**
 * Where and how a layer actually renders. Not every entry here is a Cesium
 * layer -- `ground-elevation` never touches the viewer at all, and
 * `osm-3d-context` is a hosted 3D Tileset rather than local GeoJSON.
 * - `cesium-scenario`: created inside the single `renderUrbanResilienceScenario`
 *   call alongside the main scenario (buildings, flood zones, response
 *   routes/resources).
 * - `cesium-overlay`: created by its own separate adapter render call with
 *   its own load-version guard (the two experimental GeoJSON layers).
 * - `react-panel`: never rendered into the Cesium viewer; fetched and shown
 *   as detail rows inside a React panel.
 * - `cesium-ion-context`: a Cesium ion-hosted tileset, unrelated to any
 *   local data artifact.
 */
export type UrbanLayerRenderTarget =
  | "cesium-scenario"
  | "cesium-overlay"
  | "react-panel"
  | "cesium-ion-context";

/**
 * A layer's data source is never copied as a literal URL -- it is a typed
 * key into `UrbanResilienceScenario`, resolved at read time by
 * `resolveUrbanLayerDataUrl`. This keeps `grandIslePortFourchonScenario.ts`
 * as the single place a URL literal is written; this registry only ever
 * references it. `null` means the layer has no scenario-carried data URL
 * (`osm-3d-context`, which loads from Cesium ion instead).
 */
export type UrbanLayerDataUrlKey =
  | "propertyDataUrl"
  | "floodZoneDataUrl"
  | "responseDataUrl"
  | "experimentalLa1FemaDataUrl"
  | "experimentalFacilityDataUrl"
  | "experimentalGroundElevationDataUrl"
  | null;

/**
 * Where a layer's data came from and what it does and does not mean.
 * Every field is copied from `docs/data/data-register.md` (HO-05),
 * `docs/data/urban-resilience-layers.md` (HO-09), or ADR 006 -- these are
 * safety-relevant strings, not summaries to be paraphrased.
 */
export interface UrbanLayerProvenance {
  /** The authoritative organization(s) behind the underlying data. */
  organization: string;
  /** Human-readable dataset name, matching its data-register heading. */
  dataset: string;
  /** The committed artifact path, or `null` for layers with no local file
   * (e.g. `osm-3d-context`, which has no committed artifact at all). */
  url: string | null;
  /** Attribution/license line, e.g. what a citation or credits screen would
   * say. */
  attribution: string;
  /** The interpretation limit a viewer must not lose sight of. Verbatim or
   * near-verbatim from the layer doc's "Interpretation limits" section. */
  limitation: string;
}

/** Symbol shape shown in the legend swatch -- purely descriptive metadata,
 * not a rendering instruction. */
export type UrbanLegendSwatchSymbol = "polygon" | "outline" | "point" | "line";

/** One row of legend content. `color` must always be a value copied from
 * `urbanResilienceVisualColors`, never a literal hex string, so the legend
 * and the actual Cesium styling can never silently drift apart. */
export interface UrbanLegendSwatch {
  label: string;
  color: string;
  symbol: UrbanLegendSwatchSymbol;
  detail: string;
}

/** The full declarative description of one urban-resilience layer. */
export interface UrbanLayerDefinition {
  id: UrbanLayerId;
  label: string;
  category: UrbanLayerCategory;
  renderTarget: UrbanLayerRenderTarget;
  dataUrlKey: UrbanLayerDataUrlKey;
  provenance: UrbanLayerProvenance;
  /** Whether the layer is visible/active by today's actual default
   * behavior -- see `defaultUrbanLayerVisibility` below, which this field
   * must stay consistent with. */
  defaultVisible: boolean;
  /**
   * Whether an explicit, independent on/off control exists for this layer
   * today. `response-routes` is `false` as of this issue (HO-18): its
   * visibility is currently a side effect of the `la1-fema-experiment`
   * toggle (see `docs/data/urban-resilience-layers.md`, layer 3) rather
   * than its own control. Issue #116 (HO-19) is expected to flip this to
   * `true` once it wires an independent toggle -- that is a behavior
   * change and belongs to that issue, not this inert registry.
   */
  toggleable: boolean;
  /** Whether clicking a feature in this layer produces a `ViewerSelection`
   * (one of the 8 variants in `src/ports/ViewerAdapter.ts`). */
  selectable: boolean;
  /** Legend rows this layer contributes. Empty where the layer has no
   * on-map legend representation of its own (`ground-elevation`,
   * `osm-3d-context`), or where an existing separate inline legend already
   * covers it outside the main `UrbanMapLegend` and is not migrated here
   * (`la1-fema-experiment` -- see the note on that entry below). */
  legend: readonly UrbanLegendSwatch[];
}

export const urbanResilienceLayers: readonly UrbanLayerDefinition[] = [
  {
    id: "buildings-properties",
    label: "Buildings / Properties",
    category: "core",
    renderTarget: "cesium-scenario",
    dataUrlKey: "propertyDataUrl",
    provenance: {
      organization:
        "OpenStreetMap contributors (building footprints); FEMA National " +
        "Flood Hazard Layer (zone code used only for risk classification, " +
        "not geometry, in this artifact)",
      dataset: "Grand Isle & Port Fourchon Properties",
      url: "/data/urban-resilience/grand_isle_port_fourchon_properties.geojson",
      attribution: "© OpenStreetMap contributors (ODbL); FEMA NFHL",
      limitation:
        "risk_level is a documented FEMA zone-based proxy, not a computed " +
        "hydraulic model or an official flood determination. All 435 Grand " +
        "Isle properties currently classify High; all 343 Port Fourchon " +
        "properties currently classify Unknown because Port Fourchon's FEMA " +
        "query returned zero polygons -- a coverage gap, not a low-risk " +
        "finding.",
    },
    defaultVisible: true,
    toggleable: false,
    selectable: true,
    legend: [
      {
        label: "Low risk",
        color: urbanResilienceVisualColors.riskLow,
        symbol: "polygon",
        detail: "Mapped outside the FEMA Special Flood Hazard Area",
      },
      {
        label: "Moderate risk",
        color: urbanResilienceVisualColors.riskModerate,
        symbol: "polygon",
        detail: "FEMA Zone A / AE / AH / AO / AR / A99 (1% annual chance flood)",
      },
      {
        label: "High risk",
        color: urbanResilienceVisualColors.riskHigh,
        symbol: "polygon",
        detail: "FEMA Zone V / VE (coastal high-hazard, wave action)",
      },
      {
        label: "Unknown — coverage unavailable",
        color: urbanResilienceVisualColors.riskUnknown,
        symbol: "polygon",
        detail: "No FEMA NFHL polygon was available; this is not a Low-risk finding",
      },
      {
        label: "Selected property",
        color: urbanResilienceVisualColors.selectedPropertyOutline,
        symbol: "outline",
        detail: "Yellow outline and label",
      },
      {
        label: "Ground-elevation sample available",
        color: urbanResilienceVisualColors.elevationSampleMarker,
        symbol: "point",
        detail: "Click the building to see the reading",
      },
    ],
  },
  {
    id: "flood-hazard",
    label: "FEMA Flood Hazard",
    category: "core",
    renderTarget: "cesium-scenario",
    dataUrlKey: "floodZoneDataUrl",
    provenance: {
      organization: "FEMA (National Flood Hazard Layer)",
      dataset: "Grand Isle & Port Fourchon Flood Zones",
      url: "/data/urban-resilience/grand_isle_port_fourchon_flood_zones.geojson",
      attribution: "FEMA National Flood Hazard Layer public ArcGIS REST service",
      limitation:
        "NFHL polygons are mapped hazard information, not current " +
        "floodwater, a forecast, or a project-generated hydraulic model. " +
        "Port Fourchon has a known coverage gap in this layer; affected " +
        "properties are flagged as a data gap rather than classified as low " +
        "risk.",
    },
    defaultVisible: true,
    toggleable: false,
    // No domain-side parser exists for this layer's attributes (the styler
    // reads the raw Record<string, unknown> directly), and "urbanFloodZone"
    // is not one of the 8 ViewerSelection variants in
    // src/ports/ViewerAdapter.ts -- clicking a flood-zone polygon does
    // nothing, by design. That gap is documented here rather than closed;
    // closing it is out of scope for this inert registry (see HO-18's
    // AI NOTES: adding a parser is explicitly not part of this issue).
    selectable: false,
    legend: [
      {
        label: "FEMA flood zone overlay",
        color: urbanResilienceVisualColors.floodZoneOutline,
        symbol: "outline",
        detail: "Real NFHL polygons, ground-draped by risk tier",
      },
    ],
  },
  {
    id: "response-routes",
    label: "Response Routes & Staging Resources",
    category: "core",
    renderTarget: "cesium-scenario",
    dataUrlKey: "responseDataUrl",
    provenance: {
      organization:
        "OpenStreetMap contributors (LA Highway 1 road geometry); research " +
        "judgment (route status and staging-reference placement)",
      dataset: "Grand Isle & Port Fourchon Response",
      url: "/data/urban-resilience/grand_isle_port_fourchon_response.geojson",
      attribution: "Real LA Highway 1 road geometry via OpenStreetMap (ODbL)",
      limitation:
        "Both routes' status: \"at-risk\" is a hardcoded, hand-assigned " +
        "research judgment, not derived from live road-condition data. The " +
        "regional staging-reference points are explicitly not official " +
        "shelters.",
    },
    defaultVisible: true,
    toggleable: false,
    selectable: false,
    legend: [
      {
        label: "Regional staging reference",
        color: urbanResilienceVisualColors.resource,
        symbol: "point",
        detail: "Approximate town center; not an official shelter",
      },
      {
        label: "LA-1 response route",
        color: urbanResilienceVisualColors.route,
        symbol: "line",
        detail: "Real road geometry; status is a research judgment",
      },
    ],
  },
  {
    id: "community-facilities",
    label: "Community / Public-Safety Facilities",
    category: "experimental",
    renderTarget: "cesium-overlay",
    dataUrlKey: "experimentalFacilityDataUrl",
    provenance: {
      organization: "OpenStreetMap contributors",
      dataset: "Experimental: Community/Public-Safety Facilities",
      url: "/data/urban-resilience/experiments/community_public_safety_facilities.geojson",
      attribution: "OSM-derived facility tags and geometry (ODbL)",
      limitation:
        "All 4 sampled facilities are in Grand Isle; the Port Fourchon " +
        "query returned zero matching OSM records. Absence from OSM does " +
        "not prove facilities are absent there.",
    },
    defaultVisible: false,
    toggleable: true,
    selectable: true,
    legend: [
      {
        label: "Public-safety facility",
        color: urbanResilienceVisualColors.facilityPublicSafety,
        symbol: "point",
        detail:
          "OSM-derived fire station, police, or similar; absence elsewhere " +
          "does not mean none exist",
      },
      {
        label: "Community facility",
        color: urbanResilienceVisualColors.facilityCommunity,
        symbol: "point",
        detail:
          "OSM-derived town hall, school, or similar; absence elsewhere " +
          "does not mean none exist",
      },
    ],
  },
  {
    id: "ground-elevation",
    label: "Ground Elevation Sample",
    category: "experimental",
    // Never a Cesium layer -- fetched and cached entirely in React
    // (UrbanResilienceDemoPanel.tsx), shown only as detail rows in the
    // selected-property or selected-facility inspector. The 12 sampled
    // buildings are marked directly on the map, but that marker is part of
    // the buildings-properties layer's own styling (see its legend entry
    // above), not a rendering of this layer.
    renderTarget: "react-panel",
    dataUrlKey: "experimentalGroundElevationDataUrl",
    provenance: {
      organization: "USGS (3D Elevation Program)",
      dataset: "Experimental: Grand Isle Ground Elevation Sample",
      url: "/data/urban-resilience/experiments/grand_isle_ground_elevation_sample.geojson",
      attribution: "USGS 3DEP Elevation Point Query Service",
      limitation:
        "Only 12 of 778 buildings and all 4 sampled facilities have an " +
        "elevation record. Values are estimated ground elevation at one " +
        "representative coordinate -- not flood depth, building height, " +
        "floor elevation, FEMA Base Flood Elevation, or a safety finding. " +
        "Missing elevation is represented as unavailable, never as zero.",
    },
    // "On" in the sense that it is always fetched once the mode is active --
    // there is no toggle because it is not a map layer to hide.
    defaultVisible: true,
    toggleable: false,
    selectable: false,
    legend: [],
  },
  {
    id: "la1-fema-experiment",
    label: "Experimental LA-1/FEMA Segments",
    category: "experimental",
    renderTarget: "cesium-overlay",
    dataUrlKey: "experimentalLa1FemaDataUrl",
    provenance: {
      organization:
        "OpenStreetMap contributors (way geometry); FEMA National Flood " +
        "Hazard Layer (overlap relationship)",
      dataset: "Experimental: LA-1/FEMA Intersections",
      url: "/data/urban-resilience/experiments/la1_fema_intersections.geojson",
      attribution: "Real, unmodified OSM LA-1 way segments; FEMA NFHL overlap relationship",
      limitation:
        "No segment in this dataset is currently classified fully " +
        "available (fully evaluated). This dataset is relationship-only -- " +
        "PROHIBITED_FIELDS blocks any decision-support field (status, " +
        "risk_level, flooded, closed, safe, passable, evacuation_status, " +
        "recommended_action). Live open research question, tracked in " +
        "Issue #67.",
    },
    defaultVisible: false,
    toggleable: true,
    selectable: true,
    // This layer already has its own separate, inline 3-row line-style
    // legend rendered directly inside UrbanLa1FemaExperimentPanel.tsx
    // (solid purple / solid slate / dashed slate-gray), distinct from the
    // main UrbanMapLegend. Two of those three colors (the "no overlap" and
    // "not yet evaluated" states) are literals in
    // src/cesium/styleUrbanLa1FemaDataSource.ts, not yet tokens in
    // urbanResilienceVisualTokens.ts -- migrating them is a src/cesium
    // change and out of scope for this inert registry, so this array is
    // deliberately left empty rather than either inventing untracked
    // tokens or duplicating literals here.
    legend: [],
  },
  {
    id: "osm-3d-context",
    label: "Optional Cesium OSM Buildings (3D Context)",
    category: "experimental",
    renderTarget: "cesium-ion-context",
    // Not carried on the scenario at all -- loaded directly from Cesium ion
    // via Cesium.createOsmBuildingsAsync(), gated by
    // VITE_ENABLE_URBAN_OSM_BUILDINGS and a configured Cesium ion token.
    dataUrlKey: null,
    provenance: {
      organization: "Cesium (ion-hosted global OSM Buildings tileset)",
      dataset: "Cesium OSM Buildings (not a local artifact)",
      url: null,
      attribution: "Cesium ion createOsmBuildingsAsync()",
      limitation:
        "Purely visual context; not part of the research classification " +
        "and entirely separate from the risk-classified property layer, " +
        "which renders its own buildings from local data regardless of " +
        "this setting.",
    },
    // Defaults to off: VITE_ENABLE_URBAN_OSM_BUILDINGS defaults to false in
    // .env.example.
    defaultVisible: false,
    // No in-app toggle exists -- the only way to change this today is
    // editing the environment file and restarting the dev server.
    toggleable: false,
    selectable: false,
    legend: [],
  },
];

export const urbanResilienceLayersById: ReadonlyMap<UrbanLayerId, UrbanLayerDefinition> =
  new Map(urbanResilienceLayers.map((layer) => [layer.id, layer]));

/**
 * Reproduces today's actual default visibility exactly: buildings on,
 * flood on, routes on, both experiments off, 3D context off. Any consumer
 * (HO-19) should seed its visibility state from this object rather than
 * hand-rolling defaults a second time.
 */
export const defaultUrbanLayerVisibility: Readonly<Record<UrbanLayerId, boolean>> =
  Object.fromEntries(
    urbanResilienceLayers.map((layer) => [layer.id, layer.defaultVisible]),
  ) as Record<UrbanLayerId, boolean>;

export type UrbanLayerVisibility = Record<UrbanLayerId, boolean>;

/**
 * Resolves a layer's actual data URL from the running scenario, rather than
 * from a copy stored in this file, so `grandIslePortFourchonScenario.ts`
 * stays the single place any URL literal is written.
 */
export function resolveUrbanLayerDataUrl(
  layerId: UrbanLayerId,
  scenario: UrbanResilienceScenario,
): string | null {
  const layer = urbanResilienceLayersById.get(layerId);
  if (!layer || layer.dataUrlKey === null) {
    return null;
  }
  return scenario[layer.dataUrlKey];
}

/** Layers that carry an explicit, independent on/off control today. */
export function urbanToggleableLayers(): readonly UrbanLayerDefinition[] {
  return urbanResilienceLayers.filter((layer) => layer.toggleable);
}

/**
 * Legend rows for the layers currently visible under `visibility`, in
 * registry order. A future consumer (HO-19/HO-21) can use this to make the
 * main `UrbanMapLegend` grow and shrink with which layers are actually on,
 * rather than always showing every row.
 */
export function urbanLegendEntries(
  visibility: UrbanLayerVisibility,
): readonly UrbanLegendSwatch[] {
  return urbanResilienceLayers
    .filter((layer) => visibility[layer.id])
    .flatMap((layer) => layer.legend);
}
