import { useEffect, useState } from "react";
import {
  loadUrbanGroundElevationSample,
  type UrbanGroundElevationLookupStatus,
} from "../../domain/urbanResilience/loadUrbanGroundElevationSample";
import type {
  UrbanLayerId,
  UrbanLayerVisibility,
} from "../../domain/urbanResilience/urbanResilienceLayerRegistry";
import { urbanResilienceVisualColors } from "../../theme/urbanResilienceVisualTokens";
import type {
  UrbanCameraTarget,
  UrbanGroundElevationAttributes,
  UrbanResilienceScenario,
  SelectedUrbanProperty,
  SelectedUrbanLa1FemaSegment,
  SelectedUrbanFacility,
} from "../../types/urbanResilience";
import { UrbanMapLegend } from "./UrbanMapLegend";
import { UrbanResponseContextList } from "./UrbanResponseContextList";
import { UrbanSelectedFeatureSection } from "./UrbanSelectedFeatureSection";
import { UrbanTwinEventFeed } from "./UrbanTwinEventFeed";
import "./UrbanResilienceDemoPanel.css";

interface UrbanResilienceDemoPanelProps {
  scenario: UrbanResilienceScenario;
  selectedProperty: SelectedUrbanProperty | null;
  selectedLa1FemaSegment: SelectedUrbanLa1FemaSegment | null;
  selectedFacility: SelectedUrbanFacility | null;
  layerVisibility: UrbanLayerVisibility;
  ionTokenConfigured: boolean;
  osmBuildingsEnabled: boolean;
  isCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onFocusTarget: (target: UrbanCameraTarget) => void;
  onLayerVisibilityChange: (layerId: UrbanLayerId, enabled: boolean) => void;
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
  layerVisibility,
  ionTokenConfigured,
  osmBuildingsEnabled,
  isCollapsed,
  onCollapsedChange,
  onFocusTarget,
  onLayerVisibilityChange,
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

      <UrbanSelectedFeatureSection
        scenarioName={scenario.name}
        selectedProperty={selectedProperty}
        selectedLa1FemaSegment={selectedLa1FemaSegment}
        selectedFacility={selectedFacility}
        layerVisibility={layerVisibility}
        groundElevationLookupStatus={groundElevationLookup.status}
        propertyGroundElevation={selectedPropertyGroundElevation}
        facilityGroundElevation={selectedFacilityGroundElevation}
      />

      <section
        className="urban-resilience-demo-section urban-data-layers"
        aria-labelledby="urban-data-layers-title"
      >
        <h2 id="urban-data-layers-title">Data layers</h2>

        <div className="urban-data-layer-toggle">
          <button
            className="panel-button urban-response-routes-toggle"
            type="button"
            aria-pressed={layerVisibility["response-routes"]}
            onClick={() =>
              onLayerVisibilityChange(
                "response-routes",
                !layerVisibility["response-routes"],
              )
            }
          >
            Response routes: {layerVisibility["response-routes"] ? "On" : "Off"}
          </button>
        </div>

        <div className="urban-data-layer-toggle">
          <button
            className={`panel-button urban-facility-experiment-toggle ${
              layerVisibility["community-facilities"] ? "is-enabled" : ""
            }`}
            type="button"
            aria-pressed={layerVisibility["community-facilities"]}
            onClick={() =>
              onLayerVisibilityChange(
                "community-facilities",
                !layerVisibility["community-facilities"],
              )
            }
          >
            Optional facility layer: {layerVisibility["community-facilities"] ? "On" : "Off"}
          </button>
          <p className="urban-facility-experiment-safety" role="note">
            This layer describes OSM facility locations and mapped FEMA relationships
            only. It does not report operations, availability, safety, vulnerability,
            criticality, or emergency-service availability.
          </p>
          {layerVisibility["community-facilities"] && (
            <p className="urban-facility-experiment-note">
              Four reviewed OSM records are available in the facility-specific Grand
              Isle window. Port Fourchon returned zero matching OSM records; absence
              from OSM does not prove absence of facilities.
            </p>
          )}
        </div>

        <div className="urban-data-layer-toggle">
          <button
            className={`panel-button urban-la1-experiment-toggle ${
              layerVisibility["la1-fema-experiment"] ? "is-enabled" : ""
            }`}
            type="button"
            aria-pressed={layerVisibility["la1-fema-experiment"]}
            onClick={() =>
              onLayerVisibilityChange(
                "la1-fema-experiment",
                !layerVisibility["la1-fema-experiment"],
              )
            }
          >
            Experimental layer: {layerVisibility["la1-fema-experiment"] ? "On" : "Off"}
          </button>
          <p className="urban-la1-experiment-safety" role="note">
            Line styling represents FEMA data relationships only—not current flooding,
            closure, passability, evacuation suitability, or road safety.
          </p>
          <p className="urban-la1-experiment-layer-note">
            The experimental layer draws the original OpenStreetMap LA-1 ways.
            The simplified purple response routes are controlled separately,
            above.
          </p>
          {layerVisibility["la1-fema-experiment"] && (
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
        </div>
      </section>

      <UrbanResponseContextList routes={scenario.routes} resources={scenario.resources} />

      <UrbanMapLegend visibility={layerVisibility} />

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

    </aside>
  );
}
