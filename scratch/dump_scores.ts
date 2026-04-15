import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const results = await prisma.examResult.findMany();
  results.forEach(r => {
      console.log(`ID: ${r.id}, Score: ${r.score}, Status: ${r.status}, Answers: ${r.answersJson.substring(0, 50)}...`);
  });
  await prisma.$disconnect();
}
main();
