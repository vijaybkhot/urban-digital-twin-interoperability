import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { urbanResilienceRegionBounds } from "./lib/studyAreas.mjs";

const DATA_DIR = "public/data/urban-resilience";
const REGION_BOUNDS = urbanResilienceRegionBounds;
const VALID_ZONE_CODES = new Set(["V", "VE", "A", "AE", "AH", "AO", "AR", "A99", "D", "X", "Unmapped"]);
const VALID_RISK_LEVELS = new Set(["Low", "Moderate", "High", "Unknown"]);

function assertInRegion(lon, lat, context) {
  assert.ok(
    lon >= REGION_BOUNDS.minLon &&
      lon <= REGION_BOUNDS.maxLon &&
      lat >= REGION_BOUNDS.minLat &&
      lat <= REGION_BOUNDS.maxLat,
    `${context}: coordinate [${lon}, ${lat}] falls outside the Grand Isle / Port Fourchon region bounds`,
  );
}

function expectedRiskLevel(zoneCode) {
  const zone = (zoneCode ?? "").toUpperCase();

  if (zone === "V" || zone === "VE") return "High";
  if (["A", "AE", "AH", "AO", "AR", "A99"].includes(zone)) return "Moderate";
  if (zone === "D" || zone === "UNMAPPED") return "Unknown";
  return "Low";
}

async function readGeoJson(fileName) {
  const raw = await readFile(`${DATA_DIR}/${fileName}`, "utf8");
  return JSON.parse(raw);
}

async function validateProperties() {
  const geoJson = await readGeoJson("grand_isle_port_fourchon_properties.geojson");
  assert.equal(geoJson.type, "FeatureCollection");
  assert.ok(geoJson.features.length > 0, "Expected at least one property feature");

  const seenIds = new Set();

  for (const feature of geoJson.features) {
    const properties = feature.properties;
    assert.equal(feature.type, "Feature");
    assert.equal(feature.geometry.type, "Polygon");

    assert.ok(!seenIds.has(properties.property_id), `Duplicate property_id: ${properties.property_id}`);
    seenIds.add(properties.property_id);

    for (const field of [
      "property_id",
      "address_label",
      "occupancy_type",
      "flood_zone_code",
      "risk_level",
      "recommended_action",
      "data_source",
      "confidence_note",
    ]) {
      assert.ok(
        typeof properties[field] === "string" && properties[field].trim().length > 0,
        `${properties.property_id}: missing or empty field ${field}`,
      );
    }

    assert.ok(VALID_ZONE_CODES.has(properties.flood_zone_code), `${properties.property_id}: unexpected flood_zone_code ${properties.flood_zone_code}`);
    assert.ok(VALID_RISK_LEVELS.has(properties.risk_level), `${properties.property_id}: invalid risk_level`);
    assert.equal(
      properties.risk_level,
      expectedRiskLevel(properties.flood_zone_code),
      `${properties.property_id}: risk_level does not match its FEMA zone classification rule`,
    );
    assert.equal(
      properties.sfha,
      properties.risk_level === "Unknown"
        ? null
        : properties.risk_level === "High" || properties.risk_level === "Moderate",
      `${properties.property_id}: sfha does not match its mapped/unknown classification`,
    );
    assert.ok(
      Number.isFinite(properties.building_height_m) && properties.building_height_m > 0,
      `${properties.property_id}: invalid building_height_m`,
    );
    assert.match(
      properties.data_source,
      /OpenStreetMap/,
      `${properties.property_id}: data_source must cite OpenStreetMap`,
    );
    assert.match(
      properties.confidence_note,
      /(research|data gap|coverage gap|undetermined)/i,
      `${properties.property_id}: confidence_note must carry a research/uncertainty caveat`,
    );

    const ring = feature.geometry.coordinates[0];
    assert.ok(Array.isArray(ring) && ring.length >= 4, `${properties.property_id}: polygon ring incomplete`);
    assert.deepEqual(ring[0], ring.at(-1), `${properties.property_id}: polygon ring must be closed`);

    for (const [lon, lat] of ring) {
      assertInRegion(lon, lat, properties.property_id);
    }
  }

  console.log(`Validated ${geoJson.features.length} real properties (${seenIds.size} unique IDs).`);
}

async function validateFloodZones() {
  const geoJson = await readGeoJson("grand_isle_port_fourchon_flood_zones.geojson");
  assert.equal(geoJson.type, "FeatureCollection");

  const seenIds = new Set();

  for (const feature of geoJson.features) {
    const properties = feature.properties;
    assert.ok(!seenIds.has(properties.id), `Duplicate flood zone id: ${properties.id}`);
    seenIds.add(properties.id);
    assert.ok(["Polygon", "MultiPolygon"].includes(feature.geometry.type));
    assert.ok(VALID_RISK_LEVELS.has(properties.risk_level));
  }

  console.log(`Validated ${geoJson.features.length} real FEMA flood zone polygons.`);
}

async function validateResponseContext() {
  const geoJson = await readGeoJson("grand_isle_port_fourchon_response.geojson");
  assert.equal(geoJson.type, "FeatureCollection");

  const routes = geoJson.features.filter((feature) => feature.properties.feature_kind === "route");
  const resources = geoJson.features.filter((feature) => feature.properties.feature_kind === "resource");

  assert.ok(routes.length >= 1, "Expected at least one response route");
  assert.ok(resources.length >= 1, "Expected at least one response resource");

  for (const route of routes) {
    assert.equal(route.geometry.type, "LineString");
    assert.ok(route.geometry.coordinates.length >= 2, `${route.properties.id}: route needs at least two positions`);
    assert.ok(["open", "at-risk", "not-recommended"].includes(route.properties.status));

    for (const [lon, lat] of route.geometry.coordinates) {
      assertInRegion(lon, lat, route.properties.id);
    }
  }

  for (const resource of resources) {
    assert.equal(resource.geometry.type, "Point");
    assert.match(
      resource.properties.description,
      /not an official shelter/i,
      `${resource.properties.id}: resource description must disclaim official-shelter status`,
    );

    const [lon, lat] = resource.geometry.coordinates;
    assertInRegion(lon, lat, resource.properties.id);
  }

  console.log(`Validated ${routes.length} response routes and ${resources.length} response resources.`);
}

async function main() {
  await validateProperties();
  await validateFloodZones();
  await validateResponseContext();
  console.log("Urban resilience data validation passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
