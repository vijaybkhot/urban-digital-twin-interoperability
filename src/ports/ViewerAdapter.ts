import type { MeasurementPointConfig, ProjectConfig } from "../types/projectConfig";
import type {
  ModularCameraTarget,
  ModularEntityKind,
  ModularHousingScenario,
} from "../types/modularHousing";
import type {
  DisasterCameraTarget,
  DisasterPropertyAttributes,
  DisasterResilienceScenario,
} from "../types/disasterResilience";
import type {
  UrbanCameraTarget,
  UrbanLa1FemaSegmentAttributes,
  UrbanFacilityAttributes,
  UrbanPropertyAttributes,
  UrbanResilienceScenario,
} from "../types/urbanResilience";

export type ViewerSelection =
  | { type: "measurementPoint"; id: string }
  | { type: "modelAnnotation"; id: string }
  | { type: "modularEntity"; id: string; kind: ModularEntityKind }
  | {
      type: "disasterProperty";
      id: string;
      attributes: DisasterPropertyAttributes;
    }
  | {
      type: "urbanProperty";
      id: string;
      attributes: UrbanPropertyAttributes;
    }
  | {
      type: "urbanLa1FemaSegment";
      id: string;
      attributes: UrbanLa1FemaSegmentAttributes;
    }
  | {
      type: "urbanFacility";
      id: string;
      attributes: UrbanFacilityAttributes;
    }
  | { type: "globeLocation"; lat: number; lon: number };

export interface ViewerSelectedEntityIds {
  measurementPointId?: string | null;
  modelAnnotationId?: string | null;
  modularEntityId?: string | null;
  disasterPropertyId?: string | null;
  urbanPropertyId?: string | null;
  urbanLa1FemaSegmentId?: string | null;
  urbanFacilityId?: string | null;
}

export interface ViewerAdapter {
  initialize(container: HTMLElement, config: ProjectConfig): void | Promise<void>;
  renderProject(config: ProjectConfig): void;
  renderModularScenario(scenario: ModularHousingScenario | null): void;
  renderDisasterScenario(
    scenario: DisasterResilienceScenario | null,
  ): Promise<void>;
  renderUrbanResilienceScenario(
    scenario: UrbanResilienceScenario | null,
  ): Promise<void>;
  renderUrbanLa1FemaExperiment(dataUrl: string | null): Promise<void>;
  renderUrbanFacilityExperiment(dataUrl: string | null): Promise<void>;
  setUrbanResponseRoutesVisible(visible: boolean): void;
  setUrbanElevationSampledPropertyIds(propertyIds: ReadonlySet<string>): void;
  updateMeasurementPoint(point: MeasurementPointConfig): void;
  flyToProject(config: ProjectConfig): void;
  flyToModelAsset(assetId: string): void;
  flyToModularTarget(
    scenario: ModularHousingScenario,
    target: ModularCameraTarget,
  ): void;
  flyToDisasterTarget(
    scenario: DisasterResilienceScenario,
    target: DisasterCameraTarget,
    selectedPropertyId: string | null,
  ): void;
  flyToUrbanResilienceTarget(
    scenario: UrbanResilienceScenario,
    target: UrbanCameraTarget,
    selectedPropertyId: string | null,
  ): void;
  setLocationPickMode(enabled: boolean): void;
  setSelectedEntityIds(selection: ViewerSelectedEntityIds): void;
  destroy(): void;
}
