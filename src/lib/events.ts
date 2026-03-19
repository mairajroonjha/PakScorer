import { publishRealtime, type RealtimeChannel } from "@/lib/realtime";

export type DomainEventName =
  | "match.ball_recorded"
  | "match.score_corrected"
  | "match.state_changed"
  | "leaderboard.updated"
  | "fanvote.updated";

export interface DomainEvent<TPayload = Record<string, unknown>> {
  eventVersion: 1;
  name: DomainEventName;
  occurredAt: string;
  payload: TPayload;
}

type EventListener = (event: DomainEvent) => void;

const listeners = new Set<EventListener>();

function getChannels(event: DomainEvent): RealtimeChannel[] {
  const payload = event.payload as Record<string, unknown>;
  const channels: RealtimeChannel[] = [];
  if (typeof payload.matchId === "string") {
    channels.push(`match:${payload.matchId}`);
  }
  if (typeof payload.matchId === "string" && event.name === "fanvote.updated") {
    channels.push(`fanvote:${payload.matchId}`);
  }
  if (typeof payload.scope === "string" && event.name === "leaderboard.updated") {
    channels.push(`leaderboard:${payload.scope}`);
  }
  return channels;
}

export function publishEvent<TPayload>(event: DomainEvent<TPayload>): void {
  for (const listener of listeners) {
    listener(event as DomainEvent);
  }
  for (const channel of getChannels(event as DomainEvent)) {
    void publishRealtime(channel, event as DomainEvent);
  }
}

export function subscribeEvent(listener: EventListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
