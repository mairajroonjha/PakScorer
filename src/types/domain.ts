export type Role =
  | "SUPER_ADMIN"
  | "TOURNAMENT_ADMIN"
  | "TEAM_ADMIN"
  | "MATCH_SCORER"
  | "PUBLIC_VIEWER";

export type UserStatus = "ACTIVE" | "BLOCKED" | "PENDING";
export type TournamentStatus = "PENDING" | "APPROVED" | "REJECTED";
export type TournamentFixtureType = "ROUND_ROBIN" | "KNOCKOUT" | "GROUP_STAGE" | "HYBRID";
export type MatchState = "SCHEDULED" | "LIVE" | "INNINGS_BREAK" | "COMPLETED" | "ABANDONED" | "CANCELLED";
export type ElectChoice = "BAT" | "BOWL";
export type MatchMode = "TOURNAMENT" | "DIRECT" | "FRIENDLY";
export type MatchAssignmentRole = "SCORER" | "TOURNAMENT_ADMIN" | "UMPIRE";
export type MatchWinType = "RUNS" | "WICKETS" | "TIE" | "NO_RESULT";
export type TeamApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type DirectMatchRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type ScoreCorrectionStatus = "REQUESTED" | "APPROVED" | "REJECTED";
export type TournamentRegistrationRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type WicketType =
  | "BOWLED"
  | "CAUGHT"
  | "LBW"
  | "RUN_OUT"
  | "STUMPED"
  | "HIT_WICKET"
  | "OBSTRUCTING_FIELD"
  | "TIMED_OUT"
  | "RETIRED_OUT"
  | "HANDLED_BALL";

export interface User {
  id: string;
  name: string;
  role: Role;
  status?: UserStatus;
  regionId: string;
  email?: string;
  phone?: string;
  blockedAt?: string;
  blockedReason?: string;
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
  fixtureType?: TournamentFixtureType;
  pointsWin?: number;
  pointsLoss?: number;
  pointsDraw?: number;
  pointsTie?: number;
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
  venue?: string;
  startAt: string;
  scheduledOvers?: number;
  ballsPerOver?: number;
  powerplayOvers?: number;
  maxOversPerBowler?: number;
  allowSuperOver?: boolean;
  squadLockAt: string;
  state: MatchState;
  mode: MatchMode;
  tossWinnerTeamId?: string;
  electedTo?: ElectChoice;
  winnerTeamId?: string;
  winType?: MatchWinType;
  winMarginRuns?: number;
  winMarginWickets?: number;
  targetRuns?: number;
  currentInnings?: number;
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
  inningsId?: string;
  over: number;
  ball: number;
  legalBallNumber?: number;
  strikerId: string;
  nonStrikerId?: string;
  bowlerId: string;
  runs: number;
  runsBat?: number;
  extras?: number;
  isWicket: boolean;
  extraType?: "WD" | "NB" | "LB" | "B";
  wicketType?: WicketType;
  outPlayerId?: string;
  newBatterId?: string;
  wagonZone?: string;
  commentaryText?: string;
  isUndo?: boolean;
  undoOfEventId?: string;
  createdBy: string;
  createdAt: string;
}

export interface ScoreCorrection {
  id: string;
  matchId: string;
  targetEventId: string;
  reason: string;
  requestedBy: string;
  status?: ScoreCorrectionStatus;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
}

export interface MatchOfficialAssignment {
  id: string;
  matchId: string;
  userId: string;
  assignmentRole: MatchAssignmentRole;
  assignedAt: string;
  assignedBy?: string;
}

export interface MatchInnings {
  id: string;
  matchId: string;
  inningsNumber: number;
  battingTeamId: string;
  bowlingTeamId: string;
  runs: number;
  wickets: number;
  balls: number;
  extras: number;
  byes: number;
  legByes: number;
  wides: number;
  noBalls: number;
  target?: number;
  startedAt: string;
  endedAt?: string;
  isCompleted: boolean;
}

export interface PointsTableRow {
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
  position?: number;
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
