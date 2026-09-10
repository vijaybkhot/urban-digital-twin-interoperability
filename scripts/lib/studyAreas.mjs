// Single source of truth for the research bounding windows used across the
// fetch/build/validate scripts. Each window is preserved exactly as it was
// previously hardcoded, independently, in up to six files -- this module
// gives every window one home; it does not reconcile the differences
// between them. Where two windows differ (e.g. the two Grand Isle windows
// below), that is a distinct, deliberately preserved research window, not a
// bug -- see docs/data/data-register.md for the rationale recorded for each.
//
// Bounding boxes are [south, west, north, east] in decimal degrees.

// The building/flood-zone query window used by fetchUrbanResilienceSourceData.mjs.
export const grandIsleBaseBbox = Object.freeze([29.225, -89.99, 29.245, -89.955]);

// The facility query window used by fetchUrbanResilienceFacilitySourceData.mjs
// and buildUrbanResilienceFacilityExperiment.mjs. Extends only the western
// edge of grandIsleBaseBbox so it includes mapped municipal-service
// facilities; the building and LA-1 query windows are unaffected.
export const grandIsleFacilityBbox = Object.freeze([29.225, -90.005, 29.245, -89.955]);

// Shared by both the base and facility fetch/build scripts -- identical in
// both today, kept as one named entry rather than two.
export const portFourchonBbox = Object.freeze([29.09, -90.22, 29.17, -90.14]);

// Extends north past Golden Meadow, Galliano, and Larose so the LA-1
// evacuation corridor route has real road geometry to snap to.
export const la1CorridorBbox = Object.freeze([29.05, -90.4, 29.6, -89.95]);

// The elevation-sample validator's acceptance window: a looser superset of
// grandIsleFacilityBbox (wider on the east edge, taller on both lat edges),
// used only to sanity-check that a sampled point's queried coordinate falls
// somewhere reasonable near Grand Isle -- not to reproduce the exact query
// window a fetch used.
export const grandIsleElevationValidationWindow = Object.freeze({
  minLat: 29.22,
  maxLat: 29.25,
  minLon: -90.005,
  maxLon: -89.95,
});

// The broad region-bounds superset used by validateUrbanResilienceData.mjs
// to sanity-check that every committed coordinate (buildings, flood zones,
// routes, resources) falls somewhere within the Grand Isle / Port Fourchon
// / LA-1 corridor research area, not to reproduce any single fetch window.
export const urbanResilienceRegionBounds = Object.freeze({
  minLat: 29.0,
  maxLat: 29.65,
  minLon: -90.45,
  maxLon: -89.9,
});
