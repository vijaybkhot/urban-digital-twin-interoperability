import type { CSSProperties } from "react";
import {
  urbanLegendEntries,
  type UrbanLayerVisibility,
} from "../../domain/urbanResilience/urbanResilienceLayerRegistry";

interface UrbanMapLegendProps {
  visibility: UrbanLayerVisibility;
}

function swatchStyle(color: string): CSSProperties {
  return { "--urban-legend-color": color } as CSSProperties;
}

export function UrbanMapLegend({ visibility }: UrbanMapLegendProps) {
  const entries = urbanLegendEntries(visibility);

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
        {entries.map((entry) => (
          <li key={entry.label}>
            <span
              className={`urban-map-legend-symbol urban-map-legend-${entry.symbol}`}
              style={swatchStyle(entry.color)}
              aria-hidden="true"
            />
            <span>
              <strong>{entry.label}</strong>
              <small>{entry.detail}</small>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
