import { urbanResilienceVisualColors } from "../../theme/urbanResilienceVisualTokens";
import type { SelectedUrbanLa1FemaSegment } from "../../types/urbanResilience";

interface UrbanLa1FemaExperimentPanelProps {
  enabled: boolean;
  selectedSegment: SelectedUrbanLa1FemaSegment | null;
  onEnabledChange: (enabled: boolean) => void;
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
  enabled,
  selectedSegment,
  onEnabledChange,
}: UrbanLa1FemaExperimentPanelProps) {
  const attributes = selectedSegment?.attributes;

  return (
    <section
      className="urban-resilience-demo-section urban-la1-experiment"
      aria-labelledby="urban-la1-experiment-title"
    >
      <h2 id="urban-la1-experiment-title">Experimental LA-1/FEMA inspection</h2>
      <button
        className={`panel-button urban-la1-experiment-toggle ${enabled ? "is-enabled" : ""}`}
        type="button"
        aria-pressed={enabled}
        onClick={() => onEnabledChange(!enabled)}
      >
        Experimental layer: {enabled ? "On" : "Off"}
      </button>

      <p className="urban-la1-experiment-safety" role="note">
        Line styling represents FEMA data relationships only—not current flooding,
        closure, passability, evacuation suitability, or road safety.
      </p>
      <p className="urban-la1-experiment-layer-note">
        {enabled
          ? "The experimental OSM-way layer is visible; the simplified purple response routes are hidden."
          : "The simplified purple response routes are visible; the experimental OSM-way layer is hidden."}
      </p>

      {enabled && (
        <div className="urban-la1-experiment-legend" aria-label="Experimental LA-1 legend">
          <p>
            <span
              className="urban-la1-line urban-la1-line-intersection"
              style={{ borderColor: urbanResilienceVisualColors.route }}
              aria-hidden="true"
            />
            <strong>Solid purple:</strong> mapped FEMA intersection found
          </p>
          <p>
            <span className="urban-la1-line urban-la1-line-unknown" aria-hidden="true" />
            <strong>Dashed gray:</strong> FEMA relationship Unknown
          </p>
          <p>
            <span className="urban-la1-line urban-la1-line-no-intersection" aria-hidden="true" />
            <strong>Thin slate:</strong> evaluated with no mapped intersection
          </p>
        </div>
      )}

      {!enabled ? (
        <p className="urban-resilience-demo-empty-state">
          Turn on the layer to inspect the original OpenStreetMap LA-1 ways.
        </p>
      ) : !attributes ? (
        <p className="urban-resilience-demo-empty-state" role="status">
          Click an experimental LA-1 line to inspect its mapped FEMA relationship.
        </p>
      ) : (
        <>
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
        </>
      )}
    </section>
  );
}
