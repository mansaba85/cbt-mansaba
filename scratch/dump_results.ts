import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const results = await prisma.examResult.findMany({
    include: {
      user: true,
      exam: true
    }
  });
  console.log("ALL_RESULTS_COUNT:", results.length);
  results.forEach(r => {
      console.log(`ID: ${r.id}, User: ${r.user.username}, Exam: ${r.exam.name}, Started: ${r.startedAt.toISOString()}`);
  });
  await prisma.$disconnect();
}
main();
