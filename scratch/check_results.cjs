const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const results = await prisma.examResult.findMany();
    console.log('Results in DB:', results.length);
    console.log(JSON.stringify(results, null, 2));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
