import { publishEvent } from "@/lib/events";
import { prisma } from "@/lib/prisma";
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

function nowIso(): string {
  return new Date().toISOString();
}

function mapUser(row: { id: string; name: string; role: Role; regionId: string; email?: string | null; phone?: string | null }): User {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    regionId: row.regionId,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined
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
  city: string | null;
  logoUrl: string | null;
  captainName: string | null;
  contactPhone: string | null;
  sponsorName: string | null;
}): Team {
  return {
    id: row.id,
    name: row.name,
    tournamentId: row.tournamentId ?? undefined,
    ownerUserId: row.ownerUserId ?? undefined,
    city: row.city ?? undefined,
    logoUrl: row.logoUrl ?? undefined,
    captainName: row.captainName ?? undefined,
    contactPhone: row.contactPhone ?? undefined,
    sponsorName: row.sponsorName ?? undefined
  };
}

function mapPlayer(row: {
  id: string;
  bcaId: string;
  fullName: string;
  verificationStatus: Player["verificationStatus"];
}): Player {
  return {
    id: row.id,
    bcaId: row.bcaId,
    fullName: row.fullName,
    verificationStatus: row.verificationStatus
  };
}

function mapMatch(row: {
  id: string;
  tournamentId: string | null;
  teamAId: string;
  teamBId: string;
  startAt: Date;
  squadLockAt: Date;
  state: Match["state"];
  mode: Match["mode"];
  tossWinnerTeamId: string | null;
  electedTo: Match["electedTo"] | null;
}): Match {
  return {
    id: row.id,
    tournamentId: row.tournamentId ?? undefined,
    teamAId: row.teamAId,
    teamBId: row.teamBId,
    startAt: row.startAt.toISOString(),
    squadLockAt: row.squadLockAt.toISOString(),
    state: row.state,
    mode: row.mode,
    tossWinnerTeamId: row.tossWinnerTeamId ?? undefined,
    electedTo: row.electedTo ?? undefined
  };
}

function mapBallEvent(row: {
  id: string;
  matchId: string;
  over: number;
  ball: number;
  strikerId: string;
  bowlerId: string;
  runs: number;
  isWicket: boolean;
  extraType: BallEvent["extraType"] | null;
  wagonZone: string | null;
  commentaryText: string | null;
  createdBy: string;
  createdAt: Date;
}): BallEvent {
  return {
    id: row.id,
    matchId: row.matchId,
    over: row.over,
    ball: row.ball,
    strikerId: row.strikerId,
    bowlerId: row.bowlerId,
    runs: row.runs,
    isWicket: row.isWicket,
    extraType: row.extraType ?? undefined,
    wagonZone: row.wagonZone ?? undefined,
    commentaryText: row.commentaryText ?? undefined,
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
  approvedBy: string | null;
  approvedAt: Date | null;
}): ScoreCorrection {
  return {
    id: row.id,
    matchId: row.matchId,
    targetEventId: row.targetEventId,
    reason: row.reason,
    requestedBy: row.requestedBy,
    approvedBy: row.approvedBy ?? undefined,
    approvedAt: row.approvedAt?.toISOString()
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

async function getScoreSummary(matchId: string): Promise<{ runs: number; wickets: number; balls: number }> {
  const [ballRows, wicketCount] = await Promise.all([
    prisma.ballEvent.findMany({
      where: { matchId },
      select: { runs: true }
    }),
    prisma.ballEvent.count({
      where: {
        matchId,
        isWicket: true
      }
    })
  ]);

  return {
    runs: ballRows.reduce((sum, event) => sum + event.runs, 0),
    wickets: wicketCount,
    balls: ballRows.length
  };
}

export async function getDbUserById(userId: string): Promise<User | undefined> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ? mapUser(user) : undefined;
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
  adminPassword: string;
}): Promise<TournamentRegistrationRequest> {
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
      adminPasswordHash: await hash(payload.adminPassword, 10),
      status: "PENDING"
    }
  });

  await writeAuditLog("tournament.registration.requested", "u-public", request.id, {
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

  const [emailConflict, phoneConflict] = await Promise.all([
    prisma.user.findFirst({
      where: { email: request.adminEmail },
      select: { id: true }
    }),
    prisma.user.findFirst({
      where: { phone: request.adminPhone },
      select: { id: true }
    })
  ]);

  if (emailConflict) {
    throw new Error("Admin email already exists in the system");
  }

  if (phoneConflict) {
    throw new Error("Admin phone already exists in the system");
  }

  const result = await prisma.$transaction(async (tx) => {
    const adminUser = await tx.user.create({
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
        requestedBy: "u-public",
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

    return { adminUser, tournament, request: approvedRequest };
  });

  await writeAuditLog("tournament.registration.approved", actorId, requestId, {
    tournamentName: result.tournament.name,
    adminEmail: result.adminUser.email
  });

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
  profile: Pick<Team, "name" | "city" | "captainName" | "contactPhone" | "sponsorName" | "logoUrl">,
  actorId: string
): Promise<Team> {
  const team = await prisma.team.create({
    data: {
      id: createId(),
      name: profile.name,
      city: profile.city,
      captainName: profile.captainName,
      contactPhone: profile.contactPhone,
      sponsorName: profile.sponsorName,
      logoUrl: profile.logoUrl,
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

export async function createPlayerDb(fullName: string, actorId: string): Promise<Player> {
  const player = await prisma.player.create({
    data: {
      id: createId(),
      bcaId: await nextBcaId(),
      fullName,
      verificationStatus: "VERIFIED"
    }
  });
  await writeAuditLog("player.created", actorId, player.bcaId);
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

export async function applyTossDb(
  matchId: string,
  tossWinnerTeamId: string,
  electedTo: "BAT" | "BOWL",
  actorId: string
): Promise<Match> {
  const match = await prisma.match.update({
    where: { id: matchId },
    data: {
      tossWinnerTeamId,
      electedTo,
      state: "LIVE"
    }
  });

  publishEvent({
    eventVersion: 1,
    name: "match.state_changed",
    occurredAt: nowIso(),
    payload: { matchId, state: "LIVE", tossWinnerTeamId, electedTo }
  });

  await writeAuditLog("match.toss.applied", actorId, matchId, {
    tossWinnerTeamId,
    electedTo
  });

  return mapMatch(match);
}

export async function addBallEventDb(
  matchId: string,
  payload: Omit<BallEvent, "id" | "matchId" | "createdAt">
): Promise<BallEvent> {
  const match = await getMatchByIdDb(matchId);
  if (!match) {
    throw new Error("Match not found");
  }
  if (match.state !== "LIVE") {
    throw new Error("Match is not live");
  }

  await ensurePlayerRecord(payload.strikerId);
  await ensurePlayerRecord(payload.bowlerId);

  const event = await prisma.ballEvent.create({
    data: {
      id: createId(),
      matchId,
      over: payload.over,
      ball: payload.ball,
      strikerId: payload.strikerId,
      bowlerId: payload.bowlerId,
      runs: payload.runs,
      isWicket: payload.isWicket,
      extraType: payload.extraType,
      wagonZone: payload.wagonZone,
      commentaryText: payload.commentaryText,
      createdBy: payload.createdBy
    }
  });

  publishEvent({
    eventVersion: 1,
    name: "match.ball_recorded",
    occurredAt: event.createdAt.toISOString(),
    payload: { matchId, eventId: event.id }
  });

  return mapBallEvent(event);
}

export async function addCommentaryDb(matchId: string, text: string, actorId: string): Promise<BallEvent> {
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

  if (match.mode === "TOURNAMENT") {
    await refreshLeaderboardDb("global");
  }

  publishEvent({
    eventVersion: 1,
    name: "match.state_changed",
    occurredAt: nowIso(),
    payload: { matchId, state: "COMPLETED" }
  });

  await writeAuditLog("match.completed", actorId, matchId);
  return mapMatch(match);
}

export async function getScoreDb(matchId: string): Promise<{ runs: number; wickets: number; balls: number }> {
  return getScoreSummary(matchId);
}

export async function getWagonWheelDb(matchId: string): Promise<Array<{ zone: string; runs: number; balls: number }>> {
  const events = await prisma.ballEvent.findMany({
    where: { matchId },
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
