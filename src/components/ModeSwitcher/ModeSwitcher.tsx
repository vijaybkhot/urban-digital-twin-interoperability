import type { ApplicationMode } from "../../types/applicationMode";
import {
  PRIMARY_APPLICATION_MODE,
  SECONDARY_APPLICATION_MODES,
} from "../../types/applicationMode";
import "./ModeSwitcher.css";

interface ModeSwitcherProps {
  activeMode: ApplicationMode;
  onSelectMode: (mode: ApplicationMode) => void;
}

/**
 * The single persistent way to move between the five application modes,
 * replacing a hand-wired mesh in which each panel offered a different subset
 * of destinations under inconsistent labels.
 *
 * Two tiers: the Sea Grant deliverable is always shown as a prominent entry
 * point, and the four secondary demos sit in a disclosure. They are grouped,
 * not buried -- still one click away, and the disclosure opens by default
 * whenever one of them is the active mode so the user can see how they got
 * where they are.
 */
export function ModeSwitcher({ activeMode, onSelectMode }: ModeSwitcherProps) {
  const isPrimaryActive = activeMode === PRIMARY_APPLICATION_MODE.id;
  const isSecondaryActive = SECONDARY_APPLICATION_MODES.some(
    (mode) => mode.id === activeMode,
  );

  return (
    <nav className="mode-switcher" aria-label="Application mode">
      <button
        className="mode-switcher-primary"
        type="button"
        disabled={isPrimaryActive}
        aria-current={isPrimaryActive ? "page" : undefined}
        onClick={() => onSelectMode(PRIMARY_APPLICATION_MODE.id)}
      >
        <span className="mode-switcher-primary-label">
          {PRIMARY_APPLICATION_MODE.label}
        </span>
        <span className="mode-switcher-primary-note">
          {isPrimaryActive ? "Currently open" : "Primary research deliverable"}
        </span>
      </button>

      <details className="mode-switcher-secondary" open={isSecondaryActive}>
        <summary>Other demo modes</summary>
        <ul>
          {SECONDARY_APPLICATION_MODES.map((mode) => {
            const isActive = mode.id === activeMode;

            return (
              <li key={mode.id}>
                <button
                  type="button"
                  disabled={isActive}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onSelectMode(mode.id)}
                >
                  {mode.label}
                </button>
              </li>
            );
          })}
        </ul>
      </details>
    </nav>
  );
}
