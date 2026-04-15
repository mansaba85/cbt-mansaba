import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.examResult.delete({ where: { id: 6 } });
  console.log("Deleted ID 6");
  await prisma.$disconnect();
}
main();
