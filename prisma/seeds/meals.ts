import { prisma } from '../prisma';

const MEALS: { categoryName: string; name: string; description: string | null; price: number }[] = [

    // ═══════════════════════════════════════════════════════════════
    // PLATO FUERTE
    // ═══════════════════════════════════════════════════════════════

    // Pulpo
    { categoryName: 'Plato Fuerte', name: 'Pulpo al Pastor', description: null, price: 260 },
    { categoryName: 'Plato Fuerte', name: 'Pulpo Adobado', description: null, price: 260 },
    { categoryName: 'Plato Fuerte', name: 'Pulpo Enamorado', description: null, price: 210 },

    // Camarones — salsas / estilos
    { categoryName: 'Plato Fuerte', name: 'Camarones al Coco', description: null, price: 220 },
    { categoryName: 'Plato Fuerte', name: 'Camarones Momia', description: null, price: 220 },
    { categoryName: 'Plato Fuerte', name: 'Camarones Empanizados', description: null, price: 190 },
    { categoryName: 'Plato Fuerte', name: 'Camarones Mango Habanero', description: null, price: 210 },
    { categoryName: 'Plato Fuerte', name: 'Camarones a la Diabla', description: null, price: 210 },
    { categoryName: 'Plato Fuerte', name: 'Camarones Sinaloa', description: null, price: 210 },
    { categoryName: 'Plato Fuerte', name: 'Camarones al Ajillo', description: null, price: 210 },
    { categoryName: 'Plato Fuerte', name: 'Camarones a la Mantequilla', description: null, price: 210 },
    { categoryName: 'Plato Fuerte', name: 'Camarones Zarandeados', description: null, price: 210 },
    { categoryName: 'Plato Fuerte', name: 'Camarones al Sartén', description: null, price: 160 },
    { categoryName: 'Plato Fuerte', name: 'Camarones al Carbón', description: null, price: 160 },

    // Filete de Pescado — salsas / estilos
    { categoryName: 'Plato Fuerte', name: 'Filete de Pescado al Coco', description: null, price: 220 },
    { categoryName: 'Plato Fuerte', name: 'Filete de Pescado Momia', description: null, price: 220 },
    { categoryName: 'Plato Fuerte', name: 'Filete de Pescado Empanizado', description: null, price: 190 },
    { categoryName: 'Plato Fuerte', name: 'Filete de Pescado Mango Habanero', description: null, price: 210 },
    { categoryName: 'Plato Fuerte', name: 'Filete de Pescado a la Diabla', description: null, price: 210 },
    { categoryName: 'Plato Fuerte', name: 'Filete de Pescado Sinaloa', description: null, price: 210 },
    { categoryName: 'Plato Fuerte', name: 'Filete de Pescado al Ajillo', description: null, price: 210 },
    { categoryName: 'Plato Fuerte', name: 'Filete de Pescado a la Mantequilla', description: null, price: 210 },
    { categoryName: 'Plato Fuerte', name: 'Filete de Pescado Zarandeado', description: null, price: 210 },
    { categoryName: 'Plato Fuerte', name: 'Filete de Pescado al Sartén', description: null, price: 160 },
    { categoryName: 'Plato Fuerte', name: 'Filete de Pescado al Carbón', description: null, price: 160 },

    // Especialidades
    { categoryName: 'Plato Fuerte', name: 'Tartar de Atún', description: null, price: 230 },
    { categoryName: 'Plato Fuerte', name: 'Tiritas de Pescado', description: null, price: 120 },

    // Cóctel — tamaños (Camarón o Mixto)
    { categoryName: 'Plato Fuerte', name: 'Cóctel Chico', description: 'Camarón o Mixto', price: 160 },
    { categoryName: 'Plato Fuerte', name: 'Cóctel Mediano', description: 'Camarón o Mixto', price: 210 },
    { categoryName: 'Plato Fuerte', name: 'Cóctel Grande', description: 'Camarón o Mixto', price: 255 },

    // Postre & Pescado a la talla
    { categoryName: 'Plato Fuerte', name: 'Postre de la Casa', description: null, price: 75 },
    { categoryName: 'Plato Fuerte', name: 'Pescado a la Talla', description: 'Precio según el peso. Disponible: Zarandeado, Sinaloa, Frito', price: 0 },

    // ═══════════════════════════════════════════════════════════════
    // PARA EMPEZAR (Botana / Entradas)
    // ═══════════════════════════════════════════════════════════════

    // Tostadas
    { categoryName: 'Para Empezar', name: 'Tostada Pulpo Enamorado', description: null, price: 70 },
    { categoryName: 'Para Empezar', name: 'Tostada Aguachile Mango', description: null, price: 60 },
    { categoryName: 'Para Empezar', name: 'Tostada Aguachile Verde', description: null, price: 60 },
    { categoryName: 'Para Empezar', name: 'Tostada Aguachile Negro', description: null, price: 60 },
    { categoryName: 'Para Empezar', name: 'Tostada Aguachile Chiltepín', description: null, price: 60 },
    { categoryName: 'Para Empezar', name: 'Tostada Tiritas de Pescado', description: null, price: 60 },
    { categoryName: 'Para Empezar', name: 'Tostada Zihua', description: null, price: 60 },
    { categoryName: 'Para Empezar', name: 'Tostada Tártara', description: null, price: 60 },
    { categoryName: 'Para Empezar', name: 'Tostada Ceviche de Camarón', description: null, price: 60 },

    // Nachos, Empanadas, Caldos, Sopa
    { categoryName: 'Para Empezar', name: 'Nachos Camarón', description: null, price: 120 },
    { categoryName: 'Para Empezar', name: 'Empanada de Camarón con Queso', description: null, price: 145 },
    { categoryName: 'Para Empezar', name: 'Empanada de Pescado con Queso', description: null, price: 145 },
    { categoryName: 'Para Empezar', name: 'Caldo de Camarón', description: null, price: 205 },
    { categoryName: 'Para Empezar', name: 'Caldo de Pescado', description: null, price: 205 },
    { categoryName: 'Para Empezar', name: 'Sopa de Tortilla de Mar', description: null, price: 95 },

    // Tacos (3 piezas)
    { categoryName: 'Para Empezar', name: 'Taco Gobernador', description: '3 piezas', price: 160 },
    { categoryName: 'Para Empezar', name: 'Pescadilla', description: '3 piezas', price: 95 },
    { categoryName: 'Para Empezar', name: 'Camaronilla', description: '3 piezas', price: 95 },
    { categoryName: 'Para Empezar', name: 'Taco Baja', description: '3 piezas', price: 160 },

    // Sashimi, Carpacho, Guacamole
    { categoryName: 'Para Empezar', name: 'Sashimi de Atún', description: 'Atún, salsa de soya, wasabi, jengibre encurtido, rábano daikon rallado o en tiras, ajonjolí, cebolla morada, limón', price: 220 },
    { categoryName: 'Para Empezar', name: 'Carpacho de Atún', description: 'Aceite de oliva, limón, alcaparras, queso parmesano en láminas, arúgula o mezcla de hojas verdes, cebolla morada, perejil, aguacate', price: 260 },
    { categoryName: 'Para Empezar', name: 'Guacamole', description: null, price: 65 },

    // ═══════════════════════════════════════════════════════════════
    // MENU GRILL
    // ═══════════════════════════════════════════════════════════════

    { categoryName: 'Menu Grill', name: 'Boneless', description: '150 gramos de Boneless, 200 gramos de papa, 4 bastones zanahoria, 4 bastones apio', price: 85 },
    { categoryName: 'Menu Grill', name: 'Pizza Queso', description: '8 rebanadas, 35 cm de diámetro', price: 195 },
    { categoryName: 'Menu Grill', name: 'Pizza Pepperoni', description: '8 rebanadas, 35 cm de diámetro', price: 195 },
    { categoryName: 'Menu Grill', name: 'Pizza Hawaiana', description: '8 rebanadas, 35 cm de diámetro', price: 195 },
    { categoryName: 'Menu Grill', name: 'Pizza Boneless', description: '8 rebanadas, 35 cm de diámetro, 400 gramos papas, 400 gramos Boneless', price: 245 },
    { categoryName: 'Menu Grill', name: 'Papas a la Francesa', description: '400 gramos, sazonadas con sal, limón y pimienta', price: 75 },
    { categoryName: 'Menu Grill', name: 'Papas Salseadas', description: '400 gramos, salsa a elegir', price: 85 },
    { categoryName: 'Menu Grill', name: 'Papas Gajo', description: '400 gramos, acompañadas de queso amarillo, Ranch y catsup', price: 95 },
    { categoryName: 'Menu Grill', name: 'Tocipapas', description: '400 gramos, acompañadas con queso amarillo, 200 gramos tocino', price: 95 },
    { categoryName: 'Menu Grill', name: 'Tenders', description: '5 piezas, 4 bastones apio, 4 bastones zanahoria, Dip Ranch', price: 85 },
    { categoryName: 'Menu Grill', name: 'Chiles Jalapeños Rellenos', description: '5 piezas, 4 bastones apio, 4 bastones zanahoria, Dip Ranch', price: 85 },
    { categoryName: 'Menu Grill', name: 'Aros de Cebolla', description: '6 piezas, 4 bastones apio, 4 bastones zanahoria, Dip Ranch', price: 85 },
    { categoryName: 'Menu Grill', name: 'Dedos de Queso', description: '6 piezas, 4 bastones apio, 4 bastones zanahoria, Dip Ranch', price: 85 },
    { categoryName: 'Menu Grill', name: 'Nachos', description: '70 gramos, acompañados por queso amarillo y chiles en vinagre', price: 55 },
    { categoryName: 'Menu Grill', name: 'Nachos Terraza (de la Casa)', description: '100 gramos nachos, acompañados por pico de gallo', price: 95 },
    { categoryName: 'Menu Grill', name: 'Churros', description: '100 gramos, acompañados de una salsa picante', price: 55 },

    // ═══════════════════════════════════════════════════════════════
    // BEBIDAS
    // ═══════════════════════════════════════════════════════════════

    { categoryName: 'Bebidas', name: 'Refresco', description: null, price: 30 },
    { categoryName: 'Bebidas', name: 'Limonada', description: null, price: 35 },
    { categoryName: 'Bebidas', name: 'Naranjada', description: null, price: 35 },
    { categoryName: 'Bebidas', name: 'Botella de Agua', description: null, price: 25 },
    { categoryName: 'Bebidas', name: 'Jarra Limonada', description: null, price: 85 },
    { categoryName: 'Bebidas', name: 'Jarra Naranjada', description: null, price: 85 },
    { categoryName: 'Bebidas', name: 'Rusa', description: null, price: 35 },
    { categoryName: 'Bebidas', name: 'Clamato Natural', description: null, price: 40 },
    { categoryName: 'Bebidas', name: 'Clamato Preparado', description: null, price: 50 },
    { categoryName: 'Bebidas', name: 'Piñada', description: null, price: 60 },
    { categoryName: 'Bebidas', name: 'Tarro Chelado', description: null, price: 10 },
    { categoryName: 'Bebidas', name: 'Tarro Cubano', description: null, price: 15 },
    { categoryName: 'Bebidas', name: 'Tarro Fantasma', description: null, price: 25 },
    { categoryName: 'Bebidas', name: 'Michelada 1/2', description: null, price: 55 },
    { categoryName: 'Bebidas', name: 'Michelada 1 lt', description: null, price: 90 },

    // Cerveza
    { categoryName: 'Bebidas', name: 'Cerveza Corona', description: null, price: 36 },
    { categoryName: 'Bebidas', name: 'Cerveza Victoria', description: null, price: 36 },
    { categoryName: 'Bebidas', name: 'Cerveza Bohemia Clara', description: null, price: 43 },
    { categoryName: 'Bebidas', name: 'Cerveza Bohemia Obscura', description: null, price: 43 },

    // Cocteleria Clasica
    { categoryName: 'Bebidas', name: 'Margarita', description: null, price: 80 },
    { categoryName: 'Bebidas', name: 'Mezcalita', description: null, price: 80 },
    { categoryName: 'Bebidas', name: 'Mojito', description: null, price: 80 },
    { categoryName: 'Bebidas', name: 'Paloma', description: null, price: 80 },
    { categoryName: 'Bebidas', name: 'Charro Negro', description: null, price: 80 },
    { categoryName: 'Bebidas', name: 'Tom Collins', description: null, price: 80 },
    { categoryName: 'Bebidas', name: 'Clericot Tinto', description: null, price: 80 },
    { categoryName: 'Bebidas', name: 'Clericot Blanco', description: null, price: 80 },
    { categoryName: 'Bebidas', name: 'Sangría Tinto', description: null, price: 80 },
    { categoryName: 'Bebidas', name: 'Sangría Blanco', description: null, price: 80 },

    // Sabores
    { categoryName: 'Bebidas', name: 'Margarita de sabor', description: 'Maracuyá, Mango, Frutos rojos', price: 95 },
    { categoryName: 'Bebidas', name: 'Mezcalita de sabor', description: 'Maracuyá, Mango, Frutos rojos', price: 95 },
    { categoryName: 'Bebidas', name: 'Mojito de sabor', description: 'Maracuyá, Mango, Frutos rojos', price: 95 },

    // Spritz
    { categoryName: 'Bebidas', name: 'Aperol Spritz', description: null, price: 85 },
    { categoryName: 'Bebidas', name: 'St. Germain Spritz', description: null, price: 95 },
    { categoryName: 'Bebidas', name: '43 Spritz', description: null, price: 95 },

    // Carajillo
    { categoryName: 'Bebidas', name: 'Carajillo Español', description: null, price: 95 },
    { categoryName: 'Bebidas', name: 'Carajillo Irlandés', description: null, price: 120 },
    { categoryName: 'Bebidas', name: 'Carajillo Franciscano', description: null, price: 120 },
    { categoryName: 'Bebidas', name: 'Carajillo Michoacano', description: null, price: 120 },
];

export default async function seedMeals(categoryNameToId: Map<string, string>) {
    console.log('🌱 Seeding meals...');
    for (const meal of MEALS) {
        const categoryId = categoryNameToId.get(meal.categoryName);
        if (!categoryId) {
            console.error(`❌ Category not found: ${meal.categoryName} (for ${meal.name})`);
            continue;
        }
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
            console.log(`✅ Created meal: ${meal.name} — $${meal.price}`);
        }
    }
}
