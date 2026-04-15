import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const deleted = await prisma.examResult.delete({
    where: { id: 5 }
  });
  console.log("DELETED_DUPLICATE:", deleted);
  await prisma.$disconnect();
}
main();
