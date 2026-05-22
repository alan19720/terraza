import { prisma } from '../prisma';

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

export default async function seedInventory() {
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
