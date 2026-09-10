import type { CSSProperties } from "react";
import { urbanResilienceVisualColors } from "../../theme/urbanResilienceVisualTokens";

function swatchStyle(color: string): CSSProperties {
  return { "--urban-legend-color": color } as CSSProperties;
}

export function UrbanMapLegend() {
  return (
    <section
      className="urban-resilience-demo-section urban-map-legend"
      aria-labelledby="urban-map-legend-title"
    >
      <h2 id="urban-map-legend-title">Map legend</h2>
      <p className="urban-map-legend-note">
        Property colors are a FEMA zone-based classification, not a live hazard feed.
      </p>
      <ul className="urban-map-legend-list">
        <li>
          <span
            className="urban-map-legend-symbol urban-map-legend-property"
            style={swatchStyle(urbanResilienceVisualColors.riskLow)}
            aria-hidden="true"
          />
          <span>
            <strong>Low risk</strong>
            <small>Mapped outside the FEMA Special Flood Hazard Area</small>
          </span>
        </li>
        <li>
          <span
            className="urban-map-legend-symbol urban-map-legend-property"
            style={swatchStyle(urbanResilienceVisualColors.riskModerate)}
            aria-hidden="true"
          />
          <span>
            <strong>Moderate risk</strong>
            <small>FEMA Zone A / AE / AH / AO / AR / A99 (1% annual chance flood)</small>
          </span>
        </li>
        <li>
          <span
            className="urban-map-legend-symbol urban-map-legend-property"
            style={swatchStyle(urbanResilienceVisualColors.riskHigh)}
            aria-hidden="true"
          />
          <span>
            <strong>High risk</strong>
            <small>FEMA Zone V / VE (coastal high-hazard, wave action)</small>
          </span>
        </li>
        <li>
          <span
            className="urban-map-legend-symbol urban-map-legend-property"
            style={swatchStyle(urbanResilienceVisualColors.riskUnknown)}
            aria-hidden="true"
          />
          <span>
            <strong>Unknown — coverage unavailable</strong>
            <small>No FEMA NFHL polygon was available; this is not a Low-risk finding</small>
          </span>
        </li>
        <li>
          <span
            className="urban-map-legend-symbol urban-map-legend-selected"
            style={swatchStyle(urbanResilienceVisualColors.selectedPropertyOutline)}
            aria-hidden="true"
          />
          <span>
            <strong>Selected property</strong>
            <small>Yellow outline and label</small>
          </span>
        </li>
        <li>
          <span
            className="urban-map-legend-symbol urban-map-legend-flood"
            style={swatchStyle(urbanResilienceVisualColors.floodZoneOutline)}
            aria-hidden="true"
          />
          <span>
            <strong>FEMA flood zone overlay</strong>
            <small>Real NFHL polygons, ground-draped by risk tier</small>
          </span>
        </li>
        <li>
          <span
            className="urban-map-legend-symbol urban-map-legend-resource"
            style={swatchStyle(urbanResilienceVisualColors.resource)}
            aria-hidden="true"
          />
          <span>
            <strong>Regional staging reference</strong>
            <small>Approximate town center; not an official shelter</small>
          </span>
        </li>
        <li>
          <span
            className="urban-map-legend-symbol urban-map-legend-route"
            style={swatchStyle(urbanResilienceVisualColors.route)}
            aria-hidden="true"
          />
          <span>
            <strong>LA-1 response route</strong>
            <small>Real road geometry; status is a research judgment</small>
          </span>
        </li>
        <li>
          <span
            className="urban-map-legend-symbol urban-map-legend-resource"
            style={swatchStyle(urbanResilienceVisualColors.elevationSampleMarker)}
            aria-hidden="true"
          />
          <span>
            <strong>Ground-elevation sample available</strong>
            <small>Click the building to see the reading</small>
          </span>
        </li>
      </ul>
    </section>
  );
}
