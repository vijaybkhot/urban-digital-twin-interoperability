import type { SelectedUrbanFacility } from "../../types/urbanResilience";

interface UrbanFacilityExperimentPanelProps {
  selectedFacility: SelectedUrbanFacility;
}

function formatCoverageStatus(value: string): string {
  return value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatRelationship(value: boolean | null): string {
  if (value === true) {
    return "Mapped FEMA hazard overlap";
  }

  if (value === false) {
    return "Evaluated with no mapped intersection";
  }

  return "Unknown";
}

export function UrbanFacilityExperimentPanel({
  selectedFacility,
}: UrbanFacilityExperimentPanelProps) {
  const { attributes } = selectedFacility;

  return (
    <div
      className="urban-facility-experiment"
      role="group"
      aria-labelledby="urban-facility-experiment-title"
    >
      <h3 id="urban-facility-experiment-title" className="urban-selected-feature-heading">
        Community/public-safety facilities
      </h3>
      <div className="urban-facility-experiment-heading" role="status">
        <span>Selected facility record</span>
        <strong>{attributes.name}</strong>
        <small>{attributes.facility_id}</small>
      </div>
      <dl className="urban-property-dashboard-details">
        <div><dt>Facility type</dt><dd>{attributes.facility_type_label}</dd></div>
        <div><dt>OSM classification</dt><dd>{attributes.osm_classification_key}={attributes.osm_classification_value}</dd></div>
        <div><dt>OSM identity</dt><dd>{attributes.osm_element_type} {attributes.osm_id}</dd></div>
        <div><dt>Mapped address</dt><dd>{attributes.address_label}</dd></div>
        <div><dt>Study area</dt><dd>{attributes.study_area}</dd></div>
        <div><dt>FEMA relationship</dt><dd>{formatRelationship(attributes.intersects_mapped_flood_hazard)}</dd></div>
        <div><dt>FEMA coverage</dt><dd>{formatCoverageStatus(attributes.fema_coverage_status)}</dd></div>
        <div><dt>FEMA zone(s)</dt><dd>{attributes.fema_zones.join(", ") || "None available"}</dd></div>
        <div><dt>Relationship reason</dt><dd>{attributes.fema_relationship_reason}</dd></div>
        <div><dt>OSM source</dt><dd>{attributes.osm_source}</dd></div>
        <div><dt>FEMA source</dt><dd>{attributes.fema_source}</dd></div>
        <div><dt>Processing method</dt><dd>{attributes.processing_method}</dd></div>
        <div><dt>Interpretation</dt><dd>{attributes.interpretation}</dd></div>
      </dl>
    </div>
  );
}
