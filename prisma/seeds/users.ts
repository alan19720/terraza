import * as bcrypt from 'bcrypt';
import { prisma } from '../prisma';

export default async function seedUsers() {
    console.log('🌱 Seeding default users...');
    
    const defaultUsers = [
        { role: 'ADMIN', email: 'admin@terraza.com', password: 'admin123', name: 'Administrador' },
        { role: 'CAJERO', email: 'cajero@terraza.com', password: 'cajero123', name: 'Cajero' },
        { role: 'MESERO', email: 'mesero@terraza.com', password: 'mesero123', name: 'Mesero' },
        { role: 'COCINA', email: 'cocina@terraza.com', password: 'cocina123', name: 'Cocinero' },
        { role: 'BARRA', email: 'barra@terraza.com', password: 'barra123', name: 'Bartender' },
    ];

    for (const u of defaultUsers) {
        const roleRecord = await prisma.role.findUnique({ where: { name: u.role } });
        if (!roleRecord) {
            console.error(`❌ Cannot seed user: ${u.role} role not found!`);
            continue;
        }

        const hashedPassword = await bcrypt.hash(u.password, 10);

        await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: {
                name: u.name,
                email: u.email,
                password: hashedPassword,
                roleId: roleRecord.id,
                active: true,
            },
        });
        
        console.log(`✅ Upserted default user: ${u.role} (${u.email})`);
    }
}
