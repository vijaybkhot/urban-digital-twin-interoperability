import { mkdir, readFile, writeFile } from "node:fs/promises";
import {
  geometryWithinBbox,
  pointIntersectsGeometry,
  polygonIntersectsGeometry,
} from "./lib/linePolygonIntersection.mjs";
import { grandIsleFacilityBbox, portFourchonBbox } from "./lib/studyAreas.mjs";

const CACHE_DIR = new URL(".cache/urban-resilience/", import.meta.url);
const OUTPUT_FILE = new URL(
  "../public/data/urban-resilience/experiments/community_public_safety_facilities.geojson",
  import.meta.url,
);

const STUDY_AREAS = [
  {
    id: "grand-isle",
    name: "Grand Isle facility query window",
    bbox: grandIsleFacilityBbox,
  },
  {
    id: "port-fourchon",
    name: "Port Fourchon facility query window",
    bbox: portFourchonBbox,
  },
];

const FACILITY_CLASSIFICATIONS = {
  fire_station: { category: "public-safety", label: "Fire station" },
  police: { category: "public-safety", label: "Police" },
  townhall: { category: "community", label: "Town hall" },
  school: { category: "community", label: "School" },
};

const OSM_SOURCE = "OpenStreetMap Overpass API community/public-safety facility geometry (ODbL)";
const FEMA_SOURCE = "FEMA National Flood Hazard Layer MapServer layer 28";

async function readCachedJson(fileName) {
  try {
    return JSON.parse(await readFile(new URL(fileName, CACHE_DIR), "utf8"));
  } catch (error) {
    throw new Error(
      `Unable to read ${fileName}. Run npm run fetch:urban-resilience-facility-data first.`,
      { cause: error },
    );
  }
}

function normalizeZoneCode(value) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim().toUpperCase()
    : "Unknown";
}

function closeRing(coordinates) {
  if (coordinates.length < 3) {
    return null;
  }

  const ring = coordinates.map(([lon, lat]) => [lon, lat]);
  const first = ring[0];
  const last = ring.at(-1);

  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([...first]);
  }

  return ring;
}

function geometryFromElement(element) {
  if (element.type === "node" && Number.isFinite(element.lon) && Number.isFinite(element.lat)) {
    return { type: "Point", coordinates: [element.lon, element.lat] };
  }

  if (element.type === "way") {
    const coordinates =
      element.geometry
        ?.filter((point) => Number.isFinite(point?.lon) && Number.isFinite(point?.lat))
        .map((point) => [point.lon, point.lat]) ?? [];
    const ring = closeRing(coordinates);

    return ring ? { type: "Polygon", coordinates: [ring] } : null;
  }

  return null;
}

function geometryIntersectsFema(geometry, femaGeometry) {
  if (geometry.type === "Point") {
    return pointIntersectsGeometry(geometry.coordinates, femaGeometry);
  }

  if (geometry.type === "Polygon") {
    return polygonIntersectsGeometry(geometry.coordinates, femaGeometry);
  }

  return false;
}

function evaluateFemaRelationship(geometry, area, femaFeatures) {
  const matchingFeatures = femaFeatures.filter((feature) =>
    geometryIntersectsFema(geometry, feature.geometry),
  );
  const fullyCovered = geometryWithinBbox(geometry, area.bbox);

  if (matchingFeatures.length > 0) {
    const zones = [
      ...new Set(
        matchingFeatures.map((feature) =>
          normalizeZoneCode(feature.properties?.FLD_ZONE),
        ),
      ),
    ].sort();

    return {
      coverageStatus: fullyCovered ? "available" : "partial",
      intersectsMappedHazard: true,
      zones,
      reason:
        `The facility geometry intersects mapped FEMA zone(s): ${zones.join(", ")} ` +
        `in polygon geometry returned for the ${area.name}.`,
      interpretation:
        "Mapped FEMA hazard overlap. This describes a geographic relationship only; " +
        "it does not indicate current flooding, closure, availability, operational " +
        "status, vulnerability, criticality, safety, or emergency-service availability.",
    };
  }

  if (femaFeatures.length === 0) {
    return {
      coverageStatus: "unavailable",
      intersectsMappedHazard: null,
      zones: [],
      reason: "FEMA NFHL features were not available from the facility study-area query.",
      interpretation:
        "FEMA relationship: Unknown. No conclusion about flooding, closure, availability, " +
        "operational status, vulnerability, criticality, safety, or emergency-service " +
        "availability can be made.",
    };
  }

  if (fullyCovered) {
    return {
      coverageStatus: "available",
      intersectsMappedHazard: false,
      zones: [],
      reason: `No intersection was found in FEMA features returned for the ${area.name}.`,
      interpretation:
        "Evaluated with no mapped intersection. This does not establish an absence of " +
        "flood hazard, facility safety, availability, or operational status.",
    };
  }

  return {
    coverageStatus: "partial",
    intersectsMappedHazard: null,
    zones: [],
    reason: "Only part of the facility geometry falls within the FEMA facility query window.",
    interpretation:
      "FEMA relationship: Unknown. Incomplete query coverage does not support a conclusion " +
      "about flooding, facility safety, availability, or operational status.",
  };
}

function facilityClassification(tags) {
  const amenity = typeof tags?.amenity === "string" ? tags.amenity : null;
  return amenity ? FACILITY_CLASSIFICATIONS[amenity] ?? null : null;
}

function addressLabel(tags) {
  const parts = [tags?.["addr:housenumber"], tags?.["addr:street"]].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Not mapped in OSM";
}

function elementDescription(element) {
  const amenity = typeof element?.tags?.amenity === "string" ? element.tags.amenity : "(no amenity tag)";
  return `${element?.type ?? "unknown"}/${element?.id ?? "unknown"} (amenity=${amenity})`;
}

// Distinguishes two different reasons a queried OSM element can't become a
// facility feature:
//   - "skipped-unclassified": the element's amenity/emergency/healthcare tag
//     is real and expected (the fetch script deliberately queries a broader
//     set than the 4 this build classifies), but this build doesn't cover
//     that category yet. Non-fatal, counted, and recorded in metadata --
//     see HO-11.
//   - "unsupported-geometry": the classification matched, but the element's
//     geometry could not be turned into a valid Point/Polygon (e.g. a way
//     with fewer than 3 usable coordinate pairs). This is a genuine
//     data-quality problem, not an expected OSM-diversity issue, and stays
//     fatal.
function buildFacilityFeature(element, area, femaFeatures) {
  const classification = facilityClassification(element.tags);

  if (!classification) {
    return {
      kind: "skipped-unclassified",
      amenityType:
        typeof element?.tags?.amenity === "string" ? element.tags.amenity : "(no amenity tag)",
      description: elementDescription(element),
    };
  }

  const geometry = geometryFromElement(element);

  if (!geometry) {
    return { kind: "unsupported-geometry", description: elementDescription(element) };
  }

  const relationship = evaluateFemaRelationship(geometry, area, femaFeatures);
  const facilityId = `osm-${element.type}-${element.id}`;

  return {
    kind: "built",
    feature: {
      type: "Feature",
      properties: {
        facility_id: facilityId,
        feature_kind: "community-public-safety-facility",
        facility_category: classification.category,
        facility_type: element.tags.amenity,
        facility_type_label: classification.label,
        name:
          element.tags.name ??
          element.tags.protection_title ??
          `${classification.label} (${facilityId})`,
        address_label: addressLabel(element.tags),
        osm_element_type: element.type,
        osm_id: element.id,
        osm_classification_key: "amenity",
        osm_classification_value: element.tags.amenity,
        osm_tags_json: JSON.stringify(element.tags),
        study_area: area.name,
        fema_coverage_status: relationship.coverageStatus,
        intersects_mapped_flood_hazard: relationship.intersectsMappedHazard,
        fema_zones: relationship.zones,
        fema_relationship_reason: relationship.reason,
        interpretation: relationship.interpretation,
        osm_source: OSM_SOURCE,
        fema_source: FEMA_SOURCE,
        processing_method:
          `${geometry.type} facility geometry tested against FEMA NFHL ` +
          "Polygon/MultiPolygon geometry; no operational, safety, or availability analysis.",
      },
      geometry,
    },
  };
}

async function main() {
  const areaResults = [];
  const features = [];
  let totalSkippedUnclassifiedCount = 0;
  const allSkippedTypes = new Set();

  for (const area of STUDY_AREAS) {
    const [osmResponse, femaResponse] = await Promise.all([
      readCachedJson(`${area.id}-facilities.json`),
      readCachedJson(`${area.id}-facility-flood-zones.json`),
    ]);
    const elements = Array.isArray(osmResponse.elements) ? osmResponse.elements : [];
    const femaFeatures = Array.isArray(femaResponse.features) ? femaResponse.features : [];
    const results = elements.map((element) => buildFacilityFeature(element, area, femaFeatures));

    const areaFeatures = results
      .filter((result) => result.kind === "built")
      .map((result) => result.feature);
    const skippedUnclassified = results.filter((result) => result.kind === "skipped-unclassified");
    const unsupportedGeometry = results.filter((result) => result.kind === "unsupported-geometry");

    // Unsupported geometry remains fatal -- it is a genuine data-quality
    // problem, not the expected OSM-diversity issue below.
    if (unsupportedGeometry.length > 0) {
      throw new Error(
        `${area.name}: ${unsupportedGeometry.length} queried OSM element(s) had unsupported or ` +
          `malformed geometry (${unsupportedGeometry.map((result) => result.description).join(", ")}). ` +
          "This must be reviewed manually; it is not resolved by classifying a new amenity type.",
      );
    }

    // An unclassified amenity type is expected -- the fetch script
    // deliberately queries a broader set (~10 types) than the 4 this build
    // classifies. Skip non-fatally, but never silently: count it, record
    // which types were skipped, and print a summary. See HO-11 (#108).
    const skippedTypesForArea = [
      ...new Set(skippedUnclassified.map((result) => result.amenityType)),
    ].sort();

    skippedTypesForArea.forEach((type) => allSkippedTypes.add(type));
    totalSkippedUnclassifiedCount += skippedUnclassified.length;

    features.push(...areaFeatures);
    areaResults.push({
      id: area.id,
      name: area.name,
      osmResultCount: elements.length,
      generatedFeatureCount: areaFeatures.length,
      femaFeatureCount: femaFeatures.length,
      skippedUnclassifiedCount: skippedUnclassified.length,
      skippedTypes: skippedTypesForArea,
    });

    if (skippedUnclassified.length > 0) {
      console.log(
        `  ${area.name}: skipped ${skippedUnclassified.length} unclassified OSM element(s) ` +
          `(types: ${skippedTypesForArea.join(", ")})`,
      );
    }
  }

  const output = {
    type: "FeatureCollection",
    name: "Community/public-safety facilities with conservative FEMA relationships",
    metadata: {
      areaResults,
      skippedUnclassifiedCount: totalSkippedUnclassifiedCount,
      skippedTypes: [...allSkippedTypes].sort(),
      limitation:
        "Port Fourchon returned no matching OSM facility records. Absence from " +
        "OpenStreetMap does not prove that facilities are absent.",
    },
    features,
  };

  await mkdir(new URL("../public/data/urban-resilience/experiments/", import.meta.url), {
    recursive: true,
  });
  await writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`);

  console.log(`Built ${features.length} community/public-safety facility features.`);
  areaResults.forEach((result) =>
    console.log(`  ${result.name}: ${result.generatedFeatureCount} facilities`),
  );

  if (totalSkippedUnclassifiedCount > 0) {
    console.log(
      `Skipped ${totalSkippedUnclassifiedCount} unclassified OSM element(s) total ` +
        `(types: ${[...allSkippedTypes].sort().join(", ")}).`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
