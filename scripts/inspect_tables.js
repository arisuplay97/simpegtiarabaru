const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  console.log('Tables in database:');
  for (const t of tables) {
    const countRes = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${t.table_name}"`);
    console.log(`- ${t.table_name}: ${countRes[0].count} rows`);
  }
}

inspect()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
