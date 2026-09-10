import { mkdir, writeFile } from "node:fs/promises";
import {
  grandIsleBaseBbox,
  la1CorridorBbox,
  portFourchonBbox,
} from "./lib/studyAreas.mjs";

// Grand Isle, LA (barrier-island town) and Port Fourchon, LA (port facility
// area), connected by LA Highway 1 -- the sole road connecting both to the
// mainland. Bounding boxes are [south, west, north, east] in decimal degrees.
const GRAND_ISLE_BBOX = grandIsleBaseBbox;
const PORT_FOURCHON_BBOX = portFourchonBbox;
// Extends north past Golden Meadow, Galliano, and Larose so the LA-1
// evacuation corridor route has real road geometry to snap to.
const CORRIDOR_BBOX = la1CorridorBbox;

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const FEMA_NFHL_FLOOD_ZONES_URL =
  "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query";

const CACHE_DIR = new URL(".cache/urban-resilience/", import.meta.url);

function bboxToOverpassArgs([south, west, north, east]) {
  return `${south},${west},${north},${east}`;
}

function bboxToEsriEnvelope([south, west, north, east]) {
  return `${west},${south},${east},${north}`;
}

const REQUEST_HEADERS = {
  Accept: "*/*",
  "User-Agent":
    "urban-digital-twin-interoperability-research/1.0 (LSU digital twin research prototype)",
};

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
        throw new Error(`${label ?? url}: received non-JSON (likely a busy/error response)`);
      }

      return JSON.parse(text);
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt}/${retries} failed for ${label ?? url}: ${error.message}`);

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 8000 * attempt));
      }
    }
  }

  throw lastError;
}

async function fetchOverpassBuildings(bbox, label) {
  const query = `[out:json][timeout:60];way["building"](${bboxToOverpassArgs(bbox)});out body geom;`;

  return fetchWithRetry(
    OVERPASS_URL,
    {
      method: "POST",
      body: new URLSearchParams({ data: query }),
    },
    { label: `overpass buildings (${label})` },
  );
}

async function fetchOverpassRoute(bbox, label) {
  const query = `[out:json][timeout:60];way["highway"]["ref"~"LA 1"](${bboxToOverpassArgs(bbox)});out body geom;`;

  return fetchWithRetry(
    OVERPASS_URL,
    {
      method: "POST",
      body: new URLSearchParams({ data: query }),
    },
    { label: `overpass route (${label})` },
  );
}

async function fetchFemaFloodZones(bbox, label) {
  const params = new URLSearchParams({
    geometry: bboxToEsriEnvelope(bbox),
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
    resultRecordCount: "2000",
  });

  return fetchWithRetry(`${FEMA_NFHL_FLOOD_ZONES_URL}?${params.toString()}`, undefined, {
    label: `FEMA NFHL flood zones (${label})`,
  });
}

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });

  console.log("Fetching Grand Isle building footprints from OpenStreetMap Overpass...");
  const grandIsleBuildings = await fetchOverpassBuildings(GRAND_ISLE_BBOX, "Grand Isle");
  await writeFile(
    new URL("grand-isle-buildings.json", CACHE_DIR),
    JSON.stringify(grandIsleBuildings, null, 2),
  );
  console.log(`  saved ${grandIsleBuildings.elements.length} elements`);

  console.log("Fetching Port Fourchon building footprints from OpenStreetMap Overpass...");
  const portFourchonBuildings = await fetchOverpassBuildings(PORT_FOURCHON_BBOX, "Port Fourchon");
  await writeFile(
    new URL("port-fourchon-buildings.json", CACHE_DIR),
    JSON.stringify(portFourchonBuildings, null, 2),
  );
  console.log(`  saved ${portFourchonBuildings.elements.length} elements`);

  console.log("Fetching LA Highway 1 corridor geometry from OpenStreetMap Overpass...");
  const routeWays = await fetchOverpassRoute(CORRIDOR_BBOX, "LA 1 corridor");
  await writeFile(new URL("la1-route.json", CACHE_DIR), JSON.stringify(routeWays, null, 2));
  console.log(`  saved ${routeWays.elements.length} way segments`);

  console.log("Fetching FEMA NFHL flood zones for Grand Isle...");
  const grandIsleFlood = await fetchFemaFloodZones(GRAND_ISLE_BBOX, "Grand Isle");
  await writeFile(
    new URL("grand-isle-flood-zones.json", CACHE_DIR),
    JSON.stringify(grandIsleFlood, null, 2),
  );
  console.log(`  saved ${grandIsleFlood.features?.length ?? 0} zone features`);

  console.log("Fetching FEMA NFHL flood zones for Port Fourchon...");
  const portFourchonFlood = await fetchFemaFloodZones(PORT_FOURCHON_BBOX, "Port Fourchon");
  await writeFile(
    new URL("port-fourchon-flood-zones.json", CACHE_DIR),
    JSON.stringify(portFourchonFlood, null, 2),
  );
  console.log(`  saved ${portFourchonFlood.features?.length ?? 0} zone features`);

  console.log("\nDone. Raw source data cached under scripts/.cache/urban-resilience/.");
  console.log("Run `npm run build:urban-resilience-data` next.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
