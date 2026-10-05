import type { SelectedUrbanLa1FemaSegment } from "../../types/urbanResilience";

interface UrbanLa1FemaExperimentPanelProps {
  selectedSegment: SelectedUrbanLa1FemaSegment;
}

function formatCoverageStatus(value: string): string {
  return value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatMappedOverlap(value: boolean | null): string {
  if (value === null) {
    return "Unknown";
  }

  return value ? "Yes" : "No mapped intersection found";
}

export function UrbanLa1FemaExperimentPanel({
  selectedSegment,
}: UrbanLa1FemaExperimentPanelProps) {
  const { attributes } = selectedSegment;

  return (
    <div
      className="urban-la1-experiment"
      role="group"
      aria-labelledby="urban-la1-experiment-title"
    >
      <h3 id="urban-la1-experiment-title" className="urban-selected-feature-heading">
        Experimental LA-1/FEMA inspection
      </h3>
      <div className="urban-la1-experiment-heading" role="status">
        <span>Selected OSM road way</span>
        <strong>{attributes.name}</strong>
        <small>{attributes.id}</small>
      </div>
      <dl className="urban-property-dashboard-details">
        <div>
          <dt>OSM way ID</dt>
          <dd>{attributes.osm_way_id}</dd>
        </div>
        <div>
          <dt>Road reference</dt>
          <dd>{attributes.ref}</dd>
        </div>
        <div>
          <dt>OSM highway type</dt>
          <dd>{attributes.highway_type}</dd>
        </div>
        <div>
          <dt>Query-window overlap</dt>
          <dd>{attributes.study_areas.join(", ") || "Outside current query windows"}</dd>
        </div>
        <div>
          <dt>FEMA source query</dt>
          <dd>{attributes.fema_source_queries.join(", ") || "No applicable source query"}</dd>
        </div>
        <div>
          <dt>FEMA coverage status</dt>
          <dd>{formatCoverageStatus(attributes.fema_coverage_status)}</dd>
        </div>
        <div>
          <dt>Mapped FEMA overlap</dt>
          <dd>{formatMappedOverlap(attributes.intersects_mapped_flood_hazard)}</dd>
        </div>
        <div>
          <dt>FEMA zone(s)</dt>
          <dd>{attributes.fema_zones.join(", ") || "None available"}</dd>
        </div>
        <div>
          <dt>Relationship reason</dt>
          <dd>{attributes.fema_relationship_reason}</dd>
        </div>
        <div>
          <dt>OSM source</dt>
          <dd>{attributes.osm_source}</dd>
        </div>
        <div>
          <dt>FEMA source</dt>
          <dd>{attributes.fema_source}</dd>
        </div>
        <div>
          <dt>Processing method</dt>
          <dd>{attributes.processing_method}</dd>
        </div>
        <div>
          <dt>Interpretation</dt>
          <dd>{attributes.interpretation}</dd>
        </div>
      </dl>
    </div>
  );
}
