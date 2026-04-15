const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.appSetting.findUnique({
    where: { key: 'cbt_test_settings' }
  });
  console.log("DB SETTINGS:", settings);
}

main().catch(console.error).finally(() => prisma.$disconnect());
