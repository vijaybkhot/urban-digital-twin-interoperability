import { mkdir, readFile, writeFile } from "node:fs/promises";
import { collectUrbanElevationSampleEntities } from "./lib/urbanElevationSample.mjs";

const PROPERTY_FILE = new URL(
  "../public/data/urban-resilience/grand_isle_port_fourchon_properties.geojson",
  import.meta.url,
);
const FACILITY_FILE = new URL(
  "../public/data/urban-resilience/experiments/community_public_safety_facilities.geojson",
  import.meta.url,
);
const CACHE_FILE = new URL(
  ".cache/urban-resilience/grand-isle-ground-elevation-epqs.json",
  import.meta.url,
);
const OUTPUT_FILE = new URL(
  "../public/data/urban-resilience/experiments/grand_isle_ground_elevation_sample.geojson",
  import.meta.url,
);

const ELEVATION_SOURCE =
  "USGS 3D Elevation Program (3DEP) Elevation Point Query Service";
const SOURCE_DATASET = "USGS 3DEP dynamic elevation service";
const INTERPRETATION_NOTE =
  "Estimated/interpolated ground elevation from the USGS 3DEP elevation " +
  "service at one representative coordinate. It is not flood depth, building " +
  "height, floor or finished-floor elevation, structural elevation, FEMA Base " +
  "Flood Elevation, vulnerability, safety, or current/future inundation.";
const HORIZONTAL_REFERENCE_NOTE =
  "Existing OSM longitude/latitude was submitted with WKID 4326. EPQS " +
  "documentation describes point inputs as NAD 1983; no additional local " +
  "datum transformation was applied in this experiment.";
const VERTICAL_REFERENCE_NOTE =
  "EPQS does not return a vertical datum per point. USGS states that CONUS " +
  "3DEP DEMs are typically NAVD88, but the datum is not asserted here without " +
  "work-unit or product metadata verification.";
const ACCURACY_NOTE =
  "USGS describes EPQS values as interpolated rather than surveyed and reports " +
  "an overall service RMSE of 0.53 m; local accuracy varies with source data.";

async function readJson(url, missingHint) {
  try {
    return JSON.parse(await readFile(url, "utf8"));
  } catch (error) {
    throw new Error(missingHint, { cause: error });
  }
}

function finiteElevationMeters(value) {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(parsedValue) && parsedValue >= -12000 && parsedValue <= 9000
    ? parsedValue
    : null;
}

function normalizedAcquisitionDate(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const [, month, day, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function buildFeature(entity, rawRecord, cache) {
  const elevationMeters =
    rawRecord?.status === "available"
      ? finiteElevationMeters(rawRecord.response?.value)
      : null;
  const rasterId = Number.isInteger(rawRecord?.response?.rasterId)
    ? rawRecord.response.rasterId
    : null;
  const resolution = Number.isFinite(rawRecord?.response?.resolution)
    ? rawRecord.response.resolution
    : null;
  const available =
    elevationMeters !== null &&
    rasterId !== null &&
    resolution !== null &&
    resolution > 0;
  const [longitude, latitude] = entity.representativePoint.coordinates;
  const acquisitionDateRaw =
    typeof rawRecord?.response?.attributes?.AcquisitionDate === "string"
      ? rawRecord.response.attributes.AcquisitionDate
      : null;

  return {
    type: "Feature",
    properties: {
      entity_key: entity.entityKey,
      entity_kind: entity.entityKind,
      entity_id: entity.entityId,
      display_label: entity.displayLabel,
      property_id: entity.propertyId,
      facility_id: entity.facilityId,
      osm_element_type: entity.osmElementType,
      osm_id: entity.osmId,
      query_longitude: longitude,
      query_latitude: latitude,
      representative_point_method: entity.representativePoint.method,
      elevation_status: available ? "available" : "unavailable",
      ground_elevation_m: available ? elevationMeters : null,
      elevation_units: "meters",
      elevation_source: ELEVATION_SOURCE,
      source_dataset: SOURCE_DATASET,
      elevation_service_endpoint: cache.endpoint,
      elevation_service_version: cache.serviceVersion,
      query_wkid: cache.requestWkid,
      elevation_raster_id: available ? rasterId : null,
      service_reported_resolution: available ? resolution : null,
      resolution_note:
        "Raw resolution reported by EPQS; the response schema does not name " +
        "a resolution unit or human-readable source work unit.",
      source_acquisition_date: normalizedAcquisitionDate(acquisitionDateRaw),
      source_acquisition_date_raw: acquisitionDateRaw,
      retrieved_at:
        typeof rawRecord?.retrievedAt === "string" ? rawRecord.retrievedAt : null,
      horizontal_reference_note: HORIZONTAL_REFERENCE_NOTE,
      vertical_reference_note: VERTICAL_REFERENCE_NOTE,
      accuracy_note: ACCURACY_NOTE,
      interpretation_note: INTERPRETATION_NOTE,
      unavailable_reason: available
        ? null
        : rawRecord?.error ?? "EPQS did not return a complete usable elevation response.",
    },
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
  };
}

async function main() {
  const [propertyGeoJson, facilityGeoJson, cache] = await Promise.all([
    readJson(
      PROPERTY_FILE,
      "Unable to read the existing urban property GeoJSON. Run " +
        "npm run fetch:urban-resilience-data && " +
        "npm run build:urban-resilience-data first.",
    ),
    readJson(
      FACILITY_FILE,
      "Unable to read the existing facility GeoJSON. Run " +
        "npm run fetch:urban-resilience-facility-data && " +
        "npm run build:urban-resilience-facility-data first.",
    ),
    readJson(
      CACHE_FILE,
      "Unable to read cached EPQS results. Run npm run fetch:urban-resilience-elevation-sample first.",
    ),
  ]);
  const entities = collectUrbanElevationSampleEntities(
    propertyGeoJson,
    facilityGeoJson,
  );
  const recordsByEntityKey = new Map(
    (Array.isArray(cache.records) ? cache.records : []).map((record) => [
      record.entityKey,
      record,
    ]),
  );
  const features = entities.map((entity) =>
    buildFeature(entity, recordsByEntityKey.get(entity.entityKey), cache),
  );
  const output = {
    type: "FeatureCollection",
    name: "Grand Isle representative ground-elevation sample",
    metadata: {
      experiment: "viewer-independent USGS 3DEP ground-elevation point sample",
      buildingSampleCount: features.filter(
        (feature) => feature.properties.entity_kind === "building",
      ).length,
      facilitySampleCount: features.filter(
        (feature) =>
          feature.properties.entity_kind ===
          "community-public-safety-facility",
      ).length,
      availableCount: features.filter(
        (feature) => feature.properties.elevation_status === "available",
      ).length,
      source: ELEVATION_SOURCE,
      sourceDataset: SOURCE_DATASET,
      generatedAt: cache.retrievalCompletedAt,
      limitation: INTERPRETATION_NOTE,
    },
    features,
  };

  await mkdir(
    new URL("../public/data/urban-resilience/experiments/", import.meta.url),
    { recursive: true },
  );
  await writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`);

  console.log(
    `Built ${features.length} elevation sample records ` +
      `(${output.metadata.availableCount} available).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
