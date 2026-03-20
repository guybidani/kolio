import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'guy@kolio.ai'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!'
  const orgName = 'Project Adam'
  const orgSlug = 'project-adam'

  console.log('Seeding database...')

  // Create or find default org
  const org = await prisma.organization.upsert({
    where: { slug: orgSlug },
    update: {},
    create: {
      name: orgName,
      slug: orgSlug,
      plan: 'PRO',
      planSeats: 20,
    },
  })
  console.log(`Organization: ${org.name} (${org.id})`)

  // Create or update admin user
  const passwordHash = await bcrypt.hash(adminPassword, 12)
  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      isAdmin: true,
      role: 'ADMIN',
    },
    create: {
      email: adminEmail,
      name: 'Guy Bidani',
      passwordHash,
      orgId: org.id,
      role: 'ADMIN',
      isAdmin: true,
    },
  })
  console.log(`Admin user: ${user.email} (${user.id})`)
  console.log(`Password: ${adminPassword}`)
  console.log('\nSeed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
