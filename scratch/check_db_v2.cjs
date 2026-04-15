const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        const res = await prisma.$queryRaw`SELECT * FROM app_settings`;
        console.log("DATABASE_CONTENT:");
        console.log(JSON.stringify(res, null, 2));
    } catch(e) {
        console.error("DB_ERROR:", e.message);
    }
    process.exit(0);
}
main();
