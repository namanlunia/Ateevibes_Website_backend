import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function bootstrapAdmin() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@ateevibes.com';
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'AteevibesAdmin2026!';
  const name = process.env.ADMIN_BOOTSTRAP_NAME || 'Atelier Director';

  console.log(`🔐 Bootstrapping initial owner admin account for: ${email}`);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      passwordHash,
      name,
      role: 'OWNER',
      isActive: true,
    },
    create: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'OWNER',
      isActive: true,
    },
  });

  console.log(`✅ Success! Owner Admin active:`);
  console.log(`   ID:    ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role:  ${user.role}`);
  console.log(`   Name:  ${user.name}`);
}

bootstrapAdmin()
  .catch((err) => {
    console.error('Admin bootstrap failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
