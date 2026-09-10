import { useEffect, useRef } from "react";
import { CesiumViewerAdapter } from "../../adapters/viewer/CesiumViewerAdapter";
import type {
  ViewerAdapter,
  ViewerSelection,
} from "../../ports/ViewerAdapter";
import type {
  ModularCameraTarget,
  ModularHousingScenario,
} from "../../types/modularHousing";
import type {
  DisasterCameraTarget,
  DisasterResilienceScenario,
} from "../../types/disasterResilience";
import type {
  UrbanCameraTarget,
  UrbanResilienceScenario,
} from "../../types/urbanResilience";
import type { ProjectConfig } from "../../types/projectConfig";

// Stable empty-set default so omitting urbanElevationSampledPropertyIds does
// not create a new Set identity on every render (which would retrigger the
// effect below unnecessarily).
const EMPTY_PROPERTY_ID_SET: ReadonlySet<string> = new Set();

interface CesiumSceneProps {
  config: ProjectConfig;
  onEntitySelected: (selection: ViewerSelection) => void;
  locationPickEnabled?: boolean;
  selectedMeasurementPointId?: string | null;
  selectedModelAnnotationId?: string | null;
  selectedModularEntityId?: string | null;
  selectedDisasterPropertyId?: string | null;
  selectedUrbanPropertyId?: string | null;
  selectedUrbanLa1FemaSegmentId?: string | null;
  selectedUrbanFacilityId?: string | null;
  modularScenario?: ModularHousingScenario | null;
  disasterScenario?: DisasterResilienceScenario | null;
  urbanScenario?: UrbanResilienceScenario | null;
  urbanLa1FemaExperimentDataUrl?: string | null;
  urbanFacilityExperimentDataUrl?: string | null;
  urbanResponseRoutesVisible?: boolean;
  urbanElevationSampledPropertyIds?: ReadonlySet<string> | null;
  modularFocusTarget?: ModularCameraTarget | null;
  modularFocusVersion?: number;
  disasterFocusTarget?: DisasterCameraTarget | null;
  disasterFocusPropertyId?: string | null;
  disasterFocusVersion?: number;
  urbanFocusTarget?: UrbanCameraTarget | null;
  urbanFocusPropertyId?: string | null;
  urbanFocusVersion?: number;
  focusProjectVersion?: number;
  focusModelAssetId?: string | null;
  focusModelVersion?: number;
  createViewerAdapter?: (
    onEntitySelected: (selection: ViewerSelection) => void,
  ) => ViewerAdapter;
}

function createDefaultViewerAdapter(
  selectionHandler: (selection: ViewerSelection) => void,
): ViewerAdapter {
  return new CesiumViewerAdapter(selectionHandler);
}

export function CesiumScene({
  config,
  onEntitySelected,
  locationPickEnabled = false,
  selectedMeasurementPointId = null,
  selectedModelAnnotationId = null,
  selectedModularEntityId = null,
  selectedDisasterPropertyId = null,
  selectedUrbanPropertyId = null,
  selectedUrbanLa1FemaSegmentId = null,
  selectedUrbanFacilityId = null,
  modularScenario = null,
  disasterScenario = null,
  urbanScenario = null,
  urbanLa1FemaExperimentDataUrl = null,
  urbanFacilityExperimentDataUrl = null,
  urbanResponseRoutesVisible = true,
  urbanElevationSampledPropertyIds = EMPTY_PROPERTY_ID_SET,
  modularFocusTarget = null,
  modularFocusVersion = 0,
  disasterFocusTarget = null,
  disasterFocusPropertyId = null,
  disasterFocusVersion = 0,
  urbanFocusTarget = null,
  urbanFocusPropertyId = null,
  urbanFocusVersion = 0,
  focusProjectVersion = 0,
  focusModelAssetId = null,
  focusModelVersion = 0,
  createViewerAdapter = createDefaultViewerAdapter,
}: CesiumSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const adapterRef = useRef<ViewerAdapter | null>(null);
  const selectionHandlerRef = useRef(onEntitySelected);
  const configRef = useRef(config);

  useEffect(() => {
    selectionHandlerRef.current = onEntitySelected;
  }, [onEntitySelected]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const adapter = createViewerAdapter((selection) =>
      selectionHandlerRef.current(selection),
    );
    adapter.initialize(containerRef.current, config);
    adapterRef.current = adapter;

    return () => {
      adapter.destroy();
      adapterRef.current = null;
    };
  }, [config.projectId, createViewerAdapter]);

  useEffect(() => {
    config.measurementPoints.forEach((point) => {
      adapterRef.current?.updateMeasurementPoint(point);
    });
  }, [config.measurementPoints]);

  useEffect(() => {
    adapterRef.current?.renderProject(config);
  }, [
    config.facility,
    config.siteMarker,
    config.modelAssets,
    config.modelAnnotations,
    config.measurementPoints,
  ]);

  useEffect(() => {
    adapterRef.current?.renderModularScenario(modularScenario);
  }, [modularScenario]);

  useEffect(() => {
    const adapter = adapterRef.current;

    if (!adapter) {
      return;
    }

    void adapter.renderDisasterScenario(disasterScenario).catch((loadError) => {
      console.warn("Unable to update disaster layers.", loadError);
    });

    return () => {
      void adapter.renderDisasterScenario(null).catch((cleanupError) => {
        console.warn("Unable to clear disaster layers.", cleanupError);
      });
    };
  }, [config.projectId, disasterScenario]);

  useEffect(() => {
    const adapter = adapterRef.current;

    if (!adapter) {
      return;
    }

    void adapter.renderUrbanResilienceScenario(urbanScenario).catch((loadError) => {
      console.warn("Unable to update urban resilience layers.", loadError);
    });

    return () => {
      void adapter.renderUrbanResilienceScenario(null).catch((cleanupError) => {
        console.warn("Unable to clear urban resilience layers.", cleanupError);
      });
    };
  }, [config.projectId, urbanScenario]);

  useEffect(() => {
    adapterRef.current?.setUrbanResponseRoutesVisible(
      urbanResponseRoutesVisible,
    );
  }, [config.projectId, urbanResponseRoutesVisible, urbanScenario]);

  useEffect(() => {
    adapterRef.current?.setUrbanElevationSampledPropertyIds(
      urbanElevationSampledPropertyIds ?? EMPTY_PROPERTY_ID_SET,
    );
  }, [config.projectId, urbanElevationSampledPropertyIds, urbanScenario]);

  useEffect(() => {
    const adapter = adapterRef.current;

    if (!adapter) {
      return;
    }

    void adapter
      .renderUrbanLa1FemaExperiment(urbanLa1FemaExperimentDataUrl)
      .catch((loadError) => {
        console.warn("Unable to update experimental LA-1/FEMA layer.", loadError);
      });

    return () => {
      void adapter.renderUrbanLa1FemaExperiment(null).catch((cleanupError) => {
        console.warn("Unable to clear experimental LA-1/FEMA layer.", cleanupError);
      });
    };
  }, [config.projectId, urbanLa1FemaExperimentDataUrl]);

  useEffect(() => {
    const adapter = adapterRef.current;

    if (!adapter) {
      return;
    }

    void adapter
      .renderUrbanFacilityExperiment(urbanFacilityExperimentDataUrl)
      .catch((loadError) => {
        console.warn("Unable to update community/public-safety facility layer.", loadError);
      });

    return () => {
      void adapter.renderUrbanFacilityExperiment(null).catch((cleanupError) => {
        console.warn("Unable to clear community/public-safety facility layer.", cleanupError);
      });
    };
  }, [config.projectId, urbanFacilityExperimentDataUrl]);

  useEffect(() => {
    adapterRef.current?.setLocationPickMode(locationPickEnabled);
  }, [locationPickEnabled]);

  useEffect(() => {
    adapterRef.current?.setSelectedEntityIds({
      measurementPointId: selectedMeasurementPointId,
      modelAnnotationId: selectedModelAnnotationId,
      modularEntityId: selectedModularEntityId,
      disasterPropertyId: selectedDisasterPropertyId,
      urbanPropertyId: selectedUrbanPropertyId,
      urbanLa1FemaSegmentId: selectedUrbanLa1FemaSegmentId,
      urbanFacilityId: selectedUrbanFacilityId,
    });
  }, [
    selectedMeasurementPointId,
    selectedModelAnnotationId,
    selectedModularEntityId,
    selectedDisasterPropertyId,
    selectedUrbanPropertyId,
    selectedUrbanLa1FemaSegmentId,
    selectedUrbanFacilityId,
  ]);

  useEffect(() => {
    if (focusProjectVersion > 0) {
      adapterRef.current?.flyToProject(configRef.current);
    }
  }, [focusProjectVersion]);

  useEffect(() => {
    if (focusModelAssetId && focusModelVersion > 0) {
      adapterRef.current?.flyToModelAsset(focusModelAssetId);
    }
  }, [focusModelAssetId, focusModelVersion]);

  useEffect(() => {
    if (modularScenario && modularFocusTarget && modularFocusVersion > 0) {
      adapterRef.current?.flyToModularTarget(
        modularScenario,
        modularFocusTarget,
      );
    }
  }, [modularScenario, modularFocusTarget, modularFocusVersion]);

  useEffect(() => {
    if (disasterScenario && disasterFocusTarget && disasterFocusVersion > 0) {
      adapterRef.current?.flyToDisasterTarget(
        disasterScenario,
        disasterFocusTarget,
        disasterFocusPropertyId,
      );
    }
  }, [
    disasterScenario,
    disasterFocusTarget,
    disasterFocusPropertyId,
    disasterFocusVersion,
  ]);

  useEffect(() => {
    if (urbanScenario && urbanFocusTarget && urbanFocusVersion > 0) {
      adapterRef.current?.flyToUrbanResilienceTarget(
        urbanScenario,
        urbanFocusTarget,
        urbanFocusPropertyId,
      );
    }
  }, [urbanScenario, urbanFocusTarget, urbanFocusPropertyId, urbanFocusVersion]);

  return <div ref={containerRef} className="cesium-container" />;
}
