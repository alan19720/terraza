import { prisma } from '../prisma';

const ROLE_NAMES = ['ADMIN', 'CAJERO', 'MESERO', 'COCINA', 'BARRA'];

export default async function seedRoles() {
    console.log('🌱 Seeding roles...');
    for (const name of ROLE_NAMES) {
        await prisma.role.upsert({
            where: { name },
            update: {},
            create: { name },
        });
        console.log(`✅ Upserted role: ${name}`);
    }
}
