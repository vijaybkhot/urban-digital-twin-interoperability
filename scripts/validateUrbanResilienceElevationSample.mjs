import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pointIntersectsGeoJsonGeometry } from "./lib/geoJsonRepresentativePoint.mjs";
import {
  collectUrbanElevationSampleEntities,
  EXPECTED_GRAND_ISLE_FACILITIES,
  SAMPLED_GRAND_ISLE_BUILDINGS,
} from "./lib/urbanElevationSample.mjs";
import { grandIsleElevationValidationWindow } from "./lib/studyAreas.mjs";

const PROPERTY_FILE = new URL(
  "../public/data/urban-resilience/grand_isle_port_fourchon_properties.geojson",
  import.meta.url,
);
const FACILITY_FILE = new URL(
  "../public/data/urban-resilience/experiments/community_public_safety_facilities.geojson",
  import.meta.url,
);
const OUTPUT_FILE = new URL(
  "../public/data/urban-resilience/experiments/grand_isle_ground_elevation_sample.geojson",
  import.meta.url,
);
const PROHIBITED_FIELDS = [
  "flood_depth",
  "building_height_m",
  "floor_elevation",
  "finished_floor_elevation",
  "structural_elevation",
  "vulnerability",
  "safety",
  "base_flood_elevation",
  "inundation",
];

async function readJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

function assertIsoTimestamp(value, fieldName, entityKey) {
  assert.equal(typeof value, "string", `${entityKey}: ${fieldName} must be a string`);
  assert.ok(
    Number.isFinite(Date.parse(value)),
    `${entityKey}: ${fieldName} must be a parseable date`,
  );
}

async function main() {
  const [propertyGeoJson, facilityGeoJson, output] = await Promise.all([
    readJson(PROPERTY_FILE),
    readJson(FACILITY_FILE),
    readJson(OUTPUT_FILE),
  ]);
  const expectedEntities = collectUrbanElevationSampleEntities(
    propertyGeoJson,
    facilityGeoJson,
  );
  const expectedByKey = new Map(
    expectedEntities.map((entity) => [entity.entityKey, entity]),
  );

  assert.equal(output.type, "FeatureCollection");
  assert.equal(
    output.features.length,
    SAMPLED_GRAND_ISLE_BUILDINGS.length +
      EXPECTED_GRAND_ISLE_FACILITIES.length,
  );
  assert.equal(output.metadata.buildingSampleCount, 12);
  assert.equal(output.metadata.facilitySampleCount, 4);
  assert.match(output.metadata.limitation, /not flood depth/i);

  const seenKeys = new Set();
  let availableCount = 0;

  for (const feature of output.features) {
    const properties = feature.properties;
    const expected = expectedByKey.get(properties.entity_key);

    assert.ok(expected, `${properties.entity_key}: unexpected sample entity`);
    assert.ok(!seenKeys.has(properties.entity_key), `${properties.entity_key}: duplicate`);
    seenKeys.add(properties.entity_key);

    assert.equal(feature.geometry.type, "Point");
    assert.deepEqual(feature.geometry.coordinates, [
      properties.query_longitude,
      properties.query_latitude,
    ]);
    assert.ok(
      properties.query_longitude >= grandIsleElevationValidationWindow.minLon &&
        properties.query_longitude <= grandIsleElevationValidationWindow.maxLon,
      `${properties.entity_key}: invalid Grand Isle longitude`,
    );
    assert.ok(
      properties.query_latitude >= grandIsleElevationValidationWindow.minLat &&
        properties.query_latitude <= grandIsleElevationValidationWindow.maxLat,
      `${properties.entity_key}: invalid Grand Isle latitude`,
    );
    assert.ok(
      pointIntersectsGeoJsonGeometry(
        feature.geometry.coordinates,
        expected.sourceGeometry,
      ),
      `${properties.entity_key}: representative point is outside source geometry`,
    );
    assert.equal(
      properties.representative_point_method,
      expected.representativePoint.method,
    );
    assert.equal(properties.entity_id, expected.entityId);
    assert.equal(properties.osm_element_type, expected.osmElementType);
    assert.equal(properties.osm_id, expected.osmId);
    assert.equal(properties.elevation_units, "meters");
    assert.match(properties.elevation_source, /USGS.*3DEP.*Point Query/i);
    assert.match(properties.source_dataset, /3DEP dynamic elevation service/i);
    assert.equal(properties.query_wkid, 4326);
    assert.match(properties.interpretation_note, /not flood depth/i);
    assert.match(properties.interpretation_note, /not.*finished-floor elevation/i);
    assert.match(properties.vertical_reference_note, /not asserted/i);

    PROHIBITED_FIELDS.forEach((field) => {
      assert.ok(
        !Object.hasOwn(properties, field),
        `${properties.entity_key}: prohibited derived field ${field}`,
      );
    });

    if (properties.elevation_status === "available") {
      availableCount += 1;
      assert.ok(Number.isFinite(properties.ground_elevation_m));
      assert.ok(
        properties.ground_elevation_m >= -12000 &&
          properties.ground_elevation_m <= 9000,
      );
      assert.ok(Number.isInteger(properties.elevation_raster_id));
      assert.ok(
        Number.isFinite(properties.service_reported_resolution) &&
          properties.service_reported_resolution > 0,
      );
      assert.equal(properties.unavailable_reason, null);
      assertIsoTimestamp(
        properties.retrieved_at,
        "retrieved_at",
        properties.entity_key,
      );
    } else {
      assert.equal(properties.elevation_status, "unavailable");
      assert.equal(properties.ground_elevation_m, null);
      assert.equal(properties.elevation_raster_id, null);
      assert.equal(properties.service_reported_resolution, null);
      assert.equal(typeof properties.unavailable_reason, "string");
      assert.ok(properties.unavailable_reason.length > 0);
    }
  }

  assert.deepEqual(new Set(expectedByKey.keys()), seenKeys);
  assert.equal(output.metadata.availableCount, availableCount);
  assert.ok(availableCount > 0, "At least one usable elevation is required");

  console.log(
    `Validated ${output.features.length} ground-elevation sample records ` +
      `(${availableCount} available, ${output.features.length - availableCount} unavailable).`,
  );
  console.log(
    "Validated inside-footprint coordinates, units, provenance, and interpretation boundaries.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
