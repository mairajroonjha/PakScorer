"use client";

import { useEffect, useState } from "react";

export default function LiveEventFeed() {
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    const source = new EventSource("/api/realtime/stream");
    source.onmessage = (event) => {
      setEvents((previous) => [event.data, ...previous].slice(0, 8));
    };
    return () => source.close();
  }, []);

  return (
    <div className="card">
      <h3>Realtime Feed</h3>
      {events.length === 0 ? (
        <p className="muted">Waiting for live events...</p>
      ) : (
        events.map((event, index) => (
          <p key={`${event}-${index}`} className="muted">
            {event}
          </p>
        ))
      )}
    </div>
  );
}
