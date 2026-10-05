import type { ReactNode } from "react";

interface CollapsibleSectionProps {
  /** Id of the `h2`, so existing `aria-labelledby` references keep resolving. */
  id: string;
  title: string;
  /** Short qualifier shown in the summary, so the content is discoverable while collapsed. */
  badge?: string;
  defaultOpen?: boolean;
  /** Sections sharing a group open one at a time (native <details name>). */
  group?: string;
  /** Extra class names, e.g. to keep a component's existing styling hook. */
  className?: string;
  children: ReactNode;
}

// Native <details>/<summary>: the browser provides keyboard operation
// (Tab, then Enter/Space) and the expanded state, so there is no React state
// to keep in sync. `open` is only the initial state; React does not
// overwrite what the user toggles afterwards because the prop never changes.
//
// Safety rule: a section that contains a role="note" must pass defaultOpen,
// unless the note only qualifies content inside the same section (so the
// two are only ever visible together).
export function CollapsibleSection({
  id,
  title,
  badge,
  defaultOpen = false,
  group,
  className,
  children,
}: CollapsibleSectionProps) {
  return (
    <details
      className={`urban-resilience-demo-section urban-collapsible ${className ?? ""}`.trim()}
      open={defaultOpen}
      name={group}
    >
      <summary className="urban-collapsible-summary">
        <h2 id={id}>{title}</h2>
        {badge && <span className="urban-collapsible-badge">{badge}</span>}
      </summary>
      <div className="urban-collapsible-body">{children}</div>
    </details>
  );
}
