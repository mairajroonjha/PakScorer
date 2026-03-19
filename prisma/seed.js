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
    update: {},
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
            sponsorName: "Coastal Cables",
            city: "Bela",
            captainName: "Ali Raza",
            contactPhone: "03001234567",
            ownerUserId: "u-teamadmin"
          },
          {
            id: "team-b",
            name: "Coastal Strikers",
            sponsorName: "Makran Builders",
            city: "Hub",
            captainName: "Bilal Ahmed",
            contactPhone: "03007654321",
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
            state: "SCHEDULED",
            startAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
            squadLockAt: new Date(Date.now() + 90 * 60 * 1000)
          }
        ]
      }
    }
  });

  await prisma.team.upsert({
    where: { id: "team-c" },
    update: {},
    create: {
      id: "team-c",
      name: "Lasbela Lions",
      city: "Uthal",
      captainName: "Sajid Khan",
      contactPhone: "03110002222",
      ownerUserId: "u-super"
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
