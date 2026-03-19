import type { DomainEvent } from "@/lib/events";

export type RealtimeChannel = `match:${string}` | `tournament:${string}` | `fanvote:${string}` | `leaderboard:${string}`;

export interface RealtimePublisher {
  publish(channel: RealtimeChannel, event: DomainEvent): Promise<void>;
}

class InMemoryRealtimePublisher implements RealtimePublisher {
  async publish(_channel: RealtimeChannel, _event: DomainEvent): Promise<void> {
    return;
  }
}

class RedisRealtimePublisher implements RealtimePublisher {
  private redisPromise: Promise<
    { connect: () => Promise<void>; publish: (channel: string, message: string) => Promise<number> } | null
  > | null = null;
  private disabled = false;

  private async getRedis() {
    if (this.disabled) {
      return null;
    }
    if (!this.redisPromise) {
      this.redisPromise = import("ioredis").then(({ default: Redis }) => {
        const url = process.env.REDIS_URL;
        if (!url) {
          throw new Error("REDIS_URL not configured");
        }
        const client = new Redis(url, {
          lazyConnect: true,
          maxRetriesPerRequest: 0
        });
        client.on("error", () => {
          return;
        });
        return client;
      }).catch(() => {
        this.disabled = true;
        return null;
      });
    }
    return this.redisPromise;
  }

  async publish(channel: RealtimeChannel, event: DomainEvent): Promise<void> {
    const redis = await this.getRedis();
    if (!redis) {
      return;
    }
    try {
      await redis.connect();
      await redis.publish(channel, JSON.stringify(event));
    } catch {
      this.disabled = true;
    }
  }
}

let publisher: RealtimePublisher = process.env.REDIS_URL
  ? new RedisRealtimePublisher()
  : new InMemoryRealtimePublisher();

export function setRealtimePublisher(nextPublisher: RealtimePublisher): void {
  publisher = nextPublisher;
}

export async function publishRealtime(channel: RealtimeChannel, event: DomainEvent): Promise<void> {
  await publisher.publish(channel, event);
}
