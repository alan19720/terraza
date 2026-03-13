import 'dotenv/config';
import { prisma } from './prisma';

const ROLE_NAMES = ['ADMIN', 'CASHIER', 'WAITER', 'KITCHEN'];

const CATEGORIES = [
    { name: 'Ceviches y Cocteles' },
    { name: 'Pescados' },
    { name: 'Camarones' },
    { name: 'Mariscos' },
    { name: 'Sopas y Caldos' },
    { name: 'Botanas' },
    { name: 'Bebidas' },
    { name: 'Postres' },
];

const MEALS: { categoryName: string; name: string; description: string | null; price: number }[] = [
    // Ceviches y Cocteles
    { categoryName: 'Ceviches y Cocteles', name: 'Ceviche de pescado', description: 'Pescado fresco marinado en limón con cebolla morada, cilantro y aguacate', price: 185 },
    { categoryName: 'Ceviches y Cocteles', name: 'Ceviche de camarón', description: 'Camarones cocidos en limón con pepino, jícama y salsa bandera', price: 195 },
    { categoryName: 'Ceviches y Cocteles', name: 'Ceviche mixto', description: 'Mezcla de pescado, camarón y pulpo en limón con aguacate', price: 220 },
    { categoryName: 'Ceviches y Cocteles', name: 'Coctel de camarón', description: 'Camarones en salsa cóctel con aguacate y galleta salada', price: 175 },
    { categoryName: 'Ceviches y Cocteles', name: 'Coctel de pulpo', description: 'Pulpo en salsa cóctel con cebolla y cilantro', price: 195 },
    { categoryName: 'Ceviches y Cocteles', name: 'Aguachile verde', description: 'Camarón crudo marinado en limón con chile serrano y pepino', price: 210 },
    // Pescados
    { categoryName: 'Pescados', name: 'Filete de pescado a la plancha', description: 'Filete de pescado blanco con mantequilla de ajo y verduras', price: 245 },
    { categoryName: 'Pescados', name: 'Pescado zarandeado', description: 'Pescado entero zarandeado al carbón con mantequilla y especias', price: 320 },
    { categoryName: 'Pescados', name: 'Huachinango a la talla', description: 'Huachinango entero a la parrilla con adobo rojo o verde', price: 380 },
    { categoryName: 'Pescados', name: 'Mojarra frita', description: 'Mojarra entera frita crujiente con ajo y limón', price: 195 },
    { categoryName: 'Pescados', name: 'Filete empanizado', description: 'Filete de pescado empanizado con papas a la francesa y ensalada', price: 215 },
    { categoryName: 'Pescados', name: 'Pescado al mojo de ajo', description: 'Filete de pescado con mantequilla, ajo y perejil', price: 235 },
    // Camarones
    { categoryName: 'Camarones', name: 'Camarones al ajillo', description: 'Camarones salteados en mantequilla con ajo y vino blanco', price: 265 },
    { categoryName: 'Camarones', name: 'Camarones a la diabla', description: 'Camarones en salsa de chile guajillo y chipotle', price: 255 },
    { categoryName: 'Camarones', name: 'Camarones empanizados', description: 'Camarones empanizados con papas fritas y salsa', price: 235 },
    { categoryName: 'Camarones', name: 'Camarones a la plancha', description: 'Camarones grandes a la plancha con mantequilla y limón', price: 275 },
    { categoryName: 'Camarones', name: 'Arroz con camarones', description: 'Arroz blanco con camarones al ajillo y verduras', price: 195 },
    { categoryName: 'Camarones', name: 'Camarones al coco', description: 'Camarones empanizados en coco con salsa agridulce', price: 265 },
    // Mariscos
    { categoryName: 'Mariscos', name: 'Ostiones naturales', description: 'Ostiones frescos en concha con limón y salsa', price: 185 },
    { categoryName: 'Mariscos', name: 'Almejas a la marinera', description: 'Almejas en salsa de jitomate con ajo y vino', price: 195 },
    { categoryName: 'Mariscos', name: 'Pulpo a la gallega', description: 'Pulpo cocido con papas, aceite de oliva y pimentón', price: 245 },
    { categoryName: 'Mariscos', name: 'Cóctel de ostiones', description: 'Ostiones en salsa cóctel con limón y aguacate', price: 175 },
    { categoryName: 'Mariscos', name: 'Calamar frito', description: 'Aros de calamar empanizados con salsa marinera', price: 215 },
    { categoryName: 'Mariscos', name: 'Mariscada', description: 'Mezcla de camarón, pulpo, calamar y pescado en salsa al gusto', price: 350 },
    // Sopas y Caldos
    { categoryName: 'Sopas y Caldos', name: 'Sopa de mariscos', description: 'Caldo de pescado con camarón, pulpo, calamar y verduras', price: 165 },
    { categoryName: 'Sopas y Caldos', name: 'Caldo de pescado', description: 'Caldo tradicional con pescado, verduras y limón', price: 125 },
    { categoryName: 'Sopas y Caldos', name: 'Sopa de camarón', description: 'Sopa de camarón con chipotle y verduras', price: 145 },
    { categoryName: 'Sopas y Caldos', name: 'Sopa de ostiones', description: 'Caldo con ostiones, cilantro y chile verde', price: 155 },
    { categoryName: 'Sopas y Caldos', name: 'Caldo siete mares', description: 'Caldo con variedad de mariscos y pescado', price: 185 },
    // Botanas
    { categoryName: 'Botanas', name: 'Tostadas de ceviche', description: 'Tres tostadas con ceviche de pescado o camarón', price: 95 },
    { categoryName: 'Botanas', name: 'Tacos de pescado', description: 'Tres tacos de pescado empanizado con repollo y salsa', price: 105 },
    { categoryName: 'Botanas', name: 'Tacos de camarón', description: 'Tres tacos de camarón con mayonesa y salsa', price: 115 },
    { categoryName: 'Botanas', name: 'Queso fundido con camarón', description: 'Queso fundido con camarones y tortillas', price: 165 },
    { categoryName: 'Botanas', name: 'Orden de papas fritas', description: 'Papas a la francesa con salsa', price: 65 },
    { categoryName: 'Botanas', name: 'Guacamole con totopos', description: 'Guacamole fresco con tortilla frita', price: 85 },
    // Bebidas
    { categoryName: 'Bebidas', name: 'Agua de horchata', description: 'Agua de horchata natural', price: 35 },
    { categoryName: 'Bebidas', name: 'Agua de jamaica', description: 'Agua de flor de jamaica', price: 35 },
    { categoryName: 'Bebidas', name: 'Refresco', description: 'Coca-Cola, Sprite o refresco del día', price: 40 },
    { categoryName: 'Bebidas', name: 'Cerveza nacional', description: 'Corona, Modelo o Victoria', price: 55 },
    { categoryName: 'Bebidas', name: 'Cerveza importada', description: 'Heineken, Stella Artois o similar', price: 75 },
    { categoryName: 'Bebidas', name: 'Michelada', description: 'Cerveza con limón, salsa y clamato', price: 85 },
    { categoryName: 'Bebidas', name: 'Limonada', description: 'Limonada natural con o sin gas', price: 45 },
    { categoryName: 'Bebidas', name: 'Café', description: 'Café americano o de olla', price: 40 },
    // Postres
    { categoryName: 'Postres', name: 'Flan napolitano', description: 'Flan tradicional con caramelo', price: 65 },
    { categoryName: 'Postres', name: 'Pay de limón', description: 'Pay de limón con merengue', price: 75 },
    { categoryName: 'Postres', name: 'Helado', description: 'Helado de vainilla, fresa o chocolate', price: 55 },
    { categoryName: 'Postres', name: 'Crepas con cajeta', description: 'Crepas con cajeta y nuez', price: 85 },
];

async function seedRoles() {
    console.log('🌱 Seeding roles...');
    for (const name of ROLE_NAMES) {
        const existing = await prisma.role.findFirst({ where: { name } });
        if (existing) {
            console.log(`⏭️  Role already exists: ${name}`);
        } else {
            await prisma.role.create({ data: { name } });
            console.log(`✅ Created role: ${name}`);
        }
    }
}

async function seedCategories(): Promise<Map<string, string>> {
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

async function seedTables() {
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

async function seedMeals(categoryNameToId: Map<string, string>) {
    console.log('🌱 Seeding meals...');
    for (const meal of MEALS) {
        const categoryId = categoryNameToId.get(meal.categoryName);
        if (!categoryId) continue;
        const existing = await prisma.meal.findFirst({
            where: { name: meal.name, categoryId },
        });
        if (existing) {
            console.log(`⏭️  Meal already exists: ${meal.name} (${meal.categoryName})`);
        } else {
            await prisma.meal.create({
                data: {
                    categoryId,
                    name: meal.name,
                    description: meal.description,
                    price: meal.price,
                },
            });
            console.log(`✅ Created meal: ${meal.name}`);
        }
    }
}

async function main() {
    await seedRoles();
    await seedTables();
    const categoryNameToId = await seedCategories();
    await seedMeals(categoryNameToId);
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
