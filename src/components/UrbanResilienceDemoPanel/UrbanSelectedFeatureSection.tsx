import type { UrbanGroundElevationLookupStatus } from "../../domain/urbanResilience/loadUrbanGroundElevationSample";
import type { UrbanLayerVisibility } from "../../domain/urbanResilience/urbanResilienceLayerRegistry";
import type {
  SelectedUrbanFacility,
  SelectedUrbanLa1FemaSegment,
  SelectedUrbanProperty,
  UrbanGroundElevationAttributes,
} from "../../types/urbanResilience";
import { UrbanFacilityExperimentPanel } from "./UrbanFacilityExperimentPanel";
import { UrbanGroundElevationDetails } from "./UrbanGroundElevationDetails";
import { UrbanLa1FemaExperimentPanel } from "./UrbanLa1FemaExperimentPanel";
import { UrbanPropertyDashboard } from "./UrbanPropertyDashboard";

type UrbanActiveSelection = "property" | "la1-segment" | "facility" | "none";

interface UrbanSelectedFeatureSectionProps {
  scenarioName: string;
  selectedProperty: SelectedUrbanProperty | null;
  selectedLa1FemaSegment: SelectedUrbanLa1FemaSegment | null;
  selectedFacility: SelectedUrbanFacility | null;
  layerVisibility: UrbanLayerVisibility;
  groundElevationLookupStatus: UrbanGroundElevationLookupStatus;
  propertyGroundElevation?: UrbanGroundElevationAttributes;
  facilityGroundElevation?: UrbanGroundElevationAttributes;
}

// AppShell already clears the other two selections whenever one is picked,
// so at most one of these is non-null; the order below only makes the
// choice deterministic.
function getActiveSelection(
  selectedProperty: SelectedUrbanProperty | null,
  selectedLa1FemaSegment: SelectedUrbanLa1FemaSegment | null,
  selectedFacility: SelectedUrbanFacility | null,
): UrbanActiveSelection {
  if (selectedProperty) {
    return "property";
  }

  if (selectedFacility) {
    return "facility";
  }

  if (selectedLa1FemaSegment) {
    return "la1-segment";
  }

  return "none";
}

export function UrbanSelectedFeatureSection({
  scenarioName,
  selectedProperty,
  selectedLa1FemaSegment,
  selectedFacility,
  layerVisibility,
  groundElevationLookupStatus,
  propertyGroundElevation,
  facilityGroundElevation,
}: UrbanSelectedFeatureSectionProps) {
  const activeSelection = getActiveSelection(
    selectedProperty,
    selectedLa1FemaSegment,
    selectedFacility,
  );

  return (
    <section
      className="urban-resilience-demo-section urban-selected-feature"
      aria-labelledby="urban-selected-feature-title"
    >
      <h2 id="urban-selected-feature-title">Selected feature</h2>

      {activeSelection === "property" && selectedProperty && (
        <UrbanPropertyDashboard
          scenarioName={scenarioName}
          selectedProperty={selectedProperty}
        />
      )}

      {activeSelection === "facility" && selectedFacility && (
        <UrbanFacilityExperimentPanel selectedFacility={selectedFacility} />
      )}

      {activeSelection === "la1-segment" && selectedLa1FemaSegment && (
        <UrbanLa1FemaExperimentPanel selectedSegment={selectedLa1FemaSegment} />
      )}

      {(activeSelection === "property" || activeSelection === "facility") && (
        <UrbanGroundElevationDetails
          lookupStatus={groundElevationLookupStatus}
          record={
            activeSelection === "property"
              ? propertyGroundElevation
              : facilityGroundElevation
          }
        />
      )}

      {activeSelection === "none" && (
        <div className="urban-selected-feature-empty" role="status">
          <p className="urban-resilience-demo-empty-state">
            Click a building to view its real-footprint, FEMA-zone-based risk classification.
          </p>
          {layerVisibility["community-facilities"] && (
            <p className="urban-resilience-demo-empty-state">
              Click a cyan public-safety or purple community marker to inspect it.
            </p>
          )}
          {layerVisibility["la1-fema-experiment"] && (
            <p className="urban-resilience-demo-empty-state">
              Click an experimental LA-1 line to inspect its mapped FEMA relationship.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
