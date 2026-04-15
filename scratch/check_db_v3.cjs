const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const exams = await prisma.exam.findMany();
    const users = await prisma.user.findMany();
    console.log('Exams:', exams.map(e => ({ id: e.id, name: e.name })));
    console.log('Users:', users.map(u => ({ id: u.id, username: u.username })));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
