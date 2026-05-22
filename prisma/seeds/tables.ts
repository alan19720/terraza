import { prisma } from '../prisma';

export default async function seedTables() {
    console.log('🌱 Seeding tables...');
    for (let n = 1; n <= 6; n++) {
        const number = String(n);
        const existing = await prisma.table.findFirst({ where: { number } });
        if (existing) {
            console.log(`⏭️  Table already exists: ${number}`);
        } else {
            await prisma.table.create({ data: { number } });
            console.log(`✅ Created table: ${number}`);
        }
    }
}
