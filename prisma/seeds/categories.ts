import { prisma } from '../prisma';

const CATEGORIES = [
    { name: 'Entradas' },
    { name: 'Fuertes' },
    { name: 'Ceviches y Cocteles' },
    { name: 'Pescados' },
    { name: 'Camarones' },
    { name: 'Mariscos' },
    { name: 'Sopas y Caldos' },
    { name: 'Botanas' },
    { name: 'Bebidas' },
    { name: 'Postres' },
];

export default async function seedCategories(): Promise<Map<string, string>> {
    console.log('🌱 Seeding categories...');
    const nameToId = new Map<string, string>();
    for (const { name } of CATEGORIES) {
        const existing = await prisma.category.findFirst({ where: { name } });
        if (existing) {
            nameToId.set(name, existing.id);
            console.log(`⏭️  Category already exists: ${name}`);
        } else {
            const created = await prisma.category.create({ data: { name } });
            nameToId.set(name, created.id);
            console.log(`✅ Created category: ${name}`);
        }
    }
    return nameToId;
}
