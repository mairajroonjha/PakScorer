import { z } from "zod";

export const tournamentRequestSchema = z.object({
  name: z.string().min(3),
  regionId: z.string().min(2)
});

export const playerCreateSchema = z.object({
  fullName: z.string().min(3)
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
  bowlerId: z.string().min(1),
  runs: z.number().int().min(0).max(6),
  isWicket: z.boolean(),
  extraType: z.enum(["WD", "NB", "LB", "B"]).optional(),
  wagonZone: z.string().min(1).optional(),
  commentaryText: z.string().max(160).optional()
});

export const commentarySchema = z.object({
  text: z.string().min(1).max(160)
});

export const correctionSchema = z.object({
  targetEventId: z.string().min(1),
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
  captainName: z.string().min(3),
  contactPhone: z.string().min(6),
  sponsorName: z.string().min(2).optional(),
  logoUrl: z.string().url().optional()
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

export const tournamentRegistrationRequestSchema = superTournamentCreateSchema;
