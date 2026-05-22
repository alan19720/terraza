import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from './prisma';

const ROLE_NAMES = ['ADMIN', 'CAJERO', 'MESERO', 'COCINA'];

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

const MEALS: { categoryName: string; name: string; description: string | null; price: number }[] = [
    // Entradas
    { categoryName: 'Entradas', name: 'Empanadas de camarón', description: 'Tres deliciosas empanadas fritas rellenas de camarón guisado con queso', price: 120 },
    { categoryName: 'Entradas', name: 'Tostada de ceviche de pescado', description: 'Tostada crujiente con ceviche de pescado fresco, aguacate y salsa de la casa', price: 65 },
    { categoryName: 'Entradas', name: 'Dedos de queso', description: 'Bastones de queso empanizados acompañados de salsa pomodoro (6 piezas)', price: 95 },
    
    // Fuertes
    { categoryName: 'Fuertes', name: 'Mariscada especial', description: 'Gran mariscada al gusto con camarón, pulpo, calamar, almeja y filete de pescado', price: 380 },
    { categoryName: 'Fuertes', name: 'Pulpo zarandeado', description: 'Pulpo entero zarandeado a las brasas con adobo secreto de la casa', price: 320 },
    { categoryName: 'Fuertes', name: 'Corte de Arrachera', description: '300g de jugosa arrachera a la parrilla con papas y cebollitas', price: 290 },

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

const INVENTORY_PRODUCTS: { name: string; description: string | null; unit: string; currentStock: number; minimumStock: number }[] = [
    // Seafood – some LOW STOCK
    { name: 'Camarón', description: 'Camarón fresco sin cabeza', unit: 'kg', currentStock: 3, minimumStock: 5 },
    { name: 'Filete de pescado', description: 'Filete de mojarra o tilapia', unit: 'kg', currentStock: 12, minimumStock: 5 },
    { name: 'Pulpo', description: 'Pulpo entero limpio', unit: 'kg', currentStock: 8, minimumStock: 3 },
    { name: 'Ostiones', description: 'Ostiones frescos en concha', unit: 'piezas', currentStock: 60, minimumStock: 20 },
    { name: 'Calamar', description: 'Calamar limpio en aros', unit: 'kg', currentStock: 6, minimumStock: 3 },
    // Staples
    { name: 'Arroz', description: 'Arroz blanco grano largo', unit: 'kg', currentStock: 25, minimumStock: 10 },
    { name: 'Frijol', description: 'Frijol negro cocido', unit: 'kg', currentStock: 15, minimumStock: 8 },
    { name: 'Tortillas de maíz', description: 'Paquete de 1 kg', unit: 'piezas', currentStock: 40, minimumStock: 20 },
    { name: 'Aceite de cocina', description: 'Aceite vegetal para freír', unit: 'litros', currentStock: 4, minimumStock: 10 },
    // Vegetables
    { name: 'Limón', description: 'Limón verde fresco', unit: 'kg', currentStock: 2, minimumStock: 5 },
    { name: 'Cebolla', description: 'Cebolla blanca', unit: 'kg', currentStock: 10, minimumStock: 5 },
    { name: 'Tomate', description: 'Jitomate bola rojo', unit: 'kg', currentStock: 14, minimumStock: 8 },
    { name: 'Aguacate', description: 'Aguacate Hass', unit: 'piezas', currentStock: 30, minimumStock: 15 },
    { name: 'Cilantro', description: 'Manojo de cilantro fresco', unit: 'piezas', currentStock: 20, minimumStock: 10 },
    { name: 'Chile serrano', description: 'Chile serrano verde', unit: 'kg', currentStock: 5, minimumStock: 2 },
    // Condiments & extras
    { name: 'Sal', description: 'Sal de mesa refinada', unit: 'kg', currentStock: 12, minimumStock: 3 },
    { name: 'Queso', description: 'Queso Oaxaca o manchego', unit: 'kg', currentStock: 7, minimumStock: 3 },
    // Beverages
    { name: 'Refresco embotellado', description: 'Refrescos variados 600ml', unit: 'piezas', currentStock: 48, minimumStock: 24 },
    { name: 'Cerveza nacional', description: 'Corona, Modelo o Victoria', unit: 'piezas', currentStock: 36, minimumStock: 12 },
    // Supplies – LOW STOCK
    { name: 'Gas LP', description: 'Tanque de gas estacionario', unit: 'litros', currentStock: 15, minimumStock: 50 },
    { name: 'Servilletas', description: 'Paquete de servilletas', unit: 'piezas', currentStock: 100, minimumStock: 200 },
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

async function seedUsers() {
    console.log('🌱 Seeding default users...');
    
    // Find ADMIN role
    const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
    if (!adminRole) {
        console.error('❌ Cannot seed users: ADMIN role not found!');
        return;
    }

    const defaultEmail = 'admin@terraza.com';
    
    // Check if the user already exists by email
    const existingUser = await prisma.user.findUnique({
        where: { email: defaultEmail }
    });

    if (existingUser) {
        console.log(`⏭️  Admin user already exists: ${defaultEmail}`);
        return;
    }

    // Hash the password securely using bcrypt
    const defaultPassword = 'AdminPassword123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const createdAdmin = await prisma.user.create({
        data: {
            name: 'Administrador Terraza',
            email: defaultEmail,
            password: hashedPassword,
            roleId: adminRole.id,
            active: true
        }
    });

    console.log(`✅ Created default Admin user successfully!`);
    console.log(`   - Name: ${createdAdmin.name}`);
    console.log(`   - Email: ${defaultEmail}`);
    console.log(`   - Password: ${defaultPassword}`);
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

async function seedInventory() {
    console.log('🌱 Seeding inventory products...');
    for (const item of INVENTORY_PRODUCTS) {
        const existing = await prisma.inventoryProduct.findFirst({ where: { name: item.name } });
        if (existing) {
            console.log(`⏭️  Inventory product already exists: ${item.name}`);
        } else {
            const product = await prisma.inventoryProduct.create({
                data: {
                    name: item.name,
                    description: item.description,
                    unit: item.unit,
                    currentStock: item.currentStock,
                    minimumStock: item.minimumStock,
                },
            });
            if (item.currentStock > 0) {
                await prisma.stockMovement.create({
                    data: { productId: product.id, type: 'IN', quantity: item.currentStock, notes: 'Stock inicial (seeder)' },
                });
            }
            console.log(`✅ Created inventory product: ${item.name} (${item.currentStock} ${item.unit})`);
        }
    }
}

async function main() {
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
