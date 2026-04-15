import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const settings = await prisma.appSetting.findMany();
  console.log("SETTINGS:", JSON.stringify(settings, null, 2));
  await prisma.$disconnect();
}
main();
