import * as Cesium from "cesium";
import { isUrbanRiskLevel } from "../domain/urbanResilience/urbanResilienceContract";
import { urbanResilienceVisualColors } from "../theme/urbanResilienceVisualTokens";
import type { UrbanRiskLevel } from "../types/urbanResilience";

export const URBAN_PROPERTY_MATERIAL_ALPHA = 0.82;
export const DEFAULT_URBAN_BUILDING_HEIGHT_M = 5;
export const URBAN_PROPERTY_LABEL_MAX_DISTANCE_M = 250;
export const SELECTED_URBAN_PROPERTY_MATERIAL_ALPHA = 1;

export const selectedUrbanPropertyOutlineColor = Cesium.Color.fromCssColorString(
  urbanResilienceVisualColors.selectedPropertyOutline,
);

export const urbanRiskColors: Readonly<Record<UrbanRiskLevel, Cesium.Color>> = {
  Low: Cesium.Color.fromCssColorString(urbanResilienceVisualColors.riskLow),
  Moderate: Cesium.Color.fromCssColorString(urbanResilienceVisualColors.riskModerate),
  High: Cesium.Color.fromCssColorString(urbanResilienceVisualColors.riskHigh),
  Unknown: Cesium.Color.fromCssColorString(urbanResilienceVisualColors.riskUnknown),
};

export const unknownUrbanRiskColor = Cesium.Color.fromCssColorString(
  urbanResilienceVisualColors.riskUnknown,
);

export const URBAN_ELEVATION_SAMPLE_MARKER_PIXEL_SIZE = 10;

export const urbanElevationSampleMarkerColor = Cesium.Color.fromCssColorString(
  urbanResilienceVisualColors.elevationSampleMarker,
);

export interface UrbanPropertyVisualStyle {
  color: Cesium.Color;
  label: string;
  riskLevel: UrbanRiskLevel | null;
}

export function getUrbanPropertyVisualStyle(value: unknown): UrbanPropertyVisualStyle {
  if (isUrbanRiskLevel(value)) {
    return {
      color: urbanRiskColors[value],
      label: value === "Unknown" ? "FEMA coverage unavailable" : `${value} risk`,
      riskLevel: value,
    };
  }

  return {
    color: unknownUrbanRiskColor,
    label: "Unclassified risk",
    riskLevel: null,
  };
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asBuildingHeight(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : DEFAULT_URBAN_BUILDING_HEIGHT_M;
}

function setEntityMetadata(properties: Cesium.PropertyBag, name: string, value: string): void {
  if (!properties.propertyNames.includes(name)) {
    properties.addProperty(name);
  }

  properties[name] = new Cesium.ConstantProperty(value);
}

function polygonRoofPosition(
  entity: Cesium.Entity,
  time: Cesium.JulianDate,
  buildingHeightM: number,
): Cesium.Cartesian3 | null {
  const hierarchy = entity.polygon?.hierarchy?.getValue(time) as
    | Cesium.PolygonHierarchy
    | undefined;
  const positions = hierarchy?.positions;

  if (!positions || positions.length === 0) {
    return null;
  }

  const cartographics = positions.map((position) => Cesium.Cartographic.fromCartesian(position));
  const longitude =
    cartographics.reduce((sum, position) => sum + position.longitude, 0) / cartographics.length;
  const latitude =
    cartographics.reduce((sum, position) => sum + position.latitude, 0) / cartographics.length;

  return Cesium.Cartesian3.fromRadians(longitude, latitude, buildingHeightM + 1.5);
}

function stylePropertyEntity(
  entity: Cesium.Entity,
  time: Cesium.JulianDate,
): { propertyId: string; entity: Cesium.Entity } | null {
  if (!entity.polygon || !entity.properties) {
    return null;
  }

  const values = entity.properties.getValue(time) as Record<string, unknown>;
  const propertyId = asNonEmptyString(values.property_id) ?? entity.id;
  const addressLabel = asNonEmptyString(values.address_label) ?? propertyId ?? "Property";
  const buildingHeightM = asBuildingHeight(values.building_height_m);
  const riskStyle = getUrbanPropertyVisualStyle(values.risk_level);

  entity.name = addressLabel;
  entity.polygon.height = new Cesium.ConstantProperty(0);
  entity.polygon.heightReference = new Cesium.ConstantProperty(Cesium.HeightReference.NONE);
  entity.polygon.extrudedHeight = new Cesium.ConstantProperty(buildingHeightM);
  entity.polygon.extrudedHeightReference = new Cesium.ConstantProperty(
    Cesium.HeightReference.NONE,
  );
  entity.polygon.perPositionHeight = new Cesium.ConstantProperty(false);
  entity.polygon.material = new Cesium.ColorMaterialProperty(
    riskStyle.color.withAlpha(URBAN_PROPERTY_MATERIAL_ALPHA),
  );
  entity.polygon.outline = new Cesium.ConstantProperty(true);
  entity.polygon.outlineColor = new Cesium.ConstantProperty(Cesium.Color.WHITE);
  entity.polygon.closeTop = new Cesium.ConstantProperty(true);
  entity.polygon.closeBottom = new Cesium.ConstantProperty(true);

  const roofPosition = polygonRoofPosition(entity, time, buildingHeightM);

  if (roofPosition) {
    entity.position = new Cesium.ConstantPositionProperty(roofPosition);
    entity.label = new Cesium.LabelGraphics({
      text: `${addressLabel}\n${riskStyle.label}`,
      font: "bold 12px sans-serif",
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -8),
      heightReference: Cesium.HeightReference.NONE,
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
        0,
        URBAN_PROPERTY_LABEL_MAX_DISTANCE_M,
      ),
    });
  }

  setEntityMetadata(entity.properties, "entityType", "urbanProperty");
  setEntityMetadata(entity.properties, "urbanPropertyId", propertyId);

  return { propertyId, entity };
}

export function applyUrbanPropertyVisualState(
  entity: Cesium.Entity,
  isSelected: boolean,
  time = Cesium.JulianDate.now(),
): void {
  if (!entity.polygon || !entity.properties) {
    return;
  }

  const values = entity.properties.getValue(time) as Record<string, unknown>;
  const propertyId = asNonEmptyString(values.property_id) ?? entity.id;
  const addressLabel = asNonEmptyString(values.address_label) ?? propertyId ?? "Property";
  const riskStyle = getUrbanPropertyVisualStyle(values.risk_level);

  entity.polygon.material = new Cesium.ColorMaterialProperty(
    riskStyle.color.withAlpha(
      isSelected ? SELECTED_URBAN_PROPERTY_MATERIAL_ALPHA : URBAN_PROPERTY_MATERIAL_ALPHA,
    ),
  );
  entity.polygon.outlineColor = new Cesium.ConstantProperty(
    isSelected ? selectedUrbanPropertyOutlineColor : Cesium.Color.WHITE,
  );

  if (!entity.label) {
    return;
  }

  entity.label.text = new Cesium.ConstantProperty(
    `${isSelected ? "Selected\n" : ""}${addressLabel}\n${riskStyle.label}`,
  );
  entity.label.fillColor = new Cesium.ConstantProperty(
    isSelected ? selectedUrbanPropertyOutlineColor : Cesium.Color.WHITE,
  );
  entity.label.scale = new Cesium.ConstantProperty(isSelected ? 1.15 : 1);
  entity.label.showBackground = new Cesium.ConstantProperty(isSelected);
  entity.label.backgroundColor = new Cesium.ConstantProperty(Cesium.Color.BLACK.withAlpha(0.72));
}

export function styleUrbanPropertyDataSource(
  dataSource: Cesium.GeoJsonDataSource,
  time = Cesium.JulianDate.now(),
): Map<string, Cesium.Entity> {
  const propertyEntities = new Map<string, Cesium.Entity>();

  dataSource.entities.values.forEach((entity) => {
    const styledProperty = stylePropertyEntity(entity, time);

    if (styledProperty) {
      propertyEntities.set(styledProperty.propertyId, styledProperty.entity);
    }
  });

  return propertyEntities;
}

// Marks a building that has a USGS ground-elevation sample (see
// docs/data/urban-resilience-layers.md, layer 1) by layering a small point
// marker onto the building's *existing* entity, at the same roof position
// stylePropertyEntity already computed for the address label. This does not
// add a new entity, change risk-tier styling, or affect click-selection --
// the polygon's entityType/urbanPropertyId metadata is untouched.
export function applyUrbanElevationSampleMarker(
  entity: Cesium.Entity,
  isSampled: boolean,
): void {
  if (!isSampled) {
    entity.point = undefined;
    return;
  }

  entity.point = new Cesium.PointGraphics({
    pixelSize: URBAN_ELEVATION_SAMPLE_MARKER_PIXEL_SIZE,
    color: urbanElevationSampleMarkerColor,
    outlineColor: Cesium.Color.WHITE,
    outlineWidth: 2,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
  });
}
