import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('senha123', 10);

  const merchant = await prisma.user.upsert({
    where: { email: 'carlos@fastdelivery.dev' },
    update: {},
    create: {
      name: 'Carlos Oliveira',
      email: 'carlos@fastdelivery.dev',
      role: 'MERCHANT',
      passwordHash: password,
    },
  });

  const client = await prisma.user.upsert({
    where: { email: 'mariana@fastdelivery.dev' },
    update: {},
    create: {
      name: 'Mariana Souza',
      email: 'mariana@fastdelivery.dev',
      role: 'CLIENT',
      passwordHash: password,
      addresses: {
        create: {
          label: 'Trabalho',
          street: 'Av. Paulista',
          number: '1000',
          district: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          isDefault: true,
        },
      },
    },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { ownerId: merchant.id },
    update: {},
    create: {
      ownerId: merchant.id,
      name: 'Cantina do Carlos',
      description: 'Comida caseira e marmitas',
      category: 'Brasileira',
      deliveryFee: 6.9,
      minOrder: 20,
      etaMinMinutes: 25,
      etaMaxMinutes: 45,
      menuItems: {
        create: [
          { name: 'Marmita Executiva', description: 'Arroz, feijão, bife e salada', price: 24.9, category: 'Pratos' },
          { name: 'Feijoada Individual', description: 'Acompanha arroz e couve', price: 32.5, category: 'Pratos' },
          { name: 'Refrigerante Lata', price: 6, category: 'Bebidas' },
        ],
      },
    },
  });

  console.log({ merchant: merchant.email, client: client.email, restaurant: restaurant.name });
  console.log('Login de teste -> senha: senha123');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
