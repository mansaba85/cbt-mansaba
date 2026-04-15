import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const settings = await prisma.appSetting.findMany();
  console.log("SETTINGS:", JSON.stringify(settings, null, 2));

  const results = await prisma.examResult.findMany({
    include: {
      user: true,
      exam: true
    }
  });
  console.log("RESULTS:", JSON.stringify(results, null, 2).substring(0, 1000));
  
  await prisma.$disconnect();
}
main();
