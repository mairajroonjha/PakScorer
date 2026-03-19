export type Role =
  | "SUPER_ADMIN"
  | "TOURNAMENT_ADMIN"
  | "TEAM_ADMIN"
  | "MATCH_SCORER"
  | "PUBLIC_VIEWER";

export type TournamentStatus = "PENDING" | "APPROVED" | "REJECTED";
export type MatchState = "SCHEDULED" | "LIVE" | "COMPLETED";
export type ElectChoice = "BAT" | "BOWL";
export type MatchMode = "TOURNAMENT" | "DIRECT";
export type TeamApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type DirectMatchRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type TournamentRegistrationRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  name: string;
  role: Role;
  regionId: string;
  email?: string;
  phone?: string;
}

export interface Tournament {
  id: string;
  name: string;
  regionId: string;
  city?: string;
  venue?: string;
  format?: string;
  overs?: number;
  ballType?: string;
  tournamentType?: string;
  organizerName?: string;
  organizerPhone?: string;
  sponsorName?: string;
  totalTeams?: number;
  startDate?: string;
  endDate?: string;
  ruleSummary?: string;
  adminUserId?: string;
  status: TournamentStatus;
  requestedBy: string;
  approvedBy?: string;
  rejectedBy?: string;
}

export interface TournamentRegistrationRequest {
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
  sponsorName?: string;
  totalTeams: number;
  startDate: string;
  endDate: string;
  ruleSummary: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  status: TournamentRegistrationRequestStatus;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Team {
  id: string;
  name: string;
  tournamentId?: string;
  ownerUserId?: string;
  city?: string;
  logoUrl?: string;
  captainName?: string;
  contactPhone?: string;
  sponsorName?: string;
}

export interface Player {
  id: string;
  bcaId: string;
  fullName: string;
  verificationStatus: "VERIFIED" | "FLAGGED";
}

export interface SquadEntry {
  teamId: string;
  playerBcaId: string;
  tournamentId: string;
}

export interface Match {
  id: string;
  tournamentId?: string;
  teamAId: string;
  teamBId: string;
  startAt: string;
  squadLockAt: string;
  state: MatchState;
  mode: MatchMode;
  tossWinnerTeamId?: string;
  electedTo?: ElectChoice;
}

export interface TeamTournamentApplication {
  id: string;
  teamId: string;
  tournamentId: string;
  status: TeamApplicationStatus;
  requestedBy: string;
  reviewedBy?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface DirectMatchRequest {
  id: string;
  requesterTeamId: string;
  opponentTeamId: string;
  requestedBy: string;
  format: string;
  venue: string;
  startAt: string;
  status: DirectMatchRequestStatus;
  createdAt: string;
}

export interface BallEvent {
  id: string;
  matchId: string;
  over: number;
  ball: number;
  strikerId: string;
  bowlerId: string;
  runs: number;
  isWicket: boolean;
  extraType?: "WD" | "NB" | "LB" | "B";
  wagonZone?: string;
  commentaryText?: string;
  createdBy: string;
  createdAt: string;
}

export interface ScoreCorrection {
  id: string;
  matchId: string;
  targetEventId: string;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface LeaderboardEntry {
  subjectId: string;
  label: string;
  value: number;
  metric: "RUNS" | "WICKETS" | "POINTS";
}

export interface LeaderboardSnapshot {
  id: string;
  scope: string;
  generatedAt: string;
  entries: LeaderboardEntry[];
}

export interface FanVote {
  id: string;
  matchId: string;
  playerId: string;
  voterHash: string;
  createdAt: string;
}

export interface NewsPost {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  entityId: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}
