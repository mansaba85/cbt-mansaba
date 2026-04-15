import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const qs = await prisma.question.findMany({
    where: { content: { contains: 'Berikan nomor urut' } },
    include: { answers: true }
  });
  console.log("Found Questions:", JSON.stringify(qs, null, 2));
  await prisma.$disconnect();
}
main();
