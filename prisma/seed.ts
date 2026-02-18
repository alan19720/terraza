import 'dotenv/config';
import { prisma } from './prisma';

/**
 * Seed script to populate initial roles
 */
async function main() {
    console.log('🌱 Seeding roles...');

    const roles = [
        {
            name: 'ADMIN',
            description: 'Administrator with full system access',
            permissions: {
                users: ['create', 'read', 'update', 'delete'],
                products: ['create', 'read', 'update', 'delete'],
                orders: ['create', 'read', 'update', 'delete'],
                reports: ['read'],
            },
        },
        {
            name: 'CASHIER',
            description: 'Cashier with order and payment management',
            permissions: {
                products: ['read'],
                orders: ['create', 'read', 'update'],
            },
        },
        {
            name: 'WAITER',
            description: 'Waiter with order taking capabilities',
            permissions: {
                products: ['read'],
                orders: ['create', 'read'],
            },
        },
        {
            name: 'KITCHEN',
            description: 'Kitchen staff with order preparation access',
            permissions: {
                orders: ['read', 'update'],
            },
        },
    ];

    for (const role of roles) {
        const created = await prisma.role.upsert({
            where: { name: role.name },
            update: {},
            create: role,
        });
        console.log(`✅ Created role: ${created.name}`);
    }

    console.log('🎉 Seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
