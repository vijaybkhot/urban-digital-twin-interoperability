import * as Cesium from "cesium";
import { parseUrbanFacilityAttributes } from "../domain/urbanResilience/parseUrbanFacilityAttributes";
import type { UrbanFacilityAttributes } from "../types/urbanResilience";
import { urbanResilienceVisualColors } from "../theme/urbanResilienceVisualTokens";

const PUBLIC_SAFETY_COLOR = Cesium.Color.fromCssColorString(
  urbanResilienceVisualColors.facilityPublicSafety,
);
const COMMUNITY_COLOR = Cesium.Color.fromCssColorString(
  urbanResilienceVisualColors.facilityCommunity,
);
const SELECTED_COLOR = Cesium.Color.fromCssColorString(
  urbanResilienceVisualColors.selectedPropertyOutline,
);

function facilityColor(attributes: UrbanFacilityAttributes): Cesium.Color {
  return attributes.facility_category === "public-safety"
    ? PUBLIC_SAFETY_COLOR
    : COMMUNITY_COLOR;
}

function setEntityMetadata(
  properties: Cesium.PropertyBag,
  name: string,
  value: string,
): void {
  if (!properties.propertyNames.includes(name)) {
    properties.addProperty(name);
  }

  properties[name] = new Cesium.ConstantProperty(value);
}

function polygonLabelPosition(
  entity: Cesium.Entity,
  time: Cesium.JulianDate,
): Cesium.Cartesian3 | null {
  const hierarchy = entity.polygon?.hierarchy?.getValue(time) as
    | Cesium.PolygonHierarchy
    | undefined;
  const positions = hierarchy?.positions;

  if (!positions || positions.length === 0) {
    return null;
  }

  const cartographics = positions.map((position) =>
    Cesium.Cartographic.fromCartesian(position),
  );
  const longitude =
    cartographics.reduce((sum, position) => sum + position.longitude, 0) /
    cartographics.length;
  const latitude =
    cartographics.reduce((sum, position) => sum + position.latitude, 0) /
    cartographics.length;

  return Cesium.Cartesian3.fromRadians(longitude, latitude, 2);
}

export function applyUrbanFacilityVisualState(
  entity: Cesium.Entity,
  attributes: UrbanFacilityAttributes,
  selected: boolean,
): void {
  const color = facilityColor(attributes);
  const displayColor = selected ? SELECTED_COLOR : color;

  if (entity.point) {
    entity.point.color = new Cesium.ConstantProperty(displayColor);
    entity.point.pixelSize = new Cesium.ConstantProperty(selected ? 18 : 14);
    entity.point.outlineColor = new Cesium.ConstantProperty(
      selected ? Cesium.Color.BLACK : Cesium.Color.WHITE,
    );
    entity.point.outlineWidth = new Cesium.ConstantProperty(selected ? 4 : 3);
  }

  if (entity.polygon) {
    entity.polygon.material = new Cesium.ColorMaterialProperty(
      color.withAlpha(selected ? 0.95 : 0.72),
    );
    entity.polygon.outlineColor = new Cesium.ConstantProperty(displayColor);
  }

  if (entity.label) {
    entity.label.text = new Cesium.ConstantProperty(
      `${selected ? "Selected\n" : ""}${attributes.name}\n${attributes.facility_type_label}`,
    );
    entity.label.fillColor = new Cesium.ConstantProperty(displayColor);
    entity.label.scale = new Cesium.ConstantProperty(selected ? 1.12 : 1);
  }
}

export function styleUrbanFacilityDataSource(
  dataSource: Cesium.GeoJsonDataSource,
  time = Cesium.JulianDate.now(),
): Map<string, Cesium.Entity> {
  const facilityEntities = new Map<string, Cesium.Entity>();

  dataSource.entities.values.forEach((entity) => {
    if (!entity.properties) {
      return;
    }

    const attributes = parseUrbanFacilityAttributes(
      entity.properties.getValue(time),
    );

    if (!attributes) {
      return;
    }

    entity.name = attributes.name;

    if (entity.polygon) {
      entity.polygon.height = new Cesium.ConstantProperty(0);
      entity.polygon.heightReference = new Cesium.ConstantProperty(
        Cesium.HeightReference.NONE,
      );
      entity.polygon.outline = new Cesium.ConstantProperty(true);
      entity.polygon.closeTop = new Cesium.ConstantProperty(true);
      entity.polygon.closeBottom = new Cesium.ConstantProperty(true);
      const labelPosition = polygonLabelPosition(entity, time);

      if (labelPosition) {
        entity.position = new Cesium.ConstantPositionProperty(labelPosition);
      }
    }

    // GeoJsonDataSource creates a default billboard for Point features. Replace
    // it with one facility-specific marker instead of stacking both symbols.
    entity.billboard = undefined;
    entity.point = new Cesium.PointGraphics({
      heightReference: Cesium.HeightReference.NONE,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    });
    entity.label = new Cesium.LabelGraphics({
      font: "bold 13px sans-serif",
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 4,
      pixelOffset: new Cesium.Cartesian2(0, -18),
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5000),
    });
    setEntityMetadata(entity.properties, "entityType", "urbanFacility");
    setEntityMetadata(
      entity.properties,
      "urbanFacilityId",
      attributes.facility_id,
    );
    applyUrbanFacilityVisualState(entity, attributes, false);
    facilityEntities.set(attributes.facility_id, entity);
  });

  return facilityEntities;
}
