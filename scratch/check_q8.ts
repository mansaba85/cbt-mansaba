import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const q = await prisma.question.findUnique({
    where: { id: 8 },
    include: { answers: true }
  });
  console.log("Question ID 8 Data:", JSON.stringify(q, null, 2));
  await prisma.$disconnect();
}
main();
