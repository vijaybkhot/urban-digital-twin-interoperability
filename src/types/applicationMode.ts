// The application's five top-level modes, as a typed, importable fact rather
// than prose duplicated across five panels. Lives in src/types (not src/app)
// because src/components/** must be able to import it without depending on
// src/app/**, which would invert the current dependency direction.

export type ApplicationMode =
  | "workflow"
  | "existing-demo"
  | "modular-demo"
  | "disaster-demo"
  | "urban-resilience-demo";

// Mirrors the mock / fictional / real-data distinction documented in
// docs/architecture.md and docs/handoff/onboarding.md. This distinction is a
// safety property, not a cosmetic one: it records which modes present real
// public data and which present fabricated or placeholder data.
export type ApplicationModeKind =
  | "workflow"
  | "mock"
  | "fictional"
  | "research-real-data";

export interface ApplicationModeDescriptor {
  id: ApplicationMode;
  /**
   * The single canonical label for this destination. Before this existed the
   * same mode carried up to three different labels across panels (e.g.
   * "Disaster demo" / "Disaster Resilience Demo" / "Open disaster resilience
   * demo"). Use this everywhere the mode is offered as a destination.
   */
  label: string;
  kind: ApplicationModeKind;
  /**
   * True only for the Sea Grant deliverable. The mode switcher presents the
   * primary mode prominently and groups the rest behind a disclosure; it does
   * not make them harder to reach.
   */
  isPrimary: boolean;
}

export const APPLICATION_MODES: readonly ApplicationModeDescriptor[] = [
  {
    id: "urban-resilience-demo",
    label: "Open urban resilience demo",
    kind: "research-real-data",
    isPrimary: true,
  },
  {
    id: "workflow",
    label: "New project workflow",
    kind: "workflow",
    isPrimary: false,
  },
  {
    id: "existing-demo",
    label: "Open existing demo",
    kind: "mock",
    isPrimary: false,
  },
  {
    id: "modular-demo",
    label: "Open modular housing demo",
    kind: "mock",
    isPrimary: false,
  },
  {
    id: "disaster-demo",
    label: "Open disaster resilience demo",
    kind: "fictional",
    isPrimary: false,
  },
];

export const PRIMARY_APPLICATION_MODE: ApplicationModeDescriptor =
  APPLICATION_MODES.find((mode) => mode.isPrimary) ?? APPLICATION_MODES[0];

export const SECONDARY_APPLICATION_MODES: readonly ApplicationModeDescriptor[] =
  APPLICATION_MODES.filter((mode) => !mode.isPrimary);
