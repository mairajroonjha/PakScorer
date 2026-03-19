import {
  AuditLog,
  BallEvent,
  DirectMatchRequest,
  FanVote,
  LeaderboardSnapshot,
  Match,
  NewsPost,
  Player,
  Role,
  ScoreCorrection,
  SquadEntry,
  Team,
  TeamTournamentApplication,
  Tournament,
  User
} from "@/types/domain";
import { publishEvent } from "@/lib/events";

function nowIso(): string {
  return new Date().toISOString();
}

function createId(): string {
  return crypto.randomUUID();
}

const users = new Map<string, User>();
const tournaments = new Map<string, Tournament>();
const teams = new Map<string, Team>();
const players = new Map<string, Player>();
const squads: SquadEntry[] = [];
const matches = new Map<string, Match>();
const balls = new Map<string, BallEvent[]>();
const corrections = new Map<string, ScoreCorrection[]>();
const leaderboard = new Map<string, LeaderboardSnapshot>();
const fanVotes = new Map<string, FanVote[]>();
const newsPosts: NewsPost[] = [];
const auditLogs: AuditLog[] = [];
const voteDeviceUsage = new Map<string, number>();
const teamApplications = new Map<string, TeamTournamentApplication>();
const directMatchRequests = new Map<string, DirectMatchRequest>();

function logAction(action: string, actorId: string, entityId: string, meta?: Record<string, unknown>): void {
  auditLogs.push({
    id: createId(),
    action,
    actorId,
    entityId,
    meta,
    createdAt: nowIso()
  });
}

export function bootstrapSeed(): void {
  if (users.size > 0) {
    return;
  }
  users.set("u-super", { id: "u-super", name: "Super Admin", role: "SUPER_ADMIN", regionId: "bela" });
  users.set("u-tadmin", { id: "u-tadmin", name: "Tournament Admin", role: "TOURNAMENT_ADMIN", regionId: "bela" });
  users.set("u-teamadmin", { id: "u-teamadmin", name: "Team Admin", role: "TEAM_ADMIN", regionId: "bela" });
  users.set("u-scorer", { id: "u-scorer", name: "Ground Scorer", role: "MATCH_SCORER", regionId: "bela" });
  users.set("u-public", { id: "u-public", name: "Public Viewer", role: "PUBLIC_VIEWER", regionId: "bela" });

  const tournament: Tournament = {
    id: "t-1",
    name: "Bela Champions Cup",
    regionId: "bela",
    status: "APPROVED",
    requestedBy: "u-tadmin",
    approvedBy: "u-super"
  };
  tournaments.set(tournament.id, tournament);

  teams.set("team-a", {
    id: "team-a",
    name: "Bela Warriors",
    tournamentId: "t-1",
    ownerUserId: "u-teamadmin",
    city: "Bela",
    captainName: "Ali Raza",
    contactPhone: "03001234567",
    sponsorName: "Makran Traders"
  });
  teams.set("team-b", {
    id: "team-b",
    name: "Coastal Strikers",
    tournamentId: "t-1",
    ownerUserId: "u-tadmin",
    city: "Hub",
    captainName: "Bilal Ahmed",
    contactPhone: "03007654321",
    sponsorName: "Coastal Cables"
  });
  teams.set("team-c", {
    id: "team-c",
    name: "Lasbela Lions",
    ownerUserId: "u-super",
    city: "Uthal",
    captainName: "Sajid Khan",
    contactPhone: "03110002222"
  });

  const startAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const lockAt = new Date(startAt.getTime() - 30 * 60 * 1000);
  matches.set("m-1", {
    id: "m-1",
    tournamentId: "t-1",
    teamAId: "team-a",
    teamBId: "team-b",
    startAt: startAt.toISOString(),
    squadLockAt: lockAt.toISOString(),
    state: "SCHEDULED",
    mode: "TOURNAMENT"
  });
}

bootstrapSeed();

export function getUserById(userId: string): User | undefined {
  return users.get(userId);
}

export function listUsers(): User[] {
  return [...users.values()];
}

export function listTournaments(): Tournament[] {
  return [...tournaments.values()];
}

export function listTeams(): Team[] {
  return [...teams.values()];
}

export function listMatches(): Match[] {
  return [...matches.values()];
}

export function listTeamApplications(): TeamTournamentApplication[] {
  return [...teamApplications.values()];
}

export function listDirectMatchRequests(): DirectMatchRequest[] {
  return [...directMatchRequests.values()];
}

function hasApprovedTeamApplication(teamId: string, tournamentId: string): boolean {
  return [...teamApplications.values()].some(
    (application) =>
      application.teamId === teamId &&
      application.tournamentId === tournamentId &&
      application.status === "APPROVED"
  );
}

function assertTeamOwnership(team: Team, actorId: string): void {
  const role = getRoleForUser(actorId);
  if (role === "SUPER_ADMIN" || role === "TOURNAMENT_ADMIN") {
    return;
  }
  if (team.ownerUserId !== actorId) {
    throw new Error("You can only manage your own team profile");
  }
}

export function requestTournament(name: string, regionId: string, requestedBy: string): Tournament {
  const entry: Tournament = {
    id: createId(),
    name,
    regionId,
    status: "PENDING",
    requestedBy
  };
  tournaments.set(entry.id, entry);
  logAction("tournament.requested", requestedBy, entry.id);
  return entry;
}

export function registerTeam(
  profile: Pick<Team, "name" | "city" | "captainName" | "contactPhone" | "sponsorName" | "logoUrl">,
  actorId: string
): Team {
  const team: Team = {
    id: createId(),
    name: profile.name,
    city: profile.city,
    captainName: profile.captainName,
    contactPhone: profile.contactPhone,
    sponsorName: profile.sponsorName,
    logoUrl: profile.logoUrl,
    ownerUserId: actorId
  };
  teams.set(team.id, team);
  logAction("team.registered", actorId, team.id);
  return team;
}

export function applyTeamToTournament(teamId: string, tournamentId: string, actorId: string): TeamTournamentApplication {
  const team = teams.get(teamId);
  const tournament = tournaments.get(tournamentId);
  if (!team) {
    throw new Error("Team not found");
  }
  assertTeamOwnership(team, actorId);
  if (!tournament) {
    throw new Error("Tournament not found");
  }
  const existing = [...teamApplications.values()].find(
    (application) => application.teamId === teamId && application.tournamentId === tournamentId
  );
  if (existing) {
    throw new Error("Team already applied to this tournament");
  }
  const application: TeamTournamentApplication = {
    id: createId(),
    teamId,
    tournamentId,
    status: "PENDING",
    requestedBy: actorId,
    createdAt: nowIso()
  };
  teamApplications.set(application.id, application);
  logAction("team.application.requested", actorId, application.id, { teamId, tournamentId });
  return application;
}

export function reviewTeamApplication(
  applicationId: string,
  status: "APPROVED" | "REJECTED",
  actorId: string,
  rejectionReason?: string
): TeamTournamentApplication {
  const application = teamApplications.get(applicationId);
  if (!application) {
    throw new Error("Team application not found");
  }
  application.status = status;
  application.reviewedBy = actorId;
  application.rejectionReason = status === "REJECTED" ? rejectionReason : undefined;
  logAction(`team.application.${status.toLowerCase()}`, actorId, applicationId, {
    teamId: application.teamId,
    tournamentId: application.tournamentId,
    rejectionReason
  });
  return application;
}

export function createDirectMatchRequest(
  payload: Pick<DirectMatchRequest, "requesterTeamId" | "opponentTeamId" | "format" | "venue" | "startAt">,
  actorId: string
): DirectMatchRequest {
  const requesterTeam = teams.get(payload.requesterTeamId);
  const opponentTeam = teams.get(payload.opponentTeamId);
  if (!requesterTeam || !opponentTeam) {
    throw new Error("Both teams must exist before requesting a direct match");
  }
  assertTeamOwnership(requesterTeam, actorId);
  const request: DirectMatchRequest = {
    id: createId(),
    requesterTeamId: payload.requesterTeamId,
    opponentTeamId: payload.opponentTeamId,
    requestedBy: actorId,
    format: payload.format,
    venue: payload.venue,
    startAt: payload.startAt,
    status: "PENDING",
    createdAt: nowIso()
  };
  directMatchRequests.set(request.id, request);
  logAction("match.direct.requested", actorId, request.id, payload);
  return request;
}

export function updateTournamentStatus(id: string, status: "APPROVED" | "REJECTED", actorId: string): Tournament {
  const tournament = tournaments.get(id);
  if (!tournament) {
    throw new Error("Tournament not found");
  }
  tournament.status = status;
  if (status === "APPROVED") {
    tournament.approvedBy = actorId;
  } else {
    tournament.rejectedBy = actorId;
  }
  logAction(`tournament.${status.toLowerCase()}`, actorId, id);
  return tournament;
}

function nextBcaId(): string {
  const serial = players.size + 101;
  return `BCA-${serial}`;
}

export function createPlayer(fullName: string, actorId: string): Player {
  const player: Player = {
    id: createId(),
    bcaId: nextBcaId(),
    fullName,
    verificationStatus: "VERIFIED"
  };
  players.set(player.bcaId, player);
  logAction("player.created", actorId, player.bcaId);
  return player;
}

export function getPlayerByBcaId(bcaId: string): Player | undefined {
  return players.get(bcaId);
}

function isSquadLocked(matchId: string): boolean {
  const match = matches.get(matchId);
  if (!match) {
    return false;
  }
  return Date.now() >= new Date(match.squadLockAt).getTime();
}

export function updateSquad(
  teamId: string,
  tournamentId: string,
  playerBcaIds: string[],
  actorId: string,
  overrideLock = false
): SquadEntry[] {
  const team = teams.get(teamId);
  if (!team) {
    throw new Error("Team not found");
  }
  if (team.tournamentId !== tournamentId && !hasApprovedTeamApplication(teamId, tournamentId)) {
    throw new Error("Team is not approved for this tournament");
  }
  const tournamentMatches = [...matches.values()].filter((item) => item.tournamentId === tournamentId);
  const locked = tournamentMatches.some((item) => isSquadLocked(item.id));
  if (locked && !overrideLock) {
    throw new Error("Squad is locked (T-30). Use admin override");
  }

  for (const bcaId of playerBcaIds) {
    if (!players.has(bcaId)) {
      throw new Error(`Player not found: ${bcaId}`);
    }
    const duplicate = squads.find(
      (entry) =>
        entry.tournamentId === tournamentId && entry.playerBcaId === bcaId && entry.teamId !== teamId
    );
    if (duplicate) {
      throw new Error(`Player ${bcaId} already assigned to another team in tournament`);
    }
  }

  const remaining = squads.filter((entry) => !(entry.teamId === teamId && entry.tournamentId === tournamentId));
  squads.length = 0;
  squads.push(...remaining, ...playerBcaIds.map((bcaId) => ({ teamId, playerBcaId: bcaId, tournamentId })));
  logAction("squad.updated", actorId, teamId, { tournamentId, playerCount: playerBcaIds.length, overrideLock });
  return squads.filter((entry) => entry.teamId === teamId && entry.tournamentId === tournamentId);
}

export function lockMatchSquad(matchId: string, actorId: string): Match {
  const match = matches.get(matchId);
  if (!match) {
    throw new Error("Match not found");
  }
  match.squadLockAt = nowIso();
  logAction("match.squad.locked", actorId, matchId);
  return match;
}

export function applyToss(matchId: string, tossWinnerTeamId: string, electedTo: "BAT" | "BOWL", actorId: string): Match {
  const match = matches.get(matchId);
  if (!match) {
    throw new Error("Match not found");
  }
  match.tossWinnerTeamId = tossWinnerTeamId;
  match.electedTo = electedTo;
  match.state = "LIVE";
  publishEvent({
    eventVersion: 1,
    name: "match.state_changed",
    occurredAt: nowIso(),
    payload: { matchId, state: match.state, tossWinnerTeamId, electedTo }
  });
  logAction("match.toss.applied", actorId, matchId, { tossWinnerTeamId, electedTo });
  return match;
}

export function addBallEvent(matchId: string, payload: Omit<BallEvent, "id" | "matchId" | "createdAt">): BallEvent {
  const match = matches.get(matchId);
  if (!match) {
    throw new Error("Match not found");
  }
  if (match.state !== "LIVE") {
    throw new Error("Match is not live");
  }
  const event: BallEvent = {
    ...payload,
    id: createId(),
    matchId,
    createdAt: nowIso()
  };
  const bucket = balls.get(matchId) ?? [];
  bucket.push(event);
  balls.set(matchId, bucket);
  publishEvent({
    eventVersion: 1,
    name: "match.ball_recorded",
    occurredAt: nowIso(),
    payload: { matchId, eventId: event.id }
  });
  return event;
}

export function addCommentary(matchId: string, text: string, actorId: string): BallEvent {
  const bucket = balls.get(matchId);
  if (!bucket || bucket.length === 0) {
    throw new Error("No ball exists to attach commentary");
  }
  const latest = bucket[bucket.length - 1];
  latest.commentaryText = text;
  logAction("match.commentary.added", actorId, latest.id);
  return latest;
}

export function requestCorrection(matchId: string, targetEventId: string, reason: string, actorId: string): ScoreCorrection {
  const eventBucket = balls.get(matchId) ?? [];
  const target = eventBucket.find((event) => event.id === targetEventId);
  if (!target) {
    throw new Error("Target ball event not found");
  }
  const correction: ScoreCorrection = {
    id: createId(),
    matchId,
    targetEventId,
    reason,
    requestedBy: actorId
  };
  const list = corrections.get(matchId) ?? [];
  list.push(correction);
  corrections.set(matchId, list);
  logAction("match.correction.requested", actorId, correction.id, { matchId });
  return correction;
}

export function approveCorrection(matchId: string, correctionId: string, actorId: string): ScoreCorrection {
  const list = corrections.get(matchId) ?? [];
  const correction = list.find((item) => item.id === correctionId);
  if (!correction) {
    throw new Error("Correction not found");
  }
  correction.approvedBy = actorId;
  correction.approvedAt = nowIso();
  publishEvent({
    eventVersion: 1,
    name: "match.score_corrected",
    occurredAt: correction.approvedAt,
    payload: { matchId, correctionId: correction.id, targetEventId: correction.targetEventId }
  });
  logAction("match.correction.approved", actorId, correction.id, { matchId });
  return correction;
}

export function completeMatch(matchId: string, actorId: string): Match {
  const match = matches.get(matchId);
  if (!match) {
    throw new Error("Match not found");
  }
  match.state = "COMPLETED";
  if (match.mode === "TOURNAMENT") {
    refreshLeaderboard("global");
  }
  publishEvent({
    eventVersion: 1,
    name: "match.state_changed",
    occurredAt: nowIso(),
    payload: { matchId, state: match.state }
  });
  logAction("match.completed", actorId, matchId);
  return match;
}

export function getScore(matchId: string): { runs: number; wickets: number; balls: number } {
  const bucket = balls.get(matchId) ?? [];
  return {
    runs: bucket.reduce((sum, event) => sum + event.runs, 0),
    wickets: bucket.filter((event) => event.isWicket).length,
    balls: bucket.length
  };
}

export function getWagonWheel(matchId: string): Array<{ zone: string; runs: number; balls: number }> {
  const bucket = balls.get(matchId) ?? [];
  const zoneMap = new Map<string, { zone: string; runs: number; balls: number }>();
  for (const event of bucket) {
    const zone = event.wagonZone ?? "UNKNOWN";
    const existing = zoneMap.get(zone) ?? { zone, runs: 0, balls: 0 };
    existing.runs += event.runs;
    existing.balls += 1;
    zoneMap.set(zone, existing);
  }
  return [...zoneMap.values()].sort((a, b) => b.runs - a.runs);
}

export function getTop10(scope = "global"): LeaderboardSnapshot {
  const existing = leaderboard.get(scope);
  if (existing) {
    return existing;
  }
  return refreshLeaderboard(scope);
}

export function refreshLeaderboard(scope = "global"): LeaderboardSnapshot {
  const aggregated = new Map<string, number>();
  for (const eventList of balls.values()) {
    for (const event of eventList) {
      aggregated.set(event.strikerId, (aggregated.get(event.strikerId) ?? 0) + event.runs);
    }
  }
  const entries = [...aggregated.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([subjectId, value]) => ({
      subjectId,
      label: subjectId,
      value,
      metric: "RUNS" as const
    }));
  const snapshot: LeaderboardSnapshot = {
    id: createId(),
    scope,
    generatedAt: nowIso(),
    entries
  };
  leaderboard.set(scope, snapshot);
  publishEvent({
    eventVersion: 1,
    name: "leaderboard.updated",
    occurredAt: snapshot.generatedAt,
    payload: { scope, snapshotId: snapshot.id }
  });
  return snapshot;
}

export function headToHead(teamAId: string, teamBId: string): { teamAId: string; teamBId: string; winsA: number; winsB: number } {
  let winsA = 0;
  let winsB = 0;
  for (const match of matches.values()) {
    const isPair =
      (match.teamAId === teamAId && match.teamBId === teamBId) ||
      (match.teamAId === teamBId && match.teamBId === teamAId);
    if (!isPair || match.state !== "COMPLETED") {
      continue;
    }
    const score = getScore(match.id);
    if (score.runs % 2 === 0) {
      winsA += 1;
    } else {
      winsB += 1;
    }
  }
  return { teamAId, teamBId, winsA, winsB };
}

export function submitFanVote(matchId: string, playerId: string, voterHash: string): FanVote {
  const key = `${matchId}:${voterHash}`;
  const used = voteDeviceUsage.get(key) ?? 0;
  if (used >= 1) {
    throw new Error("Vote limit reached for this device/user");
  }
  voteDeviceUsage.set(key, used + 1);
  const vote: FanVote = {
    id: createId(),
    matchId,
    playerId,
    voterHash,
    createdAt: nowIso()
  };
  const list = fanVotes.get(matchId) ?? [];
  list.push(vote);
  fanVotes.set(matchId, list);
  publishEvent({
    eventVersion: 1,
    name: "fanvote.updated",
    occurredAt: vote.createdAt,
    payload: { matchId, voteId: vote.id }
  });
  return vote;
}

export function listNews(): NewsPost[] {
  return [...newsPosts].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function addNews(title: string, body: string, actorId: string): NewsPost {
  const post: NewsPost = {
    id: createId(),
    title,
    body,
    publishedAt: nowIso()
  };
  newsPosts.push(post);
  logAction("news.created", actorId, post.id);
  return post;
}

export function getAuditLogs(): AuditLog[] {
  return auditLogs;
}

export function getMatchById(matchId: string): Match | undefined {
  return matches.get(matchId);
}

export function getCorrectionById(matchId: string, correctionId: string): ScoreCorrection | undefined {
  return (corrections.get(matchId) ?? []).find((entry) => entry.id === correctionId);
}

export function getAllCorrections(matchId: string): ScoreCorrection[] {
  return corrections.get(matchId) ?? [];
}

export function getRoleForUser(userId: string): Role {
  const user = users.get(userId);
  if (!user) {
    throw new Error("Unknown user");
  }
  return user.role;
}

export function getDashboardOverview() {
  const tournamentList = listTournaments();
  const matchList = listMatches();
  const teamList = listTeams();
  const teamApplicationList = listTeamApplications();
  const directRequestList = listDirectMatchRequests();
  const latestNews = listNews().slice(0, 5);
  const leaderboardSnapshot = getTop10("global");

  return {
    counts: {
      tournaments: tournamentList.length,
      teams: teamList.length,
      players: players.size,
      matches: matchList.length,
      liveMatches: matchList.filter((match) => match.state === "LIVE").length,
      teamApplications: teamApplicationList.length,
      directMatchRequests: directRequestList.length
    },
    tournaments: tournamentList,
    teams: teamList,
    teamApplications: teamApplicationList,
    directMatchRequests: directRequestList,
    matches: matchList.map((match) => ({
      ...match,
      score: getScore(match.id),
      wagonWheel: getWagonWheel(match.id)
    })),
    leaderboard: leaderboardSnapshot,
    news: latestNews,
    audits: auditLogs.slice(-10).reverse(),
    users: listUsers()
  };
}
