// Use CommonJS for seeding to avoid ESM loader issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.availabilityRule.deleteMany();
  await prisma.blackout.deleteMany();

  const rules = [
    // Tue–Fri: 9a–7p
    { dayOfWeek: 2, startTime: "09:00", endTime: "19:00" },
    { dayOfWeek: 3, startTime: "09:00", endTime: "19:00" },
    { dayOfWeek: 4, startTime: "09:00", endTime: "19:00" },
    { dayOfWeek: 5, startTime: "09:00", endTime: "19:00" },
    // Sat: 9a–4p
    { dayOfWeek: 6, startTime: "09:00", endTime: "16:00" },
  ];

  await prisma.availabilityRule.createMany({ data: rules });
  console.log("Seeded availability rules:", rules.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
