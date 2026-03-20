const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'guy@kolio.ai'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!'
  const orgName = 'Project Adam'
  const orgSlug = 'project-adam'

  console.log('Seeding database...')

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
  console.log('Seed complete!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e.message)
    process.exit(0) // Don't fail container start
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
