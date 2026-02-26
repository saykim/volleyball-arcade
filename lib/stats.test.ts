import { describe, expect, it } from "vitest";

import type { StatEvent } from "@/lib/domain";
import { buildPlayerInsight, computePlayerStats, summarizeTeam } from "@/lib/stats";

const BASE_EVENT: Omit<StatEvent, "type" | "outcome"> = {
  id: 1,
  teamId: 1,
  sessionId: 1,
  playerId: 10,
  createdAt: "2026-02-25T00:00:00.000Z",
};

describe("computePlayerStats", () => {
  it("counts success stats and errors by event type", () => {
    const events: StatEvent[] = [
      { ...BASE_EVENT, type: "serve", outcome: "success" },
      { ...BASE_EVENT, id: 2, type: "spike", outcome: "success" },
      { ...BASE_EVENT, id: 3, type: "receive", outcome: "success" },
      { ...BASE_EVENT, id: 4, type: "block", outcome: "success" },
      { ...BASE_EVENT, id: 5, type: "error", outcome: "error" },
      { ...BASE_EVENT, id: 6, type: "spike", outcome: "error" },
    ];

    const stats = computePlayerStats(events);
    expect(stats).toEqual({
      serveSuccess: 1,
      receiveSuccess: 1,
      spikeSuccess: 1,
      blockSuccess: 1,
      errors: 2,
      totalEvents: 6,
    });
  });
});

describe("buildPlayerInsight", () => {
  it("returns missions and a tip", () => {
    const insight = buildPlayerInsight({
      serveSuccess: 4,
      receiveSuccess: 0,
      spikeSuccess: 1,
      blockSuccess: 0,
      errors: 4,
      totalEvents: 10,
    }, (key) => key);

    expect(insight.tip.length).toBeGreaterThan(0);
    expect(insight.missions.length).toBe(2);
    expect(insight.weaknesses.length).toBeGreaterThan(0);
    expect(insight.strengths.length).toBeGreaterThan(0);
  });
});

describe("summarizeTeam", () => {
  it("summarizes total, positive, and errors", () => {
    const events: StatEvent[] = [
      { ...BASE_EVENT, type: "serve", outcome: "success" },
      { ...BASE_EVENT, id: 2, type: "spike", outcome: "error" },
      { ...BASE_EVENT, id: 3, type: "error", outcome: "error" },
    ];

    expect(summarizeTeam(events)).toEqual({
      totalEvents: 3,
      positiveEvents: 1,
      totalErrors: 2,
    });
  });
});
