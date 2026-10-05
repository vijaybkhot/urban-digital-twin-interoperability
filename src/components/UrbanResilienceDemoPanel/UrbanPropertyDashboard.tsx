import { isUrbanRiskLevel } from "../../domain/urbanResilience/urbanResilienceContract";
import type { SelectedUrbanProperty } from "../../types/urbanResilience";

interface UrbanPropertyDashboardProps {
  scenarioName: string;
  selectedProperty: SelectedUrbanProperty;
}

function displayText(value: unknown): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "Not available";
}

export function UrbanPropertyDashboard({
  scenarioName,
  selectedProperty,
}: UrbanPropertyDashboardProps) {
  const { attributes } = selectedProperty;
  const riskLevel = isUrbanRiskLevel(attributes.risk_level) ? attributes.risk_level : null;
  const riskClassName = riskLevel
    ? `urban-property-risk-${riskLevel.toLowerCase()}`
    : "urban-property-risk-unknown";

  return (
    <div
      className="urban-property-dashboard"
      role="group"
      aria-labelledby="urban-property-dashboard-title"
    >
      <h3 id="urban-property-dashboard-title" className="urban-selected-feature-heading">
        Property dashboard
      </h3>
      <div className="urban-property-dashboard-heading" role="status">
        <span>Selected property</span>
        <strong>{displayText(attributes.address_label)}</strong>
        <small>{displayText(selectedProperty.propertyId)}</small>
      </div>

      <p className={`urban-property-risk ${riskClassName}`}>
        <span aria-hidden="true" />
        Risk level: <strong>{riskLevel ?? "Unclassified"}</strong>
      </p>

      <dl className="urban-property-dashboard-details">
        <div>
          <dt>Scenario</dt>
          <dd>{displayText(scenarioName)}</dd>
        </div>
        <div>
          <dt>FEMA flood zone</dt>
          <dd>{displayText(attributes.flood_zone_code)}</dd>
        </div>
        <div>
          <dt>Special Flood Hazard Area</dt>
          <dd>
            {attributes.sfha === null
              ? "Not available — FEMA coverage gap"
              : attributes.sfha
                ? "Yes"
                : "No"}
          </dd>
        </div>
        <div>
          <dt>Occupancy type</dt>
          <dd>{displayText(attributes.occupancy_type)}</dd>
        </div>
        <div>
          <dt>Recommended action</dt>
          <dd>{displayText(attributes.recommended_action)}</dd>
        </div>
        <div>
          <dt>Data source</dt>
          <dd>{displayText(attributes.data_source)}</dd>
        </div>
        <div>
          <dt>Confidence note</dt>
          <dd>{displayText(attributes.confidence_note)}</dd>
        </div>
      </dl>
    </div>
  );
}
