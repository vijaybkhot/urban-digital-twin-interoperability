import type {
  DisasterCameraTarget,
  DisasterResilienceScenario,
  SelectedDisasterProperty,
} from "../../types/disasterResilience";
import { formatDisasterRouteStatus } from "../../domain/disasterResilience/formatDisasterRouteStatus";
import { DisasterMapLegend } from "./DisasterMapLegend";
import { DisasterPropertyDashboard } from "./DisasterPropertyDashboard";
import { DisasterTwinEventFeed } from "./DisasterTwinEventFeed";
import "./DisasterResilienceDemoPanel.css";

interface DisasterResilienceDemoPanelProps {
  scenario: DisasterResilienceScenario;
  selectedProperty: SelectedDisasterProperty | null;
  osmBuildingsConfigured: boolean;
  onFocusTarget: (target: DisasterCameraTarget) => void;
}

function formatCoordinate(value: number): string {
  return value.toFixed(5);
}

function formatDepth(value: number): string {
  return value.toFixed(1);
}

export function DisasterResilienceDemoPanel({
  scenario,
  selectedProperty,
  osmBuildingsConfigured,
  onFocusTarget,
}: DisasterResilienceDemoPanelProps) {
  return (
    <aside className="disaster-resilience-demo-panel">
      <div className="disaster-resilience-demo-heading">
        <p className="panel-kicker">Research / Proposal Demo</p>
        <h1>Property-Specific Disaster Resilience Module</h1>
      </div>

      <p className="disaster-resilience-disclaimer" role="note">
        {scenario.disclaimer}
      </p>

      <section className="disaster-resilience-demo-section">
        <h2>Camera views</h2>
        <div
          className="disaster-camera-controls"
          aria-label="Disaster resilience camera views"
        >
          <button
            className="panel-button"
            type="button"
            onClick={() => onFocusTarget("overall")}
          >
            Overall view
          </button>
          <button
            className="panel-button"
            type="button"
            onClick={() => onFocusTarget("flood")}
          >
            Flood layer view
          </button>
          <button
            className="panel-button"
            type="button"
            disabled={!selectedProperty}
            title={
              selectedProperty
                ? "Focus the latest selected fictional property"
                : "Select a fictional property first"
            }
            onClick={() => onFocusTarget("selected-property")}
          >
            Selected property view
          </button>
        </div>
        <p className="disaster-camera-note">
          Repeatable illustrative views for presenting this mock research
          scenario.
        </p>
      </section>

      <section className="disaster-resilience-demo-section">
        <h2>Scenario</h2>
        <dl className="disaster-resilience-demo-details">
          <div>
            <dt>Name</dt>
            <dd>{scenario.name}</dd>
          </div>
          <div>
            <dt>Area</dt>
            <dd>Fictional Baton Rouge-area research neighborhood</dd>
          </div>
          <div>
            <dt>Center</dt>
            <dd>
              {formatCoordinate(scenario.center.lat)}, {" "}
              {formatCoordinate(scenario.center.lon)}
            </dd>
          </div>
        </dl>
        <p className="disaster-resilience-demo-copy">
          {scenario.description}
        </p>
      </section>

      <DisasterPropertyDashboard
        scenarioName={scenario.name}
        disclaimer={scenario.disclaimer}
        selectedProperty={selectedProperty}
      />

      <section className="disaster-resilience-demo-section">
        <h2>Mock response context</h2>
        <dl className="disaster-response-details">
          <div>
            <dt>Fictional safe point</dt>
            <dd>
              <strong>{scenario.shelter.name}</strong>
              <span>{scenario.shelter.description}</span>
            </dd>
          </div>
          <div>
            <dt>Mock response route</dt>
            <dd>
              <strong>{scenario.route.name}</strong>
              <span>{scenario.route.description}</span>
            </dd>
          </div>
          <div>
            <dt>Mock route status</dt>
            <dd>
              <span
                className={`disaster-route-status disaster-route-status-${scenario.route.status}`}
              >
                {formatDisasterRouteStatus(scenario.route.status)}
              </span>
            </dd>
          </div>
        </dl>
        <p className="disaster-response-safety-note" role="note">
          Illustrative research context only. This is not an actual shelter,
          evacuation route, route recommendation, or operational guidance.
        </p>
      </section>

      <section className="disaster-resilience-demo-section">
        <h2>Mock flood visualization</h2>
        <p className="disaster-resilience-flood-label">
          <span
            className="disaster-resilience-flood-swatch"
            aria-hidden="true"
          />
          {scenario.floodLayer.label}
        </p>
        <dl className="disaster-resilience-demo-details">
          <div>
            <dt>Extent</dt>
            <dd>
              Mock depths ≥
              {formatDepth(scenario.floodLayer.displayExtentMinDepthFt)} ft
            </dd>
          </div>
          <div>
            <dt>Depth</dt>
            <dd>
              {formatDepth(scenario.floodLayer.representativeDepthFt)} ft mock
              representative depth
            </dd>
          </div>
          <div>
            <dt>Display</dt>
            <dd>
              {scenario.floodLayer.visualHeightScaleMultiplier}× illustrative
              vertical exaggeration
            </dd>
          </div>
        </dl>
        <p className="disaster-resilience-flood-note" role="note">
          {scenario.floodLayer.confidenceNote}
        </p>
        <p className="disaster-resilience-flood-explanation">
          The blue volume uses one representative depth and a 3× visual
          extrusion. It does not show the water depth at each property.
        </p>
        <p className="disaster-resilience-risk-explanation">
          Property colors use each fictional property&apos;s separate synthetic
          depth. Their diagonal arrangement has no spatial or hydrologic
          meaning.
        </p>
      </section>

      <DisasterMapLegend
        riskDepthThresholds={scenario.riskDepthThresholds}
      />

      <DisasterTwinEventFeed events={scenario.events} />

      <section className="disaster-resilience-demo-section">
        <h2>Optional 3D building context</h2>
        <p
          className={`disaster-osm-context-status ${
            osmBuildingsConfigured
              ? "disaster-osm-context-status-configured"
              : "disaster-osm-context-status-local"
          }`}
          role="status"
        >
          {osmBuildingsConfigured
            ? "Ion token detected — OSM Buildings context requested"
            : "No ion token — local-only fallback active"}
        </p>
        <p className="disaster-osm-context-copy">
          When available, Cesium OSM Buildings provide subdued neighborhood
          context only. They are not property records, hazard data, or a source
          for this demo&apos;s fictional attributes. The colored local structures
          remain authoritative and selectable.
        </p>
        <p className="disaster-osm-context-attribution-note">
          Source attribution is provided by Cesium&apos;s on-map credit display
          whenever OSM tiles are shown.
        </p>
      </section>

      <section className="disaster-resilience-demo-section">
        <h2>Current prototype scope</h2>
        <p className="disaster-resilience-demo-empty-state">
          Fictional risk-styled property structures and a mock flood-depth
          layer are shown with one fictional safe point and one non-operational
          mock response route. A matching map legend and fixed five-source
          event feed explain the synthetic local scenario.
        </p>
        <p className="disaster-resilience-alignment-note" role="note">
          Synthetic demonstration footprints. Not aligned with real parcels,
          buildings, roads, or addresses.
        </p>
      </section>

    </aside>
  );
}
