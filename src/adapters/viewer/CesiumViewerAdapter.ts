import "cesium/Build/Cesium/Widgets/widgets.css";
import * as Cesium from "cesium";
import type {
  ViewerAdapter,
  ViewerSelectedEntityIds,
  ViewerSelection,
} from "../../ports/ViewerAdapter";
import type {
  MeasurementPointConfig,
  ProjectConfig,
} from "../../types/projectConfig";
import { flyToProject as flyViewerToProject } from "../../cesium/cameraControls";
import { createCesiumViewer } from "../../cesium/createCesiumViewer";
import { isUrbanOsmBuildingsEnabled } from "../../config/cesiumIon";
import { createFacilityBoundary } from "../../cesium/createFacilityBoundary";
import { createFacilityBuilding } from "../../cesium/createFacilityBuilding";
import { createDisasterFloodLayer } from "../../cesium/createDisasterFloodLayer";
import { createDisasterResponseEntities } from "../../cesium/createDisasterResponseEntities";
import { createOptionalOsmBuildings } from "../../cesium/createOptionalOsmBuildings";
import { flyToDisasterScenarioTarget } from "../../cesium/flyToDisasterScenarioTarget";
import { createUrbanResilienceResponseEntities } from "../../cesium/createUrbanResilienceResponseEntities";
import { styleUrbanFloodZoneDataSource } from "../../cesium/createUrbanFloodZoneLayers";
import { flyToUrbanResilienceScenarioTarget } from "../../cesium/flyToUrbanResilienceScenarioTarget";
import {
  applyModelAnnotationVisualState,
  createModelAnnotationEntity,
} from "../../cesium/createModelAnnotationEntities";
import { createModelAssetEntity } from "../../cesium/createModelAssetEntities";
import {
  applyModularEntityVisualState,
  createModularHousingEntities,
  flyToModularScenarioTarget,
} from "../../cesium/createModularHousingEntities";
import { createSiteMarker } from "../../cesium/createSiteMarker";
import {
  applyDisasterPropertyVisualState,
  styleDisasterPropertyDataSource,
} from "../../cesium/styleDisasterPropertyDataSource";
import {
  applyUrbanElevationSampleMarker,
  applyUrbanPropertyVisualState,
  styleUrbanPropertyDataSource,
} from "../../cesium/styleUrbanPropertyDataSource";
import {
  applyMeasurementPointVisualState,
  createMeasurementPointEntity,
  updateMeasurementPointEntity,
} from "../../cesium/createMeasurementPointEntities";
import type {
  ModularCameraTarget,
  ModularEntityKind,
  ModularHousingScenario,
} from "../../types/modularHousing";
import type {
  DisasterCameraTarget,
  DisasterResilienceScenario,
} from "../../types/disasterResilience";
import { parseDisasterPropertyAttributes } from "../../domain/disasterResilience/parseDisasterPropertyAttributes";
import type {
  UrbanCameraTarget,
  UrbanResilienceScenario,
} from "../../types/urbanResilience";
import { parseUrbanPropertyAttributes } from "../../domain/urbanResilience/parseUrbanPropertyAttributes";
import { parseUrbanLa1FemaSegmentAttributes } from "../../domain/urbanResilience/parseUrbanLa1FemaSegment";
import {
  applyUrbanLa1FemaSegmentVisualState,
  styleUrbanLa1FemaDataSource,
} from "../../cesium/styleUrbanLa1FemaDataSource";
import { parseUrbanFacilityAttributes } from "../../domain/urbanResilience/parseUrbanFacilityAttributes";
import {
  applyUrbanFacilityVisualState,
  styleUrbanFacilityDataSource,
} from "../../cesium/styleUrbanFacilityDataSource";

type SelectionHandler = (selection: ViewerSelection) => void;

export class CesiumViewerAdapter implements ViewerAdapter {
  private viewer: Cesium.Viewer | null = null;
  private clickHandler: Cesium.ScreenSpaceEventHandler | null = null;
  private locationPickMode = false;
  private readonly pointEntities = new Map<string, Cesium.Entity>();
  private readonly modelAssetEntities = new Map<string, Cesium.Entity>();
  private readonly modelAnnotationEntities = new Map<string, Cesium.Entity>();
  private readonly modularEntities = new Map<string, Cesium.Entity>();
  private readonly disasterDataSources = new Set<Cesium.DataSource>();
  private readonly disasterEntities = new Set<Cesium.Entity>();
  private readonly disasterTilesets = new Set<Cesium.Cesium3DTileset>();
  private readonly disasterPropertyEntities = new Map<string, Cesium.Entity>();
  private readonly urbanDataSources = new Set<Cesium.DataSource>();
  private readonly urbanLa1FemaDataSources = new Set<Cesium.DataSource>();
  private readonly urbanFacilityDataSources = new Set<Cesium.DataSource>();
  private readonly urbanEntities = new Set<Cesium.Entity>();
  private readonly urbanResponseRouteEntities = new Set<Cesium.Entity>();
  private readonly urbanTilesets = new Set<Cesium.Cesium3DTileset>();
  private readonly urbanPropertyEntities = new Map<string, Cesium.Entity>();
  private readonly urbanFloodZoneEntities = new Map<string, Cesium.Entity>();
  private readonly urbanLa1FemaSegmentEntities = new Map<string, Cesium.Entity>();
  private readonly urbanFacilityEntities = new Map<string, Cesium.Entity>();
  private readonly measurementPoints = new Map<string, MeasurementPointConfig>();
  private disasterLoadVersion = 0;
  private urbanLoadVersion = 0;
  private urbanLa1FemaLoadVersion = 0;
  private urbanFacilityLoadVersion = 0;
  private selectedEntityIds: ViewerSelectedEntityIds = {};

  constructor(
    private readonly onEntitySelected: SelectionHandler,
  ) {}

  initialize(container: HTMLElement, config: ProjectConfig): void {
    window.CESIUM_BASE_URL = CESIUM_BASE_URL;
    this.destroy();
    this.viewer = createCesiumViewer(container);
    this.renderProject(config);
    this.flyToProject(config);
    this.attachSelectionHandler();
  }

  renderProject(config: ProjectConfig): void {
    if (!this.viewer) {
      return;
    }

    this.viewer.entities.removeAll();
    this.pointEntities.clear();
    this.modelAssetEntities.clear();
    this.modelAnnotationEntities.clear();
    this.modularEntities.clear();
    this.measurementPoints.clear();

    if (config.facility) {
      createFacilityBuilding(this.viewer, config.facility);
      createFacilityBoundary(this.viewer, config.facility);
    }

    if (config.siteMarker) {
      createSiteMarker(this.viewer, config.siteMarker);
    }

    const modelAssetsById = new Map(
      config.modelAssets?.map((asset) => [asset.assetId, asset]) ?? [],
    );
    const measurementPointsById = new Map(
      config.measurementPoints.map((point) => [point.id, point]),
    );

    modelAssetsById.forEach((asset) => {
      const entity = createModelAssetEntity(this.viewer!, asset);

      if (entity) {
        this.modelAssetEntities.set(asset.assetId, entity);
      }
    });

    config.modelAnnotations?.forEach((annotation) => {
      const asset = modelAssetsById.get(annotation.modelAssetId);

      if (!asset || asset.assetType !== "glb" || asset.status !== "ready") {
        return;
      }

      const entity = createModelAnnotationEntity(
        this.viewer!,
        annotation,
        asset,
        annotation.measurementPointId
          ? measurementPointsById.get(annotation.measurementPointId)
          : undefined,
      );
      this.modelAnnotationEntities.set(annotation.id, entity);
    });

    config.measurementPoints.forEach((point) => {
      const entity = createMeasurementPointEntity(this.viewer!, point);
      this.measurementPoints.set(point.id, point);
      this.pointEntities.set(point.id, entity);
    });

    this.applySelectionStyles();
  }

  renderModularScenario(scenario: ModularHousingScenario | null): void {
    if (!this.viewer) {
      return;
    }

    this.modularEntities.forEach((entity) => {
      this.viewer?.entities.remove(entity);
    });
    this.modularEntities.clear();

    if (!scenario) {
      return;
    }

    createModularHousingEntities(this.viewer, scenario).forEach(
      (entity, entityId) => {
        this.modularEntities.set(entityId, entity);
      },
    );
    this.applySelectionStyles();
  }

  async renderDisasterScenario(
    scenario: DisasterResilienceScenario | null,
  ): Promise<void> {
    const loadVersion = this.disasterLoadVersion + 1;
    this.disasterLoadVersion = loadVersion;
    const viewer = this.viewer;

    this.clearDisasterLayers();

    if (!scenario || !viewer || viewer.isDestroyed()) {
      return;
    }

    const floodEntity = createDisasterFloodLayer(
      viewer,
      scenario.floodLayer,
    );
    this.disasterEntities.add(floodEntity);
    const { shelterEntity, routeEntity } = createDisasterResponseEntities(
      viewer,
      scenario.shelter,
      scenario.route,
    );
    this.disasterEntities.add(shelterEntity);
    this.disasterEntities.add(routeEntity);
    void this.loadOptionalDisasterOsmBuildings(loadVersion, viewer);

    let dataSource: Cesium.GeoJsonDataSource | null = null;

    try {
      dataSource = await Cesium.GeoJsonDataSource.load(
        scenario.propertyDataUrl,
      );
      dataSource.show = false;
      dataSource.name = `disaster-properties:${scenario.id}`;

      if (!this.isCurrentDisasterLoad(loadVersion, viewer)) {
        dataSource.entities.removeAll();
        return;
      }

      const propertyEntities = styleDisasterPropertyDataSource(dataSource);

      if (!this.isCurrentDisasterLoad(loadVersion, viewer)) {
        dataSource.entities.removeAll();
        return;
      }

      await viewer.dataSources.add(dataSource);

      if (!this.isCurrentDisasterLoad(loadVersion, viewer)) {
        if (!viewer.isDestroyed() && viewer.dataSources.contains(dataSource)) {
          viewer.dataSources.remove(dataSource, true);
        }
        return;
      }

      this.disasterDataSources.add(dataSource);
      propertyEntities.forEach((entity, propertyId) => {
        this.disasterPropertyEntities.set(propertyId, entity);
      });
      dataSource.show = true;
      this.applySelectionStyles();
    } catch (loadError: unknown) {
      if (dataSource && !viewer.isDestroyed()) {
        if (viewer.dataSources.contains(dataSource)) {
          viewer.dataSources.remove(dataSource, true);
        } else {
          dataSource.entities.removeAll();
        }
      }

      if (this.isCurrentDisasterLoad(loadVersion, viewer)) {
        console.warn("Unable to load disaster property GeoJSON.", loadError);
      }
    }
  }

  async renderUrbanResilienceScenario(
    scenario: UrbanResilienceScenario | null,
  ): Promise<void> {
    const loadVersion = this.urbanLoadVersion + 1;
    this.urbanLoadVersion = loadVersion;
    const viewer = this.viewer;

    this.clearUrbanLayers();

    if (!scenario || !viewer || viewer.isDestroyed()) {
      return;
    }

    const { resourceEntities, routeEntities } = createUrbanResilienceResponseEntities(
      viewer,
      scenario.resources,
      scenario.routes,
    );
    resourceEntities.forEach((entity) => this.urbanEntities.add(entity));
    routeEntities.forEach((entity) => {
      this.urbanEntities.add(entity);
      this.urbanResponseRouteEntities.add(entity);
    });
    if (isUrbanOsmBuildingsEnabled()) {
      void this.loadOptionalUrbanOsmBuildings(loadVersion, viewer);
    }

    await Promise.all([
      this.loadUrbanFloodZones(loadVersion, viewer, scenario),
      this.loadUrbanProperties(loadVersion, viewer, scenario),
    ]);
  }

  async renderUrbanLa1FemaExperiment(dataUrl: string | null): Promise<void> {
    const loadVersion = this.urbanLa1FemaLoadVersion + 1;
    this.urbanLa1FemaLoadVersion = loadVersion;
    const viewer = this.viewer;

    this.clearUrbanLa1FemaExperiment();

    if (!dataUrl || !viewer || viewer.isDestroyed()) {
      return;
    }

    let dataSource: Cesium.GeoJsonDataSource | null = null;

    try {
      dataSource = await Cesium.GeoJsonDataSource.load(dataUrl, {
        clampToGround: true,
      });
      dataSource.show = false;
      dataSource.name = "experimental-la1-fema-relationships";

      if (!this.isCurrentUrbanLa1FemaLoad(loadVersion, viewer)) {
        dataSource.entities.removeAll();
        return;
      }

      const segmentEntities = styleUrbanLa1FemaDataSource(dataSource);

      if (segmentEntities.size !== dataSource.entities.values.length) {
        throw new Error("Experimental LA-1 GeoJSON contains an invalid road feature.");
      }

      if (!this.isCurrentUrbanLa1FemaLoad(loadVersion, viewer)) {
        dataSource.entities.removeAll();
        return;
      }

      await viewer.dataSources.add(dataSource);

      if (!this.isCurrentUrbanLa1FemaLoad(loadVersion, viewer)) {
        if (!viewer.isDestroyed() && viewer.dataSources.contains(dataSource)) {
          viewer.dataSources.remove(dataSource, true);
        }
        return;
      }

      this.urbanLa1FemaDataSources.add(dataSource);
      segmentEntities.forEach((entity, segmentId) => {
        this.urbanLa1FemaSegmentEntities.set(segmentId, entity);
      });
      dataSource.show = true;
      this.applySelectionStyles();
    } catch (loadError: unknown) {
      if (dataSource && !viewer.isDestroyed()) {
        if (viewer.dataSources.contains(dataSource)) {
          viewer.dataSources.remove(dataSource, true);
        } else {
          dataSource.entities.removeAll();
        }
      }

      if (this.isCurrentUrbanLa1FemaLoad(loadVersion, viewer)) {
        console.warn("Unable to load experimental LA-1/FEMA GeoJSON.", loadError);
      }
    }
  }

  async renderUrbanFacilityExperiment(dataUrl: string | null): Promise<void> {
    const loadVersion = this.urbanFacilityLoadVersion + 1;
    this.urbanFacilityLoadVersion = loadVersion;
    const viewer = this.viewer;

    this.clearUrbanFacilityExperiment();

    if (!dataUrl || !viewer || viewer.isDestroyed()) {
      return;
    }

    let dataSource: Cesium.GeoJsonDataSource | null = null;

    try {
      dataSource = await Cesium.GeoJsonDataSource.load(dataUrl);
      dataSource.show = false;
      dataSource.name = "community-public-safety-facilities";

      if (!this.isCurrentUrbanFacilityLoad(loadVersion, viewer)) {
        dataSource.entities.removeAll();
        return;
      }

      const facilityEntities = styleUrbanFacilityDataSource(dataSource);

      if (facilityEntities.size !== dataSource.entities.values.length) {
        throw new Error("Facility GeoJSON contains an invalid or unsupported feature.");
      }

      if (!this.isCurrentUrbanFacilityLoad(loadVersion, viewer)) {
        dataSource.entities.removeAll();
        return;
      }

      await viewer.dataSources.add(dataSource);

      if (!this.isCurrentUrbanFacilityLoad(loadVersion, viewer)) {
        if (!viewer.isDestroyed() && viewer.dataSources.contains(dataSource)) {
          viewer.dataSources.remove(dataSource, true);
        }
        return;
      }

      this.urbanFacilityDataSources.add(dataSource);
      facilityEntities.forEach((entity, facilityId) => {
        this.urbanFacilityEntities.set(facilityId, entity);
      });
      dataSource.show = true;
      this.applySelectionStyles();
    } catch (loadError: unknown) {
      if (dataSource && !viewer.isDestroyed()) {
        if (viewer.dataSources.contains(dataSource)) {
          viewer.dataSources.remove(dataSource, true);
        } else {
          dataSource.entities.removeAll();
        }
      }

      if (this.isCurrentUrbanFacilityLoad(loadVersion, viewer)) {
        console.warn("Unable to load community/public-safety facility GeoJSON.", loadError);
      }
    }
  }

  setUrbanResponseRoutesVisible(visible: boolean): void {
    this.urbanResponseRouteEntities.forEach((entity) => {
      entity.show = visible;
    });
  }

  setUrbanElevationSampledPropertyIds(propertyIds: ReadonlySet<string>): void {
    this.urbanPropertyEntities.forEach((entity, propertyId) => {
      applyUrbanElevationSampleMarker(entity, propertyIds.has(propertyId));
    });
  }

  updateMeasurementPoint(point: MeasurementPointConfig): void {
    const entity = this.pointEntities.get(point.id);

    if (!entity) {
      return;
    }

    this.measurementPoints.set(point.id, point);
    updateMeasurementPointEntity(entity, point);
    this.applySelectionStyles();
  }

  flyToProject(config: ProjectConfig): void {
    if (this.viewer) {
      flyViewerToProject(this.viewer, config);
    }
  }

  flyToModelAsset(assetId: string): void {
    const entity = this.modelAssetEntities.get(assetId);

    if (this.viewer && entity) {
      void this.viewer.flyTo(entity, {
        duration: 1,
      });
    }
  }

  flyToModularTarget(
    scenario: ModularHousingScenario,
    target: ModularCameraTarget,
  ): void {
    if (this.viewer) {
      flyToModularScenarioTarget(this.viewer, scenario, target);
    }
  }

  flyToDisasterTarget(
    scenario: DisasterResilienceScenario,
    target: DisasterCameraTarget,
    selectedPropertyId: string | null,
  ): void {
    if (!this.viewer) {
      return;
    }

    flyToDisasterScenarioTarget(
      this.viewer,
      scenario,
      target,
      this.disasterPropertyEntities,
      selectedPropertyId,
    );
  }

  flyToUrbanResilienceTarget(
    scenario: UrbanResilienceScenario,
    target: UrbanCameraTarget,
    selectedPropertyId: string | null,
  ): void {
    if (!this.viewer) {
      return;
    }

    flyToUrbanResilienceScenarioTarget(
      this.viewer,
      scenario,
      target,
      this.urbanPropertyEntities,
      this.urbanFloodZoneEntities,
      selectedPropertyId,
    );
  }

  setLocationPickMode(enabled: boolean): void {
    this.locationPickMode = enabled;
  }

  setSelectedEntityIds(selection: ViewerSelectedEntityIds): void {
    this.selectedEntityIds = selection;
    this.applySelectionStyles();
  }

  destroy(): void {
    this.disasterLoadVersion += 1;
    this.clearDisasterLayers();
    this.urbanLoadVersion += 1;
    this.clearUrbanLayers();
    this.urbanLa1FemaLoadVersion += 1;
    this.clearUrbanLa1FemaExperiment();
    this.urbanFacilityLoadVersion += 1;
    this.clearUrbanFacilityExperiment();

    if (this.clickHandler && !this.clickHandler.isDestroyed()) {
      this.clickHandler.destroy();
    }

    if (this.viewer && !this.viewer.isDestroyed()) {
      this.viewer.destroy();
    }

    this.clickHandler = null;
    this.viewer = null;
    this.locationPickMode = false;
    this.pointEntities.clear();
    this.modelAssetEntities.clear();
    this.modelAnnotationEntities.clear();
    this.modularEntities.clear();
    this.disasterDataSources.clear();
    this.disasterEntities.clear();
    this.disasterTilesets.clear();
    this.disasterPropertyEntities.clear();
    this.urbanDataSources.clear();
    this.urbanLa1FemaDataSources.clear();
    this.urbanFacilityDataSources.clear();
    this.urbanEntities.clear();
    this.urbanResponseRouteEntities.clear();
    this.urbanTilesets.clear();
    this.urbanPropertyEntities.clear();
    this.urbanFloodZoneEntities.clear();
    this.urbanLa1FemaSegmentEntities.clear();
    this.urbanFacilityEntities.clear();
    this.measurementPoints.clear();
  }

  private isCurrentDisasterLoad(
    loadVersion: number,
    viewer: Cesium.Viewer,
  ): boolean {
    return (
      loadVersion === this.disasterLoadVersion &&
      this.viewer === viewer &&
      !viewer.isDestroyed()
    );
  }

  private async loadOptionalDisasterOsmBuildings(
    loadVersion: number,
    viewer: Cesium.Viewer,
  ): Promise<void> {
    let tileset: Cesium.Cesium3DTileset | null = null;

    try {
      tileset = await createOptionalOsmBuildings();

      if (!tileset) {
        return;
      }

      if (!this.isCurrentDisasterLoad(loadVersion, viewer)) {
        tileset.destroy();
        return;
      }

      viewer.scene.primitives.add(tileset);

      if (!this.isCurrentDisasterLoad(loadVersion, viewer)) {
        viewer.scene.primitives.remove(tileset);
        return;
      }

      this.disasterTilesets.add(tileset);
    } catch {
      if (tileset && !tileset.isDestroyed()) {
        if (
          !viewer.isDestroyed() &&
          viewer.scene.primitives.contains(tileset)
        ) {
          viewer.scene.primitives.remove(tileset);
        } else {
          tileset.destroy();
        }
      }

      if (this.isCurrentDisasterLoad(loadVersion, viewer)) {
        console.warn(
          "Optional Cesium OSM Buildings context unavailable; continuing with local disaster layers.",
        );
      }
    }
  }

  private clearDisasterLayers(): void {
    const viewer = this.viewer;

    if (viewer && !viewer.isDestroyed()) {
      this.disasterDataSources.forEach((dataSource) => {
        if (viewer.dataSources.contains(dataSource)) {
          viewer.dataSources.remove(dataSource, true);
        }
      });
      this.disasterEntities.forEach((entity) => {
        viewer.entities.remove(entity);
      });
      this.disasterTilesets.forEach((tileset) => {
        if (viewer.scene.primitives.contains(tileset)) {
          viewer.scene.primitives.remove(tileset);
        }
      });
    }

    this.disasterDataSources.clear();
    this.disasterEntities.clear();
    this.disasterTilesets.clear();
    this.disasterPropertyEntities.clear();
  }

  private isCurrentUrbanLoad(loadVersion: number, viewer: Cesium.Viewer): boolean {
    return (
      loadVersion === this.urbanLoadVersion && this.viewer === viewer && !viewer.isDestroyed()
    );
  }

  private isCurrentUrbanLa1FemaLoad(
    loadVersion: number,
    viewer: Cesium.Viewer,
  ): boolean {
    return (
      loadVersion === this.urbanLa1FemaLoadVersion &&
      this.viewer === viewer &&
      !viewer.isDestroyed()
    );
  }

  private isCurrentUrbanFacilityLoad(
    loadVersion: number,
    viewer: Cesium.Viewer,
  ): boolean {
    return (
      loadVersion === this.urbanFacilityLoadVersion &&
      this.viewer === viewer &&
      !viewer.isDestroyed()
    );
  }

  private async loadUrbanFloodZones(
    loadVersion: number,
    viewer: Cesium.Viewer,
    scenario: UrbanResilienceScenario,
  ): Promise<void> {
    let dataSource: Cesium.GeoJsonDataSource | null = null;

    try {
      dataSource = await Cesium.GeoJsonDataSource.load(scenario.floodZoneDataUrl, {
        clampToGround: true,
      });
      dataSource.show = false;
      dataSource.name = `urban-flood-zones:${scenario.id}`;

      if (!this.isCurrentUrbanLoad(loadVersion, viewer)) {
        dataSource.entities.removeAll();
        return;
      }

      const zoneEntities = styleUrbanFloodZoneDataSource(dataSource);

      if (!this.isCurrentUrbanLoad(loadVersion, viewer)) {
        dataSource.entities.removeAll();
        return;
      }

      await viewer.dataSources.add(dataSource);

      if (!this.isCurrentUrbanLoad(loadVersion, viewer)) {
        if (!viewer.isDestroyed() && viewer.dataSources.contains(dataSource)) {
          viewer.dataSources.remove(dataSource, true);
        }
        return;
      }

      this.urbanDataSources.add(dataSource);
      zoneEntities.forEach((entity, zoneId) => {
        this.urbanFloodZoneEntities.set(zoneId, entity);
      });
      dataSource.show = true;
    } catch (loadError: unknown) {
      if (dataSource && !viewer.isDestroyed()) {
        if (viewer.dataSources.contains(dataSource)) {
          viewer.dataSources.remove(dataSource, true);
        } else {
          dataSource.entities.removeAll();
        }
      }

      if (this.isCurrentUrbanLoad(loadVersion, viewer)) {
        console.warn("Unable to load urban resilience flood zone GeoJSON.", loadError);
      }
    }
  }

  private async loadUrbanProperties(
    loadVersion: number,
    viewer: Cesium.Viewer,
    scenario: UrbanResilienceScenario,
  ): Promise<void> {
    let dataSource: Cesium.GeoJsonDataSource | null = null;

    try {
      dataSource = await Cesium.GeoJsonDataSource.load(scenario.propertyDataUrl);
      dataSource.show = false;
      dataSource.name = `urban-properties:${scenario.id}`;

      if (!this.isCurrentUrbanLoad(loadVersion, viewer)) {
        dataSource.entities.removeAll();
        return;
      }

      const propertyEntities = styleUrbanPropertyDataSource(dataSource);

      if (!this.isCurrentUrbanLoad(loadVersion, viewer)) {
        dataSource.entities.removeAll();
        return;
      }

      await viewer.dataSources.add(dataSource);

      if (!this.isCurrentUrbanLoad(loadVersion, viewer)) {
        if (!viewer.isDestroyed() && viewer.dataSources.contains(dataSource)) {
          viewer.dataSources.remove(dataSource, true);
        }
        return;
      }

      this.urbanDataSources.add(dataSource);
      propertyEntities.forEach((entity, propertyId) => {
        this.urbanPropertyEntities.set(propertyId, entity);
      });
      dataSource.show = true;
      this.applySelectionStyles();
    } catch (loadError: unknown) {
      if (dataSource && !viewer.isDestroyed()) {
        if (viewer.dataSources.contains(dataSource)) {
          viewer.dataSources.remove(dataSource, true);
        } else {
          dataSource.entities.removeAll();
        }
      }

      if (this.isCurrentUrbanLoad(loadVersion, viewer)) {
        console.warn("Unable to load urban resilience property GeoJSON.", loadError);
      }
    }
  }

  private async loadOptionalUrbanOsmBuildings(
    loadVersion: number,
    viewer: Cesium.Viewer,
  ): Promise<void> {
    let tileset: Cesium.Cesium3DTileset | null = null;

    try {
      tileset = await createOptionalOsmBuildings();

      if (!tileset) {
        return;
      }

      if (!this.isCurrentUrbanLoad(loadVersion, viewer)) {
        tileset.destroy();
        return;
      }

      viewer.scene.primitives.add(tileset);

      if (!this.isCurrentUrbanLoad(loadVersion, viewer)) {
        viewer.scene.primitives.remove(tileset);
        return;
      }

      this.urbanTilesets.add(tileset);
    } catch {
      if (tileset && !tileset.isDestroyed()) {
        if (!viewer.isDestroyed() && viewer.scene.primitives.contains(tileset)) {
          viewer.scene.primitives.remove(tileset);
        } else {
          tileset.destroy();
        }
      }

      if (this.isCurrentUrbanLoad(loadVersion, viewer)) {
        console.warn(
          "Optional Cesium OSM Buildings context unavailable; continuing with local urban resilience layers.",
        );
      }
    }
  }

  private clearUrbanLayers(): void {
    const viewer = this.viewer;

    if (viewer && !viewer.isDestroyed()) {
      this.urbanDataSources.forEach((dataSource) => {
        if (viewer.dataSources.contains(dataSource)) {
          viewer.dataSources.remove(dataSource, true);
        }
      });
      this.urbanEntities.forEach((entity) => {
        viewer.entities.remove(entity);
      });
      this.urbanTilesets.forEach((tileset) => {
        if (viewer.scene.primitives.contains(tileset)) {
          viewer.scene.primitives.remove(tileset);
        }
      });
    }

    this.urbanDataSources.clear();
    this.urbanEntities.clear();
    this.urbanResponseRouteEntities.clear();
    this.urbanTilesets.clear();
    this.urbanPropertyEntities.clear();
    this.urbanFloodZoneEntities.clear();
  }

  private clearUrbanLa1FemaExperiment(): void {
    const viewer = this.viewer;

    if (viewer && !viewer.isDestroyed()) {
      this.urbanLa1FemaDataSources.forEach((dataSource) => {
        if (viewer.dataSources.contains(dataSource)) {
          viewer.dataSources.remove(dataSource, true);
        }
      });
    }

    this.urbanLa1FemaDataSources.clear();
    this.urbanLa1FemaSegmentEntities.clear();
  }

  private clearUrbanFacilityExperiment(): void {
    const viewer = this.viewer;

    if (viewer && !viewer.isDestroyed()) {
      this.urbanFacilityDataSources.forEach((dataSource) => {
        if (viewer.dataSources.contains(dataSource)) {
          viewer.dataSources.remove(dataSource, true);
        }
      });
    }

    this.urbanFacilityDataSources.clear();
    this.urbanFacilityEntities.clear();
  }

  private applySelectionStyles(): void {
    this.pointEntities.forEach((entity, pointId) => {
      const point = this.measurementPoints.get(pointId);

      if (!point) {
        return;
      }

      applyMeasurementPointVisualState(
        entity,
        point,
        this.selectedEntityIds.measurementPointId === pointId,
      );
    });

    this.modelAnnotationEntities.forEach((entity, annotationId) => {
      applyModelAnnotationVisualState(
        entity,
        this.selectedEntityIds.modelAnnotationId === annotationId,
      );
    });

    this.modularEntities.forEach((entity, entityId) => {
      const modularId =
        (entity.properties?.modularId?.getValue() as string | undefined) ??
        entityId;

      applyModularEntityVisualState(
        entity,
        this.selectedEntityIds.modularEntityId === modularId,
      );
    });

    this.disasterPropertyEntities.forEach((entity, propertyId) => {
      applyDisasterPropertyVisualState(
        entity,
        this.selectedEntityIds.disasterPropertyId === propertyId,
      );
    });

    this.urbanPropertyEntities.forEach((entity, propertyId) => {
      applyUrbanPropertyVisualState(
        entity,
        this.selectedEntityIds.urbanPropertyId === propertyId,
      );
    });

    this.urbanLa1FemaSegmentEntities.forEach((entity, segmentId) => {
      const attributes = parseUrbanLa1FemaSegmentAttributes(
        entity.properties?.getValue(),
      );

      if (attributes) {
        applyUrbanLa1FemaSegmentVisualState(
          entity,
          attributes,
          this.selectedEntityIds.urbanLa1FemaSegmentId === segmentId,
        );
      }
    });

    this.urbanFacilityEntities.forEach((entity, facilityId) => {
      const attributes = parseUrbanFacilityAttributes(
        entity.properties?.getValue(),
      );

      if (attributes) {
        applyUrbanFacilityVisualState(
          entity,
          attributes,
          this.selectedEntityIds.urbanFacilityId === facilityId,
        );
      }
    });
  }

  private attachSelectionHandler(): void {
    if (!this.viewer) {
      return;
    }

    this.clickHandler = new Cesium.ScreenSpaceEventHandler(
      this.viewer.scene.canvas,
    );

    this.clickHandler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      if (!this.viewer) {
        return;
      }

      if (this.locationPickMode) {
        const ray = this.viewer.camera.getPickRay(event.position);
        const worldPosition = ray
          ? this.viewer.scene.globe.pick(ray, this.viewer.scene)
          : undefined;

        if (!worldPosition) {
          return;
        }

        const cartographic = Cesium.Cartographic.fromCartesian(worldPosition);

        this.locationPickMode = false;
        this.onEntitySelected({
          type: "globeLocation",
          lat: Cesium.Math.toDegrees(cartographic.latitude),
          lon: Cesium.Math.toDegrees(cartographic.longitude),
        });
        return;
      }

      const disasterPropertyPick =
        this.disasterPropertyEntities.size > 0
          ? this.viewer.scene.drillPick(event.position).find((candidate) => {
              const candidateEntity = candidate.id as
                | Cesium.Entity
                | undefined;

              return (
                candidateEntity?.properties?.entityType?.getValue() ===
                  "disasterProperty" &&
                !(candidate.primitive instanceof Cesium.LabelCollection)
              );
            })
          : undefined;
      const urbanFacilityPick =
        !disasterPropertyPick && this.urbanFacilityEntities.size > 0
          ? this.viewer.scene.drillPick(event.position).find((candidate) => {
              const candidateEntity = candidate.id as Cesium.Entity | undefined;

              return (
                candidateEntity?.properties?.entityType?.getValue() ===
                "urbanFacility"
              );
            })
          : undefined;
      const urbanPropertyPick =
        !disasterPropertyPick &&
        !urbanFacilityPick &&
        this.urbanPropertyEntities.size > 0
          ? this.viewer.scene.drillPick(event.position).find((candidate) => {
              const candidateEntity = candidate.id as
                | Cesium.Entity
                | undefined;

              return (
                candidateEntity?.properties?.entityType?.getValue() ===
                  "urbanProperty" &&
                !(candidate.primitive instanceof Cesium.LabelCollection)
              );
            })
          : undefined;
      const urbanLa1FemaSegmentPick =
        !disasterPropertyPick &&
        !urbanFacilityPick &&
        !urbanPropertyPick &&
        this.urbanLa1FemaSegmentEntities.size > 0
          ? this.viewer.scene.drillPick(event.position).find((candidate) => {
              const candidateEntity = candidate.id as Cesium.Entity | undefined;

              return (
                candidateEntity?.properties?.entityType?.getValue() ===
                "urbanLa1FemaSegment"
              );
            })
          : undefined;
      const pickedObject =
        disasterPropertyPick ??
        urbanFacilityPick ??
        urbanPropertyPick ??
        urbanLa1FemaSegmentPick ??
        this.viewer.scene.pick(event.position);

      if (!Cesium.defined(pickedObject) || !Cesium.defined(pickedObject.id)) {
        return;
      }

      const entity = pickedObject.id as Cesium.Entity;
      const entityType = entity.properties?.entityType?.getValue();
      const pointId = entity.properties?.pointId?.getValue();
      const annotationId = entity.properties?.annotationId?.getValue();
      const modularId = entity.properties?.modularId?.getValue();
      const disasterPropertyId =
        entity.properties?.disasterPropertyId?.getValue();
      const disasterPropertyAttributes = parseDisasterPropertyAttributes(
        entity.properties?.getValue(),
      );
      const urbanPropertyId = entity.properties?.urbanPropertyId?.getValue();
      const urbanPropertyAttributes = parseUrbanPropertyAttributes(
        entity.properties?.getValue(),
      );
      const urbanLa1FemaSegmentId =
        entity.properties?.urbanLa1FemaSegmentId?.getValue();
      const urbanLa1FemaSegmentAttributes = parseUrbanLa1FemaSegmentAttributes(
        entity.properties?.getValue(),
      );
      const urbanFacilityId = entity.properties?.urbanFacilityId?.getValue();
      const urbanFacilityAttributes = parseUrbanFacilityAttributes(
        entity.properties?.getValue(),
      );
      const modularKind = entity.properties?.modularKind?.getValue() as
        | ModularEntityKind
        | undefined;

      if (entityType === "measurementPoint" && typeof pointId === "string") {
        this.onEntitySelected({ type: "measurementPoint", id: pointId });
      }

      if (
        entityType === "modelAnnotation" &&
        typeof annotationId === "string"
      ) {
        this.onEntitySelected({ type: "modelAnnotation", id: annotationId });
      }

      if (
        entityType === "disasterProperty" &&
        typeof disasterPropertyId === "string" &&
        disasterPropertyAttributes?.property_id === disasterPropertyId &&
        !(pickedObject.primitive instanceof Cesium.LabelCollection)
      ) {
        this.onEntitySelected({
          type: "disasterProperty",
          id: disasterPropertyId,
          attributes: disasterPropertyAttributes,
        });
      }

      if (
        entityType === "urbanProperty" &&
        typeof urbanPropertyId === "string" &&
        urbanPropertyAttributes?.property_id === urbanPropertyId &&
        !(pickedObject.primitive instanceof Cesium.LabelCollection)
      ) {
        this.onEntitySelected({
          type: "urbanProperty",
          id: urbanPropertyId,
          attributes: urbanPropertyAttributes,
        });
      }

      if (
        entityType === "urbanLa1FemaSegment" &&
        typeof urbanLa1FemaSegmentId === "string" &&
        urbanLa1FemaSegmentAttributes?.id === urbanLa1FemaSegmentId
      ) {
        this.onEntitySelected({
          type: "urbanLa1FemaSegment",
          id: urbanLa1FemaSegmentId,
          attributes: urbanLa1FemaSegmentAttributes,
        });
      }

      if (
        entityType === "urbanFacility" &&
        typeof urbanFacilityId === "string" &&
        urbanFacilityAttributes?.facility_id === urbanFacilityId
      ) {
        this.onEntitySelected({
          type: "urbanFacility",
          id: urbanFacilityId,
          attributes: urbanFacilityAttributes,
        });
      }

      if (
        entityType === "modularEntity" &&
        typeof modularId === "string" &&
        typeof modularKind === "string"
      ) {
        this.onEntitySelected({
          type: "modularEntity",
          id: modularId,
          kind: modularKind,
        });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }
}
