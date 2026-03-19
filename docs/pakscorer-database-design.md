# PakScorer Database Design

This document maps the PakScorer product blueprint to a practical database design for the current Prisma/PostgreSQL codebase.

## Goal

Support:

- multi-tier admin control
- tournament approval and management
- automatic fixture generation
- flexible friendly matches and custom overs
- ball-by-ball scoring
- points table and NRR
- player rankings and performance history
- notifications and shareable scorecards

## Current Schema Coverage

The current schema already gives a solid base:

- `User`
- `Tournament`
- `TournamentRegistrationRequest`
- `Team`
- `Player`
- `SquadEntry`
- `Match`
- `DirectMatchRequest`
- `BallEvent`
- `ScoreCorrection`
- `LeaderboardSnapshot`
- `LeaderboardEntry`
- `FanVote`
- `NewsPost`
- `AuditLog`

That base is enough for a prototype, but it does not fully model:

- scorer assignment per match
- tournament stages and bracket generation
- custom match rules per match
- innings-level score state
- points table rows with NRR
- monthly ranking snapshots
- player match stats history
- notification delivery/subscriptions
- shareable scorecard assets

## Recommended Design Direction

Keep the current tables, but extend the schema with a few explicit domain tables instead of overloading `Match` and `LeaderboardSnapshot`.

## Core Domain Tables

### 1. `User`

Purpose: identity plus role control.

Recommended fields:

- `id`
- `name`
- `email`
- `phone`
- `passwordHash`
- `image`
- `role`
- `status` (`ACTIVE`, `BLOCKED`, `PENDING`)
- `regionId`
- `createdAt`
- `updatedAt`
- `blockedAt`
- `blockedReason`

Notes:

- current schema already covers most of this
- `status` should be added for Super Admin control

### 2. `TournamentRegistrationRequest`

Purpose: request submitted by clubs before approval.

Recommended fields:

- `id`
- organizer identity fields
- tournament meta fields
- `status`
- `submittedAt`
- `reviewedAt`
- `reviewedBy`
- `rejectionReason`

Notes:

- this table already exists and is aligned

### 3. `Tournament`

Purpose: approved competition container.

Recommended fields:

- `id`
- `name`
- `regionId`
- `city`
- `venue`
- `format`
- `overs`
- `ballType`
- `tournamentType`
- `totalTeams`
- `startDate`
- `endDate`
- `status`
- `requestedBy`
- `approvedBy`
- `adminUserId`
- `ruleSummary`
- `fixtureType` (`ROUND_ROBIN`, `KNOCKOUT`, `GROUP_STAGE`, `HYBRID`)
- `pointsWin`
- `pointsLoss`
- `pointsDraw`
- `pointsTie`
- `createdAt`
- `updatedAt`

Why:

- points rules should not be hardcoded
- fixture type is required for automatic scheduling

### 4. `TournamentStage`

Purpose: separate group stage, semifinal, final, knockout rounds.

Recommended fields:

- `id`
- `tournamentId`
- `name`
- `stageType` (`GROUP`, `ROUND_OF_16`, `QUARTER_FINAL`, `SEMI_FINAL`, `FINAL`, `LEAGUE`)
- `sequence`
- `groupLabel`
- `createdAt`

Why:

- needed for bracket generation and stage-aware fixtures

### 5. `Team`

Purpose: club/team identity.

Recommended fields:

- `id`
- `name`
- `shortName`
- `logoUrl`
- `city`
- `captainName`
- `contactPhone`
- `sponsorName`
- `ownerUserId`
- `createdAt`
- `updatedAt`

Notes:

- team should stay globally reusable
- current `tournamentId` on `Team` is too restrictive for teams joining multiple tournaments over time

Recommendation:

- keep `Team` global
- use join tables for tournament participation

### 6. `TournamentTeam`

Purpose: team participation in a tournament.

Recommended fields:

- `id`
- `tournamentId`
- `teamId`
- `status` (`PENDING`, `APPROVED`, `REJECTED`, `WITHDRAWN`)
- `seed`
- `groupLabel`
- `appliedAt`
- `approvedAt`
- `approvedBy`

Why:

- cleaner than storing `tournamentId` directly on `Team`
- needed for seeding and group allocation

### 7. `Player`

Purpose: player master record.

Recommended fields:

- `id`
- `bcaId`
- `fullName`
- `dateOfBirth`
- `battingStyle`
- `bowlingStyle`
- `primaryRole` (`BATTER`, `BOWLER`, `ALL_ROUNDER`, `WICKET_KEEPER`)
- `cnicOrIdNumber`
- `photoUrl`
- `verificationStatus`
- `createdAt`
- `updatedAt`

Why:

- monthly rankings and career history need a stable player master

### 8. `TeamPlayer`

Purpose: player belonging to a team over time.

Recommended fields:

- `id`
- `teamId`
- `playerId`
- `shirtNumber`
- `isCaptain`
- `isWicketKeeper`
- `joinedAt`
- `leftAt`

Why:

- separate long-term roster from tournament-specific squad

### 9. `SquadEntry`

Purpose: tournament-specific approved squad.

Recommended fields:

- `id`
- `tournamentId`
- `teamId`
- `playerId`
- `createdAt`
- `createdBy`

Notes:

- this already exists and should remain
- keep unique constraint on `[playerId, tournamentId]`

## Match and Scoring Tables

### 10. `Match`

Purpose: fixture or friendly match.

Recommended fields:

- `id`
- `tournamentId` nullable
- `stageId` nullable
- `teamAId`
- `teamBId`
- `mode` (`TOURNAMENT`, `DIRECT`, `FRIENDLY`)
- `state` (`SCHEDULED`, `LIVE`, `INNINGS_BREAK`, `COMPLETED`, `ABANDONED`, `CANCELLED`)
- `venue`
- `startAt`
- `scheduledOvers`
- `ballsPerOver`
- `powerplayOvers`
- `maxOversPerBowler`
- `allowSuperOver`
- `squadLockAt`
- `tossWinnerTeamId`
- `electedTo`
- `winnerTeamId`
- `winType` (`RUNS`, `WICKETS`, `TIE`, `NO_RESULT`)
- `winMarginRuns`
- `winMarginWickets`
- `targetRuns`
- `currentInnings`
- `createdAt`
- `updatedAt`

Why:

- current `Match` is missing the custom rules that your blueprint needs

### 11. `MatchOfficialAssignment`

Purpose: assign scorer/admin to a specific match.

Recommended fields:

- `id`
- `matchId`
- `userId`
- `assignmentRole` (`SCORER`, `UMPIRE`, `TOURNAMENT_ADMIN`)
- `assignedAt`
- `assignedBy`

Why:

- match scorer should only control assigned matches

### 12. `MatchInnings`

Purpose: innings-level state.

Recommended fields:

- `id`
- `matchId`
- `inningsNumber`
- `battingTeamId`
- `bowlingTeamId`
- `runs`
- `wickets`
- `balls`
- `extras`
- `byes`
- `legByes`
- `wides`
- `noBalls`
- `target`
- `startedAt`
- `endedAt`
- `isCompleted`

Why:

- makes target calculation and innings swap reliable

### 13. `BallEvent`

Purpose: immutable ball-by-ball feed.

Recommended fields:

- `id`
- `matchId`
- `inningsId`
- `over`
- `ball`
- `legalBallNumber`
- `strikerId`
- `nonStrikerId`
- `bowlerId`
- `runsBat`
- `extras`
- `extraType`
- `isWicket`
- `wicketType`
- `outPlayerId`
- `newBatterId`
- `wagonZone`
- `commentaryText`
- `createdBy`
- `createdAt`
- `isUndo`
- `undoOfEventId`

Why:

- explicit undo chain is safer than mutating the last record

### 14. `ScoreCorrection`

Purpose: audit-safe correction flow.

Recommended fields:

- `id`
- `matchId`
- `targetEventId`
- `reason`
- `requestedBy`
- `approvedBy`
- `status`
- `approvedAt`
- `createdAt`

Notes:

- current schema already has the base
- add `status` and `createdAt`

## Scheduling and Results Tables

### 15. `FixtureTemplate` optional

Purpose: reusable generator output or schedule rules.

Recommended fields:

- `id`
- `tournamentId`
- `fixtureType`
- `teamsCount`
- `generatedAt`
- `generatedBy`
- `metaJson`

Why:

- useful if you want to regenerate schedules predictably

### 16. `PointsTableRow`

Purpose: cached standings for tournament teams.

Recommended fields:

- `id`
- `tournamentId`
- `teamId`
- `played`
- `won`
- `lost`
- `drawn`
- `tied`
- `noResult`
- `points`
- `runsFor`
- `oversFacedBalls`
- `runsAgainst`
- `oversBowledBalls`
- `netRunRate`
- `position`
- `updatedAt`

Why:

- this should be stored explicitly, not inferred every page load

### 17. `MatchResultAudit`

Purpose: track recalculations that changed standings or rankings.

Recommended fields:

- `id`
- `matchId`
- `action` (`MATCH_COMPLETED`, `RESULT_EDITED`, `TABLE_RECALCULATED`, `RANKINGS_RECALCULATED`)
- `metaJson`
- `createdAt`
- `createdBy`

## Rankings and History Tables

### 18. `PlayerMatchStat`

Purpose: per-player stat line after each match.

Recommended fields:

- `id`
- `matchId`
- `playerId`
- `teamId`
- `inningsId` nullable
- batting metrics
- bowling metrics
- fielding metrics
- strike rate
- economy
- fantasy/performance rating
- `createdAt`

Why:

- performance graph should not be recomputed from raw events every time

### 19. `PlayerCareerStat`

Purpose: denormalized all-time totals.

Recommended fields:

- `playerId`
- `matches`
- `innings`
- `runs`
- `ballsFaced`
- `fours`
- `sixes`
- `wickets`
- `ballsBowled`
- `runsConceded`
- `catches`
- `stumpings`
- `battingAverage`
- `strikeRate`
- `bowlingAverage`
- `economy`
- `updatedAt`

Why:

- profile pages become fast and cheap

### 20. `RankingSnapshot`

Purpose: monthly ranking publication.

Recommended fields:

- `id`
- `scope` (`GLOBAL`, `REGION`, `TOURNAMENT`)
- `regionId` nullable
- `tournamentId` nullable
- `category` (`BATTER`, `BOWLER`, `ALL_ROUNDER`, `TEAM`)
- `month`
- `year`
- `publishedAt`
- `algorithmVersion`

### 21. `RankingEntry`

Purpose: each ranked row inside a snapshot.

Recommended fields:

- `id`
- `snapshotId`
- `subjectType` (`PLAYER`, `TEAM`)
- `subjectId`
- `rank`
- `previousRank`
- `rankChange`
- `rating`
- `trend` (`UP`, `DOWN`, `SAME`, `NEW`)
- `statsJson`

Why:

- directly supports green up arrow and red down arrow UI

## Viewer and Distribution Tables

### 22. `NotificationSubscription`

Purpose: push notification registration.

Recommended fields:

- `id`
- `userId` nullable
- `deviceHash`
- `endpoint`
- `p256dh`
- `auth`
- `platform`
- `createdAt`
- `lastSeenAt`
- `isActive`

### 23. `NotificationEvent`

Purpose: sendable event queue.

Recommended fields:

- `id`
- `type` (`WICKET`, `MILESTONE`, `RESULT`, `TOURNAMENT_LIVE`)
- `matchId` nullable
- `tournamentId` nullable
- `title`
- `message`
- `payloadJson`
- `createdAt`
- `sentAt` nullable

### 24. `ShareableAsset`

Purpose: generated scorecard image/social asset.

Recommended fields:

- `id`
- `matchId`
- `assetType` (`SCORECARD_IMAGE`, `RESULT_CARD`, `POINTS_TABLE_IMAGE`)
- `storageUrl`
- `checksum`
- `generatedAt`
- `generatedBy`

## Recommended Enums

Suggested additions:

- `UserStatus`
- `TournamentFixtureType`
- `TournamentStageType`
- `MatchAssignmentRole`
- `MatchWinType`
- `WicketType`
- `RankingCategory`
- `RankingTrend`
- `NotificationType`
- `ShareableAssetType`

## Relationship Summary

High-level relationship flow:

1. `User` submits `TournamentRegistrationRequest`
2. approved request becomes `Tournament`
3. `Tournament` has many `TournamentStage`
4. `Tournament` has many `TournamentTeam`
5. `Team` has many `TeamPlayer`
6. `TournamentTeam` has many `SquadEntry`
7. `Tournament` or friendly flow creates `Match`
8. `Match` has many `MatchOfficialAssignment`
9. `Match` has one or two `MatchInnings`
10. `MatchInnings` has many `BallEvent`
11. completed `Match` updates `PointsTableRow`
12. completed `Match` produces `PlayerMatchStat`
13. periodic jobs generate `RankingSnapshot` and `RankingEntry`
14. notable events create `NotificationEvent` and `ShareableAsset`

## Recommended Prisma Refactor Order

Do this in phases, not one migration:

### Phase 1

- add `User.status`
- extend `Tournament`
- extend `Match`
- add `MatchOfficialAssignment`
- add `MatchInnings`
- extend `BallEvent`
- extend `ScoreCorrection`

### Phase 2

- add `TournamentStage`
- add `TournamentTeam`
- move `Team.tournamentId` usage toward join-table model
- add `PointsTableRow`

### Phase 3

- add `PlayerMatchStat`
- add `PlayerCareerStat`
- replace generic leaderboard storage with `RankingSnapshot` and `RankingEntry`

### Phase 4

- add `NotificationSubscription`
- add `NotificationEvent`
- add `ShareableAsset`

## Practical Advice for This Repo

For the current codebase, the safest next schema changes are:

1. Add `MatchInnings`
2. Add custom match-rule columns to `Match`
3. Add `MatchOfficialAssignment`
4. Add `PointsTableRow`
5. Add ranking tables

That gives you the biggest product coverage without forcing a full rewrite of existing routes.
