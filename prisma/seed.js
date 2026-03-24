/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const { hashSync } = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      id: "u-super",
      name: "Super Admin",
      email: "super@pakscorer.local",
      phone: "03000000001",
      passwordHash: hashSync("Pakscorer!Super1", 10),
      role: "SUPER_ADMIN",
      regionId: "bela"
    },
    {
      id: "u-tadmin",
      name: "Tournament Admin",
      email: "tournament@pakscorer.local",
      phone: "03000000002",
      passwordHash: hashSync("Pakscorer!Tournament1", 10),
      role: "TOURNAMENT_ADMIN",
      regionId: "bela"
    },
    {
      id: "u-teamadmin",
      name: "Team Admin",
      email: "team@pakscorer.local",
      phone: "03000000003",
      passwordHash: hashSync("Pakscorer!Team1", 10),
      role: "TEAM_ADMIN",
      regionId: "bela"
    },
    {
      id: "u-scorer",
      name: "Ground Scorer",
      email: "scorer@pakscorer.local",
      phone: "03000000004",
      passwordHash: hashSync("Pakscorer!Scorer1", 10),
      role: "MATCH_SCORER",
      regionId: "bela"
    },
    {
      id: "u-public",
      name: "Public Viewer",
      email: "public@pakscorer.local",
      phone: "03000000005",
      passwordHash: hashSync("Pakscorer!Public1", 10),
      role: "PUBLIC_VIEWER",
      regionId: "bela"
    }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        passwordHash: user.passwordHash,
        role: user.role,
        regionId: user.regionId
      },
      create: user
    });
  }

  await prisma.tournament.upsert({
    where: { id: "t-1" },
    update: {
      fixtureType: "ROUND_ROBIN",
      pointsWin: 2,
      pointsLoss: 0,
      pointsDraw: 1,
      pointsTie: 1
    },
    create: {
      id: "t-1",
      name: "Bela Champions Cup",
      regionId: "bela",
      city: "Bela",
      venue: "BCA Ground",
      format: "T20",
      overs: 20,
      ballType: "Tape Ball",
      tournamentType: "League + Knockout",
      organizerName: "Bela Cricket Board",
      organizerPhone: "03005550000",
      sponsorName: "Makran Energy",
      totalTeams: 8,
      fixtureType: "ROUND_ROBIN",
      pointsWin: 2,
      pointsLoss: 0,
      pointsDraw: 1,
      pointsTie: 1,
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
      ruleSummary: "Verified players only. T20 format with points table and knockout finish.",
      adminUserId: "u-tadmin",
      status: "APPROVED",
      requestedBy: "u-super",
      approvedBy: "u-super",
      teams: {
        create: [
          {
            id: "team-a",
            name: "Bela Warriors",
            description: "Aggressive local club with a strong top order and coastal league experience.",
            sponsorName: "Coastal Cables",
            city: "Bela",
            ownerName: "Mairaj Roonjha",
            ownerEmail: "team@pakscorer.local",
            ownerPhone: "03000000003",
            captainName: "Ali Raza",
            contactPhone: "03001234567",
            managerName: "Kamran Baloch",
            managerPhone: "03008887771",
            homeGround: "BCA Ground",
            leagueAffiliation: "Bela Domestic League",
            inviteCode: "BELA-A1",
            ownerUserId: "u-teamadmin"
          },
          {
            id: "team-b",
            name: "Coastal Strikers",
            description: "Balanced side built around seam bowling and middle-order power.",
            sponsorName: "Makran Builders",
            city: "Hub",
            ownerName: "Tournament Desk",
            ownerEmail: "tournament@pakscorer.local",
            ownerPhone: "03000000002",
            captainName: "Bilal Ahmed",
            contactPhone: "03007654321",
            managerName: "Aamir Jamaldini",
            managerPhone: "03008887772",
            homeGround: "Makran Sports Oval",
            leagueAffiliation: "Hub Cricket Association",
            inviteCode: "COAS-B1",
            ownerUserId: "u-tadmin"
          }
        ]
      },
      matches: {
        create: [
          {
            id: "m-1",
            teamAId: "team-a",
            teamBId: "team-b",
            venue: "BCA Ground",
            state: "SCHEDULED",
            scheduledOvers: 20,
            ballsPerOver: 6,
            powerplayOvers: 6,
            maxOversPerBowler: 4,
            startAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
            squadLockAt: new Date(Date.now() + 90 * 60 * 1000)
          }
        ]
      }
    }
  });

  await prisma.team.upsert({
    where: { id: "team-a" },
    update: {
      name: "Bela Warriors",
      description: "Aggressive local club with a strong top order and coastal league experience.",
      sponsorName: "Coastal Cables",
      city: "Bela",
      ownerName: "Mairaj Roonjha",
      ownerEmail: "team@pakscorer.local",
      ownerPhone: "03000000003",
      captainName: "Ali Raza",
      contactPhone: "03001234567",
      managerName: "Kamran Baloch",
      managerPhone: "03008887771",
      homeGround: "BCA Ground",
      leagueAffiliation: "Bela Domestic League",
      inviteCode: "BELA-A1",
      ownerUserId: "u-teamadmin",
      tournamentId: "t-1"
    },
    create: {
      id: "team-a",
      name: "Bela Warriors",
      description: "Aggressive local club with a strong top order and coastal league experience.",
      sponsorName: "Coastal Cables",
      city: "Bela",
      ownerName: "Mairaj Roonjha",
      ownerEmail: "team@pakscorer.local",
      ownerPhone: "03000000003",
      captainName: "Ali Raza",
      contactPhone: "03001234567",
      managerName: "Kamran Baloch",
      managerPhone: "03008887771",
      homeGround: "BCA Ground",
      leagueAffiliation: "Bela Domestic League",
      inviteCode: "BELA-A1",
      ownerUserId: "u-teamadmin",
      tournamentId: "t-1"
    }
  });

  await prisma.team.upsert({
    where: { id: "team-b" },
    update: {
      name: "Coastal Strikers",
      description: "Balanced side built around seam bowling and middle-order power.",
      sponsorName: "Makran Builders",
      city: "Hub",
      ownerName: "Tournament Desk",
      ownerEmail: "tournament@pakscorer.local",
      ownerPhone: "03000000002",
      captainName: "Bilal Ahmed",
      contactPhone: "03007654321",
      managerName: "Aamir Jamaldini",
      managerPhone: "03008887772",
      homeGround: "Makran Sports Oval",
      leagueAffiliation: "Hub Cricket Association",
      inviteCode: "COAS-B1",
      ownerUserId: "u-tadmin",
      tournamentId: "t-1"
    },
    create: {
      id: "team-b",
      name: "Coastal Strikers",
      description: "Balanced side built around seam bowling and middle-order power.",
      sponsorName: "Makran Builders",
      city: "Hub",
      ownerName: "Tournament Desk",
      ownerEmail: "tournament@pakscorer.local",
      ownerPhone: "03000000002",
      captainName: "Bilal Ahmed",
      contactPhone: "03007654321",
      managerName: "Aamir Jamaldini",
      managerPhone: "03008887772",
      homeGround: "Makran Sports Oval",
      leagueAffiliation: "Hub Cricket Association",
      inviteCode: "COAS-B1",
      ownerUserId: "u-tadmin",
      tournamentId: "t-1"
    }
  });

  await prisma.team.upsert({
    where: { id: "team-c" },
    update: {
      name: "Lasbela Lions",
      description: "Travel-heavy club team used for friendly and direct match fixtures.",
      city: "Uthal",
      ownerName: "Super Admin Desk",
      ownerEmail: "super@pakscorer.local",
      ownerPhone: "03000000001",
      captainName: "Sajid Khan",
      contactPhone: "03110002222",
      managerName: "Arif Rind",
      managerPhone: "03008887773",
      homeGround: "Lasbela Sports Complex",
      leagueAffiliation: "Lasbela Open Circuit",
      inviteCode: "LASB-C1",
      ownerUserId: "u-super"
    },
    create: {
      id: "team-c",
      name: "Lasbela Lions",
      description: "Travel-heavy club team used for friendly and direct match fixtures.",
      city: "Uthal",
      ownerName: "Super Admin Desk",
      ownerEmail: "super@pakscorer.local",
      ownerPhone: "03000000001",
      captainName: "Sajid Khan",
      contactPhone: "03110002222",
      managerName: "Arif Rind",
      managerPhone: "03008887773",
      homeGround: "Lasbela Sports Complex",
      leagueAffiliation: "Lasbela Open Circuit",
      inviteCode: "LASB-C1",
      ownerUserId: "u-super"
    }
  });

  await prisma.match.upsert({
    where: { id: "m-1" },
    update: {
      venue: "BCA Ground",
      scheduledOvers: 20,
      ballsPerOver: 6,
      powerplayOvers: 6,
      maxOversPerBowler: 4,
      allowSuperOver: false
    },
    create: {
      id: "m-1",
      tournamentId: "t-1",
      teamAId: "team-a",
      teamBId: "team-b",
      venue: "BCA Ground",
      state: "SCHEDULED",
      mode: "TOURNAMENT",
      scheduledOvers: 20,
      ballsPerOver: 6,
      powerplayOvers: 6,
      maxOversPerBowler: 4,
      allowSuperOver: false,
      startAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      squadLockAt: new Date(Date.now() + 90 * 60 * 60 * 1000)
    }
  });

  await prisma.matchOfficialAssignment.upsert({
    where: {
      matchId_userId_assignmentRole: {
        matchId: "m-1",
        userId: "u-scorer",
        assignmentRole: "SCORER"
      }
    },
    update: {
      assignedBy: "u-tadmin"
    },
    create: {
      id: "assign-m1-scorer",
      matchId: "m-1",
      userId: "u-scorer",
      assignmentRole: "SCORER",
      assignedBy: "u-tadmin"
    }
  });

  for (const teamId of ["team-a", "team-b"]) {
    await prisma.pointsTableRow.upsert({
      where: {
        tournamentId_teamId: {
          tournamentId: "t-1",
          teamId
        }
      },
      update: {},
      create: {
        id: `ptr-${teamId}`,
        tournamentId: "t-1",
        teamId
      }
    });
  }

  const liveDemoPlayers = [
    { id: "p-demo-a-1", bcaId: "BCA-201", fullName: "Ahsan Baloch" },
    { id: "p-demo-a-2", bcaId: "BCA-202", fullName: "Umair Rind" },
    { id: "p-demo-a-3", bcaId: "BCA-203", fullName: "Danish Sheikh" },
    { id: "p-demo-a-4", bcaId: "BCA-204", fullName: "Samiullah Khan" },
    { id: "p-demo-a-5", bcaId: "BCA-205", fullName: "Faizan Lashari" },
    { id: "p-demo-a-6", bcaId: "BCA-206", fullName: "Hamza Jamali" },
    { id: "p-demo-b-1", bcaId: "BCA-207", fullName: "Razaq Mengal" },
    { id: "p-demo-b-2", bcaId: "BCA-208", fullName: "Yasir Bizenjo" },
    { id: "p-demo-b-3", bcaId: "BCA-209", fullName: "Naveed Sumalani" },
    { id: "p-demo-b-4", bcaId: "BCA-210", fullName: "Shahid Zehri" },
    { id: "p-demo-b-5", bcaId: "BCA-211", fullName: "Adnan Sajdi" },
    { id: "p-demo-b-6", bcaId: "BCA-212", fullName: "Imran Gichki" }
  ];

  for (const player of liveDemoPlayers) {
    await prisma.player.upsert({
      where: { id: player.id },
      update: {
        bcaId: player.bcaId,
        fullName: player.fullName,
        verificationStatus: "VERIFIED"
      },
      create: {
        ...player,
        verificationStatus: "VERIFIED"
      }
    });
  }

  const liveDemoSquadEntries = [
    { id: "sq-demo-a-1", teamId: "team-a", playerId: "p-demo-a-1" },
    { id: "sq-demo-a-2", teamId: "team-a", playerId: "p-demo-a-2" },
    { id: "sq-demo-a-3", teamId: "team-a", playerId: "p-demo-a-3" },
    { id: "sq-demo-a-4", teamId: "team-a", playerId: "p-demo-a-4" },
    { id: "sq-demo-a-5", teamId: "team-a", playerId: "p-demo-a-5" },
    { id: "sq-demo-a-6", teamId: "team-a", playerId: "p-demo-a-6" },
    { id: "sq-demo-b-1", teamId: "team-b", playerId: "p-demo-b-1" },
    { id: "sq-demo-b-2", teamId: "team-b", playerId: "p-demo-b-2" },
    { id: "sq-demo-b-3", teamId: "team-b", playerId: "p-demo-b-3" },
    { id: "sq-demo-b-4", teamId: "team-b", playerId: "p-demo-b-4" },
    { id: "sq-demo-b-5", teamId: "team-b", playerId: "p-demo-b-5" },
    { id: "sq-demo-b-6", teamId: "team-b", playerId: "p-demo-b-6" }
  ];

  for (const squadEntry of liveDemoSquadEntries) {
    await prisma.squadEntry.upsert({
      where: { id: squadEntry.id },
      update: {
        teamId: squadEntry.teamId,
        playerId: squadEntry.playerId,
        tournamentId: "t-1"
      },
      create: {
        ...squadEntry,
        tournamentId: "t-1"
      }
    });
  }

  const liveStart = new Date(Date.now() - 45 * 60 * 1000);
  const liveLock = new Date(Date.now() - 75 * 60 * 1000);

  await prisma.match.upsert({
    where: { id: "m-live-demo" },
    update: {
      tournamentId: "t-1",
      teamAId: "team-a",
      teamBId: "team-b",
      mode: "TOURNAMENT",
      state: "LIVE",
      venue: "BCA Ground",
      startAt: liveStart,
      scheduledOvers: 20,
      ballsPerOver: 6,
      powerplayOvers: 6,
      maxOversPerBowler: 4,
      squadLockAt: liveLock,
      tossWinnerTeamId: "team-a",
      electedTo: "BAT",
      currentInnings: 1,
      winnerTeamId: null,
      winType: null,
      winMarginRuns: null,
      winMarginWickets: null,
      targetRuns: null
    },
    create: {
      id: "m-live-demo",
      tournamentId: "t-1",
      teamAId: "team-a",
      teamBId: "team-b",
      mode: "TOURNAMENT",
      state: "LIVE",
      venue: "BCA Ground",
      startAt: liveStart,
      scheduledOvers: 20,
      ballsPerOver: 6,
      powerplayOvers: 6,
      maxOversPerBowler: 4,
      squadLockAt: liveLock,
      tossWinnerTeamId: "team-a",
      electedTo: "BAT",
      currentInnings: 1
    }
  });

  await prisma.matchOfficialAssignment.upsert({
    where: {
      matchId_userId_assignmentRole: {
        matchId: "m-live-demo",
        userId: "u-scorer",
        assignmentRole: "SCORER"
      }
    },
    update: {
      assignedBy: "u-tadmin"
    },
    create: {
      id: "assign-live-demo-scorer",
      matchId: "m-live-demo",
      userId: "u-scorer",
      assignmentRole: "SCORER",
      assignedBy: "u-tadmin"
    }
  });

  await prisma.matchInnings.upsert({
    where: {
      matchId_inningsNumber: {
        matchId: "m-live-demo",
        inningsNumber: 1
      }
    },
    update: {
      battingTeamId: "team-a",
      bowlingTeamId: "team-b",
      runs: 46,
      wickets: 1,
      balls: 24,
      extras: 0,
      isCompleted: false
    },
    create: {
      id: "inn-live-demo-1",
      matchId: "m-live-demo",
      inningsNumber: 1,
      battingTeamId: "team-a",
      bowlingTeamId: "team-b",
      runs: 46,
      wickets: 1,
      balls: 24,
      extras: 0,
      isCompleted: false
    }
  });

  await prisma.ballEvent.deleteMany({
    where: { matchId: "m-live-demo" }
  });

  const liveBallEvents = [
    {
      id: "be-live-1",
      inningsId: "inn-live-demo-1",
      over: 1,
      ball: 1,
      legalBallNumber: 1,
      strikerId: "p-demo-a-1",
      nonStrikerId: "p-demo-a-2",
      bowlerId: "p-demo-b-1",
      runs: 1,
      runsBat: 1,
      isWicket: false,
      commentaryText: "Ahsan opens with a single into the leg side.",
      wagonZone: "Midwicket"
    },
    {
      id: "be-live-2",
      inningsId: "inn-live-demo-1",
      over: 1,
      ball: 2,
      legalBallNumber: 2,
      strikerId: "p-demo-a-2",
      nonStrikerId: "p-demo-a-1",
      bowlerId: "p-demo-b-1",
      runs: 4,
      runsBat: 4,
      isWicket: false,
      commentaryText: "FOUR! Umair leans into the drive through covers.",
      wagonZone: "Cover"
    },
    {
      id: "be-live-3",
      inningsId: "inn-live-demo-1",
      over: 1,
      ball: 3,
      legalBallNumber: 3,
      strikerId: "p-demo-a-2",
      nonStrikerId: "p-demo-a-1",
      bowlerId: "p-demo-b-1",
      runs: 0,
      runsBat: 0,
      isWicket: false,
      commentaryText: "Good length, defended back to the bowler.",
      wagonZone: "Straight"
    },
    {
      id: "be-live-4",
      inningsId: "inn-live-demo-1",
      over: 1,
      ball: 4,
      legalBallNumber: 4,
      strikerId: "p-demo-a-2",
      nonStrikerId: "p-demo-a-1",
      bowlerId: "p-demo-b-1",
      runs: 1,
      runsBat: 1,
      isWicket: false,
      commentaryText: "Tucked for one. Smart strike rotation.",
      wagonZone: "Square Leg"
    },
    {
      id: "be-live-5",
      inningsId: "inn-live-demo-1",
      over: 1,
      ball: 5,
      legalBallNumber: 5,
      strikerId: "p-demo-a-1",
      nonStrikerId: "p-demo-a-2",
      bowlerId: "p-demo-b-1",
      runs: 2,
      runsBat: 2,
      isWicket: false,
      commentaryText: "Worked behind square for a comfortable two.",
      wagonZone: "Fine Leg"
    },
    {
      id: "be-live-6",
      inningsId: "inn-live-demo-1",
      over: 1,
      ball: 6,
      legalBallNumber: 6,
      strikerId: "p-demo-a-1",
      nonStrikerId: "p-demo-a-2",
      bowlerId: "p-demo-b-1",
      runs: 6,
      runsBat: 6,
      isWicket: false,
      commentaryText: "SIX! Ahsan launches it deep over long-on.",
      wagonZone: "Long On"
    },
    {
      id: "be-live-7",
      inningsId: "inn-live-demo-1",
      over: 2,
      ball: 1,
      legalBallNumber: 7,
      strikerId: "p-demo-a-2",
      nonStrikerId: "p-demo-a-1",
      bowlerId: "p-demo-b-2",
      runs: 1,
      runsBat: 1,
      isWicket: false,
      commentaryText: "Single to deep point.",
      wagonZone: "Point"
    },
    {
      id: "be-live-8",
      inningsId: "inn-live-demo-1",
      over: 2,
      ball: 2,
      legalBallNumber: 8,
      strikerId: "p-demo-a-1",
      nonStrikerId: "p-demo-a-2",
      bowlerId: "p-demo-b-2",
      runs: 0,
      runsBat: 0,
      isWicket: false,
      commentaryText: "Beaten outside off. Sharp pace.",
      wagonZone: "Off Side"
    },
    {
      id: "be-live-9",
      inningsId: "inn-live-demo-1",
      over: 2,
      ball: 3,
      legalBallNumber: 9,
      strikerId: "p-demo-a-1",
      nonStrikerId: "p-demo-a-2",
      bowlerId: "p-demo-b-2",
      runs: 4,
      runsBat: 4,
      isWicket: false,
      commentaryText: "FOUR! Ahsan cuts hard behind point.",
      wagonZone: "Backward Point"
    },
    {
      id: "be-live-10",
      inningsId: "inn-live-demo-1",
      over: 2,
      ball: 4,
      legalBallNumber: 10,
      strikerId: "p-demo-a-1",
      nonStrikerId: "p-demo-a-2",
      bowlerId: "p-demo-b-2",
      runs: 0,
      runsBat: 0,
      isWicket: true,
      wicketType: "BOWLED",
      outPlayerId: "p-demo-a-1",
      newBatterId: "p-demo-a-3",
      commentaryText: "Bowled! Yasir castles Ahsan with a skiddy in-dipper.",
      wagonZone: "Straight"
    },
    {
      id: "be-live-11",
      inningsId: "inn-live-demo-1",
      over: 2,
      ball: 5,
      legalBallNumber: 11,
      strikerId: "p-demo-a-3",
      nonStrikerId: "p-demo-a-2",
      bowlerId: "p-demo-b-2",
      runs: 2,
      runsBat: 2,
      isWicket: false,
      commentaryText: "Danish is away with two through midwicket.",
      wagonZone: "Midwicket"
    },
    {
      id: "be-live-12",
      inningsId: "inn-live-demo-1",
      over: 2,
      ball: 6,
      legalBallNumber: 12,
      strikerId: "p-demo-a-3",
      nonStrikerId: "p-demo-a-2",
      bowlerId: "p-demo-b-2",
      runs: 1,
      runsBat: 1,
      isWicket: false,
      commentaryText: "Danish pushes into the ring and keeps strike moving.",
      wagonZone: "Extra Cover"
    },
    {
      id: "be-live-13",
      inningsId: "inn-live-demo-1",
      over: 3,
      ball: 1,
      legalBallNumber: 13,
      strikerId: "p-demo-a-2",
      nonStrikerId: "p-demo-a-3",
      bowlerId: "p-demo-b-3",
      runs: 1,
      runsBat: 1,
      isWicket: false,
      commentaryText: "Quick single to start the over.",
      wagonZone: "Point"
    },
    {
      id: "be-live-14",
      inningsId: "inn-live-demo-1",
      over: 3,
      ball: 2,
      legalBallNumber: 14,
      strikerId: "p-demo-a-3",
      nonStrikerId: "p-demo-a-2",
      bowlerId: "p-demo-b-3",
      runs: 4,
      runsBat: 4,
      isWicket: false,
      commentaryText: "FOUR! Danish drives cleanly past extra cover.",
      wagonZone: "Extra Cover"
    },
    {
      id: "be-live-15",
      inningsId: "inn-live-demo-1",
      over: 3,
      ball: 3,
      legalBallNumber: 15,
      strikerId: "p-demo-a-3",
      nonStrikerId: "p-demo-a-2",
      bowlerId: "p-demo-b-3",
      runs: 1,
      runsBat: 1,
      isWicket: false,
      commentaryText: "Nudged into the gap for one.",
      wagonZone: "Mid On"
    },
    {
      id: "be-live-16",
      inningsId: "inn-live-demo-1",
      over: 3,
      ball: 4,
      legalBallNumber: 16,
      strikerId: "p-demo-a-2",
      nonStrikerId: "p-demo-a-3",
      bowlerId: "p-demo-b-3",
      runs: 6,
      runsBat: 6,
      isWicket: false,
      commentaryText: "SIX! Umair picks the slower ball and deposits it over square leg.",
      wagonZone: "Square Leg"
    },
    {
      id: "be-live-17",
      inningsId: "inn-live-demo-1",
      over: 3,
      ball: 5,
      legalBallNumber: 17,
      strikerId: "p-demo-a-2",
      nonStrikerId: "p-demo-a-3",
      bowlerId: "p-demo-b-3",
      runs: 1,
      runsBat: 1,
      isWicket: false,
      commentaryText: "Single taken. Field stays spread.",
      wagonZone: "Long Off"
    },
    {
      id: "be-live-18",
      inningsId: "inn-live-demo-1",
      over: 3,
      ball: 6,
      legalBallNumber: 18,
      strikerId: "p-demo-a-3",
      nonStrikerId: "p-demo-a-2",
      bowlerId: "p-demo-b-3",
      runs: 2,
      runsBat: 2,
      isWicket: false,
      commentaryText: "Two more to close the over. Strong finish.",
      wagonZone: "Deep Cover"
    },
    {
      id: "be-live-19",
      inningsId: "inn-live-demo-1",
      over: 4,
      ball: 1,
      legalBallNumber: 19,
      strikerId: "p-demo-a-2",
      nonStrikerId: "p-demo-a-3",
      bowlerId: "p-demo-b-2",
      runs: 0,
      runsBat: 0,
      isWicket: false,
      commentaryText: "Back of a length and defended solidly.",
      wagonZone: "Straight"
    },
    {
      id: "be-live-20",
      inningsId: "inn-live-demo-1",
      over: 4,
      ball: 2,
      legalBallNumber: 20,
      strikerId: "p-demo-a-2",
      nonStrikerId: "p-demo-a-3",
      bowlerId: "p-demo-b-2",
      runs: 1,
      runsBat: 1,
      isWicket: false,
      commentaryText: "Soft hands, single to third man.",
      wagonZone: "Third Man"
    },
    {
      id: "be-live-21",
      inningsId: "inn-live-demo-1",
      over: 4,
      ball: 3,
      legalBallNumber: 21,
      strikerId: "p-demo-a-3",
      nonStrikerId: "p-demo-a-2",
      bowlerId: "p-demo-b-2",
      runs: 4,
      runsBat: 4,
      isWicket: false,
      commentaryText: "Danish threads the gap again. FOUR!",
      wagonZone: "Cover"
    },
    {
      id: "be-live-22",
      inningsId: "inn-live-demo-1",
      over: 4,
      ball: 4,
      legalBallNumber: 22,
      strikerId: "p-demo-a-3",
      nonStrikerId: "p-demo-a-2",
      bowlerId: "p-demo-b-2",
      runs: 1,
      runsBat: 1,
      isWicket: false,
      commentaryText: "Guided to the sweeper for one.",
      wagonZone: "Point"
    },
    {
      id: "be-live-23",
      inningsId: "inn-live-demo-1",
      over: 4,
      ball: 5,
      legalBallNumber: 23,
      strikerId: "p-demo-a-2",
      nonStrikerId: "p-demo-a-3",
      bowlerId: "p-demo-b-2",
      runs: 1,
      runsBat: 1,
      isWicket: false,
      commentaryText: "Another single keeps the board ticking.",
      wagonZone: "Long On"
    },
    {
      id: "be-live-24",
      inningsId: "inn-live-demo-1",
      over: 4,
      ball: 6,
      legalBallNumber: 24,
      strikerId: "p-demo-a-3",
      nonStrikerId: "p-demo-a-2",
      bowlerId: "p-demo-b-2",
      runs: 2,
      runsBat: 2,
      isWicket: false,
      commentaryText: "Danish closes the over with two more. Bela Warriors are 46 for 1 after 4 overs.",
      wagonZone: "Midwicket"
    }
  ];

  await prisma.ballEvent.createMany({
    data: liveBallEvents.map((event, index) => ({
      ...event,
      matchId: "m-live-demo",
      extras: 0,
      createdBy: "u-scorer",
      createdAt: new Date(liveStart.getTime() + (index + 1) * 45 * 1000)
    }))
  });

  await prisma.newsPost.upsert({
    where: { id: "news-live-demo" },
    update: {
      title: "Live now: Bela Warriors vs Coastal Strikers",
      body: "Demo live match is active on PakScorer public board with ball-by-ball commentary, predictions, and fantasy widgets.",
      publishedAt: new Date()
    },
    create: {
      id: "news-live-demo",
      title: "Live now: Bela Warriors vs Coastal Strikers",
      body: "Demo live match is active on PakScorer public board with ball-by-ball commentary, predictions, and fantasy widgets.",
      publishedAt: new Date()
    }
  });

}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
