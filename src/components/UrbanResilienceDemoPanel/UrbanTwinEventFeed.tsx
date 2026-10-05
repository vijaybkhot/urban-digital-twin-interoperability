import type { UrbanTwinEvent } from "../../types/urbanResilience";

interface UrbanTwinEventFeedProps {
  events: readonly UrbanTwinEvent[];
}

function formatEventTimestamp(timestamp: string): string {
  const timestampParts = timestamp.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}):\d{2}Z$/);

  return timestampParts ? `${timestampParts[1]} · ${timestampParts[2]} UTC` : timestamp;
}

export function UrbanTwinEventFeed({ events }: UrbanTwinEventFeedProps) {
  const orderedEvents = [...events].sort(
    (first, second) =>
      first.timestamp.localeCompare(second.timestamp) || first.id.localeCompare(second.id),
  );

  return (
    <section
      className="urban-resilience-demo-subsection urban-event-feed"
      aria-labelledby="urban-event-feed-title"
    >
      <h3 id="urban-event-feed-title" className="urban-subsection-heading">
        Data provenance feed
      </h3>
      <p className="urban-event-feed-note" role="note">
        These entries document where this scenario&apos;s real data came from and how it was
        classified. This is not live monitoring.
      </p>
      <ol className="urban-event-feed-list">
        {orderedEvents.map((event, index) => (
          <li key={event.id} data-event-id={event.id}>
            <div className="urban-event-feed-meta">
              <span className="urban-event-sequence">{String(index + 1).padStart(2, "0")}</span>
              <strong>{event.source}</strong>
            </div>
            <time dateTime={event.timestamp}>{formatEventTimestamp(event.timestamp)}</time>
            <p>{event.message}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
