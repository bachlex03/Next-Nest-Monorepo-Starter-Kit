import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Clearing existing data...')
  await prisma.token.deleteMany()
  await prisma.user.deleteMany()

  // Create sample users
  console.log('👥 Creating sample users...')

  const hashedPassword = await bcrypt.hash('password123', 10)

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        userName: 'admin',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
      },
    }),
    prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        userName: 'johndoe',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@example.com',
        userName: 'janesmith',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Smith',
      },
    }),
  ])

  console.log(`✅ Created ${users.length} users`)

  // Create sample tokens (optional - for testing refresh tokens)
  console.log('🔑 Creating sample tokens...')

  const tokens = await Promise.all(
    users.map((user) =>
      prisma.token.create({
        data: {
          userId: user.id,
          refreshToken: null, // Will be set when user logs in
          locked: false,
        },
      }),
    ),
  )

  console.log(`✅ Created ${tokens.length} tokens`)

  console.log('🎉 Database seeding completed successfully!')
  console.log('\n📋 Sample Users:')
  users.forEach((user) => {
    console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - Username: ${user.userName}`)
  })
  console.log('\n🔑 Default password for all users: password123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
