import { publishEvent } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { isStaticExportMode } from "@/lib/runtime-mode";
import {
  getStaticPublicMatchCenterData,
  getStaticPublicMatchDetailData,
  getStaticPublicMatchIds,
  getStaticPublicPlayerIds,
  getStaticPublicPlayerProfileData
} from "@/lib/static-demo-data";
import type { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import type {
  AuditLog,
  BallEvent,
  DirectMatchRequest,
  FanVote,
  LeaderboardSnapshot,
  Match,
  NewsPost,
  Player,
  PointsTableRow,
  Role,
  ScoreCorrection,
  SquadEntry,
  Team,
  TournamentRegistrationRequest,
  TeamTournamentApplication,
  Tournament,
  User
} from "@/types/domain";

function createId(): string {
  return crypto.randomUUID();
}

function createInviteCode(teamName: string): string {
  const prefix = teamName
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, "X");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function mapUser(row: {
  id: string;
  name: string;
  role: Role;
  regionId: string;
  email?: string | null;
  phone?: string | null;
  managedByUserId?: string | null;
  status?: User["status"] | null;
  blockedAt?: Date | string | null;
  blockedReason?: string | null;
}): User {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    regionId: row.regionId,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    managedByUserId: row.managedByUserId ?? undefined,
    status: row.status ?? undefined,
    blockedAt:
      typeof row.blockedAt === "string"
        ? row.blockedAt
        : row.blockedAt instanceof Date
          ? row.blockedAt.toISOString()
          : undefined,
    blockedReason: row.blockedReason ?? undefined
  };
}

function mapTournament(row: {
  id: string;
  name: string;
  regionId: string;
  city: string | null;
  venue: string | null;
  format: string | null;
  overs: number | null;
  ballType: string | null;
  tournamentType: string | null;
  organizerName: string | null;
  organizerPhone: string | null;
  sponsorName: string | null;
  totalTeams: number | null;
  fixtureType: Tournament["fixtureType"] | null;
  pointsWin: number;
  pointsLoss: number;
  pointsDraw: number;
  pointsTie: number;
  startDate: Date | null;
  endDate: Date | null;
  ruleSummary: string | null;
  adminUserId: string | null;
  status: Tournament["status"];
  requestedBy: string;
  approvedBy: string | null;
}): Tournament {
  return {
    id: row.id,
    name: row.name,
    regionId: row.regionId,
    city: row.city ?? undefined,
    venue: row.venue ?? undefined,
    format: row.format ?? undefined,
    overs: row.overs ?? undefined,
    ballType: row.ballType ?? undefined,
    tournamentType: row.tournamentType ?? undefined,
    organizerName: row.organizerName ?? undefined,
    organizerPhone: row.organizerPhone ?? undefined,
    sponsorName: row.sponsorName ?? undefined,
    totalTeams: row.totalTeams ?? undefined,
    fixtureType: row.fixtureType ?? undefined,
    pointsWin: row.pointsWin,
    pointsLoss: row.pointsLoss,
    pointsDraw: row.pointsDraw,
    pointsTie: row.pointsTie,
    startDate: row.startDate?.toISOString(),
    endDate: row.endDate?.toISOString(),
    ruleSummary: row.ruleSummary ?? undefined,
    adminUserId: row.adminUserId ?? undefined,
    status: row.status,
    requestedBy: row.requestedBy,
    approvedBy: row.approvedBy ?? undefined
  };
}

function mapTournamentRegistrationRequest(row: {
  id: string;
  name: string;
  regionId: string;
  city: string;
  venue: string;
  format: string;
  overs: number;
  ballType: string;
  tournamentType: string;
  organizerName: string;
  organizerPhone: string;
  sponsorName: string | null;
  totalTeams: number;
  startDate: Date;
  endDate: Date;
  ruleSummary: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  status: TournamentRegistrationRequest["status"];
  rejectionReason: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
}): TournamentRegistrationRequest {
  return {
    id: row.id,
    name: row.name,
    regionId: row.regionId,
    city: row.city,
    venue: row.venue,
    format: row.format,
    overs: row.overs,
    ballType: row.ballType,
    tournamentType: row.tournamentType,
    organizerName: row.organizerName,
    organizerPhone: row.organizerPhone,
    sponsorName: row.sponsorName ?? undefined,
    totalTeams: row.totalTeams,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    ruleSummary: row.ruleSummary,
    adminName: row.adminName,
    adminEmail: row.adminEmail,
    adminPhone: row.adminPhone,
    status: row.status,
    rejectionReason: row.rejectionReason ?? undefined,
    submittedAt: row.submittedAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString(),
    reviewedBy: row.reviewedBy ?? undefined
  };
}

function mapTeam(row: {
  id: string;
  name: string;
  tournamentId: string | null;
  ownerUserId: string | null;
  description?: string | null;
  city: string | null;
  logoUrl: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  captainName: string | null;
  contactPhone: string | null;
  managerName?: string | null;
  managerPhone?: string | null;
  homeGround?: string | null;
  leagueAffiliation?: string | null;
  inviteCode?: string | null;
  sponsorName: string | null;
}): Team {
  return {
    id: row.id,
    name: row.name,
    tournamentId: row.tournamentId ?? undefined,
    ownerUserId: row.ownerUserId ?? undefined,
    description: row.description ?? undefined,
    city: row.city ?? undefined,
    logoUrl: row.logoUrl ?? undefined,
    ownerName: row.ownerName ?? undefined,
    ownerEmail: row.ownerEmail ?? undefined,
    ownerPhone: row.ownerPhone ?? undefined,
    captainName: row.captainName ?? undefined,
    contactPhone: row.contactPhone ?? undefined,
    managerName: row.managerName ?? undefined,
    managerPhone: row.managerPhone ?? undefined,
    homeGround: row.homeGround ?? undefined,
    leagueAffiliation: row.leagueAffiliation ?? undefined,
    inviteCode: row.inviteCode ?? undefined,
    sponsorName: row.sponsorName ?? undefined
  };
}

function mapPlayer(row: {
  id: string;
  bcaId: string;
  fullName: string;
  phone?: string | null;
  verificationStatus: Player["verificationStatus"];
}): Player {
  return {
    id: row.id,
    bcaId: row.bcaId,
    fullName: row.fullName,
    phone: row.phone ?? undefined,
    verificationStatus: row.verificationStatus
  };
}

function mapMatch(row: {
  id: string;
  tournamentId: string | null;
  teamAId: string;
  teamBId: string;
  venue: string | null;
  startAt: Date;
  scheduledOvers: number | null;
  ballsPerOver: number;
  powerplayOvers: number | null;
  maxOversPerBowler: number | null;
  allowSuperOver: boolean;
  squadLockAt: Date;
  state: Match["state"];
  mode: Match["mode"];
  tossWinnerTeamId: string | null;
  electedTo: Match["electedTo"] | null;
  winnerTeamId: string | null;
  winType: Match["winType"] | null;
  winMarginRuns: number | null;
  winMarginWickets: number | null;
  targetRuns: number | null;
  currentInnings: number;
}): Match {
  return {
    id: row.id,
    tournamentId: row.tournamentId ?? undefined,
    teamAId: row.teamAId,
    teamBId: row.teamBId,
    venue: row.venue ?? undefined,
    startAt: row.startAt.toISOString(),
    scheduledOvers: row.scheduledOvers ?? undefined,
    ballsPerOver: row.ballsPerOver,
    powerplayOvers: row.powerplayOvers ?? undefined,
    maxOversPerBowler: row.maxOversPerBowler ?? undefined,
    allowSuperOver: row.allowSuperOver,
    squadLockAt: row.squadLockAt.toISOString(),
    state: row.state,
    mode: row.mode,
    tossWinnerTeamId: row.tossWinnerTeamId ?? undefined,
    electedTo: row.electedTo ?? undefined,
    winnerTeamId: row.winnerTeamId ?? undefined,
    winType: row.winType ?? undefined,
    winMarginRuns: row.winMarginRuns ?? undefined,
    winMarginWickets: row.winMarginWickets ?? undefined,
    targetRuns: row.targetRuns ?? undefined,
    currentInnings: row.currentInnings
  };
}

function mapBallEvent(row: {
  id: string;
  matchId: string;
  inningsId: string | null;
  over: number;
  ball: number;
  legalBallNumber: number | null;
  strikerId: string;
  nonStrikerId: string | null;
  bowlerId: string;
  runs: number;
  runsBat: number;
  extras: number;
  isWicket: boolean;
  extraType: BallEvent["extraType"] | null;
  wicketType: BallEvent["wicketType"] | null;
  outPlayerId: string | null;
  newBatterId: string | null;
  wagonZone: string | null;
  commentaryText: string | null;
  isUndo: boolean;
  undoOfEventId: string | null;
  createdBy: string;
  createdAt: Date;
}): BallEvent {
  return {
    id: row.id,
    matchId: row.matchId,
    inningsId: row.inningsId ?? undefined,
    over: row.over,
    ball: row.ball,
    legalBallNumber: row.legalBallNumber ?? undefined,
    strikerId: row.strikerId,
    nonStrikerId: row.nonStrikerId ?? undefined,
    bowlerId: row.bowlerId,
    runs: row.runs,
    runsBat: row.runsBat,
    extras: row.extras,
    isWicket: row.isWicket,
    extraType: row.extraType ?? undefined,
    wicketType: row.wicketType ?? undefined,
    outPlayerId: row.outPlayerId ?? undefined,
    newBatterId: row.newBatterId ?? undefined,
    wagonZone: row.wagonZone ?? undefined,
    commentaryText: row.commentaryText ?? undefined,
    isUndo: row.isUndo,
    undoOfEventId: row.undoOfEventId ?? undefined,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString()
  };
}

function mapCorrection(row: {
  id: string;
  matchId: string;
  targetEventId: string;
  reason: string;
  requestedBy: string;
  status: ScoreCorrection["status"] | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date | null;
}): ScoreCorrection {
  return {
    id: row.id,
    matchId: row.matchId,
    targetEventId: row.targetEventId,
    reason: row.reason,
    requestedBy: row.requestedBy,
    status: row.status ?? undefined,
    approvedBy: row.approvedBy ?? undefined,
    approvedAt: row.approvedAt?.toISOString(),
    createdAt: row.createdAt?.toISOString()
  };
}

function mapApplication(row: {
  id: string;
  teamId: string;
  tournamentId: string;
  status: TeamTournamentApplication["status"];
  requestedBy: string;
  reviewedBy: string | null;
  rejectionReason: string | null;
  createdAt: Date;
}): TeamTournamentApplication {
  return {
    id: row.id,
    teamId: row.teamId,
    tournamentId: row.tournamentId,
    status: row.status,
    requestedBy: row.requestedBy,
    reviewedBy: row.reviewedBy ?? undefined,
    rejectionReason: row.rejectionReason ?? undefined,
    createdAt: row.createdAt.toISOString()
  };
}

function mapDirectMatchRequest(row: {
  id: string;
  requesterTeamId: string;
  opponentTeamId: string;
  requestedBy: string;
  format: string;
  venue: string;
  startAt: Date;
  status: DirectMatchRequest["status"];
  createdAt: Date;
}): DirectMatchRequest {
  return {
    id: row.id,
    requesterTeamId: row.requesterTeamId,
    opponentTeamId: row.opponentTeamId,
    requestedBy: row.requestedBy,
    format: row.format,
    venue: row.venue,
    startAt: row.startAt.toISOString(),
    status: row.status,
    createdAt: row.createdAt.toISOString()
  };
}

function mapFanVote(row: {
  id: string;
  matchId: string;
  playerId: string;
  voterHash: string;
  createdAt: Date;
}): FanVote {
  return {
    id: row.id,
    matchId: row.matchId,
    playerId: row.playerId,
    voterHash: row.voterHash,
    createdAt: row.createdAt.toISOString()
  };
}

function mapNewsPost(row: { id: string; title: string; body: string; publishedAt: Date }): NewsPost {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    publishedAt: row.publishedAt.toISOString()
  };
}

function mapAuditLog(row: {
  id: string;
  action: string;
  actorId: string;
  entityId: string;
  metaJson: string | null;
  createdAt: Date;
}): AuditLog {
  return {
    id: row.id,
    action: row.action,
    actorId: row.actorId,
    entityId: row.entityId,
    meta: row.metaJson ? JSON.parse(row.metaJson) : undefined,
    createdAt: row.createdAt.toISOString()
  };
}

function mapPointsTableRow(row: {
  id: string;
  tournamentId: string;
  teamId: string;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  tied: number;
  noResult: number;
  points: number;
  runsFor: number;
  oversFacedBalls: number;
  runsAgainst: number;
  oversBowledBalls: number;
  netRunRate: number;
  position: number | null;
}): PointsTableRow {
  return {
    id: row.id,
    tournamentId: row.tournamentId,
    teamId: row.teamId,
    played: row.played,
    won: row.won,
    lost: row.lost,
    drawn: row.drawn,
    tied: row.tied,
    noResult: row.noResult,
    points: row.points,
    runsFor: row.runsFor,
    oversFacedBalls: row.oversFacedBalls,
    runsAgainst: row.runsAgainst,
    oversBowledBalls: row.oversBowledBalls,
    netRunRate: row.netRunRate,
    position: row.position ?? undefined
  };
}

async function writeAuditLog(action: string, actorId: string, entityId: string, meta?: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: {
      id: createId(),
      action,
      actorId,
      entityId,
      metaJson: meta ? JSON.stringify(meta) : undefined
    }
  });
}

async function nextBcaId(): Promise<string> {
  const players = await prisma.player.findMany({ select: { bcaId: true } });
  const max = players.reduce((current, player) => {
    const serial = Number(player.bcaId.replace("BCA-", ""));
    return Number.isFinite(serial) ? Math.max(current, serial) : current;
  }, 100);
  return `BCA-${max + 1}`;
}

async function getTeamById(teamId: string): Promise<Team | undefined> {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  return team ? mapTeam(team) : undefined;
}

async function getMatchByIdDb(matchId: string): Promise<Match | undefined> {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  return match ? mapMatch(match) : undefined;
}

async function assertTeamOwnership(team: Team, actorId: string): Promise<void> {
  const role = await getDbRoleForUser(actorId);
  if (role === "SUPER_ADMIN" || role === "TOURNAMENT_ADMIN") {
    return;
  }
  if (team.ownerUserId !== actorId) {
    throw new Error("You can only manage your own team profile");
  }
}

function scheduledOversFromFormat(format: string): number {
  const numeric = Number(format.replace(/[^0-9]/g, ""));
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }
  if (format.toLowerCase().includes("one day")) {
    return 50;
  }
  return 20;
}

async function hasApprovedTeamApplicationDb(teamId: string, tournamentId: string): Promise<boolean> {
  const application = await prisma.teamTournamentApplication.findFirst({
    where: {
      teamId,
      tournamentId,
      status: "APPROVED"
    },
    select: { id: true }
  });
  return Boolean(application);
}

async function isSquadLockedDb(matchId: string): Promise<boolean> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { squadLockAt: true }
  });
  if (!match) {
    return false;
  }
  return Date.now() >= match.squadLockAt.getTime();
}

async function ensurePlayerRecord(playerId: string): Promise<void> {
  const existing = await prisma.player.findUnique({
    where: { id: playerId },
    select: { id: true }
  });
  if (existing) {
    return;
  }

  await prisma.player.create({
    data: {
      id: playerId,
      bcaId: await nextBcaId(),
      fullName: playerId.replace(/[-_]/g, " "),
      verificationStatus: "VERIFIED"
    }
  });
}

function resolveBattingOrder(match: {
  teamAId: string;
  teamBId: string;
  tossWinnerTeamId?: string | null;
  electedTo?: Match["electedTo"] | null;
}) {
  const tossWinnerTeamId = match.tossWinnerTeamId ?? match.teamAId;
  const otherTeamId = tossWinnerTeamId === match.teamAId ? match.teamBId : match.teamAId;
  const firstBattingTeamId = match.electedTo === "BOWL" ? otherTeamId : tossWinnerTeamId;
  const firstBowlingTeamId = firstBattingTeamId === match.teamAId ? match.teamBId : match.teamAId;

  return {
    firstBattingTeamId,
    firstBowlingTeamId,
    secondBattingTeamId: firstBowlingTeamId,
    secondBowlingTeamId: firstBattingTeamId
  };
}

async function ensureMatchOrganizerAccessDb(matchId: string | undefined, actorId: string): Promise<Role> {
  const role = await getDbRoleForUser(actorId);
  if (role === "SUPER_ADMIN") {
    return role;
  }
  if (role !== "TOURNAMENT_ADMIN") {
    throw new Error("Only tournament operators can manage scorer assignments.");
  }
  if (!matchId) {
    return role;
  }

  const managedWhere = await getTournamentAdminManagedMatchWhere(actorId);

  const managedMatch = await prisma.match.findFirst({
    where: {
      id: matchId,
      AND: [managedWhere]
    },
    select: {
      id: true
    }
  });

  if (!managedMatch) {
    throw new Error("This tournament admin does not manage the selected match.");
  }

  return role;
}

async function getTournamentAdminManagedMatchWhere(actorId: string): Promise<Prisma.MatchWhereInput> {
  const managedTournamentCount = await prisma.tournament.count({
    where: {
      adminUserId: actorId
    }
  });

  if (managedTournamentCount > 0) {
    return {
      tournament: {
        adminUserId: actorId
      }
    };
  }

  return {
    tournamentId: {
      not: null
    }
  };
}

async function getTournamentAdminManagedTournamentWhere(actorId: string): Promise<Prisma.TournamentWhereInput> {
  const managedTournamentCount = await prisma.tournament.count({
    where: {
      adminUserId: actorId
    }
  });

  if (managedTournamentCount > 0) {
    return {
      adminUserId: actorId
    };
  }

  return {};
}

async function canManageScorerDb(scorerId: string, actorId: string): Promise<boolean> {
  const actorRole = await getDbRoleForUser(actorId);
  if (actorRole === "SUPER_ADMIN") {
    return true;
  }
  if (actorRole !== "TOURNAMENT_ADMIN") {
    return false;
  }

  const scorer = await prisma.user.findUnique({
    where: { id: scorerId },
    select: {
      id: true,
      role: true,
      managedByUserId: true,
      scorerTournamentPools: {
        select: {
          tournament: {
            select: {
              adminUserId: true
            }
          }
        }
      }
    }
  });

  if (!scorer || scorer.role !== "MATCH_SCORER") {
    return false;
  }

  if (scorer.managedByUserId === actorId) {
    return true;
  }

  if (scorer.managedByUserId) {
    return false;
  }

  if (scorer.scorerTournamentPools.some((pool) => pool.tournament.adminUserId === actorId)) {
    return true;
  }

  const managedWhere = await getTournamentAdminManagedMatchWhere(actorId);
  const assignment = await prisma.matchOfficialAssignment.findFirst({
    where: {
      userId: scorerId,
      assignmentRole: "SCORER",
      match: managedWhere
    },
    select: { id: true }
  });

  return Boolean(assignment);
}

async function assertScorerManageableByActorDb(scorerId: string, actorId: string): Promise<void> {
  const allowed = await canManageScorerDb(scorerId, actorId);
  if (!allowed) {
    throw new Error("This scorer is not managed by the current tournament admin.");
  }
}

async function ensureInningsRowDb(matchId: string, inningsNumber: number) {
  const existing = await prisma.matchInnings.findUnique({
    where: {
      matchId_inningsNumber: {
        matchId,
        inningsNumber
      }
    }
  });

  if (existing) {
    return existing;
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      teamAId: true,
      teamBId: true,
      tossWinnerTeamId: true,
      electedTo: true,
      targetRuns: true
    }
  });

  if (!match) {
    throw new Error("Match not found");
  }

  const order = resolveBattingOrder(match);
  const battingTeamId = inningsNumber === 1 ? order.firstBattingTeamId : order.secondBattingTeamId;
  const bowlingTeamId = inningsNumber === 1 ? order.firstBowlingTeamId : order.secondBowlingTeamId;

  return prisma.matchInnings.create({
    data: {
      id: createId(),
      matchId,
      inningsNumber,
      battingTeamId,
      bowlingTeamId,
      target: inningsNumber === 2 ? match.targetRuns ?? undefined : undefined
    }
  });
}

async function getInningsBallWhere(matchId: string, inningsNumber?: number): Promise<Prisma.BallEventWhereInput> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      currentInnings: true
    }
  });

  if (!match) {
    throw new Error("Match not found");
  }

  const resolvedInningsNumber = inningsNumber ?? (match.currentInnings ?? 1);
  const innings = await prisma.matchInnings.findUnique({
    where: {
      matchId_inningsNumber: {
        matchId,
        inningsNumber: resolvedInningsNumber
      }
    },
    select: {
      id: true
    }
  });

  if (innings) {
    if (resolvedInningsNumber === 1) {
      return {
        matchId,
        isUndo: false,
        OR: [{ inningsId: innings.id }, { inningsId: null }]
      };
    }

    return {
      matchId,
      isUndo: false,
      inningsId: innings.id
    };
  }

  if (resolvedInningsNumber === 1) {
    return {
      matchId,
      isUndo: false
    };
  }

  return {
    matchId,
    isUndo: false,
    inningsId: "__no-innings__"
  };
}

async function syncInningsFromEventsDb(inningsId: string) {
  const events = await prisma.ballEvent.findMany({
    where: {
      inningsId,
      isUndo: false
    },
    select: {
      runs: true,
      isWicket: true,
      extraType: true,
      extras: true
    }
  });

  const runs = events.reduce((sum, event) => sum + event.runs, 0);
  const wickets = events.filter((event) => event.isWicket).length;
  const balls = events.filter((event) => event.extraType !== "WD" && event.extraType !== "NB").length;
  const extras = events.reduce((sum, event) => sum + (event.extras ?? 0), 0);
  const byes = events.reduce((sum, event) => sum + (event.extraType === "B" ? event.extras ?? 0 : 0), 0);
  const legByes = events.reduce((sum, event) => sum + (event.extraType === "LB" ? event.extras ?? 0 : 0), 0);
  const wides = events.reduce((sum, event) => sum + (event.extraType === "WD" ? event.extras ?? 0 : 0), 0);
  const noBalls = events.reduce((sum, event) => sum + (event.extraType === "NB" ? event.extras ?? 0 : 0), 0);

  await prisma.matchInnings.update({
    where: { id: inningsId },
    data: {
      runs,
      wickets,
      balls,
      extras,
      byes,
      legByes,
      wides,
      noBalls
    }
  });
}

async function getScoreSummary(
  matchId: string,
  options?: { inningsNumber?: number }
): Promise<{ runs: number; wickets: number; balls: number }> {
  const where = await getInningsBallWhere(matchId, options?.inningsNumber);
  const [ballRows, wicketCount] = await Promise.all([
    prisma.ballEvent.findMany({
      where,
      select: { runs: true, extraType: true }
    }),
    prisma.ballEvent.count({
      where: {
        isWicket: true,
        ...where
      }
    })
  ]);

  return {
    runs: ballRows.reduce((sum, event) => sum + event.runs, 0),
    wickets: wicketCount,
    balls: ballRows.filter((event) => event.extraType !== "WD" && event.extraType !== "NB").length
  };
}

export async function getDbUserById(userId: string): Promise<User | undefined> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ? mapUser(user) : undefined;
}

export async function getDbAuthUserById(userId: string): Promise<
  | {
      id: string;
      name: string;
      email?: string;
      phone?: string;
      passwordHash?: string;
      role: Role;
      regionId: string;
    }
  | undefined
> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      passwordHash: true,
      role: true,
      regionId: true
    }
  });

  if (!user) {
    return undefined;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email ?? undefined,
    phone: user.phone ?? undefined,
    passwordHash: user.passwordHash ?? undefined,
    role: user.role,
    regionId: user.regionId
  };
}

export async function getDbRoleForUser(userId: string): Promise<Role> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  if (!user) {
    throw new Error("Unknown user");
  }
  return user.role;
}

async function ensureMatchScorerAccessDb(matchId: string, actorId: string): Promise<Role> {
  const role = await getDbRoleForUser(actorId);
  if (role === "SUPER_ADMIN" || role === "TOURNAMENT_ADMIN") {
    await ensureMatchOrganizerAccessDb(matchId, actorId);
    return role;
  }

  const assignment = await prisma.matchOfficialAssignment.findUnique({
    where: {
      matchId_userId_assignmentRole: {
        matchId,
        userId: actorId,
        assignmentRole: "SCORER"
      }
    }
  });

  if (!assignment) {
    throw new Error("This scorer is not assigned to the selected match.");
  }

  return role;
}

export async function updateUserRoleDb(userId: string, role: Role, actorId: string): Promise<User> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      role: true,
      regionId: true
    }
  });

  await writeAuditLog("user.role.updated", actorId, userId, { role });
  return mapUser(user);
}

export async function createPublicUserDb(payload: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<User> {
  const normalizedEmail = payload.email.trim().toLowerCase();
  const normalizedPhone = payload.phone.trim();

  const [emailConflict, phoneConflict] = await Promise.all([
    prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true }
    }),
    prisma.user.findFirst({
      where: { phone: normalizedPhone },
      select: { id: true }
    })
  ]);

  if (emailConflict) {
    throw new Error("Email is already registered");
  }

  if (phoneConflict) {
    throw new Error("Phone number is already registered");
  }

  const user = await prisma.user.create({
    data: {
      id: createId(),
      name: payload.name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash: await hash(payload.password, 10),
      role: "PUBLIC_VIEWER",
      regionId: "bela"
    }
  });

  await writeAuditLog("user.public.created", user.id, user.id, {
    email: user.email,
    phone: user.phone
  });

  return mapUser(user);
}

export async function createScorerUserDb(payload: {
  tournamentId: string;
  name: string;
  email: string;
  phone: string;
  password: string;
}, actorId: string): Promise<User> {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: {
      id: true,
      role: true,
      regionId: true
    }
  });

  if (!actor || !["SUPER_ADMIN", "TOURNAMENT_ADMIN"].includes(actor.role)) {
    throw new Error("Only tournament admins or super admins can create scorer accounts.");
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: payload.tournamentId },
    select: {
      id: true,
      adminUserId: true
    }
  });

  if (!tournament) {
    throw new Error("Tournament not found.");
  }

  if (actor.role === "TOURNAMENT_ADMIN" && tournament.adminUserId && tournament.adminUserId !== actorId) {
    throw new Error("This tournament is managed by another tournament admin.");
  }

  const normalizedEmail = payload.email.trim().toLowerCase();
  const normalizedPhone = payload.phone.trim();

  const [emailConflict, phoneConflict] = await Promise.all([
    prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true }
    }),
    prisma.user.findFirst({
      where: { phone: normalizedPhone },
      select: { id: true }
    })
  ]);

  if (emailConflict) {
    throw new Error("Email is already registered");
  }

  if (phoneConflict) {
    throw new Error("Phone number is already registered");
  }

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        id: createId(),
        name: payload.name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash: await hash(payload.password, 10),
        role: "MATCH_SCORER",
        regionId: actor.regionId,
        managedByUserId: actor.role === "TOURNAMENT_ADMIN" ? actorId : undefined
      },
      select: {
        id: true,
        name: true,
        role: true,
        regionId: true,
        email: true,
        phone: true,
        managedByUserId: true,
        status: true
      }
    });

    await tx.tournamentScorerPool.create({
      data: {
        id: createId(),
        tournamentId: payload.tournamentId,
        scorerUserId: created.id
      }
    });

    return created;
  });

  await writeAuditLog("user.scorer.created", actorId, user.id, {
    email: user.email,
    phone: user.phone,
    managedByUserId: user.managedByUserId ?? null,
    tournamentId: payload.tournamentId
  });

  return mapUser(user);
}

export async function updateScorerStatusDb(scorerId: string, status: "ACTIVE" | "BLOCKED", actorId: string): Promise<User> {
  await assertScorerManageableByActorDb(scorerId, actorId);

  const user = await prisma.user.update({
    where: { id: scorerId },
    data: {
      status,
      blockedAt: status === "BLOCKED" ? new Date() : null,
      blockedReason: status === "BLOCKED" ? "Tournament admin action" : null
    },
    select: {
      id: true,
      name: true,
      role: true,
      regionId: true,
      email: true,
      phone: true,
      managedByUserId: true,
      status: true,
      blockedAt: true,
      blockedReason: true
    }
  });

  if (status === "BLOCKED") {
    await prisma.matchOfficialAssignment.deleteMany({
      where: {
        userId: scorerId,
        assignmentRole: "SCORER"
      }
    });
  }

  await writeAuditLog("user.scorer.status.updated", actorId, scorerId, { status });
  return mapUser(user);
}

export async function resetScorerPasswordDb(scorerId: string, password: string, actorId: string): Promise<User> {
  await assertScorerManageableByActorDb(scorerId, actorId);

  const user = await prisma.user.update({
    where: { id: scorerId },
    data: {
      passwordHash: await hash(password, 10)
    },
    select: {
      id: true,
      name: true,
      role: true,
      regionId: true,
      email: true,
      phone: true,
      managedByUserId: true,
      status: true,
      blockedAt: true,
      blockedReason: true
    }
  });

  await writeAuditLog("user.scorer.password.reset", actorId, scorerId);
  return mapUser(user);
}

export async function createTournamentWithAdminDb(
  payload: {
    name: string;
    regionId: string;
    city: string;
    venue: string;
    format: string;
    overs: number;
    ballType: string;
    tournamentType: string;
    organizerName: string;
    organizerPhone: string;
    sponsorName?: string;
    totalTeams: number;
    startDate: string;
    endDate: string;
    ruleSummary: string;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
    adminPassword: string;
  },
  actorId: string
): Promise<{ tournament: Tournament; adminUser: User }> {
  const normalizedEmail = payload.adminEmail.trim().toLowerCase();
  const normalizedPhone = payload.adminPhone.trim();

  const [emailConflict, phoneConflict] = await Promise.all([
    prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true }
    }),
    prisma.user.findFirst({
      where: { phone: normalizedPhone },
      select: { id: true }
    })
  ]);

  if (emailConflict) {
    throw new Error("Tournament admin email is already in use");
  }

  if (phoneConflict) {
    throw new Error("Tournament admin phone is already in use");
  }

  const passwordHash = await hash(payload.adminPassword, 10);

  const { adminUser, tournament } = await prisma.$transaction(async (tx) => {
    const adminUser = await tx.user.create({
      data: {
        id: createId(),
        name: payload.adminName,
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash,
        role: "TOURNAMENT_ADMIN",
        regionId: payload.regionId
      }
    });

    const tournament = await tx.tournament.create({
      data: {
        id: createId(),
        name: payload.name,
        regionId: payload.regionId,
        city: payload.city,
        venue: payload.venue,
        format: payload.format,
        overs: payload.overs,
        ballType: payload.ballType,
        tournamentType: payload.tournamentType,
        organizerName: payload.organizerName,
        organizerPhone: payload.organizerPhone,
        sponsorName: payload.sponsorName || undefined,
        totalTeams: payload.totalTeams,
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        ruleSummary: payload.ruleSummary,
        adminUserId: adminUser.id,
        status: "APPROVED",
        requestedBy: actorId,
        approvedBy: actorId
      }
    });

    return { adminUser, tournament };
  });

  await writeAuditLog("user.tournament_admin.created", actorId, adminUser.id, {
    email: normalizedEmail,
    tournamentName: payload.name
  });
  await writeAuditLog("tournament.created_by_super_admin", actorId, tournament.id, {
    adminUserId: adminUser.id,
    format: payload.format,
    city: payload.city,
    totalTeams: payload.totalTeams
  });

  return {
    tournament: mapTournament(tournament),
    adminUser: mapUser(adminUser)
  };
}

export async function submitTournamentRegistrationRequestDb(payload: {
  name: string;
  regionId: string;
  city: string;
  venue: string;
  format: string;
  overs: number;
  ballType: string;
  tournamentType: string;
  organizerName: string;
  organizerPhone: string;
  sponsorName?: string;
  totalTeams: number;
  startDate: string;
  endDate: string;
  ruleSummary: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminPassword?: string;
  adminPasswordHash?: string;
  requestedBy: string;
}): Promise<TournamentRegistrationRequest> {
  const adminPasswordHash =
    payload.adminPasswordHash ?? (payload.adminPassword ? await hash(payload.adminPassword, 10) : undefined);

  if (!adminPasswordHash) {
    throw new Error("Organizer account password is missing");
  }

  const request = await prisma.tournamentRegistrationRequest.create({
    data: {
      id: createId(),
      name: payload.name,
      regionId: payload.regionId,
      city: payload.city,
      venue: payload.venue,
      format: payload.format,
      overs: payload.overs,
      ballType: payload.ballType,
      tournamentType: payload.tournamentType,
      organizerName: payload.organizerName,
      organizerPhone: payload.organizerPhone,
      sponsorName: payload.sponsorName || undefined,
      totalTeams: payload.totalTeams,
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate),
      ruleSummary: payload.ruleSummary,
      adminName: payload.adminName,
      adminEmail: payload.adminEmail.trim().toLowerCase(),
      adminPhone: payload.adminPhone.trim(),
      adminPasswordHash,
      status: "PENDING"
    }
  });

  await writeAuditLog("tournament.registration.requested", payload.requestedBy, request.id, {
    name: request.name,
    regionId: request.regionId,
    adminEmail: request.adminEmail
  });

  return mapTournamentRegistrationRequest(request);
}

export async function approveTournamentRegistrationRequestDb(
  requestId: string,
  actorId: string
): Promise<{ request: TournamentRegistrationRequest; tournament: Tournament; adminUser: User }> {
  const request = await prisma.tournamentRegistrationRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) {
    throw new Error("Tournament registration request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error("Request is already processed");
  }

  const result = await prisma.$transaction(async (tx) => {
    const [emailMatch, phoneMatch] = await Promise.all([
      tx.user.findFirst({
        where: { email: request.adminEmail }
      }),
      tx.user.findFirst({
        where: { phone: request.adminPhone }
      })
    ]);

    if (emailMatch && phoneMatch && emailMatch.id !== phoneMatch.id) {
      throw new Error("Organizer account details conflict with multiple existing accounts");
    }

    const existingAccount = emailMatch ?? phoneMatch;

    if (
      existingAccount &&
      existingAccount.role !== "PUBLIC_VIEWER" &&
      existingAccount.role !== "TOURNAMENT_ADMIN"
    ) {
      throw new Error("Organizer account already uses another operational role");
    }

    const adminUser = existingAccount
      ? await tx.user.update({
          where: { id: existingAccount.id },
          data: {
            name: request.adminName,
            email: request.adminEmail,
            phone: request.adminPhone,
            passwordHash: request.adminPasswordHash,
            role: "TOURNAMENT_ADMIN",
            regionId: request.regionId,
            status: "ACTIVE",
            blockedAt: null,
            blockedReason: null
          }
        })
      : await tx.user.create({
          data: {
            id: createId(),
            name: request.adminName,
            email: request.adminEmail,
            phone: request.adminPhone,
            passwordHash: request.adminPasswordHash,
            role: "TOURNAMENT_ADMIN",
            regionId: request.regionId
          }
        });

    const tournament = await tx.tournament.create({
      data: {
        id: createId(),
        name: request.name,
        regionId: request.regionId,
        city: request.city,
        venue: request.venue,
        format: request.format,
        overs: request.overs,
        ballType: request.ballType,
        tournamentType: request.tournamentType,
        organizerName: request.organizerName,
        organizerPhone: request.organizerPhone,
        sponsorName: request.sponsorName ?? undefined,
        totalTeams: request.totalTeams,
        startDate: request.startDate,
        endDate: request.endDate,
        ruleSummary: request.ruleSummary,
        adminUserId: adminUser.id,
        status: "APPROVED",
        requestedBy: adminUser.id,
        approvedBy: actorId
      }
    });

    const approvedRequest = await tx.tournamentRegistrationRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedBy: actorId
      }
    });

    return {
      adminUser,
      tournament,
      request: approvedRequest,
      reusedAccount: Boolean(existingAccount)
    };
  });

  await writeAuditLog("tournament.registration.approved", actorId, requestId, {
    tournamentName: result.tournament.name,
    adminEmail: result.adminUser.email,
    reusedAccount: result.reusedAccount
  });

  await writeAuditLog(
    result.reusedAccount ? "user.tournament_admin.promoted_from_request" : "user.tournament_admin.created_from_request",
    actorId,
    result.adminUser.id,
    {
      requestId,
      tournamentName: result.tournament.name
    }
  );

  return {
    request: mapTournamentRegistrationRequest(result.request),
    tournament: mapTournament(result.tournament),
    adminUser: mapUser(result.adminUser)
  };
}

export async function rejectTournamentRegistrationRequestDb(
  requestId: string,
  rejectionReason: string,
  actorId: string
): Promise<TournamentRegistrationRequest> {
  const request = await prisma.tournamentRegistrationRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      rejectionReason,
      reviewedAt: new Date(),
      reviewedBy: actorId
    }
  });

  await writeAuditLog("tournament.registration.rejected", actorId, requestId, { rejectionReason });
  return mapTournamentRegistrationRequest(request);
}

export async function requestTournamentDb(name: string, regionId: string, requestedBy: string): Promise<Tournament> {
  const tournament = await prisma.tournament.create({
    data: {
      id: createId(),
      name,
      regionId,
      status: "PENDING",
      requestedBy
    }
  });
  await writeAuditLog("tournament.requested", requestedBy, tournament.id);
  return mapTournament(tournament);
}

export async function updateTournamentStatusDb(
  id: string,
  status: "APPROVED" | "REJECTED",
  actorId: string
): Promise<Tournament> {
  const tournament = await prisma.tournament.update({
    where: { id },
    data: {
      status,
      approvedBy: status === "APPROVED" ? actorId : null
    }
  });
  await writeAuditLog(`tournament.${status.toLowerCase()}`, actorId, id);
  return mapTournament(tournament);
}

export async function registerTeamDb(
  profile: Pick<
    Team,
    | "name"
    | "city"
    | "description"
    | "ownerName"
    | "ownerEmail"
    | "ownerPhone"
    | "captainName"
    | "contactPhone"
    | "managerName"
    | "managerPhone"
    | "homeGround"
    | "leagueAffiliation"
    | "sponsorName"
    | "logoUrl"
  >,
  actorId: string
): Promise<Team> {
  const inviteCode = createInviteCode(profile.name);
  const team = await prisma.team.create({
    data: {
      id: createId(),
      name: profile.name,
      description: profile.description,
      city: profile.city,
      captainName: profile.captainName,
      contactPhone: profile.contactPhone,
      ownerName: profile.ownerName,
      ownerEmail: profile.ownerEmail,
      ownerPhone: profile.ownerPhone,
      managerName: profile.managerName,
      managerPhone: profile.managerPhone,
      homeGround: profile.homeGround,
      leagueAffiliation: profile.leagueAffiliation,
      sponsorName: profile.sponsorName,
      logoUrl: profile.logoUrl,
      inviteCode,
      ownerUserId: actorId
    }
  });
  await writeAuditLog("team.registered", actorId, team.id);
  return mapTeam(team);
}

export async function applyTeamToTournamentDb(
  teamId: string,
  tournamentId: string,
  actorId: string
): Promise<TeamTournamentApplication> {
  const team = await getTeamById(teamId);
  if (!team) {
    throw new Error("Team not found");
  }
  await assertTeamOwnership(team, actorId);

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) {
    throw new Error("Tournament not found");
  }

  const existing = await prisma.teamTournamentApplication.findFirst({
    where: { teamId, tournamentId }
  });
  if (existing) {
    throw new Error("Team already applied to this tournament");
  }

  const application = await prisma.teamTournamentApplication.create({
    data: {
      id: createId(),
      teamId,
      tournamentId,
      requestedBy: actorId,
      status: "PENDING"
    }
  });
  await writeAuditLog("team.application.requested", actorId, application.id, { teamId, tournamentId });
  return mapApplication(application);
}

export async function reviewTeamApplicationDb(
  applicationId: string,
  status: "APPROVED" | "REJECTED",
  actorId: string,
  rejectionReason?: string
): Promise<TeamTournamentApplication> {
  const application = await prisma.teamTournamentApplication.update({
    where: { id: applicationId },
    data: {
      status,
      reviewedBy: actorId,
      rejectionReason: status === "REJECTED" ? rejectionReason : null
    }
  });
  await writeAuditLog(`team.application.${status.toLowerCase()}`, actorId, application.id, {
    teamId: application.teamId,
    tournamentId: application.tournamentId,
    rejectionReason
  });
  return mapApplication(application);
}

export async function createDirectMatchRequestDb(
  payload: Pick<DirectMatchRequest, "requesterTeamId" | "opponentTeamId" | "format" | "venue" | "startAt">,
  actorId: string
): Promise<DirectMatchRequest> {
  const requesterTeam = await getTeamById(payload.requesterTeamId);
  const opponentTeam = await getTeamById(payload.opponentTeamId);
  if (!requesterTeam || !opponentTeam) {
    throw new Error("Both teams must exist before requesting a direct match");
  }
  await assertTeamOwnership(requesterTeam, actorId);

  const request = await prisma.directMatchRequest.create({
    data: {
      id: createId(),
      requesterTeamId: payload.requesterTeamId,
      opponentTeamId: payload.opponentTeamId,
      requestedBy: actorId,
      format: payload.format,
      venue: payload.venue,
      startAt: new Date(payload.startAt),
      status: "PENDING"
    }
  });
  await writeAuditLog("match.direct.requested", actorId, request.id, payload);
  return mapDirectMatchRequest(request);
}

export async function respondToDirectMatchRequestDb(
  requestId: string,
  payload: {
    action: "ACCEPT" | "REJECT" | "COUNTER";
    format?: string;
    venue?: string;
    startAt?: string;
  },
  actorId: string
): Promise<{ request: DirectMatchRequest; match?: Match }> {
  const requestRow = await prisma.directMatchRequest.findUnique({
    where: { id: requestId },
    include: {
      requesterTeam: { select: { id: true, ownerUserId: true, name: true } },
      opponentTeam: { select: { id: true, ownerUserId: true, name: true } }
    }
  });

  if (!requestRow) {
    throw new Error("Direct match request not found");
  }

  const role = await getDbRoleForUser(actorId);
  const canOverride = role === "SUPER_ADMIN";
  const canReview =
    canOverride ||
    requestRow.opponentTeam.ownerUserId === actorId ||
    (requestRow.requesterTeam.ownerUserId === actorId && requestRow.opponentTeam.ownerUserId === actorId);

  if (!canReview) {
    throw new Error("Only the challenged team can review this request");
  }

  if (requestRow.status !== "PENDING") {
    throw new Error("Only pending direct match requests can be reviewed");
  }

  if (payload.action === "COUNTER") {
    if (!payload.startAt && !payload.venue && !payload.format) {
      throw new Error("Counter offer must change date, venue, or format");
    }

    const updated = await prisma.directMatchRequest.update({
      where: { id: requestId },
      data: {
        requesterTeamId: requestRow.opponentTeamId,
        opponentTeamId: requestRow.requesterTeamId,
        requestedBy: actorId,
        startAt: payload.startAt ? new Date(payload.startAt) : undefined,
        venue: payload.venue ?? undefined,
        format: payload.format ?? undefined
      }
    });

    await writeAuditLog("match.direct.countered", actorId, requestId, {
      requesterTeamId: requestRow.requesterTeamId,
      opponentTeamId: requestRow.opponentTeamId,
      startAt: payload.startAt,
      venue: payload.venue,
      format: payload.format
    });

    return {
      request: mapDirectMatchRequest(updated)
    };
  }

  const updated = await prisma.directMatchRequest.update({
    where: { id: requestId },
    data: {
      status: payload.action === "ACCEPT" ? "ACCEPTED" : "REJECTED"
    }
  });

  let createdMatch: Match | undefined;

  if (payload.action === "ACCEPT") {
    const startAt = updated.startAt;
    const scheduledOvers = scheduledOversFromFormat(updated.format);
    const match = await prisma.match.create({
      data: {
        id: createId(),
        teamAId: updated.requesterTeamId,
        teamBId: updated.opponentTeamId,
        venue: updated.venue,
        startAt,
        scheduledOvers,
        squadLockAt: new Date(startAt.getTime() - 30 * 60 * 1000),
        state: "SCHEDULED",
        mode: "DIRECT"
      }
    });

    createdMatch = mapMatch(match);
  }

  await writeAuditLog(`match.direct.${payload.action.toLowerCase()}`, actorId, requestId, {
    requesterTeamId: requestRow.requesterTeamId,
    opponentTeamId: requestRow.opponentTeamId,
    createdMatchId: createdMatch?.id
  });

  return {
    request: mapDirectMatchRequest(updated),
    match: createdMatch
  };
}

export async function createPlayerDb(fullName: string, actorId: string, phone?: string): Promise<Player> {
  const player = await prisma.player.create({
    data: {
      id: createId(),
      bcaId: await nextBcaId(),
      fullName,
      phone,
      verificationStatus: "VERIFIED"
    }
  });
  await writeAuditLog("player.created", actorId, player.bcaId, { phone });
  return mapPlayer(player);
}

export async function getPlayerByBcaIdDb(bcaId: string): Promise<Player | undefined> {
  const player = await prisma.player.findUnique({ where: { bcaId } });
  return player ? mapPlayer(player) : undefined;
}

export async function updateSquadDb(
  teamId: string,
  tournamentId: string,
  playerBcaIds: string[],
  actorId: string,
  overrideLock = false
): Promise<SquadEntry[]> {
  const team = await getTeamById(teamId);
  if (!team) {
    throw new Error("Team not found");
  }

  await assertTeamOwnership(team, actorId);
  const approved = await hasApprovedTeamApplicationDb(teamId, tournamentId);
  if (team.tournamentId !== tournamentId && !approved) {
    throw new Error("Team is not approved for this tournament");
  }

  const tournamentMatches = await prisma.match.findMany({
    where: { tournamentId },
    select: { id: true }
  });
  if (!overrideLock) {
    for (const match of tournamentMatches) {
      if (await isSquadLockedDb(match.id)) {
        throw new Error("Squad is locked (T-30). Use admin override");
      }
    }
  }

  const players = await prisma.player.findMany({
    where: {
      bcaId: {
        in: playerBcaIds
      }
    }
  });
  if (players.length !== playerBcaIds.length) {
    const found = new Set(players.map((player) => player.bcaId));
    const missing = playerBcaIds.find((bcaId) => !found.has(bcaId));
    throw new Error(`Player not found: ${missing}`);
  }

  const duplicateAssignments = await prisma.squadEntry.findMany({
    where: {
      tournamentId,
      teamId: { not: teamId },
      playerId: {
        in: players.map((player) => player.id)
      }
    },
    include: {
      player: {
        select: { bcaId: true }
      }
    }
  });
  if (duplicateAssignments.length > 0) {
    throw new Error(`Player ${duplicateAssignments[0].player.bcaId} already assigned to another team in tournament`);
  }

  await prisma.$transaction([
    prisma.squadEntry.deleteMany({
      where: {
        teamId,
        tournamentId
      }
    }),
    prisma.squadEntry.createMany({
      data: players.map((player) => ({
        id: createId(),
        teamId,
        playerId: player.id,
        tournamentId
      }))
    })
  ]);

  await writeAuditLog("squad.updated", actorId, teamId, {
    tournamentId,
    playerCount: playerBcaIds.length,
    overrideLock
  });

  return players.map((player) => ({
    teamId,
    tournamentId,
    playerBcaId: player.bcaId
  }));
}

export async function manageTeamRosterDb(
  teamId: string,
  tournamentId: string,
  players: Array<{
    bcaId: string;
    roleTag: string;
    availabilityStatus: string;
    isSubstitute: boolean;
  }>,
  actorId: string,
  overrideLock = false
): Promise<SquadEntry[]> {
  const team = await getTeamById(teamId);
  if (!team) {
    throw new Error("Team not found");
  }

  await assertTeamOwnership(team, actorId);
  const approved = await hasApprovedTeamApplicationDb(teamId, tournamentId);
  if (team.tournamentId !== tournamentId && !approved) {
    throw new Error("Team is not approved for this tournament");
  }

  const tournamentMatches = await prisma.match.findMany({
    where: { tournamentId },
    select: { id: true }
  });
  if (!overrideLock) {
    for (const match of tournamentMatches) {
      if (await isSquadLockedDb(match.id)) {
        throw new Error("Squad is locked (T-30). Use admin override");
      }
    }
  }

  const uniqueBcaIds = [...new Set(players.map((player) => player.bcaId))];
  if (uniqueBcaIds.length !== players.length) {
    throw new Error("Duplicate players are not allowed in the same roster");
  }

  const dbPlayers = await prisma.player.findMany({
    where: {
      bcaId: {
        in: uniqueBcaIds
      }
    }
  });
  if (dbPlayers.length !== uniqueBcaIds.length) {
    const found = new Set(dbPlayers.map((player) => player.bcaId));
    const missing = uniqueBcaIds.find((bcaId) => !found.has(bcaId));
    throw new Error(`Player not found: ${missing}`);
  }

  const duplicateAssignments = await prisma.squadEntry.findMany({
    where: {
      tournamentId,
      teamId: { not: teamId },
      playerId: {
        in: dbPlayers.map((player) => player.id)
      }
    },
    include: {
      player: {
        select: { bcaId: true }
      }
    }
  });
  if (duplicateAssignments.length > 0) {
    throw new Error(`Player ${duplicateAssignments[0].player.bcaId} already assigned to another team in tournament`);
  }

  const dbPlayerByBcaId = new Map(dbPlayers.map((player) => [player.bcaId, player]));

  await prisma.$transaction([
    prisma.squadEntry.deleteMany({
      where: {
        teamId,
        tournamentId
      }
    }),
    prisma.squadEntry.createMany({
      data: players.map((player) => ({
        id: createId(),
        teamId,
        playerId: dbPlayerByBcaId.get(player.bcaId)!.id,
        tournamentId,
        roleTag: player.roleTag,
        availabilityStatus: player.availabilityStatus,
        isSubstitute: player.isSubstitute
      }))
    })
  ]);

  await writeAuditLog("team.roster.updated", actorId, teamId, {
    tournamentId,
    playerCount: players.length,
    substituteCount: players.filter((player) => player.isSubstitute).length,
    overrideLock
  });

  return players.map((player) => ({
    id: undefined,
    teamId,
    playerId: dbPlayerByBcaId.get(player.bcaId)?.id,
    playerBcaId: player.bcaId,
    tournamentId,
    roleTag: player.roleTag,
    availabilityStatus: player.availabilityStatus,
    isSubstitute: player.isSubstitute
  }));
}

export async function getTeamAdminWorkspaceDb(actorId: string) {
  const ownedTeams = await prisma.team.findMany({
    where: { ownerUserId: actorId },
    orderBy: { name: "asc" }
  });

  if (ownedTeams.length === 0) {
    return [];
  }

  const teamIds = ownedTeams.map((team) => team.id);
  const seededTournamentIds = ownedTeams.map((team) => team.tournamentId).filter((value): value is string => Boolean(value));
  const [matches, applications, directRequests, rosterRows, tournaments, approvedTournaments] = await Promise.all([
    prisma.match.findMany({
      where: {
        OR: [{ teamAId: { in: teamIds } }, { teamBId: { in: teamIds } }]
      },
      orderBy: { startAt: "asc" }
    }),
    prisma.teamTournamentApplication.findMany({
      where: { teamId: { in: teamIds } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.directMatchRequest.findMany({
      where: {
        OR: [{ requesterTeamId: { in: teamIds } }, { opponentTeamId: { in: teamIds } }]
      },
      orderBy: { startAt: "asc" }
    }),
    prisma.squadEntry.findMany({
      where: { teamId: { in: teamIds } },
      orderBy: [{ createdAt: "asc" }],
      include: {
        player: true
      }
    }),
    prisma.tournament.findMany({
      where: {
        OR: [{ id: { in: seededTournamentIds } }]
      }
    }),
    prisma.tournament.findMany({
      where: { status: "APPROVED" },
      orderBy: [{ startDate: "asc" }, { name: "asc" }]
    })
  ]);

  const tournamentIds = [
    ...new Set([
      ...seededTournamentIds,
      ...applications.map((application) => application.tournamentId),
      ...rosterRows.map((row) => row.tournamentId)
    ])
  ];
  const extraTournaments =
    tournamentIds.length === 0
      ? []
      : await prisma.tournament.findMany({
          where: {
            id: { in: tournamentIds }
          }
        });
  const allTournaments = [...tournaments, ...extraTournaments, ...approvedTournaments];
  const tournamentById = new Map(allTournaments.map((tournament) => [tournament.id, tournament.name]));
  const relatedTeamIds = [
    ...new Set([
      ...teamIds,
      ...matches.flatMap((match) => [match.teamAId, match.teamBId]),
      ...directRequests.flatMap((request) => [request.requesterTeamId, request.opponentTeamId])
    ])
  ];
  const extraTeams =
    relatedTeamIds.length === 0
      ? []
      : await prisma.team.findMany({
          where: {
            id: { in: relatedTeamIds }
          },
          select: {
            id: true,
            name: true
          }
        });
  const teamNameById = new Map(extraTeams.map((team) => [team.id, team.name]));
  const rosterPlayerIds = [...new Set(rosterRows.map((row) => row.playerId))];
  const matchIds = [...new Set(matches.map((match) => match.id))];
  const [ballEvents, pointsTableRows] = await Promise.all([
    rosterPlayerIds.length === 0 || matchIds.length === 0
      ? Promise.resolve([])
      : prisma.ballEvent.findMany({
          where: {
            matchId: { in: matchIds },
            isUndo: false,
            OR: [{ strikerId: { in: rosterPlayerIds } }, { bowlerId: { in: rosterPlayerIds } }]
          },
          select: {
            matchId: true,
            strikerId: true,
            bowlerId: true,
            runs: true,
            runsBat: true,
            isWicket: true,
            extraType: true
          }
        }),
    tournamentIds.length === 0
      ? Promise.resolve([])
      : prisma.pointsTableRow.findMany({
          where: {
            tournamentId: { in: tournamentIds },
            teamId: { in: teamIds }
          }
        })
  ]);
  const pointsRowByKey = new Map(pointsTableRows.map((row) => [`${row.teamId}:${row.tournamentId}`, row]));
  const playerLineById = new Map<
    string,
    {
      matches: Set<string>;
      runs: number;
      balls: number;
      wickets: number;
      fours: number;
      sixes: number;
    }
  >();

  for (const event of ballEvents) {
    const strikerLine =
      playerLineById.get(event.strikerId) ??
      {
        matches: new Set<string>(),
        runs: 0,
        balls: 0,
        wickets: 0,
        fours: 0,
        sixes: 0
      };

    strikerLine.matches.add(event.matchId);
    strikerLine.runs += event.runsBat ?? event.runs;
    if (event.extraType !== "WD") {
      strikerLine.balls += 1;
    }
    if ((event.runsBat ?? event.runs) === 4) {
      strikerLine.fours += 1;
    }
    if ((event.runsBat ?? event.runs) === 6) {
      strikerLine.sixes += 1;
    }
    playerLineById.set(event.strikerId, strikerLine);

    const bowlerLine =
      playerLineById.get(event.bowlerId) ??
      {
        matches: new Set<string>(),
        runs: 0,
        balls: 0,
        wickets: 0,
        fours: 0,
        sixes: 0
      };
    bowlerLine.matches.add(event.matchId);
    if (event.isWicket) {
      bowlerLine.wickets += 1;
    }
    playerLineById.set(event.bowlerId, bowlerLine);
  }

  return ownedTeams.map((team) => {
    const teamMatches = matches.filter((match) => match.teamAId === team.id || match.teamBId === team.id);
    const teamRoster = rosterRows.filter((row) => row.teamId === team.id);
    const teamApplications = applications.filter((application) => application.teamId === team.id);
    const teamDirectRequests = directRequests.filter((request) => request.requesterTeamId === team.id || request.opponentTeamId === team.id);
    const completedMatches = teamMatches.filter((match) => match.state === "COMPLETED");
    const wins = completedMatches.filter((match) => match.winnerTeamId === team.id).length;
    const incomingChallenges = teamDirectRequests.filter((request) => request.opponentTeamId === team.id);
    const outgoingChallenges = teamDirectRequests.filter((request) => request.requesterTeamId === team.id);
    const pendingIncomingChallenges = incomingChallenges.filter((request) => request.status === "PENDING").length;
    const activeTournamentIds = [
      ...new Set(
        [
          team.tournamentId,
          ...teamApplications.filter((application) => application.status === "APPROVED").map((application) => application.tournamentId)
        ].filter((value): value is string => Boolean(value))
      )
    ];
    const activeTournaments = activeTournamentIds
      .map((tournamentId) => {
        const tournament = allTournaments.find((entry) => entry.id === tournamentId);
        if (!tournament) {
          return null;
        }

        const nextMatch = teamMatches
          .filter((match) => match.tournamentId === tournamentId && match.state !== "COMPLETED")
          .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())[0];
        const pointsRow = pointsRowByKey.get(`${team.id}:${tournamentId}`);

        return {
          id: tournament.id,
          name: tournament.name,
          format: tournament.format ?? undefined,
          city: tournament.city ?? undefined,
          venue: tournament.venue ?? undefined,
          status: "REGISTERED",
          entryFeeStatus: "UNPAID",
          points: pointsRow?.points ?? 0,
          position: pointsRow?.position ?? undefined,
          played: pointsRow?.played ?? 0,
          nextMatchId: nextMatch?.id,
          nextMatchLabel: nextMatch
            ? `${teamNameById.get(nextMatch.teamAId) ?? nextMatch.teamAId} vs ${teamNameById.get(nextMatch.teamBId) ?? nextMatch.teamBId}`
            : undefined,
          nextMatchStartAt: nextMatch?.startAt.toISOString()
        };
      })
      .filter((value): value is NonNullable<typeof value> => Boolean(value));
    const blockedTournamentIds = new Set([...activeTournamentIds, ...teamApplications.map((application) => application.tournamentId)]);
    const openTournaments = approvedTournaments
      .filter((tournament) => !blockedTournamentIds.has(tournament.id))
      .map((tournament) => ({
        id: tournament.id,
        name: tournament.name,
        city: tournament.city ?? undefined,
        format: tournament.format ?? undefined,
        venue: tournament.venue ?? undefined,
        startDate: tournament.startDate?.toISOString(),
        totalTeams: tournament.totalTeams ?? undefined,
        entryFeeStatus: "UNPAID"
      }));

    return {
      team: mapTeam(team),
      stats: {
        matches: teamMatches.length,
        completed: completedMatches.length,
        wins,
        losses: completedMatches.filter((match) => match.winnerTeamId && match.winnerTeamId !== team.id).length,
        live: teamMatches.filter((match) => match.state === "LIVE" || match.state === "INNINGS_BREAK").length,
        upcoming: teamMatches.filter((match) => match.state === "SCHEDULED").length,
        rosterPlayers: teamRoster.length,
        substitutes: teamRoster.filter((row) => row.isSubstitute).length,
        pendingIncomingChallenges
      },
      applications: teamApplications.map((application) => ({
        ...mapApplication(application),
        tournamentName: tournamentById.get(application.tournamentId) ?? application.tournamentId,
        entryFeeStatus: application.status === "APPROVED" ? "UNPAID" : "PENDING"
      })),
      activeTournaments,
      openTournaments,
      teamDirectory: extraTeams
        .filter((candidate) => candidate.id !== team.id)
        .map((candidate) => ({
          id: candidate.id,
          name: candidate.name
        })),
      directRequests: teamDirectRequests.map((request) => ({
        ...mapDirectMatchRequest(request),
        isIncoming: request.opponentTeamId === team.id,
        isOutgoing: request.requesterTeamId === team.id,
        requesterName: teamNameById.get(request.requesterTeamId) ?? request.requesterTeamId,
        opponentName:
          team.id === request.requesterTeamId
            ? teamNameById.get(request.opponentTeamId) ?? request.opponentTeamId
            : teamNameById.get(request.requesterTeamId) ?? request.requesterTeamId
      })),
      challengeCenter: {
        incoming: incomingChallenges.map((request) => ({
          ...mapDirectMatchRequest(request),
          requesterName: teamNameById.get(request.requesterTeamId) ?? request.requesterTeamId,
          opponentName: team.name,
          isIncoming: true,
          isOutgoing: false
        })),
        outgoing: outgoingChallenges.map((request) => ({
          ...mapDirectMatchRequest(request),
          requesterName: team.name,
          opponentName: teamNameById.get(request.opponentTeamId) ?? request.opponentTeamId,
          isIncoming: false,
          isOutgoing: true
        })),
        pendingIncoming: pendingIncomingChallenges
      },
      fixtures: teamMatches.map((match) => ({
        ...mapMatch(match),
        tournamentName: match.tournamentId ? tournamentById.get(match.tournamentId) ?? match.tournamentId : "Direct Match",
        opponentName: team.id === match.teamAId ? teamNameById.get(match.teamBId) ?? match.teamBId : teamNameById.get(match.teamAId) ?? match.teamAId
      })),
      roster: teamRoster.map((row) => ({
        id: row.id,
        playerId: row.playerId,
        playerBcaId: row.player.bcaId,
        fullName: row.player.fullName,
        phone: row.player.phone ?? undefined,
        tournamentId: row.tournamentId,
        tournamentName: tournamentById.get(row.tournamentId) ?? row.tournamentId,
        roleTag: row.roleTag ?? "Squad Player",
        availabilityStatus: row.availabilityStatus ?? "AVAILABLE",
        isSubstitute: row.isSubstitute,
        stats: {
          matches: playerLineById.get(row.playerId)?.matches.size ?? 0,
          runs: playerLineById.get(row.playerId)?.runs ?? 0,
          wickets: playerLineById.get(row.playerId)?.wickets ?? 0,
          strikeRate:
            (playerLineById.get(row.playerId)?.balls ?? 0) > 0
              ? Number((((playerLineById.get(row.playerId)?.runs ?? 0) / (playerLineById.get(row.playerId)?.balls ?? 1)) * 100).toFixed(1))
              : 0
        }
      }))
    };
  });
}

export async function getScorerWorkspaceDb(actorId: string) {
  const role = await getDbRoleForUser(actorId);
  const managedTournamentMatchWhere = role === "TOURNAMENT_ADMIN" ? await getTournamentAdminManagedMatchWhere(actorId) : undefined;
  const assignments =
    role === "SUPER_ADMIN" || role === "TOURNAMENT_ADMIN"
      ? []
      : await prisma.matchOfficialAssignment.findMany({
          where: {
            userId: actorId,
            assignmentRole: "SCORER"
          },
          orderBy: { assignedAt: "desc" }
        });

  const assignedMatchIds = assignments.map((assignment) => assignment.matchId);
  const matches = await prisma.match.findMany({
    where:
      role === "SUPER_ADMIN"
        ? {
            state: {
              in: ["SCHEDULED", "LIVE", "INNINGS_BREAK"]
            }
          }
        : role === "TOURNAMENT_ADMIN"
          ? {
              state: {
                in: ["SCHEDULED", "LIVE", "INNINGS_BREAK"]
              },
              AND: managedTournamentMatchWhere ? [managedTournamentMatchWhere] : []
            }
          : {
              id: {
                in: assignedMatchIds.length > 0 ? assignedMatchIds : ["__no-match__"]
              }
            },
    orderBy: [{ startAt: "asc" }]
  });

  if (matches.length === 0) {
    return [];
  }

  const teamIds = [...new Set(matches.flatMap((match) => [match.teamAId, match.teamBId]))];
  const tournamentIds = [...new Set(matches.map((match) => match.tournamentId).filter((value): value is string => Boolean(value)))];
  const matchIds = matches.map((match) => match.id);

  const [teams, tournaments, squadEntries, lineupEntries, inningsRows, recentEvents] = await Promise.all([
    prisma.team.findMany({
      where: {
        id: { in: teamIds }
      }
    }),
    tournamentIds.length === 0
      ? Promise.resolve([])
      : prisma.tournament.findMany({
          where: {
            id: { in: tournamentIds }
          }
        }),
    prisma.squadEntry.findMany({
      where: {
        teamId: { in: teamIds },
        OR: tournamentIds.length > 0 ? [{ tournamentId: { in: tournamentIds } }] : [{ teamId: { in: teamIds } }]
      },
      include: {
        player: true
      },
      orderBy: [{ createdAt: "asc" }]
    }),
    prisma.matchLineupEntry.findMany({
      where: {
        matchId: { in: matchIds }
      },
      include: {
        player: true
      },
      orderBy: [{ battingOrder: "asc" }, { createdAt: "asc" }]
    }),
    prisma.matchInnings.findMany({
      where: {
        matchId: { in: matchIds }
      },
      select: {
        id: true,
        matchId: true,
        inningsNumber: true
      }
    }),
    prisma.ballEvent.findMany({
      where: {
        matchId: { in: matchIds },
        isUndo: false
      },
      include: {
        striker: { select: { fullName: true } },
        bowler: { select: { fullName: true } }
      },
      orderBy: [{ createdAt: "desc" }],
      take: 120
    })
  ]);

  const teamById = new Map(teams.map((team) => [team.id, team]));
  const tournamentById = new Map(tournaments.map((tournament) => [tournament.id, tournament]));
  const assignmentByMatchId = new Map(assignments.map((assignment) => [assignment.matchId, assignment]));
  const inningsByMatchAndNumber = new Map(inningsRows.map((row) => [`${row.matchId}:${row.inningsNumber}`, row.id]));

  return Promise.all(
    matches.map(async (match) => {
      const score = await getScoreSummary(match.id);
      const mappedMatch = mapMatch(match);
      const matchLineups = lineupEntries.filter((entry) => entry.matchId === match.id);
      const activeInningsId = inningsByMatchAndNumber.get(`${match.id}:${match.currentInnings ?? 1}`);
      const matchEvents = recentEvents
        .filter((event) => {
          if (event.matchId !== match.id) {
            return false;
          }
          if (!activeInningsId) {
            return (match.currentInnings ?? 1) === 1 ? !event.inningsId : false;
          }
          return event.inningsId === activeInningsId || ((match.currentInnings ?? 1) === 1 && !event.inningsId);
        })
        .slice(0, 8)
        .map((event) => ({
          id: event.id,
          overBall: `${event.over}.${event.ball}`,
          summary:
            event.commentaryText ??
            `${event.runs} run${event.runs === 1 ? "" : "s"}${event.isWicket ? " and wicket" : ""}`,
          strikerName: event.striker.fullName,
          bowlerName: event.bowler.fullName
        }));

      const buildTeamSheet = (teamId: string) => {
        const lineupForTeam = matchLineups.filter((entry) => entry.teamId === teamId);
        const squadForTeam = squadEntries.filter(
          (entry) =>
            entry.teamId === teamId &&
            (!match.tournamentId || entry.tournamentId === match.tournamentId)
        );
        const selectedIds = new Set(lineupForTeam.map((entry) => entry.playerId));

        return {
          id: teamId,
          name: teamById.get(teamId)?.name ?? teamId,
          lineupConfirmed: lineupForTeam.length > 0,
          players: squadForTeam.map((entry) => ({
            playerId: entry.playerId,
            name: entry.player.fullName,
            roleTag: entry.roleTag ?? "Squad Player",
            isSubstitute: entry.isSubstitute,
            selected: selectedIds.has(entry.playerId)
          })),
          lineup: lineupForTeam.map((entry) => ({
            playerId: entry.playerId,
            name: entry.player.fullName,
            roleTag: entry.roleTag ?? "Playing XI"
          }))
        };
      };

      const teamA = buildTeamSheet(match.teamAId);
      const teamB = buildTeamSheet(match.teamBId);
      const ballsPerOver = match.ballsPerOver ?? 6;
      const nextLegalBall = score.balls + 1;
      const nextOver = Math.floor(score.balls / ballsPerOver);
      const nextBall = (score.balls % ballsPerOver) + 1;
      const isAssigned = role === "SUPER_ADMIN" || role === "TOURNAMENT_ADMIN" || assignmentByMatchId.has(match.id);

      return {
        match: mappedMatch,
        label: `${teamA.name} vs ${teamB.name}`,
        tournamentName: match.tournamentId ? tournamentById.get(match.tournamentId)?.name ?? "Tournament" : "Direct Match",
        score,
        scoreText: `${score.runs}-${score.wickets} (${toOversLabel(score.balls, ballsPerOver)})`,
        assignmentRole: isAssigned ? "SCORER" : undefined,
        canStartScoring: isAssigned && match.state !== "COMPLETED" && match.state !== "ABANDONED" && match.state !== "CANCELLED",
        needsToss: !match.tossWinnerTeamId,
        hasLineups: teamA.lineupConfirmed && teamB.lineupConfirmed,
        teamA,
        teamB,
        nextBallContext: {
          inningsNumber: match.currentInnings,
          legalBallNumber: nextLegalBall,
          over: nextOver,
          ball: nextBall
        },
        recentEvents: matchEvents
      };
    })
  );
}

export async function getScorerAssignmentWorkspaceDb(actorId: string) {
  await ensureMatchOrganizerAccessDb(undefined, actorId);
  const role = await getDbRoleForUser(actorId);
  const managedTournamentMatchWhere = role === "TOURNAMENT_ADMIN" ? await getTournamentAdminManagedMatchWhere(actorId) : undefined;
  const managedTournamentWhere = role === "TOURNAMENT_ADMIN" ? await getTournamentAdminManagedTournamentWhere(actorId) : undefined;
  const [matches, teams, tournaments] = await Promise.all([
    prisma.match.findMany({
      where:
        role === "SUPER_ADMIN"
          ? {
              state: {
                in: ["SCHEDULED", "LIVE", "INNINGS_BREAK"]
              }
            }
          : {
              state: {
                in: ["SCHEDULED", "LIVE", "INNINGS_BREAK"]
              },
              AND: managedTournamentMatchWhere ? [managedTournamentMatchWhere] : []
            },
      orderBy: [{ startAt: "asc" }]
    }),
    prisma.team.findMany({
      select: {
        id: true,
        name: true
      }
    }),
    prisma.tournament.findMany({
      where: role === "SUPER_ADMIN" ? undefined : managedTournamentWhere,
      select: {
        id: true,
        name: true,
        venue: true
      },
      orderBy: [{ startDate: "asc" }, { name: "asc" }]
    })
  ]);

  const accessibleMatchIds = matches.map((match) => match.id);
  const accessibleTournamentIds = tournaments.map((tournament) => tournament.id);

  const [scorers, scorerDirectory, assignments] = await Promise.all([
    prisma.user.findMany({
      where:
        role === "SUPER_ADMIN"
          ? {
              role: "MATCH_SCORER",
              status: "ACTIVE"
            }
          : {
              role: "MATCH_SCORER",
              status: "ACTIVE",
              OR: [
                {
                  managedByUserId: actorId
                },
                {
                  managedByUserId: null,
                  scorerTournamentPools: {
                    some: {
                      tournamentId: {
                        in: accessibleTournamentIds.length > 0 ? accessibleTournamentIds : ["__no-tournament__"]
                      }
                    }
                  }
                },
                {
                  managedByUserId: null,
                  matchAssignments: {
                    some: {
                      assignmentRole: "SCORER",
                      matchId: {
                        in: accessibleMatchIds.length > 0 ? accessibleMatchIds : ["__no-match__"]
                      }
                    }
                  }
                }
              ]
            },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        scorerTournamentPools: {
          where:
            role === "SUPER_ADMIN"
              ? undefined
              : {
                  tournamentId: {
                    in: accessibleTournamentIds.length > 0 ? accessibleTournamentIds : ["__no-tournament__"]
                  }
                },
          select: {
            tournamentId: true,
            tournament: {
              select: {
                id: true,
                name: true,
                venue: true
              }
            }
          }
        }
      }
    }),
    prisma.user.findMany({
      where:
        role === "SUPER_ADMIN"
          ? {
              role: "MATCH_SCORER"
            }
          : {
              role: "MATCH_SCORER",
              OR: [
                {
                  managedByUserId: actorId
                },
                {
                  managedByUserId: null,
                  scorerTournamentPools: {
                    some: {
                      tournamentId: {
                        in: accessibleTournamentIds.length > 0 ? accessibleTournamentIds : ["__no-tournament__"]
                      }
                    }
                  }
                },
                {
                  managedByUserId: null,
                  matchAssignments: {
                    some: {
                      assignmentRole: "SCORER",
                      matchId: {
                        in: accessibleMatchIds.length > 0 ? accessibleMatchIds : ["__no-match__"]
                      }
                    }
                  }
                }
              ]
            },
      orderBy: [{ status: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        managedByUserId: true,
        scorerTournamentPools: {
          where:
            role === "SUPER_ADMIN"
              ? undefined
              : {
                  tournamentId: {
                    in: accessibleTournamentIds.length > 0 ? accessibleTournamentIds : ["__no-tournament__"]
                  }
                },
          select: {
            tournamentId: true,
            tournament: {
              select: {
                id: true,
                name: true,
                venue: true
              }
            }
          }
        }
      }
    }),
    prisma.matchOfficialAssignment.findMany({
      where: {
        assignmentRole: "SCORER",
        matchId: {
          in: accessibleMatchIds.length > 0 ? accessibleMatchIds : ["__no-match__"]
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
  ]);

  const teamNameById = new Map(teams.map((team) => [team.id, team.name]));
  const tournamentNameById = new Map(tournaments.map((tournament) => [tournament.id, tournament.name]));
  const assignmentByMatchId = new Map(assignments.map((assignment) => [assignment.matchId, assignment]));
  const matchById = new Map(matches.map((match) => [match.id, match]));

  const scorerDirectoryRows = scorerDirectory.map((scorer) => {
    const scorerAssignments = assignments
      .filter((assignment) => assignment.userId === scorer.id)
      .map((assignment) => {
        const match = matchById.get(assignment.matchId);
        return {
          matchId: assignment.matchId,
          label:
            match
              ? `${teamNameById.get(match.teamAId) ?? match.teamAId} vs ${teamNameById.get(match.teamBId) ?? match.teamBId}`
              : assignment.matchId,
          tournamentName:
            match?.tournamentId ? tournamentNameById.get(match.tournamentId) ?? "Tournament" : "Direct Match",
          venue: match?.venue ?? "Venue pending",
          state: match?.state ?? "SCHEDULED"
        };
      });
    const poolTournaments = scorer.scorerTournamentPools.map((pool) => ({
      id: pool.tournamentId,
      name: pool.tournament.name,
      venue: pool.tournament.venue ?? "Venue pending"
    }));
    const tournamentGroups = [...new Set([...poolTournaments.map((pool) => pool.name), ...scorerAssignments.map((assignment) => assignment.tournamentName)])];
    const venueGroups = [...new Set([...poolTournaments.map((pool) => pool.venue), ...scorerAssignments.map((assignment) => assignment.venue)])];

    return {
      id: scorer.id,
      name: scorer.name,
      email: scorer.email ?? null,
      phone: scorer.phone ?? null,
      status: scorer.status,
      managedByCurrentAdmin:
        role === "SUPER_ADMIN"
          ? true
          : scorer.managedByUserId && scorer.managedByUserId !== actorId
            ? false
            : scorer.managedByUserId === actorId ||
              scorer.scorerTournamentPools.length > 0 ||
              (scorer.managedByUserId === null && scorerAssignments.length > 0),
      assignments: scorerAssignments,
      tournamentGroups: tournamentGroups.length > 0 ? tournamentGroups : ["Unassigned Pool"],
      venueGroups: venueGroups.length > 0 ? venueGroups : ["Unassigned Pool"],
      poolTournaments
    };
  });

  return {
    scorers: scorers.map((scorer) => ({
      id: scorer.id,
      name: scorer.name,
      email: scorer.email ?? null,
      tournamentPoolIds: scorer.scorerTournamentPools.map((pool) => pool.tournamentId)
    })),
    scorerDirectory: scorerDirectoryRows,
    tournaments: tournaments.map((tournament) => ({
      id: tournament.id,
      name: tournament.name,
      venue: tournament.venue ?? null
    })),
    matches: matches.map((match) => {
      const assignment = assignmentByMatchId.get(match.id);
      return {
        id: match.id,
        tournamentId: match.tournamentId ?? null,
        label: `${teamNameById.get(match.teamAId) ?? match.teamAId} vs ${teamNameById.get(match.teamBId) ?? match.teamBId}`,
        tournamentName: match.tournamentId ? tournamentNameById.get(match.tournamentId) ?? "Tournament" : "Direct Match",
        state: match.state,
        venue: match.venue ?? undefined,
        startAt: match.startAt.toISOString(),
        scorerUserId: assignment?.userId,
        scorerName: assignment?.user.name,
        scorerEmail: assignment?.user.email ?? undefined
      };
    })
  };
}

export async function assignMatchScorerDb(matchId: string, scorerUserId: string | null, actorId: string) {
  await ensureMatchOrganizerAccessDb(matchId, actorId);
  const actorRole = await getDbRoleForUser(actorId);
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      tournamentId: true
    }
  });

  if (!match) {
    throw new Error("Match not found.");
  }

  if (scorerUserId) {
    const scorer = await prisma.user.findUnique({
      where: { id: scorerUserId },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        status: true,
        managedByUserId: true,
        scorerTournamentPools: {
          select: {
            tournamentId: true
          }
        }
      }
    });

    if (!scorer || scorer.role !== "MATCH_SCORER" || scorer.status !== "ACTIVE") {
      throw new Error("Selected user is not an active scorer.");
    }
    if (actorRole === "TOURNAMENT_ADMIN" && scorer.managedByUserId && scorer.managedByUserId !== actorId) {
      throw new Error("This scorer is managed by another tournament admin.");
    }
    if (
      match.tournamentId &&
      !scorer.scorerTournamentPools.some((pool) => pool.tournamentId === match.tournamentId)
    ) {
      throw new Error("This scorer is not in the selected tournament pool.");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.matchOfficialAssignment.deleteMany({
      where: {
        matchId,
        assignmentRole: "SCORER"
      }
    });

    if (scorerUserId) {
      await tx.matchOfficialAssignment.create({
        data: {
          id: createId(),
          matchId,
          userId: scorerUserId,
          assignmentRole: "SCORER",
          assignedBy: actorId
        }
      });
    }
  });

  await writeAuditLog("match.scorer.assigned", actorId, matchId, {
    scorerUserId: scorerUserId ?? null
  });

  return prisma.matchOfficialAssignment.findFirst({
    where: {
      matchId,
      assignmentRole: "SCORER"
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}

export async function startSecondInningsDb(matchId: string, targetRuns: number | undefined, actorId: string) {
  await ensureMatchScorerAccessDb(matchId, actorId);
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      teamAId: true,
      teamBId: true,
      tossWinnerTeamId: true,
      electedTo: true,
      currentInnings: true,
      targetRuns: true,
      state: true
    }
  });

  if (!match) {
    throw new Error("Match not found");
  }
  if (!match.tossWinnerTeamId || !match.electedTo) {
    throw new Error("Set the toss before switching innings.");
  }
  if (match.currentInnings >= 2) {
    throw new Error("Second innings has already started.");
  }

  const firstInnings = await ensureInningsRowDb(matchId, 1);
  await prisma.ballEvent.updateMany({
    where: {
      matchId,
      inningsId: null,
      isUndo: false
    },
    data: {
      inningsId: firstInnings.id
    }
  });
  await syncInningsFromEventsDb(firstInnings.id);

  const firstInningsScore = await getScoreSummary(matchId, { inningsNumber: 1 });
  const resolvedTarget = Math.max(targetRuns ?? firstInningsScore.runs + 1, firstInningsScore.runs + 1);

  await prisma.matchInnings.update({
    where: {
      matchId_inningsNumber: {
        matchId,
        inningsNumber: 1
      }
    },
    data: {
      runs: firstInningsScore.runs,
      wickets: firstInningsScore.wickets,
      balls: firstInningsScore.balls,
      isCompleted: true,
      endedAt: new Date()
    }
  });

  const secondInnings = await ensureInningsRowDb(matchId, 2);
  await prisma.matchInnings.update({
    where: { id: secondInnings.id },
    data: {
      target: resolvedTarget,
      isCompleted: false,
      endedAt: null
    }
  });

  const updatedMatch = await prisma.match.update({
    where: { id: matchId },
    data: {
      currentInnings: 2,
      targetRuns: resolvedTarget,
      state: "LIVE"
    }
  });

  publishEvent({
    eventVersion: 1,
    name: "match.state_changed",
    occurredAt: nowIso(),
    payload: {
      matchId,
      state: "LIVE",
      inningsNumber: 2,
      targetRuns: resolvedTarget,
      headline: `Second innings started. Target is ${resolvedTarget}.`
    }
  });

  await writeAuditLog("match.second_innings.started", actorId, matchId, {
    targetRuns: resolvedTarget
  });

  return {
    match: mapMatch(updatedMatch),
    score: await getScoreSummary(matchId),
    targetRuns: resolvedTarget
  };
}

export async function undoLastBallDb(matchId: string, reason: string, actorId: string) {
  await ensureMatchScorerAccessDb(matchId, actorId);
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      currentInnings: true
    }
  });

  if (!match) {
    throw new Error("Match not found");
  }

  const where = await getInningsBallWhere(matchId, match.currentInnings ?? 1);
  const latestBall = await prisma.ballEvent.findFirst({
    where,
    orderBy: [{ createdAt: "desc" }, { over: "desc" }, { ball: "desc" }]
  });

  if (!latestBall) {
    throw new Error("No ball is available to undo.");
  }

  const correction = await prisma.scoreCorrection.create({
    data: {
      id: createId(),
      matchId,
      targetEventId: latestBall.id,
      reason,
      requestedBy: actorId,
      status: "APPROVED",
      approvedBy: actorId,
      approvedAt: new Date()
    }
  });

  await prisma.ballEvent.update({
    where: { id: latestBall.id },
    data: {
      isUndo: true,
      undoOfEventId: latestBall.id
    }
  });

  if (latestBall.inningsId) {
    await syncInningsFromEventsDb(latestBall.inningsId);
  }

  publishEvent({
    eventVersion: 1,
    name: "match.score_corrected",
    occurredAt: correction.approvedAt?.toISOString() ?? nowIso(),
    payload: {
      matchId,
      correctionId: correction.id,
      targetEventId: latestBall.id,
      headline: `Last ball ${latestBall.over}.${latestBall.ball} has been removed from the scoring sheet.`
    }
  });

  await writeAuditLog("match.ball.undone", actorId, latestBall.id, {
    matchId,
    correctionId: correction.id,
    reason
  });

  return {
    correction: mapCorrection(correction),
    undoneEventId: latestBall.id,
    score: await getScoreSummary(matchId)
  };
}

export async function lockMatchSquadDb(matchId: string, actorId: string): Promise<Match> {
  const match = await prisma.match.update({
    where: { id: matchId },
    data: {
      squadLockAt: new Date()
    }
  });
  await writeAuditLog("match.squad.locked", actorId, matchId);
  return mapMatch(match);
}

export async function submitMatchLineupDb(matchId: string, teamId: string, playerIds: string[], actorId: string) {
  await ensureMatchScorerAccessDb(matchId, actorId);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      teamAId: true,
      teamBId: true,
      tournamentId: true
    }
  });

  if (!match) {
    throw new Error("Match not found");
  }

  if (![match.teamAId, match.teamBId].includes(teamId)) {
    throw new Error("Selected team is not part of this match.");
  }

  const squadEntries = await prisma.squadEntry.findMany({
    where: match.tournamentId
      ? {
          teamId,
          tournamentId: match.tournamentId
        }
      : {
          teamId
        },
    include: {
      player: {
        select: {
          id: true,
          fullName: true
        }
      }
    },
    orderBy: [{ createdAt: "asc" }]
  });

  if (squadEntries.length === 0) {
    throw new Error("No squad is linked to this team for lineup confirmation.");
  }

  const uniquePlayerIds = [...new Set(playerIds)];
  const availablePlayerIds = new Set(squadEntries.map((entry) => entry.playerId));
  const invalidPlayerId = uniquePlayerIds.find((playerId) => !availablePlayerIds.has(playerId));
  if (invalidPlayerId) {
    throw new Error("One or more selected players are not in the registered squad.");
  }

  const requiredCount = squadEntries.length >= 11 ? 11 : squadEntries.length;
  if (uniquePlayerIds.length !== requiredCount) {
    throw new Error(`Select ${requiredCount} players to confirm the lineup.`);
  }

  const selectedEntries = squadEntries.filter((entry) => uniquePlayerIds.includes(entry.playerId));
  await prisma.$transaction([
    prisma.matchLineupEntry.deleteMany({
      where: { matchId, teamId }
    }),
    prisma.matchLineupEntry.createMany({
      data: selectedEntries.map((entry, index) => ({
        id: createId(),
        matchId,
        teamId,
        playerId: entry.playerId,
        roleTag: entry.roleTag ?? undefined,
        battingOrder: index + 1,
        isCaptain: Boolean(entry.roleTag?.includes("Captain") && !entry.roleTag?.includes("Vice-Captain")),
        isViceCaptain: Boolean(entry.roleTag?.includes("Vice-Captain")),
        isWicketkeeper: Boolean(entry.roleTag?.toLowerCase().includes("wicket")),
        isSubstitute: entry.isSubstitute
      }))
    })
  ]);

  await writeAuditLog("match.lineup.confirmed", actorId, matchId, {
    teamId,
    playerCount: uniquePlayerIds.length
  });

  return selectedEntries.map((entry, index) => ({
    id: `${matchId}:${teamId}:${entry.playerId}`,
    matchId,
    teamId,
    playerId: entry.playerId,
    roleTag: entry.roleTag ?? undefined,
    battingOrder: index + 1,
    isCaptain: Boolean(entry.roleTag?.includes("Captain") && !entry.roleTag?.includes("Vice-Captain")),
    isViceCaptain: Boolean(entry.roleTag?.includes("Vice-Captain")),
    isWicketkeeper: Boolean(entry.roleTag?.toLowerCase().includes("wicket")),
    isSubstitute: entry.isSubstitute,
    createdAt: nowIso()
  }));
}

export async function applyTossDb(
  matchId: string,
  tossWinnerTeamId: string,
  electedTo: "BAT" | "BOWL",
  actorId: string
): Promise<Match> {
  await ensureMatchScorerAccessDb(matchId, actorId);
  const match = await prisma.match.update({
    where: { id: matchId },
    data: {
      tossWinnerTeamId,
      electedTo,
      state: "LIVE"
    }
  });
  const teams = await prisma.team.findMany({
    where: {
      id: {
        in: [match.teamAId, match.teamBId, tossWinnerTeamId]
      }
    },
    select: {
      id: true,
      name: true
    }
  });
  const teamNameById = new Map(teams.map((team) => [team.id, team.name]));

  publishEvent({
    eventVersion: 1,
    name: "match.state_changed",
    occurredAt: nowIso(),
    payload: {
      matchId,
      state: "LIVE",
      tossWinnerTeamId,
      tossWinnerTeamName: teamNameById.get(tossWinnerTeamId) ?? tossWinnerTeamId,
      electedTo,
      headline: `${teamNameById.get(tossWinnerTeamId) ?? tossWinnerTeamId} won the toss and chose to ${electedTo.toLowerCase()}.`
    }
  });

  await writeAuditLog("match.toss.applied", actorId, matchId, {
    tossWinnerTeamId,
    electedTo
  });

  await ensureInningsRowDb(matchId, 1);

  return mapMatch(match);
}

export async function addBallEventDb(
  matchId: string,
  payload: Omit<BallEvent, "id" | "matchId" | "createdAt">
): Promise<BallEvent> {
  await ensureMatchScorerAccessDb(matchId, payload.createdBy);
  const match = await getMatchByIdDb(matchId);
  if (!match) {
    throw new Error("Match not found");
  }
  if (match.state !== "LIVE") {
    throw new Error("Match is not live");
  }

  await ensurePlayerRecord(payload.strikerId);
  await ensurePlayerRecord(payload.bowlerId);
  if (payload.nonStrikerId) {
    await ensurePlayerRecord(payload.nonStrikerId);
  }
  if (payload.outPlayerId) {
    await ensurePlayerRecord(payload.outPlayerId);
  }
  if (payload.newBatterId) {
    await ensurePlayerRecord(payload.newBatterId);
  }

  const inningsRow =
    payload.inningsId
      ? await prisma.matchInnings.findUnique({
          where: { id: payload.inningsId }
        })
      : await ensureInningsRowDb(matchId, match.currentInnings ?? 1);

  const event = await prisma.ballEvent.create({
    data: {
      id: createId(),
      matchId,
      inningsId: inningsRow?.id,
      over: payload.over,
      ball: payload.ball,
      legalBallNumber: payload.legalBallNumber,
      strikerId: payload.strikerId,
      nonStrikerId: payload.nonStrikerId,
      bowlerId: payload.bowlerId,
      runs: payload.runs,
      runsBat: payload.runsBat ?? (payload.extraType === "WD" ? 0 : payload.runs),
      extras: payload.extras ?? (payload.extraType ? payload.runs - (payload.runsBat ?? 0) : 0),
      isWicket: payload.isWicket,
      extraType: payload.extraType,
      wicketType: payload.wicketType,
      outPlayerId: payload.outPlayerId,
      newBatterId: payload.newBatterId,
      wagonZone: payload.wagonZone,
      commentaryText: payload.commentaryText,
      isUndo: payload.isUndo ?? false,
      undoOfEventId: payload.undoOfEventId,
      createdBy: payload.createdBy
    }
  });
  if (inningsRow?.id) {
    await syncInningsFromEventsDb(inningsRow.id);
  }
  const [scoreAfterBall, playerRows] = await Promise.all([
    getScoreSummary(matchId),
    prisma.player.findMany({
      where: {
        id: {
          in: [payload.strikerId, payload.bowlerId]
        }
      },
      select: {
        id: true,
        fullName: true
      }
    })
  ]);
  const playerNameById = new Map(playerRows.map((player) => [player.id, player.fullName]));
  const milestone = [50, 100, 150, 200].find(
    (entry) => scoreAfterBall.runs >= entry && scoreAfterBall.runs - payload.runs < entry
  );

  publishEvent({
    eventVersion: 1,
    name: "match.ball_recorded",
    occurredAt: event.createdAt.toISOString(),
      payload: {
        matchId,
        eventId: event.id,
        overBall: `${payload.over}.${payload.ball}`,
        runs: payload.runs,
        runsBat: payload.runsBat ?? (payload.extraType === "WD" ? 0 : payload.runs),
        extras: payload.extras ?? (payload.extraType ? payload.runs - (payload.runsBat ?? 0) : 0),
        isWicket: payload.isWicket,
        strikerId: payload.strikerId,
        strikerName: playerNameById.get(payload.strikerId) ?? payload.strikerId,
        bowlerId: payload.bowlerId,
      bowlerName: playerNameById.get(payload.bowlerId) ?? payload.bowlerId,
      scoreText: `${scoreAfterBall.runs}-${scoreAfterBall.wickets} (${toOversLabel(scoreAfterBall.balls, match.ballsPerOver ?? 6)})`,
      commentaryText:
        payload.commentaryText ??
        `${payload.runs} run${payload.runs === 1 ? "" : "s"}${payload.isWicket ? " and a wicket" : ""}`,
      milestone
    }
  });

  return mapBallEvent(event);
}

export async function addCommentaryDb(matchId: string, text: string, actorId: string): Promise<BallEvent> {
  await ensureMatchScorerAccessDb(matchId, actorId);
  const latest = await prisma.ballEvent.findFirst({
    where: { matchId },
    orderBy: [{ over: "desc" }, { ball: "desc" }, { createdAt: "desc" }]
  });
  if (!latest) {
    throw new Error("No ball exists to attach commentary");
  }

  const updated = await prisma.ballEvent.update({
    where: { id: latest.id },
    data: {
      commentaryText: text
    }
  });

  await writeAuditLog("match.commentary.added", actorId, updated.id);
  return mapBallEvent(updated);
}

export async function requestCorrectionDb(
  matchId: string,
  targetEventId: string,
  reason: string,
  actorId: string
): Promise<ScoreCorrection> {
  const target = await prisma.ballEvent.findFirst({
    where: {
      id: targetEventId,
      matchId
    },
    select: { id: true }
  });
  if (!target) {
    throw new Error("Target ball event not found");
  }

  const correction = await prisma.scoreCorrection.create({
    data: {
      id: createId(),
      matchId,
      targetEventId,
      reason,
      requestedBy: actorId
    }
  });

  await writeAuditLog("match.correction.requested", actorId, correction.id, { matchId });
  return mapCorrection(correction);
}

export async function approveCorrectionDb(
  matchId: string,
  correctionId: string,
  actorId: string
): Promise<ScoreCorrection> {
  const existing = await prisma.scoreCorrection.findFirst({
    where: {
      id: correctionId,
      matchId
    }
  });
  if (!existing) {
    throw new Error("Correction not found");
  }

  const correction = await prisma.scoreCorrection.update({
    where: { id: correctionId },
    data: {
      status: "APPROVED",
      approvedBy: actorId,
      approvedAt: new Date()
    }
  });

  publishEvent({
    eventVersion: 1,
    name: "match.score_corrected",
    occurredAt: correction.approvedAt?.toISOString() ?? nowIso(),
    payload: { matchId, correctionId: correction.id, targetEventId: correction.targetEventId }
  });

  await writeAuditLog("match.correction.approved", actorId, correction.id, { matchId });
  return mapCorrection(correction);
}

export async function completeMatchDb(matchId: string, actorId: string): Promise<Match> {
  const match = await prisma.match.update({
    where: { id: matchId },
    data: { state: "COMPLETED" }
  });
  const teams = await prisma.team.findMany({
    where: {
      id: {
        in: [match.teamAId, match.teamBId, match.winnerTeamId].filter((value): value is string => Boolean(value))
      }
    },
    select: {
      id: true,
      name: true
    }
  });
  const teamNameById = new Map(teams.map((team) => [team.id, team.name]));

  if (match.mode === "TOURNAMENT") {
    await refreshLeaderboardDb("global");
  }

  publishEvent({
    eventVersion: 1,
    name: "match.state_changed",
    occurredAt: nowIso(),
    payload: {
      matchId,
      state: "COMPLETED",
      winnerTeamId: match.winnerTeamId,
      winnerTeamName: match.winnerTeamId ? teamNameById.get(match.winnerTeamId) ?? match.winnerTeamId : undefined,
      headline: match.winnerTeamId
        ? `${teamNameById.get(match.winnerTeamId) ?? match.winnerTeamId} won the match.`
        : "Match result has been recorded."
    }
  });

  await writeAuditLog("match.completed", actorId, matchId);
  return mapMatch(match);
}

export async function getScoreDb(matchId: string): Promise<{ runs: number; wickets: number; balls: number }> {
  return getScoreSummary(matchId);
}

export async function getWagonWheelDb(matchId: string): Promise<Array<{ zone: string; runs: number; balls: number }>> {
  const where = await getInningsBallWhere(matchId);
  const events = await prisma.ballEvent.findMany({
    where,
    select: {
      wagonZone: true,
      runs: true
    }
  });

  const zoneMap = new Map<string, { zone: string; runs: number; balls: number }>();
  for (const event of events) {
    const zone = event.wagonZone ?? "UNKNOWN";
    const current = zoneMap.get(zone) ?? { zone, runs: 0, balls: 0 };
    current.runs += event.runs;
    current.balls += 1;
    zoneMap.set(zone, current);
  }

  return [...zoneMap.values()].sort((left, right) => right.runs - left.runs);
}

export async function refreshLeaderboardDb(scope = "global"): Promise<LeaderboardSnapshot> {
  const rows = await prisma.ballEvent.findMany({
    where: {
      isUndo: false
    },
    select: {
      strikerId: true,
      runs: true
    }
  });

  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.strikerId, (totals.get(row.strikerId) ?? 0) + row.runs);
  }

  const topRows = [...totals.entries()].sort((left, right) => right[1] - left[1]).slice(0, 10);
  const players = await prisma.player.findMany({
    where: {
      id: {
        in: topRows.map(([subjectId]) => subjectId)
      }
    },
    select: {
      id: true,
      fullName: true
    }
  });
  const labels = new Map(players.map((player) => [player.id, player.fullName]));
  const generatedAt = new Date();

  const snapshot = await prisma.leaderboardSnapshot.create({
    data: {
      id: createId(),
      scope,
      generatedAt,
      entries: {
        create: topRows.map(([subjectId, value]) => ({
          id: createId(),
          subjectId,
          label: labels.get(subjectId) ?? subjectId,
          value,
          metric: "RUNS"
        }))
      }
    },
    include: {
      entries: true
    }
  });

  publishEvent({
    eventVersion: 1,
    name: "leaderboard.updated",
    occurredAt: generatedAt.toISOString(),
    payload: { scope, snapshotId: snapshot.id }
  });

  return {
    id: snapshot.id,
    scope: snapshot.scope,
    generatedAt: snapshot.generatedAt.toISOString(),
    entries: snapshot.entries.map((entry) => ({
      subjectId: entry.subjectId,
      label: entry.label,
      value: entry.value,
      metric: entry.metric
    }))
  };
}

export async function getTop10Db(scope = "global"): Promise<LeaderboardSnapshot> {
  const snapshot = await prisma.leaderboardSnapshot.findFirst({
    where: { scope },
    orderBy: { generatedAt: "desc" },
    include: { entries: true }
  });

  if (!snapshot) {
    return refreshLeaderboardDb(scope);
  }

  return {
    id: snapshot.id,
    scope: snapshot.scope,
    generatedAt: snapshot.generatedAt.toISOString(),
    entries: snapshot.entries.map((entry) => ({
      subjectId: entry.subjectId,
      label: entry.label,
      value: entry.value,
      metric: entry.metric
    }))
  };
}

export async function headToHeadDb(
  teamAId: string,
  teamBId: string
): Promise<{ teamAId: string; teamBId: string; winsA: number; winsB: number }> {
  const matches = await prisma.match.findMany({
    where: {
      state: "COMPLETED",
      OR: [
        { teamAId, teamBId },
        { teamAId: teamBId, teamBId: teamAId }
      ]
    },
    select: {
      id: true,
      winnerTeamId: true
    }
  });

  let winsA = 0;
  let winsB = 0;

  for (const match of matches) {
    if (match.winnerTeamId === teamAId) {
      winsA += 1;
      continue;
    }
    if (match.winnerTeamId === teamBId) {
      winsB += 1;
      continue;
    }
    const score = await getScoreSummary(match.id);
    if (score.runs % 2 === 0) {
      winsA += 1;
    } else {
      winsB += 1;
    }
  }

  return { teamAId, teamBId, winsA, winsB };
}

export async function submitFanVoteDb(matchId: string, playerId: string, voterHash: string): Promise<FanVote> {
  const existing = await prisma.fanVote.findFirst({
    where: { matchId, voterHash },
    select: { id: true }
  });
  if (existing) {
    throw new Error("Vote limit reached for this device/user");
  }

  await ensurePlayerRecord(playerId);

  const vote = await prisma.fanVote.create({
    data: {
      id: createId(),
      matchId,
      playerId,
      voterHash
    }
  });

  publishEvent({
    eventVersion: 1,
    name: "fanvote.updated",
    occurredAt: vote.createdAt.toISOString(),
    payload: { matchId, voteId: vote.id }
  });

  return mapFanVote(vote);
}

export async function listNewsDb(): Promise<NewsPost[]> {
  return (await prisma.newsPost.findMany({ orderBy: { publishedAt: "desc" } })).map(mapNewsPost);
}

export async function addNewsDb(title: string, body: string, actorId: string): Promise<NewsPost> {
  const post = await prisma.newsPost.create({
    data: {
      id: createId(),
      title,
      body,
      publishedAt: new Date()
    }
  });
  await writeAuditLog("news.created", actorId, post.id);
  return mapNewsPost(post);
}

export async function getDbAuditLogs(): Promise<AuditLog[]> {
  return (await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" } })).map(mapAuditLog);
}

export async function getDbDashboardOverview() {
  const [
    users,
    tournaments,
    teams,
    playersCount,
    teamApplications,
    tournamentRegistrationRequests,
    directMatchRequests,
    matches,
    corrections,
    audits,
    news,
    leaderboard
  ] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.tournament.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.player.count(),
    prisma.teamTournamentApplication.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.tournamentRegistrationRequest.findMany({ orderBy: { submittedAt: "desc" } }),
    prisma.directMatchRequest.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.match.findMany({ orderBy: { startAt: "asc" } }),
    prisma.scoreCorrection.findMany({ orderBy: { requestedBy: "asc" } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.newsPost.findMany({ orderBy: { publishedAt: "desc" }, take: 5 }),
    getTop10Db("global")
  ]);

  const matchDetails = await Promise.all(
    matches.map(async (match) => ({
      ...mapMatch(match),
      score: await getScoreSummary(match.id),
      wagonWheel: await getWagonWheelDb(match.id)
    }))
  );

  return {
    counts: {
      tournaments: tournaments.length,
      teams: teams.length,
      players: playersCount,
      matches: matches.length,
      liveMatches: matches.filter((match) => match.state === "LIVE").length,
      tournamentRegistrationRequests: tournamentRegistrationRequests.length,
      pendingTournamentRegistrationRequests: tournamentRegistrationRequests.filter((request) => request.status === "PENDING").length,
      teamApplications: teamApplications.length,
      directMatchRequests: directMatchRequests.length,
      pendingCorrections: corrections.filter((correction) => !correction.approvedBy).length
    },
    tournaments: tournaments.map(mapTournament),
    tournamentRegistrationRequests: tournamentRegistrationRequests.map(mapTournamentRegistrationRequest),
    teams: teams.map(mapTeam),
    teamApplications: teamApplications.map(mapApplication),
    directMatchRequests: directMatchRequests.map(mapDirectMatchRequest),
    matches: matchDetails,
    corrections: corrections.map(mapCorrection),
    leaderboard,
    news: news.map(mapNewsPost),
    audits: audits.map(mapAuditLog),
    users: users.map(mapUser)
  };
}

export interface PublicCenterMatch {
  id: string;
  tournamentId?: string;
  tournamentName: string;
  seriesLabel: string;
  mode: Match["mode"];
  state: Match["state"];
  teamAId: string;
  teamAName: string;
  teamBId: string;
  teamBName: string;
  venue?: string;
  startAt: string;
  scoreText: string;
  statusText: string;
  resultText?: string;
}

export interface PublicTournamentBoard {
  tournament: Tournament;
  liveMatches: PublicCenterMatch[];
  upcomingMatches: PublicCenterMatch[];
  finishedMatches: PublicCenterMatch[];
  pointsTable: Array<
    PointsTableRow & {
      teamName: string;
    }
  >;
  rankings: {
    runs: Array<{ playerId: string; playerName: string; runs: number }>;
    wickets: Array<{ playerId: string; playerName: string; wickets: number }>;
  };
}

export interface PublicMatchDetail {
  match: PublicCenterMatch & {
    scheduledOvers?: number;
    ballsPerOver: number;
    currentInnings: number;
    tossWinnerTeamName?: string;
    electedTo?: Match["electedTo"];
    targetRuns?: number;
    winnerTeamName?: string;
  };
  tournament?: Tournament;
  teamA?: Team;
  teamB?: Team;
  squads: {
    teamA: Array<{ playerId?: string; name: string; role: string }>;
    teamB: Array<{ playerId?: string; name: string; role: string }>;
  };
  form: {
    teamA: Array<{ label: string; tone: "win" | "loss" | "neutral"; result: string }>;
    teamB: Array<{ label: string; tone: "win" | "loss" | "neutral"; result: string }>;
  };
  headToHead: {
    winsA: number;
    winsB: number;
  };
  recentHeadToHead: Array<{
    id: string;
    title: string;
    result: string;
    startAt: string;
  }>;
  comparison: {
    teamA: {
      matchesPlayed: number;
      wins: number;
      losses: number;
      tournamentPoints?: number;
      netRunRate?: number;
      lastResult: string;
    };
    teamB: {
      matchesPlayed: number;
      wins: number;
      losses: number;
      tournamentPoints?: number;
      netRunRate?: number;
      lastResult: string;
    };
  };
  score: {
    runs: number;
    wickets: number;
    balls: number;
    oversLabel: string;
    currentRunRate: number;
    batterSpotlight?: {
      playerId: string;
      name: string;
      runs: number;
      balls: number;
      strikeRate: number;
    };
    bowlerSpotlight?: {
      playerId: string;
      name: string;
      wickets: number;
      runsConceded: number;
      balls: number;
      oversLabel: string;
      economy: number;
    };
  };
  recentBalls: Array<{
    id: string;
    overBall: string;
    batterId: string;
    batterName: string;
    bowlerId: string;
    bowlerName: string;
    text: string;
    createdAt: string;
  }>;
  wagonWheel: Array<{ zone: string; runs: number; balls: number }>;
  venue: {
    name: string;
    matchesHosted: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    pitchReport: string;
    conditionsNote: string;
    recentMatches: Array<{
      id: string;
      title: string;
      result: string;
      startAt: string;
    }>;
  };
  matchCenter: {
    summaryText: string;
    lastSixBalls: Array<{
      ballId: string;
      label: string;
      tone: "dot" | "run" | "boundary" | "wicket";
    }>;
    projectedScore?: number;
    currentPartnership: {
      runs: number;
      balls: number;
    };
    lastWicket?: string;
    battingNow: Array<{
      playerId: string;
      name: string;
      runs: number;
      balls: number;
      fours: number;
      sixes: number;
      strikeRate: number;
      isOnStrike: boolean;
      status: "batting" | "out";
    }>;
    bowlingNow?: {
      playerId: string;
      name: string;
      overs: string;
      maidens: number;
      runs: number;
      wickets: number;
      economy: number;
    };
    scorecard: {
      batting: Array<{
        playerId: string;
        name: string;
        runs: number;
        balls: number;
        fours: number;
        sixes: number;
        strikeRate: number;
        dismissalText: string;
      }>;
      bowling: Array<{
        playerId: string;
        name: string;
        overs: string;
        maidens: number;
        runs: number;
        wickets: number;
        economy: number;
      }>;
    };
    stats: {
      winProbability: {
        teamA: number;
        teamB: number;
      };
      runRateBars: Array<{
        label: string;
        teamA: number;
        teamB: number;
      }>;
      requirements?: {
        target: number;
        runsNeeded: number;
        ballsRemaining: number;
        requiredRate: number;
        currentRate: number;
        pressure: "Low" | "Balanced" | "High";
      };
      runFlow: Array<{
        over: number;
        total: number;
        overRuns: number;
      }>;
      phaseBreakdown: Array<{
        label: string;
        runs: number;
        wickets: number;
        balls: number;
        runRate: number;
      }>;
      ballOutcomeSplit: Array<{
        label: string;
        value: number;
        tone: "dot" | "run" | "boundary" | "wicket";
      }>;
      analysisNotes: string[];
    };
    playerOfTheMatch?: {
      playerId: string;
      name: string;
      summary: string;
    };
  };
}

export interface PublicPlayerProfile {
  player: Player;
  teams: Array<{ id: string; name: string }>;
  tournaments: Array<{ id: string; name: string }>;
  summary: {
    roleLabel: string;
    matchesPlayed: number;
    runs: number;
    ballsFaced: number;
    strikeRate: number;
    fours: number;
    sixes: number;
    wickets: number;
    ballsBowled: number;
    oversBowled: string;
    economy: number;
    bestScore: number;
    bestBowling: string;
  };
  recentMatches: Array<{
    matchId: string;
    title: string;
    date: string;
    runs: number;
    ballsFaced: number;
    wickets: number;
    runsConceded: number;
  }>;
}

export interface PublicMatchCenterData {
  overview: {
    news: NewsPost[];
    leaderboard: {
      entries: Array<{
        id: string;
        subjectId: string;
        label: string;
        value: number;
        metric: "RUNS" | "WICKETS" | "POINTS";
      }>;
    };
  };
  liveMatches: PublicCenterMatch[];
  upcomingMatches: PublicCenterMatch[];
  finishedMatches: PublicCenterMatch[];
  tournamentBoards: PublicTournamentBoard[];
}

function toOversLabel(balls: number, ballsPerOver = 6) {
  return `${Math.floor(balls / ballsPerOver)}.${balls % ballsPerOver}`;
}

function toRunRate(runs: number, balls: number, ballsPerOver = 6) {
  if (balls === 0) {
    return 0;
  }
  return (runs * ballsPerOver) / balls;
}

function inferPitchReport(averageScore: number) {
  if (averageScore >= 165) {
    return "Batting-friendly deck with true bounce and enough value for shots square of the wicket.";
  }
  if (averageScore >= 135) {
    return "Balanced surface where disciplined pace-up bowling and clean batting both stay in the game.";
  }
  return "Bowling-friendly wicket where cutters, spin, and tight lengths usually control the scoring rate.";
}

function inferVenueConditions(averageScore: number) {
  if (averageScore >= 165) {
    return "Expect dew or a skiddy surface later in the innings, so chasing sides stay interested.";
  }
  if (averageScore >= 135) {
    return "Par totals stay competitive, and the toss matters mainly for pressure rather than surface extremes.";
  }
  return "Early wickets and scoreboard pressure usually matter more than pure power-hitting at this venue.";
}

function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toSeriesLabel(match: Match, tournamentNameById: Map<string, string>) {
  if (match.tournamentId) {
    return tournamentNameById.get(match.tournamentId) ?? "Tournament";
  }

  if (match.mode === "DIRECT") {
    return "Direct Match Series";
  }

  if (match.mode === "FRIENDLY") {
    return "Friendly Series";
  }

  return "Independent Match";
}

function toResultText(match: Match, teamNameById: Map<string, string>) {
  if (match.state !== "COMPLETED") {
    return undefined;
  }

  if (!match.winnerTeamId) {
    return "Result recorded";
  }

  const winner = teamNameById.get(match.winnerTeamId) ?? match.winnerTeamId;

  if (match.winType === "RUNS" && match.winMarginRuns) {
    return `${winner} won by ${match.winMarginRuns} runs`;
  }

  if (match.winType === "WICKETS" && match.winMarginWickets) {
    return `${winner} won by ${match.winMarginWickets} wickets`;
  }

  if (match.winType === "TIE") {
    return `${winner} shared a tie result`;
  }

  if (match.winType === "NO_RESULT") {
    return "No result";
  }

  return `${winner} won`;
}

export async function getPublicMatchCenterData(): Promise<PublicMatchCenterData> {
  if (isStaticExportMode()) {
    return getStaticPublicMatchCenterData();
  }

  const dashboardOverview = await getDbDashboardOverview();
  const overview: PublicMatchCenterData["overview"] = {
    news: dashboardOverview.news,
    leaderboard: {
      entries: dashboardOverview.leaderboard.entries.map((entry, index) => ({
        id: `leaderboard-${index + 1}-${entry.subjectId}`,
        subjectId: entry.subjectId,
        label: entry.label,
        value: entry.value,
        metric: entry.metric
      }))
    }
  };
  const approvedTournaments = dashboardOverview.tournaments.filter((tournament) => tournament.status === "APPROVED");
  const approvedTournamentIds = approvedTournaments.map((tournament) => tournament.id);
  const teamNameById = new Map(dashboardOverview.teams.map((team) => [team.id, team.name]));
  const tournamentNameById = new Map(approvedTournaments.map((tournament) => [tournament.id, tournament.name]));

  const [pointsTableRows, tournamentBallEvents] = await Promise.all([
    approvedTournamentIds.length === 0
      ? Promise.resolve([])
      : prisma.pointsTableRow.findMany({
          where: {
            tournamentId: {
              in: approvedTournamentIds
            }
          },
          orderBy: [{ points: "desc" }, { netRunRate: "desc" }, { played: "desc" }]
        }),
    approvedTournamentIds.length === 0
      ? Promise.resolve([])
      : prisma.ballEvent.findMany({
          where: {
            isUndo: false,
            match: {
              tournamentId: {
                in: approvedTournamentIds
              }
            }
          },
          select: {
            matchId: true,
            strikerId: true,
            bowlerId: true,
            runs: true,
            isWicket: true
          }
        })
  ]);

  const playerIds = [...new Set(tournamentBallEvents.flatMap((event) => [event.strikerId, event.bowlerId]))];
  const players =
    playerIds.length === 0
      ? []
      : await prisma.player.findMany({
          where: {
            id: {
              in: playerIds
            }
          },
          select: {
            id: true,
            fullName: true
          }
        });
  const playerNameById = new Map(players.map((player) => [player.id, player.fullName]));

  const decoratedMatches: PublicCenterMatch[] = dashboardOverview.matches.map((match) => ({
    id: match.id,
    tournamentId: match.tournamentId,
    tournamentName: match.tournamentId ? tournamentNameById.get(match.tournamentId) ?? "Tournament" : toSeriesLabel(match, tournamentNameById),
    seriesLabel: toSeriesLabel(match, tournamentNameById),
    mode: match.mode,
    state: match.state,
    teamAId: match.teamAId,
    teamAName: teamNameById.get(match.teamAId) ?? match.teamAId,
    teamBId: match.teamBId,
    teamBName: teamNameById.get(match.teamBId) ?? match.teamBId,
    venue: match.venue,
    startAt: match.startAt,
    scoreText:
      match.state === "LIVE" || match.state === "COMPLETED"
        ? `${match.score.runs}-${match.score.wickets} (${toOversLabel(match.score.balls, match.ballsPerOver ?? 6)})`
        : `Starts ${new Date(match.startAt).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" })}`,
    statusText:
      match.state === "LIVE"
        ? "Live"
        : match.state === "COMPLETED"
          ? "Finished"
          : new Date(match.startAt).toLocaleString("en-PK", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit"
            }),
    resultText: toResultText(match, teamNameById)
  }));

  const liveMatches = decoratedMatches.filter((match) => match.state === "LIVE" || match.state === "INNINGS_BREAK");
  const upcomingMatches = decoratedMatches.filter((match) => match.state === "SCHEDULED");
  const finishedMatches = decoratedMatches.filter((match) => match.state === "COMPLETED");

  const tournamentBoards: PublicTournamentBoard[] = approvedTournaments.map((tournament) => {
    const tournamentMatches = decoratedMatches.filter((match) => match.tournamentId === tournament.id);
    const tournamentPointRows = pointsTableRows
      .filter((row) => row.tournamentId === tournament.id)
      .map((row) => ({
        ...mapPointsTableRow(row),
        teamName: teamNameById.get(row.teamId) ?? row.teamId
      }));

    const fallbackTeams = dashboardOverview.teams
      .filter((team) => team.tournamentId === tournament.id)
      .map((team, index) => ({
        id: `fallback-${tournament.id}-${team.id}`,
        tournamentId: tournament.id,
        teamId: team.id,
        teamName: team.name,
        played: 0,
        won: 0,
        lost: 0,
        drawn: 0,
        tied: 0,
        noResult: 0,
        points: 0,
        runsFor: 0,
        oversFacedBalls: 0,
        runsAgainst: 0,
        oversBowledBalls: 0,
        netRunRate: 0,
        position: index + 1
      }));

    const table = (tournamentPointRows.length > 0 ? tournamentPointRows : fallbackTeams).sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points;
      }

      return right.netRunRate - left.netRunRate;
    });

    const matchIds = new Set(tournamentMatches.map((match) => match.id));
    const events = tournamentBallEvents.filter((event) => matchIds.has(event.matchId));
    const runsByPlayer = new Map<string, number>();
    const wicketsByPlayer = new Map<string, number>();

    for (const event of events) {
      runsByPlayer.set(event.strikerId, (runsByPlayer.get(event.strikerId) ?? 0) + event.runs);
      if (event.isWicket) {
        wicketsByPlayer.set(event.bowlerId, (wicketsByPlayer.get(event.bowlerId) ?? 0) + 1);
      }
    }

    return {
      tournament,
      liveMatches: tournamentMatches.filter((match) => match.state === "LIVE" || match.state === "INNINGS_BREAK"),
      upcomingMatches: tournamentMatches.filter((match) => match.state === "SCHEDULED"),
      finishedMatches: tournamentMatches.filter((match) => match.state === "COMPLETED"),
      pointsTable: table,
      rankings: {
        runs: [...runsByPlayer.entries()]
          .sort((left, right) => right[1] - left[1])
          .slice(0, 5)
          .map(([playerId, runs]) => ({
            playerId,
            playerName: playerNameById.get(playerId) ?? playerId,
            runs
          })),
        wickets: [...wicketsByPlayer.entries()]
          .sort((left, right) => right[1] - left[1])
          .slice(0, 5)
          .map(([playerId, wickets]) => ({
            playerId,
            playerName: playerNameById.get(playerId) ?? playerId,
            wickets
          }))
      }
    };
  });

  return {
    overview,
    liveMatches,
    upcomingMatches,
    finishedMatches,
    tournamentBoards
  };
}

export async function getPublicMatchDetailData(matchId: string): Promise<PublicMatchDetail | undefined> {
  if (isStaticExportMode()) {
    return getStaticPublicMatchDetailData(matchId);
  }

  const matchRow = await prisma.match.findUnique({
    where: { id: matchId }
  });

  if (!matchRow) {
    return undefined;
  }

  const match = mapMatch(matchRow);
  const currentInningsWhere = await getInningsBallWhere(matchId, match.currentInnings ?? 1);

  const [
    tournamentRow,
    baseTeamRows,
    score,
    wagonWheel,
    recentBallRows,
    matchBallRows,
    headToHead,
    squadRows,
    lineupRows,
    pointsTableRows,
    completedRelevantMatches,
    completedVenueMatches
  ] = await Promise.all([
    match.tournamentId ? prisma.tournament.findUnique({ where: { id: match.tournamentId } }) : Promise.resolve(null),
    prisma.team.findMany({
      where: {
        id: {
          in: [match.teamAId, match.teamBId]
        }
      }
    }),
    getScoreSummary(match.id),
    getWagonWheelDb(match.id),
    prisma.ballEvent.findMany({
      where: currentInningsWhere,
      orderBy: [{ createdAt: "desc" }, { over: "desc" }, { ball: "desc" }],
      take: 12,
      select: {
        id: true,
        over: true,
        ball: true,
        strikerId: true,
        bowlerId: true,
        outPlayerId: true,
        runs: true,
        isWicket: true,
        commentaryText: true,
        createdAt: true,
        striker: {
          select: {
            fullName: true
          }
        },
        bowler: {
          select: {
            fullName: true
          }
        }
      }
    }),
    prisma.ballEvent.findMany({
      where: currentInningsWhere,
      orderBy: [{ createdAt: "desc" }, { over: "desc" }, { ball: "desc" }],
      select: {
        id: true,
        over: true,
        ball: true,
        strikerId: true,
        bowlerId: true,
        outPlayerId: true,
        runs: true,
        isWicket: true,
        commentaryText: true,
        createdAt: true,
        striker: {
          select: {
            fullName: true
          }
        },
        bowler: {
          select: {
            fullName: true
          }
        }
      }
    }),
    headToHeadDb(match.teamAId, match.teamBId),
    match.tournamentId
      ? prisma.squadEntry.findMany({
          where: {
            tournamentId: match.tournamentId,
            teamId: {
              in: [match.teamAId, match.teamBId]
            }
          },
          include: {
            player: {
              select: {
                id: true,
                fullName: true
              }
            },
            team: {
              select: {
                id: true
              }
            }
          }
        })
      : Promise.resolve([]),
    prisma.matchLineupEntry.findMany({
      where: {
        matchId,
        teamId: {
          in: [match.teamAId, match.teamBId]
        }
      },
      include: {
        player: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: [{ battingOrder: "asc" }, { createdAt: "asc" }]
    }),
    match.tournamentId
      ? prisma.pointsTableRow.findMany({
          where: {
            tournamentId: match.tournamentId,
            teamId: {
              in: [match.teamAId, match.teamBId]
            }
          }
        })
      : Promise.resolve([]),
    prisma.match.findMany({
      where: {
        state: "COMPLETED",
        OR: [{ teamAId: match.teamAId }, { teamBId: match.teamAId }, { teamAId: match.teamBId }, { teamBId: match.teamBId }]
      },
      orderBy: { startAt: "desc" },
      take: 20
    }),
    match.venue
      ? prisma.match.findMany({
          where: {
            state: "COMPLETED",
            venue: match.venue
          },
          orderBy: { startAt: "desc" },
          take: 8
        })
      : Promise.resolve([])
  ]);

  const relatedTeamIds = [
    ...new Set([
      ...baseTeamRows.map((team) => team.id),
      ...completedRelevantMatches.flatMap((row) => [row.teamAId, row.teamBId]),
      ...completedVenueMatches.flatMap((row) => [row.teamAId, row.teamBId])
    ])
  ];
  const extraTeamIds = relatedTeamIds.filter((teamId) => !baseTeamRows.some((team) => team.id === teamId));
  const extraTeamRows =
    extraTeamIds.length === 0
      ? []
      : await prisma.team.findMany({
          where: {
            id: {
              in: extraTeamIds
            }
          }
        });
  const teamRows = [...baseTeamRows, ...extraTeamRows];
  const teamNameById = new Map(teamRows.map((team) => [team.id, team.name]));
  const teamById = new Map(teamRows.map((team) => [team.id, team]));
  const tournamentNameById = tournamentRow ? new Map([[tournamentRow.id, tournamentRow.name]]) : new Map<string, string>();
  const decoratedMatch: PublicCenterMatch = {
    id: match.id,
    tournamentId: match.tournamentId,
    tournamentName: match.tournamentId ? tournamentNameById.get(match.tournamentId) ?? "Tournament" : toSeriesLabel(match, tournamentNameById),
    seriesLabel: toSeriesLabel(match, tournamentNameById),
    mode: match.mode,
    state: match.state,
    teamAId: match.teamAId,
    teamAName: teamNameById.get(match.teamAId) ?? match.teamAId,
    teamBId: match.teamBId,
    teamBName: teamNameById.get(match.teamBId) ?? match.teamBId,
    venue: match.venue,
    startAt: match.startAt,
    scoreText:
      match.state === "LIVE" || match.state === "COMPLETED"
        ? `${score.runs}-${score.wickets} (${toOversLabel(score.balls, match.ballsPerOver ?? 6)})`
        : `Starts ${new Date(match.startAt).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" })}`,
    statusText:
      match.state === "LIVE"
        ? "Live"
        : match.state === "INNINGS_BREAK"
          ? "Innings Break"
          : match.state === "COMPLETED"
            ? "Finished"
            : new Date(match.startAt).toLocaleString("en-PK", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit"
            }),
    resultText: toResultText(match, teamNameById)
  };

  const outcomeForTeam = (
    row: {
      teamAId: string;
      teamBId: string;
      winnerTeamId?: string | null;
    },
    teamId: string
  ): { label: string; tone: "win" | "loss" | "neutral" } => {
    if (!row.winnerTeamId) {
      return { label: "N", tone: "neutral" };
    }

    if (row.winnerTeamId === teamId) {
      return { label: "W", tone: "win" };
    }

    return { label: "L", tone: "loss" };
  };

  const teamAHistory = completedRelevantMatches
    .filter((row) => row.teamAId === match.teamAId || row.teamBId === match.teamAId)
    .slice(0, 5);
  const teamBHistory = completedRelevantMatches
    .filter((row) => row.teamAId === match.teamBId || row.teamBId === match.teamBId)
    .slice(0, 5);
  const headToHeadHistory = completedRelevantMatches
    .filter(
      (row) =>
        (row.teamAId === match.teamAId && row.teamBId === match.teamBId) ||
        (row.teamAId === match.teamBId && row.teamBId === match.teamAId)
    )
    .slice(0, 5);

  const pointsByTeamId = new Map(pointsTableRows.map((row) => [row.teamId, row]));
  const venueScores = await Promise.all(completedVenueMatches.map((row) => getScoreSummary(row.id)));
  const venueTotals = venueScores.map((entry) => entry.runs);
  const averageVenueScore =
    venueTotals.length > 0 ? Math.round(venueTotals.reduce((sum, current) => sum + current, 0) / venueTotals.length) : 0;
  const teamASquadEntries = squadRows.filter((row) => row.teamId === match.teamAId);
  const teamBSquadEntries = squadRows.filter((row) => row.teamId === match.teamBId);
  const teamALineupEntries = lineupRows.filter((row) => row.teamId === match.teamAId);
  const teamBLineupEntries = lineupRows.filter((row) => row.teamId === match.teamBId);

  const fallbackSquad = (teamId: string) => {
    const team = teamById.get(teamId);
    const fallback = [];

    if (team?.captainName) {
      fallback.push({
        playerId: undefined,
        name: team.captainName,
        role: "Captain"
      });
    }

    fallback.push({
      playerId: undefined,
      name: "Squad to be announced",
      role: "Pending"
    });

    return fallback;
  };

  const chronologicalBalls = [...matchBallRows].sort((left, right) => {
    if (left.over !== right.over) {
      return left.over - right.over;
    }
    if (left.ball !== right.ball) {
      return left.ball - right.ball;
    }
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });

  const batterStatsById = new Map<
    string,
    { playerId: string; name: string; runs: number; balls: number; fours: number; sixes: number; lastSeen: number; isDismissed: boolean }
  >();
  const bowlerStatsById = new Map<
    string,
    {
      playerId: string;
      name: string;
      wickets: number;
      runsConceded: number;
      balls: number;
      maidenOvers: number;
      overRuns: Map<number, number>;
    }
  >();
  let lastWicketIndex = -1;
  let lastWicketBall: (typeof chronologicalBalls)[number] | undefined;

  for (const [index, ball] of chronologicalBalls.entries()) {
    const batter = batterStatsById.get(ball.strikerId) ?? {
      playerId: ball.strikerId,
      name: ball.striker.fullName,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      lastSeen: index,
      isDismissed: false
    };
    batter.runs += ball.runs;
    batter.balls += 1;
    batter.fours += ball.runs === 4 ? 1 : 0;
    batter.sixes += ball.runs >= 6 ? 1 : 0;
    batter.lastSeen = index;
    batterStatsById.set(ball.strikerId, batter);

    const bowler = bowlerStatsById.get(ball.bowlerId) ?? {
      playerId: ball.bowlerId,
      name: ball.bowler.fullName,
      wickets: 0,
      runsConceded: 0,
      balls: 0,
      maidenOvers: 0,
      overRuns: new Map<number, number>()
    };
    bowler.runsConceded += ball.runs;
    bowler.balls += 1;
    bowler.overRuns.set(ball.over, (bowler.overRuns.get(ball.over) ?? 0) + ball.runs);
    if (ball.isWicket) {
      bowler.wickets += 1;
      const dismissedId = ball.outPlayerId ?? ball.strikerId;
      const dismissedPlayer = batterStatsById.get(dismissedId) ?? {
        playerId: dismissedId,
        name: dismissedId === ball.strikerId ? ball.striker.fullName : dismissedId,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        lastSeen: index,
        isDismissed: false
      };
      dismissedPlayer.isDismissed = true;
      batterStatsById.set(dismissedId, dismissedPlayer);
      lastWicketIndex = index;
      lastWicketBall = ball;
    }
    bowlerStatsById.set(ball.bowlerId, bowler);
  }

  for (const bowler of bowlerStatsById.values()) {
    bowler.maidenOvers = [...bowler.overRuns.values()].filter((runsInOver) => runsInOver === 0).length;
  }

  const latestBall = recentBallRows[0];
  const batterSpotlightSource =
    (latestBall ? batterStatsById.get(latestBall.strikerId) : undefined) ??
    [...batterStatsById.values()].sort((left, right) => right.runs - left.runs)[0];
  const bowlerSpotlightSource =
    (latestBall ? bowlerStatsById.get(latestBall.bowlerId) : undefined) ??
    [...bowlerStatsById.values()].sort((left, right) => right.wickets - left.wickets || left.runsConceded - right.runsConceded)[0];

  const currentBatterIds = [
    ...new Set(
      [...recentBallRows]
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .map((ball) => ball.strikerId)
    )
  ].slice(0, 2);
  const battingNow = currentBatterIds
    .map((playerId) => batterStatsById.get(playerId))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .map((entry) => ({
      playerId: entry.playerId,
      name: entry.name,
      runs: entry.runs,
      balls: entry.balls,
      fours: entry.fours,
      sixes: entry.sixes,
      strikeRate: entry.balls > 0 ? (entry.runs * 100) / entry.balls : 0,
      isOnStrike: entry.playerId === latestBall?.strikerId,
      status: "batting" as const
    }))
    .sort((left, right) => Number(right.isOnStrike) - Number(left.isOnStrike));

  const partnershipBalls = chronologicalBalls.slice(lastWicketIndex + 1);
  const currentPartnership = {
    runs: partnershipBalls.reduce((sum, ball) => sum + ball.runs, 0),
    balls: partnershipBalls.length
  };
  const lastWicket =
    lastWicketBall && lastWicketIndex >= 0
      ? `${lastWicketBall.striker.fullName} fell at ${lastWicketBall.over}.${lastWicketBall.ball}`
      : undefined;

  const lastSixBalls = chronologicalBalls.slice(-6).map((ball) => ({
    ballId: ball.id,
    label: ball.isWicket ? "W" : `${ball.runs}`,
    tone: ball.isWicket ? ("wicket" as const) : ball.runs >= 4 ? ("boundary" as const) : ball.runs === 0 ? ("dot" as const) : ("run" as const)
  }));

  const projectedScore =
    match.scheduledOvers && score.balls > 0 ? Math.round(toRunRate(score.runs, score.balls, match.ballsPerOver ?? 6) * match.scheduledOvers) : undefined;

  const battingTeamName = match.currentInnings === 2 ? decoratedMatch.teamBName : decoratedMatch.teamAName;
  const bowlingTeamName = match.currentInnings === 2 ? decoratedMatch.teamAName : decoratedMatch.teamBName;
  const totalScheduledBalls = (match.scheduledOvers ?? 0) * (match.ballsPerOver ?? 6);
  const ballsRemaining = totalScheduledBalls > 0 ? Math.max(totalScheduledBalls - score.balls, 0) : 0;
  const runsNeeded = typeof match.targetRuns === "number" ? Math.max(match.targetRuns - score.runs, 0) : undefined;
  const requiredRate =
    typeof runsNeeded === "number" && ballsRemaining > 0 ? toRunRate(runsNeeded, ballsRemaining, match.ballsPerOver ?? 6) : 0;

  let summaryText = decoratedMatch.resultText ?? `${decoratedMatch.teamAName} vs ${decoratedMatch.teamBName}`;
  if (match.state === "LIVE") {
    summaryText =
      typeof runsNeeded === "number" && match.currentInnings === 2
        ? `${battingTeamName} need ${runsNeeded} runs in ${ballsRemaining} balls`
        : `${battingTeamName} are ${score.runs}/${score.wickets} after ${toOversLabel(score.balls, match.ballsPerOver ?? 6)}`;
  } else if (match.state === "INNINGS_BREAK") {
    summaryText = `Innings break. ${bowlingTeamName} will chase shortly.`;
  }

  let winProbability = {
    teamA: 50,
    teamB: 50
  };
  if (match.state === "COMPLETED" && match.winnerTeamId) {
    winProbability = {
      teamA: match.winnerTeamId === match.teamAId ? 100 : 0,
      teamB: match.winnerTeamId === match.teamBId ? 100 : 0
    };
  } else if (match.state === "LIVE" || match.state === "INNINGS_BREAK") {
    if (typeof runsNeeded === "number" && match.currentInnings === 2) {
      const chaseProbability = clampPercentage(55 + (toRunRate(score.runs, score.balls, match.ballsPerOver ?? 6) - requiredRate) * 12 - score.wickets * 3);
      winProbability = {
        teamA: 100 - chaseProbability,
        teamB: chaseProbability
      };
    } else {
      const battingPressure = clampPercentage(48 + (toRunRate(score.runs, score.balls, match.ballsPerOver ?? 6) - 7) * 6 - score.wickets * 2);
      winProbability = {
        teamA: match.currentInnings === 1 ? battingPressure : 100 - battingPressure,
        teamB: match.currentInnings === 1 ? 100 - battingPressure : battingPressure
      };
    }
  }

  const runRateBars = [
    {
      label: "Current RR",
      teamA: match.currentInnings === 1 ? Number(toRunRate(score.runs, score.balls, match.ballsPerOver ?? 6).toFixed(2)) : 0,
      teamB: match.currentInnings === 2 ? Number(toRunRate(score.runs, score.balls, match.ballsPerOver ?? 6).toFixed(2)) : 0
    },
    {
      label: "Required RR",
      teamA: 0,
      teamB: Number(requiredRate.toFixed(2))
    },
    {
      label: "Projected",
      teamA: Number((projectedScore ?? 0).toFixed(0)),
      teamB: Number((match.targetRuns ?? 0).toFixed(0))
    }
  ];

  const currentRate = toRunRate(score.runs, score.balls, match.ballsPerOver ?? 6);
  const requirements =
    typeof match.targetRuns === "number" && match.currentInnings === 2
      ? {
          target: match.targetRuns,
          runsNeeded: runsNeeded ?? 0,
          ballsRemaining,
          requiredRate: Number(requiredRate.toFixed(2)),
          currentRate: Number(currentRate.toFixed(2)),
          pressure:
            requiredRate <= currentRate + 0.4 ? ("Low" as const) : requiredRate <= currentRate + 1.5 ? ("Balanced" as const) : ("High" as const)
        }
      : undefined;

  const runFlow = (() => {
    const flow = new Map<number, { over: number; total: number; overRuns: number }>();
    let runningTotal = 0;

    for (const ball of chronologicalBalls) {
      runningTotal += ball.runs;
      const existing = flow.get(ball.over) ?? {
        over: ball.over + 1,
        total: 0,
        overRuns: 0
      };
      existing.overRuns += ball.runs;
      existing.total = runningTotal;
      flow.set(ball.over, existing);
    }

    return [...flow.values()];
  })();

  const estimatedPowerplayOvers =
    match.powerplayOvers ?? (match.scheduledOvers && match.scheduledOvers >= 40 ? 10 : match.scheduledOvers && match.scheduledOvers >= 20 ? 6 : 2);
  const totalOvers = match.scheduledOvers ?? 20;
  const deathOversStart = Math.max(totalOvers - 5, estimatedPowerplayOvers);
  const phaseBuckets = [
    {
      label: "Powerplay",
      filter: (over: number) => over < estimatedPowerplayOvers
    },
    {
      label: "Middle",
      filter: (over: number) => over >= estimatedPowerplayOvers && over < deathOversStart
    },
    {
      label: "Death",
      filter: (over: number) => over >= deathOversStart
    }
  ];

  const phaseBreakdown = phaseBuckets.map((bucket) => {
    const phaseBalls = chronologicalBalls.filter((ball) => bucket.filter(ball.over));
    const phaseRuns = phaseBalls.reduce((sum, ball) => sum + ball.runs, 0);
    const phaseWickets = phaseBalls.filter((ball) => ball.isWicket).length;
    return {
      label: bucket.label,
      runs: phaseRuns,
      wickets: phaseWickets,
      balls: phaseBalls.length,
      runRate: Number(toRunRate(phaseRuns, phaseBalls.length, match.ballsPerOver ?? 6).toFixed(2))
    };
  });

  const ballOutcomeSplit = [
    {
      label: "Dots",
      value: chronologicalBalls.filter((ball) => ball.runs === 0 && !ball.isWicket).length,
      tone: "dot" as const
    },
    {
      label: "Singles/2s/3s",
      value: chronologicalBalls.filter((ball) => ball.runs > 0 && ball.runs < 4 && !ball.isWicket).length,
      tone: "run" as const
    },
    {
      label: "Boundaries",
      value: chronologicalBalls.filter((ball) => ball.runs >= 4 && !ball.isWicket).length,
      tone: "boundary" as const
    },
    {
      label: "Wickets",
      value: chronologicalBalls.filter((ball) => ball.isWicket).length,
      tone: "wicket" as const
    }
  ];

  const analysisNotes = [
    requirements
      ? `${battingTeamName} need ${requirements.runsNeeded} from ${requirements.ballsRemaining} balls at ${requirements.requiredRate.toFixed(2)} RPO.`
      : `${battingTeamName} are building at ${currentRate.toFixed(2)} runs per over.`,
    projectedScore
      ? `Projected finish is ${projectedScore} if the current scoring pattern holds.`
      : "Projected finish will sharpen after more overs are recorded.",
    phaseBreakdown.find((phase) => phase.label === "Powerplay" && phase.balls > 0)
      ? `Powerplay rate is ${phaseBreakdown.find((phase) => phase.label === "Powerplay")?.runRate.toFixed(2)} with ${
          phaseBreakdown.find((phase) => phase.label === "Powerplay")?.wickets ?? 0
        } wickets.`
      : "Phase breakdown will appear once enough overs are recorded."
  ];

  const scorecardBatting = [...batterStatsById.values()]
    .sort((left, right) => Number(right.playerId === latestBall?.strikerId) - Number(left.playerId === latestBall?.strikerId) || right.runs - left.runs)
    .map((entry) => ({
      playerId: entry.playerId,
      name: entry.name,
      runs: entry.runs,
      balls: entry.balls,
      fours: entry.fours,
      sixes: entry.sixes,
      strikeRate: entry.balls > 0 ? (entry.runs * 100) / entry.balls : 0,
      dismissalText: entry.isDismissed ? "Out" : "Not out"
    }));
  const scorecardBowling = [...bowlerStatsById.values()]
    .sort((left, right) => right.wickets - left.wickets || left.runsConceded - right.runsConceded)
    .map((entry) => ({
      playerId: entry.playerId,
      name: entry.name,
      overs: toOversLabel(entry.balls, match.ballsPerOver ?? 6),
      maidens: entry.maidenOvers,
      runs: entry.runsConceded,
      wickets: entry.wickets,
      economy: toRunRate(entry.runsConceded, entry.balls, match.ballsPerOver ?? 6)
    }));

  const playerOfTheMatchSource = [...new Set([...batterStatsById.keys(), ...bowlerStatsById.keys()])]
    .map((playerId) => {
      const batting = batterStatsById.get(playerId);
      const bowling = bowlerStatsById.get(playerId);
      const scoreValue = (batting?.runs ?? 0) + (bowling?.wickets ?? 0) * 20 - (bowling?.runsConceded ?? 0) * 0.1;
      return {
        playerId,
        name: batting?.name ?? bowling?.name ?? playerId,
        scoreValue,
        summary: `${batting?.runs ?? 0} runs, ${bowling?.wickets ?? 0}/${bowling?.runsConceded ?? 0}`
      };
    })
    .sort((left, right) => right.scoreValue - left.scoreValue)[0];

  const teamAComparison = {
    matchesPlayed: teamAHistory.length,
    wins: teamAHistory.filter((row) => row.winnerTeamId === match.teamAId).length,
    losses: teamAHistory.filter((row) => row.winnerTeamId && row.winnerTeamId !== match.teamAId).length,
    tournamentPoints: pointsByTeamId.get(match.teamAId)?.points,
    netRunRate: pointsByTeamId.get(match.teamAId)?.netRunRate,
    lastResult: headToHeadHistory[0]
      ? toResultText(mapMatch(headToHeadHistory[0]), teamNameById) ?? "Recent result pending"
      : "No recent completed match"
  };

  const teamBComparison = {
    matchesPlayed: teamBHistory.length,
    wins: teamBHistory.filter((row) => row.winnerTeamId === match.teamBId).length,
    losses: teamBHistory.filter((row) => row.winnerTeamId && row.winnerTeamId !== match.teamBId).length,
    tournamentPoints: pointsByTeamId.get(match.teamBId)?.points,
    netRunRate: pointsByTeamId.get(match.teamBId)?.netRunRate,
    lastResult: headToHeadHistory[0]
      ? toResultText(mapMatch(headToHeadHistory[0]), teamNameById) ?? "Recent result pending"
      : "No recent completed match"
  };

  return {
    match: {
      ...decoratedMatch,
      scheduledOvers: match.scheduledOvers,
      ballsPerOver: match.ballsPerOver ?? 6,
      currentInnings: match.currentInnings ?? 1,
      tossWinnerTeamName: match.tossWinnerTeamId ? teamNameById.get(match.tossWinnerTeamId) ?? match.tossWinnerTeamId : undefined,
      electedTo: match.electedTo,
      targetRuns: match.targetRuns,
      winnerTeamName: match.winnerTeamId ? teamNameById.get(match.winnerTeamId) ?? match.winnerTeamId : undefined
    },
    tournament: tournamentRow ? mapTournament(tournamentRow) : undefined,
    teamA: teamById.get(match.teamAId) ? mapTeam(teamById.get(match.teamAId)!) : undefined,
    teamB: teamById.get(match.teamBId) ? mapTeam(teamById.get(match.teamBId)!) : undefined,
    squads: {
      teamA:
        teamALineupEntries.length > 0
          ? teamALineupEntries.map((entry) => ({
              playerId: entry.player.id,
              name: entry.player.fullName,
              role: entry.roleTag ?? "Playing XI"
            }))
          : teamASquadEntries.length > 0
            ? teamASquadEntries.map((entry, index) => ({
              playerId: entry.player.id,
              name: entry.player.fullName,
              role: index === 0 ? "Playing XI Captain" : index < 11 ? "Playing XI" : "Squad"
            }))
            : fallbackSquad(match.teamAId),
      teamB:
        teamBLineupEntries.length > 0
          ? teamBLineupEntries.map((entry) => ({
              playerId: entry.player.id,
              name: entry.player.fullName,
              role: entry.roleTag ?? "Playing XI"
            }))
          : teamBSquadEntries.length > 0
            ? teamBSquadEntries.map((entry, index) => ({
              playerId: entry.player.id,
              name: entry.player.fullName,
              role: index === 0 ? "Playing XI Captain" : index < 11 ? "Playing XI" : "Squad"
            }))
            : fallbackSquad(match.teamBId)
    },
    form: {
      teamA: teamAHistory.map((row) => {
        const outcome = outcomeForTeam(row, match.teamAId);
        return {
          label: outcome.label,
          tone: outcome.tone,
          result: toResultText(mapMatch(row), teamNameById) ?? "Completed"
        };
      }),
      teamB: teamBHistory.map((row) => {
        const outcome = outcomeForTeam(row, match.teamBId);
        return {
          label: outcome.label,
          tone: outcome.tone,
          result: toResultText(mapMatch(row), teamNameById) ?? "Completed"
        };
      })
    },
    headToHead: {
      winsA: headToHead.winsA,
      winsB: headToHead.winsB
    },
    recentHeadToHead: headToHeadHistory.map((row) => ({
      id: row.id,
      title: `${teamNameById.get(row.teamAId) ?? row.teamAId} vs ${teamNameById.get(row.teamBId) ?? row.teamBId}`,
      result: toResultText(mapMatch(row), teamNameById) ?? "Completed result",
      startAt: row.startAt.toISOString()
    })),
    comparison: {
      teamA: teamAComparison,
      teamB: teamBComparison
    },
    score: {
      runs: score.runs,
      wickets: score.wickets,
      balls: score.balls,
      oversLabel: toOversLabel(score.balls, match.ballsPerOver ?? 6),
      currentRunRate: toRunRate(score.runs, score.balls, match.ballsPerOver ?? 6),
      batterSpotlight: batterSpotlightSource
        ? {
            playerId: batterSpotlightSource.playerId,
            name: batterSpotlightSource.name,
            runs: batterSpotlightSource.runs,
            balls: batterSpotlightSource.balls,
            strikeRate: batterSpotlightSource.balls > 0 ? (batterSpotlightSource.runs * 100) / batterSpotlightSource.balls : 0
          }
        : undefined,
      bowlerSpotlight: bowlerSpotlightSource
        ? {
            playerId: bowlerSpotlightSource.playerId,
            name: bowlerSpotlightSource.name,
            wickets: bowlerSpotlightSource.wickets,
            runsConceded: bowlerSpotlightSource.runsConceded,
            balls: bowlerSpotlightSource.balls,
            oversLabel: toOversLabel(bowlerSpotlightSource.balls, match.ballsPerOver ?? 6),
            economy: toRunRate(bowlerSpotlightSource.runsConceded, bowlerSpotlightSource.balls, match.ballsPerOver ?? 6)
          }
        : undefined
    },
    matchCenter: {
      summaryText,
      lastSixBalls,
      projectedScore,
      currentPartnership,
      lastWicket,
      battingNow,
      bowlingNow: bowlerSpotlightSource
        ? {
            playerId: bowlerSpotlightSource.playerId,
            name: bowlerSpotlightSource.name,
            overs: toOversLabel(bowlerSpotlightSource.balls, match.ballsPerOver ?? 6),
            maidens: bowlerSpotlightSource.maidenOvers,
            runs: bowlerSpotlightSource.runsConceded,
            wickets: bowlerSpotlightSource.wickets,
            economy: toRunRate(bowlerSpotlightSource.runsConceded, bowlerSpotlightSource.balls, match.ballsPerOver ?? 6)
          }
        : undefined,
      scorecard: {
        batting: scorecardBatting,
        bowling: scorecardBowling
      },
      stats: {
        winProbability,
        runRateBars,
        requirements,
        runFlow,
        phaseBreakdown,
        ballOutcomeSplit,
        analysisNotes
      },
      playerOfTheMatch: playerOfTheMatchSource
        ? {
            playerId: playerOfTheMatchSource.playerId,
            name: playerOfTheMatchSource.name,
            summary: playerOfTheMatchSource.summary
          }
        : undefined
    },
    recentBalls: recentBallRows.map((ball) => ({
      id: ball.id,
      overBall: `${ball.over}.${ball.ball}`,
      batterId: ball.strikerId,
      batterName: ball.striker.fullName,
      bowlerId: ball.bowlerId,
      bowlerName: ball.bowler.fullName,
      text:
        ball.commentaryText ??
        `${ball.runs} run${ball.runs === 1 ? "" : "s"}${ball.isWicket ? ", wicket" : ""}`,
      createdAt: ball.createdAt.toISOString()
    })),
    wagonWheel,
    venue: {
      name: match.venue ?? "Ground pending",
      matchesHosted: completedVenueMatches.length,
      averageScore: averageVenueScore,
      highestScore: venueTotals.length > 0 ? Math.max(...venueTotals) : 0,
      lowestScore: venueTotals.length > 0 ? Math.min(...venueTotals) : 0,
      pitchReport:
        completedVenueMatches.length > 0
          ? inferPitchReport(averageVenueScore)
          : "Venue report will sharpen automatically once completed matches are recorded here.",
      conditionsNote:
        completedVenueMatches.length > 0
          ? inferVenueConditions(averageVenueScore)
          : "Conditions note will appear after the venue builds a result history on PakScorer.",
      recentMatches: completedVenueMatches.map((row) => ({
        id: row.id,
        title: `${teamNameById.get(row.teamAId) ?? row.teamAId} vs ${teamNameById.get(row.teamBId) ?? row.teamBId}`,
        result: toResultText(mapMatch(row), teamNameById) ?? "Completed result",
        startAt: row.startAt.toISOString()
      }))
    }
  };
}

export async function getPublicPlayerProfileData(playerId: string): Promise<PublicPlayerProfile | undefined> {
  if (isStaticExportMode()) {
    return getStaticPublicPlayerProfileData(playerId);
  }

  const playerRow = await prisma.player.findUnique({
    where: { id: playerId }
  });

  if (!playerRow) {
    return undefined;
  }

  const [squadEntries, battingEvents, bowlingEvents] = await Promise.all([
    prisma.squadEntry.findMany({
      where: { playerId },
      include: {
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    }),
    prisma.ballEvent.findMany({
      where: { strikerId: playerId, isUndo: false },
      orderBy: { createdAt: "desc" },
      select: {
        matchId: true,
        runs: true,
        createdAt: true
      }
    }),
    prisma.ballEvent.findMany({
      where: { bowlerId: playerId, isUndo: false },
      orderBy: { createdAt: "desc" },
      select: {
        matchId: true,
        runs: true,
        isWicket: true,
        createdAt: true
      }
    })
  ]);

  const teams = [...new Map(squadEntries.map((entry) => [entry.team.id, { id: entry.team.id, name: entry.team.name }])).values()];
  const tournamentIds = [...new Set(squadEntries.map((entry) => entry.tournamentId))];
  const tournamentRows =
    tournamentIds.length === 0
      ? []
      : await prisma.tournament.findMany({
          where: {
            id: {
              in: tournamentIds
            }
          },
          select: {
            id: true,
            name: true
          }
        });
  const tournaments = tournamentRows.map((tournament) => ({
    id: tournament.id,
    name: tournament.name
  }));

  const battingByMatch = new Map<string, { runs: number; ballsFaced: number }>();
  for (const event of battingEvents) {
    const current = battingByMatch.get(event.matchId) ?? { runs: 0, ballsFaced: 0 };
    current.runs += event.runs;
    current.ballsFaced += 1;
    battingByMatch.set(event.matchId, current);
  }

  const bowlingByMatch = new Map<string, { wickets: number; runsConceded: number; balls: number }>();
  for (const event of bowlingEvents) {
    const current = bowlingByMatch.get(event.matchId) ?? { wickets: 0, runsConceded: 0, balls: 0 };
    current.runsConceded += event.runs;
    current.balls += 1;
    if (event.isWicket) {
      current.wickets += 1;
    }
    bowlingByMatch.set(event.matchId, current);
  }

  const matchIds = [...new Set([...battingByMatch.keys(), ...bowlingByMatch.keys()])];
  const matches =
    matchIds.length === 0
      ? []
      : await prisma.match.findMany({
          where: {
            id: {
              in: matchIds
            }
          },
          include: {
            teamA: {
              select: {
                id: true,
                name: true
              }
            },
            teamB: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

  const matchById = new Map(matches.map((match) => [match.id, match]));
  const totalRuns = battingEvents.reduce((sum, event) => sum + event.runs, 0);
  const ballsFaced = battingEvents.length;
  const totalWickets = bowlingEvents.filter((event) => event.isWicket).length;
  const ballsBowled = bowlingEvents.length;
  const totalRunsConceded = bowlingEvents.reduce((sum, event) => sum + event.runs, 0);
  const bestScore = Math.max(0, ...[...battingByMatch.values()].map((entry) => entry.runs));
  const bestBowlingEntry = [...bowlingByMatch.values()].sort(
    (left, right) => right.wickets - left.wickets || left.runsConceded - right.runsConceded
  )[0];
  const roleLabel =
    totalRuns > 0 && totalWickets > 0
      ? "All-Rounder"
      : totalWickets > totalRuns
        ? "Bowler"
        : totalRuns > 0
          ? "Batter"
          : "Squad Player";

  const recentMatches = matchIds
    .map((matchIdValue) => {
      const match = matchById.get(matchIdValue);
      if (!match) {
        return undefined;
      }

      const batting = battingByMatch.get(matchIdValue) ?? { runs: 0, ballsFaced: 0 };
      const bowling = bowlingByMatch.get(matchIdValue) ?? { wickets: 0, runsConceded: 0, balls: 0 };

      return {
        matchId: match.id,
        title: `${match.teamA.name} vs ${match.teamB.name}`,
        date: match.startAt.toISOString(),
        runs: batting.runs,
        ballsFaced: batting.ballsFaced,
        wickets: bowling.wickets,
        runsConceded: bowling.runsConceded
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 6);

  return {
    player: mapPlayer(playerRow),
    teams,
    tournaments,
    summary: {
      roleLabel,
      matchesPlayed: matchIds.length,
      runs: totalRuns,
      ballsFaced,
      strikeRate: ballsFaced > 0 ? (totalRuns * 100) / ballsFaced : 0,
      fours: battingEvents.filter((event) => event.runs === 4).length,
      sixes: battingEvents.filter((event) => event.runs >= 6).length,
      wickets: totalWickets,
      ballsBowled,
      oversBowled: toOversLabel(ballsBowled),
      economy: ballsBowled > 0 ? toRunRate(totalRunsConceded, ballsBowled) : 0,
      bestScore,
      bestBowling: bestBowlingEntry ? `${bestBowlingEntry.wickets}/${bestBowlingEntry.runsConceded}` : "0/0"
    },
    recentMatches
  };
}

export function getStaticPublicExportIds() {
  return {
    matchIds: getStaticPublicMatchIds(),
    playerIds: getStaticPublicPlayerIds()
  };
}
