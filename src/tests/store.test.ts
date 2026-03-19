import { describe, expect, test } from "vitest";
import {
  applyTeamToTournament,
  createDirectMatchRequest,
  createPlayer,
  getTop10,
  registerTeam,
  requestTournament,
  reviewTeamApplication,
  submitFanVote,
  updateSquad
} from "@/lib/store";

describe("Store domain rules", () => {
  test("creates BCA ids", () => {
    const player = createPlayer("Ali Khan", "u-tadmin");
    expect(player.bcaId.startsWith("BCA-")).toBe(true);
  });

  test("tournament request starts as pending", () => {
    const tournament = requestTournament("District Cup", "bela", "u-tadmin");
    expect(tournament.status).toBe("PENDING");
  });

  test("single vote per device hash", () => {
    submitFanVote("m-1", "p-1", "hash-1");
    expect(() => submitFanVote("m-1", "p-1", "hash-1")).toThrow();
  });

  test("leaderboard snapshot always defined", () => {
    const lb = getTop10("global");
    expect(lb.scope).toBe("global");
  });

  test("prevents same player in different teams for same tournament", () => {
    const p = createPlayer("Bilal", "u-tadmin");
    updateSquad("team-a", "t-1", [p.bcaId], "u-tadmin");
    expect(() => updateSquad("team-b", "t-1", [p.bcaId], "u-tadmin")).toThrow();
  });

  test("team can register and apply to a tournament", () => {
    const team = registerTeam(
      {
        name: "Pakscorer XI",
        city: "Karachi",
        captainName: "Mairaj",
        contactPhone: "03000000000"
      },
      "u-teamadmin"
    );
    const application = applyTeamToTournament(team.id, "t-1", "u-teamadmin");
    const approved = reviewTeamApplication(application.id, "APPROVED", "u-tadmin");
    expect(approved.status).toBe("APPROVED");
  });

  test("team admin can create direct match request", () => {
    const request = createDirectMatchRequest(
      {
        requesterTeamId: "team-a",
        opponentTeamId: "team-c",
        format: "T20",
        venue: "Bela Ground",
        startAt: new Date().toISOString()
      },
      "u-teamadmin"
    );
    expect(request.status).toBe("PENDING");
  });
});
