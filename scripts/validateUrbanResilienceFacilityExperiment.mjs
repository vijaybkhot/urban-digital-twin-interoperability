import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  pointIntersectsGeometry,
  polygonIntersectsGeometry,
} from "./lib/linePolygonIntersection.mjs";

const OUTPUT_FILE = new URL(
  "../public/data/urban-resilience/experiments/community_public_safety_facilities.geojson",
  import.meta.url,
);
const FLOOD_ZONE_FILE = new URL(
  "../public/data/urban-resilience/grand_isle_port_fourchon_flood_zones.geojson",
  import.meta.url,
);
const EXPECTED_FACILITIES = new Map([
  [
    "osm-node-367132153",
    {
      name: "Grand Isle Fire Department",
      type: "fire_station",
      geometry: "Point",
      osmElementType: "node",
      osmId: 367132153,
      osmNameTag: "name",
    },
  ],
  [
    "osm-node-367133144",
    {
      name: "Grand Isle Police Department",
      type: "police",
      geometry: "Point",
      osmElementType: "node",
      osmId: 367133144,
      osmNameTag: "name",
    },
  ],
  [
    "osm-way-924797034",
    {
      name: "Town of Grand Isle",
      type: "townhall",
      geometry: "Polygon",
      osmElementType: "way",
      osmId: 924797034,
      osmNameTag: "protection_title",
    },
  ],
  [
    "osm-way-924801527",
    {
      name: "Grand Isle High School",
      type: "school",
      geometry: "Polygon",
      osmElementType: "way",
      osmId: 924801527,
      osmNameTag: "name",
    },
  ],
]);
const VALID_TYPES = new Set(["fire_station", "police", "townhall", "school"]);
const VALID_CATEGORIES = new Set(["public-safety", "community"]);
const VALID_COVERAGE = new Set(["available", "partial", "unavailable", "not-queried"]);
const PROHIBITED_FIELDS = [
  "operational_status",
  "availability",
  "vulnerability_score",
  "criticality_score",
  "safety_status",
  "emergency_recommendation",
  "recommended_action",
];

async function readJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

function geometryIntersectsFema(geometry, femaGeometry) {
  return geometry.type === "Point"
    ? pointIntersectsGeometry(geometry.coordinates, femaGeometry)
    : polygonIntersectsGeometry(geometry.coordinates, femaGeometry);
}

function assertCoordinates(geometry, facilityId) {
  const positions = [];

  function collect(value) {
    if (Array.isArray(value) && value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
      positions.push(value);
    } else if (Array.isArray(value)) {
      value.forEach(collect);
    }
  }

  collect(geometry.coordinates);
  assert.ok(positions.length > 0, `${facilityId}: missing coordinates`);
  positions.forEach(([lon, lat]) => {
    assert.ok(lon >= -90.005 && lon <= -89.955, `${facilityId}: longitude outside facility window`);
    assert.ok(lat >= 29.225 && lat <= 29.245, `${facilityId}: latitude outside facility window`);
  });
}

async function main() {
  const [geoJson, floodZones] = await Promise.all([
    readJson(OUTPUT_FILE),
    readJson(FLOOD_ZONE_FILE),
  ]);

  assert.equal(geoJson.type, "FeatureCollection");
  assert.equal(geoJson.features.length, 4, "Expected the four reviewed Grand Isle records");
  assert.equal(floodZones.type, "FeatureCollection");
  assert.ok(floodZones.features.length > 0, "Expected committed FEMA polygon evidence");
  assert.match(geoJson.metadata.limitation, /does not prove/i);

  const grandIsleResult = geoJson.metadata.areaResults.find(
    (result) => result.id === "grand-isle",
  );
  const portFourchonResult = geoJson.metadata.areaResults.find(
    (result) => result.id === "port-fourchon",
  );
  assert.equal(grandIsleResult?.osmResultCount, 4);
  assert.equal(grandIsleResult?.generatedFeatureCount, 4);
  assert.equal(portFourchonResult?.osmResultCount, 0);
  assert.equal(portFourchonResult?.generatedFeatureCount, 0);
  assert.equal(portFourchonResult?.femaFeatureCount, 0);

  // HO-11 (#108): skippedUnclassifiedCount/skippedTypes are new fields.
  // Default to "no skips" (?? 0 / ?? []) rather than requiring them present,
  // since the currently committed artifact predates this change and was not
  // regenerated to add them -- both "field absent" and "field present as
  // zero" mean the same thing here, and both must validate as zero because
  // the 4 known Grand Isle records and 0 Port Fourchon records are exactly
  // what this dataset has always contained; nothing was actually skipped.
  assert.equal(grandIsleResult?.skippedUnclassifiedCount ?? 0, 0);
  assert.deepEqual(grandIsleResult?.skippedTypes ?? [], []);
  assert.equal(portFourchonResult?.skippedUnclassifiedCount ?? 0, 0);
  assert.deepEqual(portFourchonResult?.skippedTypes ?? [], []);
  assert.equal(geoJson.metadata.skippedUnclassifiedCount ?? 0, 0);
  assert.deepEqual(geoJson.metadata.skippedTypes ?? [], []);

  const seenIds = new Set();

  for (const feature of geoJson.features) {
    const properties = feature.properties;
    const expected = EXPECTED_FACILITIES.get(properties.facility_id);

    assert.ok(expected, `${properties.facility_id}: unexpected facility identity`);
    assert.ok(!seenIds.has(properties.facility_id), `${properties.facility_id}: duplicate ID`);
    seenIds.add(properties.facility_id);
    assert.equal(feature.geometry.type, expected.geometry);
    assert.equal(properties.osm_element_type, expected.osmElementType);
    assert.equal(properties.osm_id, expected.osmId);
    assert.equal(properties.facility_type, expected.type);
    assert.equal(properties.name, expected.name);
    assert.equal(properties.osm_classification_key, "amenity");
    assert.equal(properties.osm_classification_value, expected.type);
    assert.ok(VALID_TYPES.has(properties.facility_type));
    assert.ok(VALID_CATEGORIES.has(properties.facility_category));
    assert.ok(VALID_COVERAGE.has(properties.fema_coverage_status));
    const osmTags = JSON.parse(properties.osm_tags_json);
    assert.equal(osmTags.amenity, expected.type);
    assert.equal(osmTags[expected.osmNameTag], expected.name);
    assert.match(properties.osm_source, /OpenStreetMap.*ODbL/i);
    assert.match(properties.fema_source, /FEMA National Flood Hazard Layer/i);
    assert.match(properties.processing_method, /no operational, safety, or availability analysis/i);
    assertCoordinates(feature.geometry, properties.facility_id);

    PROHIBITED_FIELDS.forEach((field) => {
      assert.ok(!Object.hasOwn(properties, field), `${properties.facility_id}: prohibited field ${field}`);
    });

    const directMatches = floodZones.features.filter((femaFeature) =>
      geometryIntersectsFema(feature.geometry, femaFeature.geometry),
    );
    assert.equal(
      properties.intersects_mapped_flood_hazard,
      directMatches.length > 0,
      `${properties.facility_id}: FEMA relationship differs from committed polygon geometry`,
    );

    if (properties.intersects_mapped_flood_hazard === true) {
      const matchedZones = [
        ...new Set(
          directMatches.map((match) => match.properties.flood_zone_code),
        ),
      ].sort();
      assert.deepEqual([...properties.fema_zones].sort(), matchedZones);
      assert.match(properties.interpretation, /geographic relationship only/i);
    } else if (properties.intersects_mapped_flood_hazard === false) {
      assert.equal(properties.fema_coverage_status, "available");
      assert.match(properties.interpretation, /Evaluated with no mapped intersection/i);
    } else {
      assert.match(properties.interpretation, /Unknown/i);
    }
  }

  const townHallTags = JSON.parse(
    geoJson.features.find((feature) => feature.properties.facility_type === "townhall").properties.osm_tags_json,
  );
  assert.equal(townHallTags.old_name, "United States Coast Guard Station No. 79");
  const school = geoJson.features.find((feature) => feature.properties.facility_type === "school");
  assert.equal(school.properties.osm_classification_value, "school");
  assert.ok(!/evacuation shelter/i.test(JSON.stringify(school.properties)));

  assert.deepEqual(
    new Set(seenIds),
    new Set(EXPECTED_FACILITIES.keys()),
    "All four reviewed OSM identities must be present",
  );

  console.log("Validated 4 community/public-safety facilities and conservative FEMA relationships.");
  console.log("Validated Port Fourchon as zero OSM facility results without inferring absence.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
