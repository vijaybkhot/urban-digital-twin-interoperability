import { useEffect, useState } from "react";
import {
  loadUrbanGroundElevationSample,
  type UrbanGroundElevationLookupStatus,
} from "../../domain/urbanResilience/loadUrbanGroundElevationSample";
import type {
  UrbanCameraTarget,
  UrbanGroundElevationAttributes,
  UrbanResilienceScenario,
  SelectedUrbanProperty,
  SelectedUrbanLa1FemaSegment,
  SelectedUrbanFacility,
} from "../../types/urbanResilience";
import { UrbanLa1FemaExperimentPanel } from "./UrbanLa1FemaExperimentPanel";
import { UrbanFacilityExperimentPanel } from "./UrbanFacilityExperimentPanel";
import { UrbanMapLegend } from "./UrbanMapLegend";
import { UrbanPropertyDashboard } from "./UrbanPropertyDashboard";
import { UrbanResponseContextList } from "./UrbanResponseContextList";
import { UrbanTwinEventFeed } from "./UrbanTwinEventFeed";
import "./UrbanResilienceDemoPanel.css";

interface UrbanResilienceDemoPanelProps {
  scenario: UrbanResilienceScenario;
  selectedProperty: SelectedUrbanProperty | null;
  selectedLa1FemaSegment: SelectedUrbanLa1FemaSegment | null;
  selectedFacility: SelectedUrbanFacility | null;
  la1FemaExperimentEnabled: boolean;
  facilityExperimentEnabled: boolean;
  ionTokenConfigured: boolean;
  osmBuildingsEnabled: boolean;
  isCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onFocusTarget: (target: UrbanCameraTarget) => void;
  onLa1FemaExperimentEnabledChange: (enabled: boolean) => void;
  onFacilityExperimentEnabledChange: (enabled: boolean) => void;
  onNewProject: () => void;
  onOpenExistingDemo: () => void;
  onOpenModularDemo: () => void;
  onOpenDisasterDemo: () => void;
}

function formatCoordinate(value: number): string {
  return value.toFixed(5);
}

interface UrbanGroundElevationLookupState {
  status: UrbanGroundElevationLookupStatus;
  records: Map<string, UrbanGroundElevationAttributes>;
}

export function UrbanResilienceDemoPanel({
  scenario,
  selectedProperty,
  selectedLa1FemaSegment,
  selectedFacility,
  la1FemaExperimentEnabled,
  facilityExperimentEnabled,
  ionTokenConfigured,
  osmBuildingsEnabled,
  isCollapsed,
  onCollapsedChange,
  onFocusTarget,
  onLa1FemaExperimentEnabledChange,
  onFacilityExperimentEnabledChange,
  onNewProject,
  onOpenExistingDemo,
  onOpenModularDemo,
  onOpenDisasterDemo,
}: UrbanResilienceDemoPanelProps) {
  const [groundElevationLookup, setGroundElevationLookup] =
    useState<UrbanGroundElevationLookupState>({
      status: "loading",
      records: new Map(),
    });

  useEffect(() => {
    const controller = new AbortController();
    setGroundElevationLookup({ status: "loading", records: new Map() });

    void loadUrbanGroundElevationSample(
      scenario.experimentalGroundElevationDataUrl,
      controller.signal,
    )
      .then((records) => {
        if (controller.signal.aborted) {
          return;
        }

        setGroundElevationLookup({ status: "ready", records });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        console.warn("Unable to load the local ground-elevation sample.", error);
        setGroundElevationLookup({ status: "unavailable", records: new Map() });
      });

    return () => {
      controller.abort();
    };
  }, [scenario.experimentalGroundElevationDataUrl]);

  const selectedPropertyGroundElevation = selectedProperty
    ? groundElevationLookup.records.get(`property:${selectedProperty.propertyId}`)
    : undefined;
  const selectedFacilityGroundElevation = selectedFacility
    ? groundElevationLookup.records.get(`facility:${selectedFacility.facilityId}`)
    : undefined;

  // Collapsed renders a slim title bar only. The body is removed from the DOM
  // rather than visually hidden, so screen readers and tab order match what is
  // actually on screen -- and so a safety disclaimer can never be present but
  // invisible. Every hook above runs in both states, so the ground-elevation
  // lookup is not refetched when the panel is expanded again.
  if (isCollapsed) {
    return (
      <aside className="urban-resilience-demo-panel is-collapsed">
        <div className="urban-resilience-demo-heading">
          <h1>{scenario.name}</h1>
          <button
            className="panel-button urban-resilience-demo-collapse-toggle"
            type="button"
            aria-expanded={false}
            aria-label="Expand panel"
            onClick={() => onCollapsedChange(false)}
          >
            Expand
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="urban-resilience-demo-panel">
      <div className="urban-resilience-demo-heading">
        <div className="urban-resilience-demo-heading-text">
          <p className="panel-kicker">Research Prototype / Real Data</p>
          <h1>{scenario.name}</h1>
        </div>
        <button
          className="panel-button urban-resilience-demo-collapse-toggle"
          type="button"
          aria-expanded
          aria-label="Collapse panel"
          onClick={() => onCollapsedChange(true)}
        >
          Collapse
        </button>
      </div>

      <p className="urban-resilience-disclaimer" role="note">
        {scenario.disclaimer}
      </p>

      <section className="urban-resilience-demo-section">
        <h2>Camera views</h2>
        <div className="urban-camera-controls" aria-label="Urban resilience camera views">
          <button className="panel-button" type="button" onClick={() => onFocusTarget("overall")}>
            Overall view
          </button>
          <button className="panel-button" type="button" onClick={() => onFocusTarget("flood")}>
            Flood zone view
          </button>
          <button
            className="panel-button"
            type="button"
            disabled={!selectedProperty}
            title={selectedProperty ? "Focus the selected property" : "Select a property first"}
            onClick={() => onFocusTarget("selected-property")}
          >
            Selected property view
          </button>
        </div>
      </section>

      <section className="urban-resilience-demo-section">
        <h2>Scenario</h2>
        <dl className="urban-resilience-demo-details">
          <div>
            <dt>Name</dt>
            <dd>{scenario.name}</dd>
          </div>
          <div>
            <dt>Area</dt>
            <dd>Grand Isle &amp; Port Fourchon, Louisiana</dd>
          </div>
          <div>
            <dt>Center</dt>
            <dd>
              {formatCoordinate(scenario.center.lat)}, {formatCoordinate(scenario.center.lon)}
            </dd>
          </div>
        </dl>
        <p className="urban-resilience-demo-copy">{scenario.description}</p>
      </section>

      <UrbanPropertyDashboard
        scenarioName={scenario.name}
        disclaimer={scenario.disclaimer}
        selectedProperty={selectedProperty}
        groundElevationLookupStatus={groundElevationLookup.status}
        groundElevation={selectedPropertyGroundElevation}
      />

      <UrbanLa1FemaExperimentPanel
        enabled={la1FemaExperimentEnabled}
        selectedSegment={selectedLa1FemaSegment}
        onEnabledChange={onLa1FemaExperimentEnabledChange}
      />

      <UrbanFacilityExperimentPanel
        enabled={facilityExperimentEnabled}
        selectedFacility={selectedFacility}
        groundElevationLookupStatus={groundElevationLookup.status}
        groundElevation={selectedFacilityGroundElevation}
        onEnabledChange={onFacilityExperimentEnabledChange}
      />

      <UrbanResponseContextList routes={scenario.routes} resources={scenario.resources} />

      <UrbanMapLegend />

      <section
        className="urban-resilience-demo-section urban-data-attribution"
        aria-labelledby="urban-data-attribution-title"
      >
        <h2 id="urban-data-attribution-title">Data attribution</h2>
        <p>
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            © OpenStreetMap contributors (ODbL)
          </a>
          <span aria-hidden="true"> · </span>
          <a
            href="https://www.fema.gov/flood-maps/national-flood-hazard-layer"
            target="_blank"
            rel="noreferrer"
          >
            FEMA NFHL
          </a>
          <span aria-hidden="true"> · </span>
          <a
            href="https://www.usgs.gov/3d-elevation-program"
            target="_blank"
            rel="noreferrer"
          >
            USGS 3DEP
          </a>
        </p>
      </section>

      <UrbanTwinEventFeed events={scenario.events} />

      <section className="urban-resilience-demo-section">
        <h2>3D context</h2>
        <p
          className={`urban-osm-context-status ${
            !osmBuildingsEnabled
              ? "urban-osm-context-status-local"
              : ionTokenConfigured
              ? "urban-osm-context-status-configured"
              : "urban-osm-context-status-unavailable"
          }`}
          role="status"
        >
          {!osmBuildingsEnabled
            ? "Additional 3D context: Off"
            : ionTokenConfigured
              ? "Additional 3D context: On"
              : "Additional 3D context is unavailable"}
        </p>
        <p className="urban-osm-context-copy">
          Colored buildings show the FEMA-zone classification. Optional
          surrounding buildings provide visual context only.
        </p>
      </section>

      <section className="urban-resilience-demo-section">
        <h2>Current prototype scope</h2>
        <p className="urban-resilience-demo-empty-state">
          Real OpenStreetMap building footprints and real FEMA National Flood
          Hazard Layer zone polygons for Grand Isle and Port Fourchon,
          Louisiana, colored by a zone-based risk classification. Response
          routes follow real LA Highway 1 road geometry; staging references
          mark approximate inland town centers along the corridor.
        </p>
        <p className="urban-resilience-alignment-note" role="note">
          This is a research classification, not an official flood
          determination, insurance requirement, or evacuation order.
        </p>
      </section>

      <div className="urban-resilience-demo-actions">
        <button className="panel-button" type="button" onClick={onNewProject}>
          New project workflow
        </button>
        <button className="panel-button" type="button" onClick={onOpenExistingDemo}>
          Open existing demo
        </button>
        <button className="panel-button" type="button" onClick={onOpenModularDemo}>
          Open modular housing demo
        </button>
        <button className="panel-button" type="button" onClick={onOpenDisasterDemo}>
          Open disaster resilience demo
        </button>
      </div>
    </aside>
  );
}
