import type {
  PublicCenterMatch,
  PublicMatchCenterData,
  PublicMatchDetail,
  PublicPlayerProfile,
  PublicTournamentBoard
} from "@/lib/db-store";
import type { Player, PointsTableRow, Tournament } from "@/types/domain";

const players: Record<string, Player> = {
  "player-a": { id: "player-a", bcaId: "BCA-401", fullName: "Babar Rind", verificationStatus: "VERIFIED" },
  "player-b": { id: "player-b", bcaId: "BCA-402", fullName: "Hamza Ali", verificationStatus: "VERIFIED" },
  "player-c": { id: "player-c", bcaId: "BCA-403", fullName: "Fahad Noor", verificationStatus: "VERIFIED" },
  "player-d": { id: "player-d", bcaId: "BCA-404", fullName: "Kashif Hub", verificationStatus: "VERIFIED" }
};

const tournaments: Record<string, Tournament> = {
  "t-bpl-demo": {
    id: "t-bpl-demo",
    name: "Bela Premier League",
    regionId: "bela",
    city: "Bela",
    venue: "Bela Cricket Ground",
    format: "T20",
    overs: 20,
    ballType: "Tape Ball",
    tournamentType: "League",
    organizerName: "PakScorer Demo Ops",
    organizerPhone: "0300-0000000",
    sponsorName: "Makran Sports",
    totalTeams: 4,
    fixtureType: "ROUND_ROBIN",
    pointsWin: 2,
    pointsLoss: 0,
    pointsDraw: 1,
    pointsTie: 1,
    startDate: "2026-03-20T15:00:00.000Z",
    endDate: "2026-03-30T18:00:00.000Z",
    ruleSummary: "Static public tournament board for Cloudflare Pages.",
    adminUserId: "u-demo-tadmin",
    status: "APPROVED",
    requestedBy: "u-demo-organizer",
    approvedBy: "u-super"
  },
  "t-spring-demo": {
    id: "t-spring-demo",
    name: "Makran Spring Cup",
    regionId: "makran",
    city: "Hub",
    venue: "Hub Sports Complex",
    format: "T10",
    overs: 10,
    ballType: "Hard Ball",
    tournamentType: "Cup",
    organizerName: "PakScorer Demo Ops",
    organizerPhone: "0300-1111111",
    sponsorName: "Coastal Traders",
    totalTeams: 4,
    fixtureType: "GROUP_STAGE",
    pointsWin: 2,
    pointsLoss: 0,
    pointsDraw: 1,
    pointsTie: 1,
    startDate: "2026-03-25T12:00:00.000Z",
    endDate: "2026-04-02T18:00:00.000Z",
    ruleSummary: "Upcoming showcase cup for static export.",
    adminUserId: "u-demo-tadmin",
    status: "APPROVED",
    requestedBy: "u-demo-organizer",
    approvedBy: "u-super"
  }
};

const liveMatch: PublicCenterMatch = {
  id: "m-live-demo",
  tournamentId: "t-bpl-demo",
  tournamentName: tournaments["t-bpl-demo"].name,
  seriesLabel: "Bela Premier League 2026",
  mode: "TOURNAMENT",
  state: "LIVE",
  teamAId: "team-bela-warriors",
  teamAName: "Bela Warriors",
  teamBId: "team-coastal-strikers",
  teamBName: "Coastal Strikers",
  venue: "Bela Cricket Ground",
  startAt: "2026-03-24T15:30:00.000Z",
  scoreText: "86/3 (11.2)",
  statusText: "Bela Warriors need 42 runs in 52 balls"
};

const upcomingMatch: PublicCenterMatch = {
  id: "m-upcoming-demo",
  tournamentId: "t-spring-demo",
  tournamentName: tournaments["t-spring-demo"].name,
  seriesLabel: "Makran Spring Cup 2026",
  mode: "TOURNAMENT",
  state: "SCHEDULED",
  teamAId: "team-makran-falcons",
  teamAName: "Makran Falcons",
  teamBId: "team-hub-stallions",
  teamBName: "Hub Stallions",
  venue: "Hub Sports Complex",
  startAt: "2026-03-25T14:00:00.000Z",
  scoreText: "Starts 7:00 PM PKT",
  statusText: "Starting soon"
};

const finishedMatch: PublicCenterMatch = {
  id: "m-finished-demo",
  tournamentId: "t-bpl-demo",
  tournamentName: tournaments["t-bpl-demo"].name,
  seriesLabel: "Bela Premier League 2026",
  mode: "TOURNAMENT",
  state: "COMPLETED",
  teamAId: "team-hub-stallions",
  teamAName: "Hub Stallions",
  teamBId: "team-lasbela-sharks",
  teamBName: "Lasbela Sharks",
  venue: "Uthal City Ground",
  startAt: "2026-03-23T15:00:00.000Z",
  scoreText: "Hub Stallions 144/6 - Lasbela Sharks 139/9",
  statusText: "Completed",
  resultText: "Hub Stallions won by 5 runs"
};

function teamRow(
  id: string,
  tournamentId: string,
  teamId: string,
  teamName: string,
  played: number,
  won: number,
  lost: number,
  points: number,
  netRunRate: number,
  position: number
): PointsTableRow & { teamName: string } {
  return {
    id,
    tournamentId,
    teamId,
    teamName,
    played,
    won,
    lost,
    drawn: 0,
    tied: 0,
    noResult: 0,
    points,
    runsFor: 0,
    oversFacedBalls: 0,
    runsAgainst: 0,
    oversBowledBalls: 0,
    netRunRate,
    position
  };
}

const tournamentBoards: PublicTournamentBoard[] = [
  {
    tournament: tournaments["t-bpl-demo"],
    liveMatches: [liveMatch],
    upcomingMatches: [],
    finishedMatches: [finishedMatch],
    pointsTable: [
      teamRow("pt1", "t-bpl-demo", "team-bela-warriors", "Bela Warriors", 3, 2, 1, 4, 1.2, 1),
      teamRow("pt2", "t-bpl-demo", "team-coastal-strikers", "Coastal Strikers", 3, 2, 1, 4, 0.18, 2),
      teamRow("pt3", "t-bpl-demo", "team-hub-stallions", "Hub Stallions", 4, 1, 3, 2, -0.7, 3)
    ],
    rankings: {
      runs: [
        { playerId: "player-a", playerName: players["player-a"].fullName, runs: 178 },
        { playerId: "player-c", playerName: players["player-c"].fullName, runs: 161 }
      ],
      wickets: [
        { playerId: "player-c", playerName: players["player-c"].fullName, wickets: 9 },
        { playerId: "player-d", playerName: players["player-d"].fullName, wickets: 6 }
      ]
    }
  },
  {
    tournament: tournaments["t-spring-demo"],
    liveMatches: [],
    upcomingMatches: [upcomingMatch],
    finishedMatches: [],
    pointsTable: [
      teamRow("pt4", "t-spring-demo", "team-makran-falcons", "Makran Falcons", 0, 0, 0, 0, 0, 1),
      teamRow("pt5", "t-spring-demo", "team-hub-stallions", "Hub Stallions", 0, 0, 0, 0, 0, 2)
    ],
    rankings: {
      runs: [{ playerId: "player-a", playerName: players["player-a"].fullName, runs: 0 }],
      wickets: [{ playerId: "player-d", playerName: players["player-d"].fullName, wickets: 0 }]
    }
  }
];

const liveDetail: PublicMatchDetail = {
  match: {
    ...liveMatch,
    scheduledOvers: 20,
    ballsPerOver: 6,
    currentInnings: 2,
    tossWinnerTeamName: "Bela Warriors",
    electedTo: "BAT",
    targetRuns: 128
  },
  tournament: tournaments["t-bpl-demo"],
  teamA: {
    id: "team-bela-warriors",
    name: "Bela Warriors",
    city: "Bela",
    captainName: "Babar Rind"
  },
  teamB: {
    id: "team-coastal-strikers",
    name: "Coastal Strikers",
    city: "Bela",
    captainName: "Fahad Noor"
  },
  squads: {
    teamA: [
      { playerId: "player-a", name: players["player-a"].fullName, role: "Captain" },
      { playerId: "player-b", name: players["player-b"].fullName, role: "Opening Batter" }
    ],
    teamB: [
      { playerId: "player-c", name: players["player-c"].fullName, role: "Strike Bowler" },
      { playerId: "player-d", name: players["player-d"].fullName, role: "All-Rounder" }
    ]
  },
  form: {
    teamA: [
      { label: "W", tone: "win", result: "Beat Hub Stallions by 18 runs" },
      { label: "L", tone: "loss", result: "Lost to Coastal Strikers by 4 wickets" }
    ],
    teamB: [
      { label: "W", tone: "win", result: "Beat Bela Warriors by 4 wickets" },
      { label: "W", tone: "win", result: "Beat Lasbela Sharks by 6 wickets" }
    ]
  },
  headToHead: { winsA: 2, winsB: 1 },
  recentHeadToHead: [
    {
      id: "hh1",
      title: "Bela Warriors vs Coastal Strikers",
      result: "Coastal Strikers won by 4 wickets",
      startAt: "2026-03-21T15:00:00.000Z"
    }
  ],
  comparison: {
    teamA: {
      matchesPlayed: 6,
      wins: 4,
      losses: 2,
      tournamentPoints: 4,
      netRunRate: 1.2,
      lastResult: "Beat Hub Stallions by 18 runs"
    },
    teamB: {
      matchesPlayed: 6,
      wins: 4,
      losses: 2,
      tournamentPoints: 4,
      netRunRate: 0.18,
      lastResult: "Beat Lasbela Sharks by 6 wickets"
    }
  },
  score: {
    runs: 86,
    wickets: 3,
    balls: 68,
    oversLabel: "11.2",
    currentRunRate: 7.59,
    batterSpotlight: {
      playerId: "player-a",
      name: players["player-a"].fullName,
      runs: 42,
      balls: 31,
      strikeRate: 135.5
    },
    bowlerSpotlight: {
      playerId: "player-c",
      name: players["player-c"].fullName,
      wickets: 2,
      runsConceded: 18,
      balls: 20,
      oversLabel: "3.2",
      economy: 5.4
    }
  },
  recentBalls: [
    {
      id: "ball1",
      overBall: "10.3",
      batterId: "player-a",
      batterName: players["player-a"].fullName,
      bowlerId: "player-c",
      bowlerName: players["player-c"].fullName,
      text: "FOUR! Sliced over cover to keep the chase moving.",
      createdAt: "2026-03-24T16:24:00.000Z"
    }
  ],
  wagonWheel: [
    { zone: "Cover", runs: 16, balls: 7 },
    { zone: "Mid-wicket", runs: 20, balls: 6 }
  ],
  venue: {
    name: "Bela Cricket Ground",
    matchesHosted: 6,
    averageScore: 141,
    highestScore: 182,
    lowestScore: 109,
    pitchReport: "Balanced tape-ball surface where clean hitting and cutters both stay relevant.",
    conditionsNote: "The chase stays alive under lights, but slower balls grip after the tenth over.",
    recentMatches: [
      {
        id: "m-finished-demo",
        title: "Hub Stallions vs Lasbela Sharks",
        result: "Hub Stallions won by 5 runs",
        startAt: "2026-03-23T15:00:00.000Z"
      }
    ]
  },
  matchCenter: {
    summaryText: "Bela Warriors need 42 from 52 balls with seven wickets in hand.",
    lastSixBalls: [
      { ballId: "l1", label: "1", tone: "run" },
      { ballId: "l2", label: "4", tone: "boundary" },
      { ballId: "l3", label: "0", tone: "dot" },
      { ballId: "l4", label: "W", tone: "wicket" },
      { ballId: "l5", label: "2", tone: "run" },
      { ballId: "l6", label: "1", tone: "run" }
    ],
    projectedScore: 129,
    currentPartnership: { runs: 18, balls: 14 },
    lastWicket: "Hamza Ali 19 (14) c deep mid-wicket b Fahad Noor",
    battingNow: [
      {
        playerId: "player-a",
        name: players["player-a"].fullName,
        runs: 42,
        balls: 31,
        fours: 4,
        sixes: 1,
        strikeRate: 135.5,
        isOnStrike: true,
        status: "batting"
      },
      {
        playerId: "player-b",
        name: players["player-b"].fullName,
        runs: 11,
        balls: 8,
        fours: 1,
        sixes: 0,
        strikeRate: 137.5,
        isOnStrike: false,
        status: "batting"
      }
    ],
    bowlingNow: {
      playerId: "player-c",
      name: players["player-c"].fullName,
      overs: "3.2",
      maidens: 0,
      runs: 18,
      wickets: 2,
      economy: 5.4
    },
    scorecard: {
      batting: [
        {
          playerId: "player-a",
          name: players["player-a"].fullName,
          runs: 42,
          balls: 31,
          fours: 4,
          sixes: 1,
          strikeRate: 135.5,
          dismissalText: "Not out"
        },
        {
          playerId: "player-b",
          name: players["player-b"].fullName,
          runs: 19,
          balls: 14,
          fours: 2,
          sixes: 1,
          strikeRate: 135.7,
          dismissalText: "c deep mid-wicket b Fahad Noor"
        }
      ],
      bowling: [
        {
          playerId: "player-c",
          name: players["player-c"].fullName,
          overs: "3.2",
          maidens: 0,
          runs: 18,
          wickets: 2,
          economy: 5.4
        },
        {
          playerId: "player-d",
          name: players["player-d"].fullName,
          overs: "4.0",
          maidens: 0,
          runs: 28,
          wickets: 1,
          economy: 7
        }
      ]
    },
    stats: {
      winProbability: { teamA: 63, teamB: 37 },
      runRateBars: [
        { label: "Current RR", teamA: 7.59, teamB: 6.8 },
        { label: "Required RR", teamA: 7.59, teamB: 4.85 },
        { label: "Projected", teamA: 129, teamB: 128 }
      ],
      requirements: {
        target: 128,
        runsNeeded: 42,
        ballsRemaining: 52,
        requiredRate: 4.85,
        currentRate: 7.59,
        pressure: "Balanced"
      },
      runFlow: [
        { over: 1, total: 9, overRuns: 9 },
        { over: 2, total: 17, overRuns: 8 },
        { over: 3, total: 28, overRuns: 11 },
        { over: 4, total: 37, overRuns: 9 },
        { over: 5, total: 46, overRuns: 9 }
      ],
      phaseBreakdown: [
        { label: "Powerplay", runs: 46, wickets: 1, balls: 36, runRate: 7.66 },
        { label: "Middle", runs: 40, wickets: 2, balls: 32, runRate: 7.5 },
        { label: "Death", runs: 0, wickets: 0, balls: 0, runRate: 0 }
      ],
      ballOutcomeSplit: [
        { label: "Dots", value: 18, tone: "dot" },
        { label: "Singles/2s/3s", value: 23, tone: "run" },
        { label: "Boundaries", value: 8, tone: "boundary" },
        { label: "Wickets", value: 3, tone: "wicket" }
      ],
      analysisNotes: [
        "The chase is ahead of the asking rate, but one wicket can reset the pressure instantly.",
        "Bela Warriors have targeted cover and mid-wicket well against pace off the ball.",
        "This is static showcase data for Cloudflare Pages."
      ]
    },
    playerOfTheMatch: {
      playerId: "player-a",
      name: players["player-a"].fullName,
      summary: "42* in the chase with control against spin and pace-off bowling."
    }
  }
};

const upcomingDetail: PublicMatchDetail = {
  ...liveDetail,
  match: {
    ...upcomingMatch,
    scheduledOvers: 10,
    ballsPerOver: 6,
    currentInnings: 1
  },
  tournament: tournaments["t-spring-demo"],
  matchCenter: {
    ...liveDetail.matchCenter,
    summaryText: "Lineups and toss will appear once matchday begins.",
    lastSixBalls: [],
    projectedScore: undefined,
    currentPartnership: { runs: 0, balls: 0 },
    lastWicket: undefined,
    battingNow: [],
    bowlingNow: undefined,
    scorecard: { batting: [], bowling: [] },
    stats: {
      ...liveDetail.matchCenter.stats,
      winProbability: { teamA: 50, teamB: 50 },
      requirements: undefined,
      runFlow: [],
      ballOutcomeSplit: [
        { label: "Dots", value: 0, tone: "dot" },
        { label: "Singles/2s/3s", value: 0, tone: "run" },
        { label: "Boundaries", value: 0, tone: "boundary" },
        { label: "Wickets", value: 0, tone: "wicket" }
      ],
      analysisNotes: [
        "Upcoming fixture preview only.",
        "Toss, lineups, and venue conditions will update on Worker deployment.",
        "Static Pages build keeps this route browseable."
      ]
    }
  },
  score: { runs: 0, wickets: 0, balls: 0, oversLabel: "0.0", currentRunRate: 0 },
  recentBalls: [],
  wagonWheel: []
};

const finishedDetail: PublicMatchDetail = {
  ...liveDetail,
  match: {
    ...finishedMatch,
    scheduledOvers: 20,
    ballsPerOver: 6,
    currentInnings: 2,
    tossWinnerTeamName: "Lasbela Sharks",
    electedTo: "BOWL",
    targetRuns: 145,
    winnerTeamName: "Hub Stallions"
  },
  tournament: tournaments["t-bpl-demo"],
  matchCenter: {
    ...liveDetail.matchCenter,
    summaryText: "Hub Stallions defended 144 and closed the match by 5 runs.",
    playerOfTheMatch: {
      playerId: "player-d",
      name: players["player-d"].fullName,
      summary: "3 wickets in the defense and controlled death overs."
    }
  }
};

const matchDetails: Record<string, PublicMatchDetail> = {
  "m-live-demo": liveDetail,
  "m-upcoming-demo": upcomingDetail,
  "m-finished-demo": finishedDetail
};

const playerProfiles: Record<string, PublicPlayerProfile> = {
  "player-a": {
    player: players["player-a"],
    teams: [{ id: "team-bela-warriors", name: "Bela Warriors" }],
    tournaments: [{ id: "t-bpl-demo", name: "Bela Premier League" }],
    summary: {
      roleLabel: "Top-order Batter",
      matchesPlayed: 7,
      runs: 178,
      ballsFaced: 132,
      strikeRate: 134.84,
      fours: 18,
      sixes: 7,
      wickets: 0,
      ballsBowled: 0,
      oversBowled: "0.0",
      economy: 0,
      bestScore: 68,
      bestBowling: "0/0"
    },
    recentMatches: [{ matchId: "m-live-demo", title: "Bela Warriors vs Coastal Strikers", date: "2026-03-24T15:30:00.000Z", runs: 42, ballsFaced: 31, wickets: 0, runsConceded: 0 }]
  },
  "player-b": {
    player: players["player-b"],
    teams: [{ id: "team-bela-warriors", name: "Bela Warriors" }],
    tournaments: [{ id: "t-bpl-demo", name: "Bela Premier League" }],
    summary: {
      roleLabel: "Middle-order Batter",
      matchesPlayed: 6,
      runs: 121,
      ballsFaced: 94,
      strikeRate: 128.72,
      fours: 9,
      sixes: 4,
      wickets: 0,
      ballsBowled: 0,
      oversBowled: "0.0",
      economy: 0,
      bestScore: 41,
      bestBowling: "0/0"
    },
    recentMatches: [{ matchId: "m-live-demo", title: "Bela Warriors vs Coastal Strikers", date: "2026-03-24T15:30:00.000Z", runs: 19, ballsFaced: 14, wickets: 0, runsConceded: 0 }]
  },
  "player-c": {
    player: players["player-c"],
    teams: [{ id: "team-coastal-strikers", name: "Coastal Strikers" }],
    tournaments: [{ id: "t-bpl-demo", name: "Bela Premier League" }],
    summary: {
      roleLabel: "Strike Bowler",
      matchesPlayed: 6,
      runs: 21,
      ballsFaced: 16,
      strikeRate: 131.25,
      fours: 2,
      sixes: 0,
      wickets: 9,
      ballsBowled: 126,
      oversBowled: "21.0",
      economy: 6.18,
      bestScore: 12,
      bestBowling: "3/18"
    },
    recentMatches: [{ matchId: "m-live-demo", title: "Bela Warriors vs Coastal Strikers", date: "2026-03-24T15:30:00.000Z", runs: 0, ballsFaced: 0, wickets: 2, runsConceded: 18 }]
  },
  "player-d": {
    player: players["player-d"],
    teams: [{ id: "team-hub-stallions", name: "Hub Stallions" }],
    tournaments: [{ id: "t-bpl-demo", name: "Bela Premier League" }],
    summary: {
      roleLabel: "Bowler",
      matchesPlayed: 5,
      runs: 12,
      ballsFaced: 10,
      strikeRate: 120,
      fours: 1,
      sixes: 0,
      wickets: 6,
      ballsBowled: 96,
      oversBowled: "16.0",
      economy: 6.62,
      bestScore: 8,
      bestBowling: "3/24"
    },
    recentMatches: [{ matchId: "m-finished-demo", title: "Hub Stallions vs Lasbela Sharks", date: "2026-03-23T15:00:00.000Z", runs: 0, ballsFaced: 0, wickets: 3, runsConceded: 24 }]
  }
};

export function getStaticPublicMatchCenterData(): PublicMatchCenterData {
  return {
    overview: {
      news: [
        {
          id: "news-1",
          title: "Bela Premier League enters the pressure week",
          body: "Static Pages demo is showing a live chase and a completed result while Worker features stay offline.",
          publishedAt: "2026-03-24T10:00:00.000Z"
        },
        {
          id: "news-2",
          title: "Makran Spring Cup fixtures published",
          body: "Upcoming cards now highlight start time, format, venue, and tournament presentation.",
          publishedAt: "2026-03-24T08:00:00.000Z"
        }
      ],
      leaderboard: {
        entries: [
          { id: "lb-1", subjectId: "player-a", label: players["player-a"].fullName, metric: "RUNS", value: 178 },
          { id: "lb-2", subjectId: "player-c", label: players["player-c"].fullName, metric: "WICKETS", value: 9 },
          { id: "lb-3", subjectId: "team-bela-warriors", label: "Bela Warriors", metric: "POINTS", value: 4 }
        ]
      }
    },
    liveMatches: [liveMatch],
    upcomingMatches: [upcomingMatch],
    finishedMatches: [finishedMatch],
    tournamentBoards
  };
}

export function getStaticPublicMatchDetailData(matchId: string): PublicMatchDetail | undefined {
  return matchDetails[matchId];
}

export function getStaticPublicPlayerProfileData(playerId: string): PublicPlayerProfile | undefined {
  return playerProfiles[playerId];
}

export function getStaticPublicMatchIds(): string[] {
  return Object.keys(matchDetails);
}

export function getStaticPublicPlayerIds(): string[] {
  return Object.keys(playerProfiles);
}
