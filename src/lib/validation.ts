import { z } from "zod";

export const tournamentRequestSchema = z.object({
  name: z.string().min(3),
  regionId: z.string().min(2)
});

export const playerCreateSchema = z.object({
  fullName: z.string().min(3),
  phone: z.string().min(6).max(20).optional()
});

export const squadUpdateSchema = z.object({
  tournamentId: z.string().min(1),
  playerBcaIds: z.array(z.string().regex(/^BCA-\d+$/)).min(1)
});

export const tossSchema = z.object({
  tossWinnerTeamId: z.string().min(1),
  electedTo: z.enum(["BAT", "BOWL"])
});

export const ballEventSchema = z.object({
  over: z.number().int().min(0),
  ball: z.number().int().min(1).max(6),
  strikerId: z.string().min(1),
  nonStrikerId: z.string().min(1).optional(),
  bowlerId: z.string().min(1),
  runs: z.number().int().min(0).max(6),
  runsBat: z.number().int().min(0).max(6).optional(),
  extras: z.number().int().min(0).max(6).optional(),
  isWicket: z.boolean(),
  extraType: z.enum(["WD", "NB", "LB", "B"]).optional(),
  wicketType: z
    .enum([
      "BOWLED",
      "CAUGHT",
      "LBW",
      "RUN_OUT",
      "STUMPED",
      "HIT_WICKET",
      "OBSTRUCTING_FIELD",
      "TIMED_OUT",
      "RETIRED_OUT",
      "HANDLED_BALL"
    ])
    .optional(),
  outPlayerId: z.string().min(1).optional(),
  newBatterId: z.string().min(1).optional(),
  wagonZone: z.string().min(1).optional(),
  commentaryText: z.string().max(160).optional()
});

export const commentarySchema = z.object({
  text: z.string().min(1).max(160)
});

export const matchLineupSchema = z.object({
  teamId: z.string().min(1),
  playerIds: z.array(z.string().min(1)).min(1).max(11)
});

export const correctionSchema = z.object({
  targetEventId: z.string().min(1),
  reason: z.string().min(8).max(300)
});

export const scorerAssignmentSchema = z.object({
  scorerUserId: z.string().min(1).nullable().optional()
});

export const secondInningsSchema = z.object({
  targetRuns: z.number().int().min(1).max(999).optional()
});

export const undoBallSchema = z.object({
  reason: z.string().min(8).max(300)
});

export const fanVoteSchema = z.object({
  playerId: z.string().min(1),
  otpVerified: z.boolean(),
  deviceId: z.string().min(3)
});

export const loginSchema = z.object({
  userId: z.enum(["u-super", "u-tadmin", "u-teamadmin", "u-scorer", "u-public"])
});

export const teamRegistrationSchema = z.object({
  name: z.string().min(3),
  city: z.string().min(2),
  description: z.string().min(10).max(280).optional(),
  ownerName: z.string().min(3),
  ownerEmail: z.string().email().optional(),
  ownerPhone: z.string().min(6),
  captainName: z.string().min(3),
  contactPhone: z.string().min(6),
  managerName: z.string().min(3).optional(),
  managerPhone: z.string().min(6).optional(),
  homeGround: z.string().min(3).optional(),
  leagueAffiliation: z.string().min(3).optional(),
  sponsorName: z.string().min(2).optional(),
  logoUrl: z.string().url().optional()
});

export const teamRosterManageSchema = z.object({
  tournamentId: z.string().min(1),
  players: z
    .array(
      z.object({
        bcaId: z.string().regex(/^BCA-\d+$/),
        roleTag: z.string().min(3).max(40),
        availabilityStatus: z.enum(["AVAILABLE", "UNAVAILABLE", "QUESTIONABLE"]).default("AVAILABLE"),
        isSubstitute: z.boolean().default(false)
      })
    )
    .min(1)
    .max(25)
});

export const teamTournamentApplicationSchema = z.object({
  teamId: z.string().min(1)
});

export const teamApplicationDecisionSchema = z.object({
  rejectionReason: z.string().min(5).max(200).optional()
});

export const directMatchRequestSchema = z.object({
  requesterTeamId: z.string().min(1),
  opponentTeamId: z.string().min(1),
  format: z.string().min(2),
  venue: z.string().min(3),
  startAt: z.string().min(8)
});

export const directMatchResponseSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT", "COUNTER"]),
  format: z.string().min(2).optional(),
  venue: z.string().min(3).optional(),
  startAt: z.string().min(8).optional()
});

export const roleUpdateSchema = z.object({
  role: z.enum(["SUPER_ADMIN", "TOURNAMENT_ADMIN", "TEAM_ADMIN", "MATCH_SCORER", "PUBLIC_VIEWER"])
});

export const superTournamentCreateSchema = z
  .object({
    name: z.string().min(4),
    regionId: z.string().min(2),
    city: z.string().min(2),
    venue: z.string().min(3),
    format: z.string().min(2),
    overs: z.coerce.number().int().min(1).max(100),
    ballType: z.string().min(2),
    tournamentType: z.string().min(3),
    organizerName: z.string().min(3),
    organizerPhone: z.string().min(6),
    sponsorName: z.string().min(2).optional(),
    totalTeams: z.coerce.number().int().min(2).max(128),
    startDate: z.string().min(8),
    endDate: z.string().min(8),
    ruleSummary: z.string().min(10).max(1000),
    adminName: z.string().min(3),
    adminEmail: z.string().email(),
    adminPhone: z.string().min(6),
    adminPassword: z.string().min(8).max(128)
  })
  .refine((value) => new Date(value.endDate).getTime() >= new Date(value.startDate).getTime(), {
    message: "End date must be on or after start date",
    path: ["endDate"]
  });

export const tournamentRegistrationRequestSchema = z
  .object({
    name: z.string().min(4),
    city: z.string().min(2),
    venue: z.string().min(3),
    format: z.string().min(2),
    overs: z.coerce.number().int().min(1).max(100),
    ballType: z.string().min(2),
    totalTeams: z.coerce.number().int().min(2).max(128),
    startDate: z.string().min(8),
    endDate: z.string().min(8)
  })
  .refine((value) => new Date(value.endDate).getTime() >= new Date(value.startDate).getTime(), {
    message: "End date must be on or after start date",
    path: ["endDate"]
  });

export const publicSignupSchema = z.object({
  name: z.string().min(3).max(80),
  email: z.string().email(),
  phone: z.string().min(6).max(20),
  password: z.string().min(8).max(128)
});

export const scorerCreateSchema = z.object({
  tournamentId: z.string().min(1),
  name: z.string().min(3).max(80),
  email: z.string().email(),
  phone: z.string().min(6).max(20),
  password: z.string().min(8).max(128)
});

export const scorerStatusSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED"])
});

export const scorerPasswordResetSchema = z.object({
  password: z.string().min(8).max(128)
});
