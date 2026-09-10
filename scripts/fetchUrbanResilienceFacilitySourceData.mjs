import { mkdir, writeFile } from "node:fs/promises";
import { grandIsleFacilityBbox, portFourchonBbox } from "./lib/studyAreas.mjs";

// Facility-specific research windows. The Grand Isle window extends only its
// western edge so it includes mapped municipal-service facilities. Existing
// building and LA-1 query windows remain unchanged.
const FACILITY_STUDY_AREAS = [
  {
    id: "grand-isle",
    label: "Grand Isle facility query window",
    bbox: grandIsleFacilityBbox,
  },
  {
    id: "port-fourchon",
    label: "Port Fourchon facility query window",
    bbox: portFourchonBbox,
  },
];

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const FEMA_NFHL_FLOOD_ZONES_URL =
  "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query";
const CACHE_DIR = new URL(".cache/urban-resilience/", import.meta.url);
const REQUEST_HEADERS = {
  Accept: "*/*",
  "User-Agent":
    "urban-digital-twin-interoperability-research/1.0 (LSU digital twin research prototype)",
};

function bboxToOverpassArgs([south, west, north, east]) {
  return `${south},${west},${north},${east}`;
}

function bboxToEsriEnvelope([south, west, north, east]) {
  return `${west},${south},${east},${north}`;
}

async function fetchWithRetry(url, options, { retries = 5, label } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...REQUEST_HEADERS, ...options?.headers },
      });

      if (!response.ok) {
        throw new Error(`${label ?? url}: HTTP ${response.status}`);
      }

      const text = await response.text();

      if (text.trim().startsWith("<")) {
        throw new Error(`${label ?? url}: received non-JSON response`);
      }

      return JSON.parse(text);
    } catch (error) {
      lastError = error;
      console.warn(
        `Attempt ${attempt}/${retries} failed for ${label ?? url}: ${error.message}`,
      );

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 8000 * attempt));
      }
    }
  }

  throw lastError;
}

async function fetchOverpassFacilities(area) {
  const bbox = bboxToOverpassArgs(area.bbox);
  const query = `[out:json][timeout:60];(
    nwr["amenity"~"^(fire_station|police|hospital|clinic|pharmacy|fuel|doctors|community_centre|townhall|school)$"](${bbox});
    nwr["emergency"~"^(ambulance_station|coast_guard|lifeguard_base)$"](${bbox});
    nwr["healthcare"](${bbox});
    nwr["office"="government"](${bbox});
  );out body center geom;`;

  return fetchWithRetry(
    OVERPASS_URL,
    {
      method: "POST",
      body: new URLSearchParams({ data: query }),
    },
    { label: `Overpass facilities (${area.label})` },
  );
}

async function fetchFemaFloodZones(area) {
  const params = new URLSearchParams({
    geometry: bboxToEsriEnvelope(area.bbox),
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
    resultRecordCount: "2000",
  });

  return fetchWithRetry(
    `${FEMA_NFHL_FLOOD_ZONES_URL}?${params.toString()}`,
    undefined,
    { label: `FEMA NFHL facilities (${area.label})` },
  );
}

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });

  for (const area of FACILITY_STUDY_AREAS) {
    console.log(`Fetching community/public-safety facilities for ${area.label}...`);
    const facilities = await fetchOverpassFacilities(area);
    await writeFile(
      new URL(`${area.id}-facilities.json`, CACHE_DIR),
      JSON.stringify(facilities, null, 2),
    );
    console.log(`  saved ${facilities.elements?.length ?? 0} OSM elements`);

    console.log(`Fetching FEMA polygons for ${area.label}...`);
    const floodZones = await fetchFemaFloodZones(area);
    await writeFile(
      new URL(`${area.id}-facility-flood-zones.json`, CACHE_DIR),
      JSON.stringify(floodZones, null, 2),
    );
    console.log(`  saved ${floodZones.features?.length ?? 0} FEMA features`);
  }

  console.log("Facility source data cached without changing building or LA-1 caches.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
