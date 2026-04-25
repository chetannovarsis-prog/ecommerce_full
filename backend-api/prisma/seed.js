import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@admin.com';
  const adminPassword = 'admin123';

  console.log(`Checking for admin: ${adminEmail}`);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      password: adminPassword,
      is2FAEnabled: true
    },
    create: {
      email: adminEmail,
      password: adminPassword,
      is2FAEnabled: true
    }
  });

  console.log('Admin user created/updated successfully:', admin.email);

  // Also ensure default settings exist
  await prisma.globalSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      codEnabled: false
    }
  });
  console.log('Default settings ensured.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
