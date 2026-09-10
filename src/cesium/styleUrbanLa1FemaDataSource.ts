import * as Cesium from "cesium";
import { parseUrbanLa1FemaSegmentAttributes } from "../domain/urbanResilience/parseUrbanLa1FemaSegment";
import { urbanResilienceVisualColors } from "../theme/urbanResilienceVisualTokens";
import type { UrbanLa1FemaSegmentAttributes } from "../types/urbanResilience";

// Reuses the response-route purple so a confirmed FEMA overlap reads as a
// deliberate, prominent research finding rather than blending into the
// basemap alongside the two calmer, muted "no overlap" / "not yet evaluated"
// states below.
export const URBAN_LA1_INTERSECTION_COLOR = Cesium.Color.fromCssColorString(
  urbanResilienceVisualColors.route,
);
export const URBAN_LA1_UNKNOWN_COLOR = Cesium.Color.fromCssColorString("#94a3b8");
export const URBAN_LA1_NO_INTERSECTION_COLOR =
  Cesium.Color.fromCssColorString("#64748b");
export const URBAN_LA1_SELECTED_COLOR = Cesium.Color.WHITE;

function segmentMaterial(
  attributes: UrbanLa1FemaSegmentAttributes,
  selected: boolean,
): Cesium.MaterialProperty {
  if (selected) {
    return new Cesium.PolylineOutlineMaterialProperty({
      color:
        attributes.intersects_mapped_flood_hazard === true
          ? URBAN_LA1_INTERSECTION_COLOR
          : URBAN_LA1_UNKNOWN_COLOR,
      outlineColor: URBAN_LA1_SELECTED_COLOR,
      outlineWidth: 3,
    });
  }

  if (attributes.intersects_mapped_flood_hazard === true) {
    return new Cesium.PolylineOutlineMaterialProperty({
      color: URBAN_LA1_INTERSECTION_COLOR,
      outlineColor: Cesium.Color.fromCssColorString("#334155"),
      outlineWidth: 1,
    });
  }

  if (attributes.intersects_mapped_flood_hazard === false) {
    return new Cesium.ColorMaterialProperty(URBAN_LA1_NO_INTERSECTION_COLOR);
  }

  return new Cesium.PolylineDashMaterialProperty({
    color: URBAN_LA1_UNKNOWN_COLOR,
    gapColor: Cesium.Color.TRANSPARENT,
    dashLength: 14,
  });
}

export function applyUrbanLa1FemaSegmentVisualState(
  entity: Cesium.Entity,
  attributes: UrbanLa1FemaSegmentAttributes,
  selected: boolean,
): void {
  if (!entity.polyline) {
    return;
  }

  entity.polyline.width = new Cesium.ConstantProperty(
    selected
      ? 7
      : attributes.intersects_mapped_flood_hazard === true
        ? 4
        : 3,
  );
  entity.polyline.material = segmentMaterial(attributes, selected);
  entity.polyline.clampToGround = new Cesium.ConstantProperty(true);
  entity.polyline.zIndex = new Cesium.ConstantProperty(selected ? 12 : 8);
}

export function styleUrbanLa1FemaDataSource(
  dataSource: Cesium.GeoJsonDataSource,
  time = Cesium.JulianDate.now(),
): Map<string, Cesium.Entity> {
  const segmentEntities = new Map<string, Cesium.Entity>();

  dataSource.entities.values.forEach((entity) => {
    if (!entity.polyline || !entity.properties) {
      return;
    }

    const attributes = parseUrbanLa1FemaSegmentAttributes(
      entity.properties.getValue(time),
    );

    if (!attributes) {
      return;
    }

    entity.name = `${attributes.name} — FEMA relationship experiment`;

    if (!entity.properties.propertyNames.includes("entityType")) {
      entity.properties.addProperty("entityType");
    }
    if (!entity.properties.propertyNames.includes("urbanLa1FemaSegmentId")) {
      entity.properties.addProperty("urbanLa1FemaSegmentId");
    }

    entity.properties.entityType = new Cesium.ConstantProperty(
      "urbanLa1FemaSegment",
    );
    entity.properties.urbanLa1FemaSegmentId = new Cesium.ConstantProperty(
      attributes.id,
    );
    applyUrbanLa1FemaSegmentVisualState(entity, attributes, false);
    segmentEntities.set(attributes.id, entity);
  });

  return segmentEntities;
}
