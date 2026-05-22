
import { prisma } from './prisma';

import seedRoles from './seeds/roles';
import seedUsers from './seeds/users';
import seedCategories from './seeds/categories';
import seedMeals from './seeds/meals';
import seedTables from './seeds/tables';
import seedInventory from './seeds/inventory';

async function main() {
    console.log('🚀 Starting database seed...');
    
    await seedRoles();
    await seedUsers();
    await seedTables();
    
    const categoryNameToId = await seedCategories();
    await seedMeals(categoryNameToId);
    
    await seedInventory();
    
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
