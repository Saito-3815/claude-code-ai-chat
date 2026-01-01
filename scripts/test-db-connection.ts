import { prisma } from '../src/lib/db'

async function testConnection() {
  try {
    console.log('Testing database connection...')

    // データベースに接続を試みる
    await prisma.$connect()
    console.log('✓ Successfully connected to MongoDB')

    // 簡単なクエリを実行してみる
    const userCount = await prisma.user.count()
    console.log(`✓ Database query successful. Current user count: ${userCount}`)

    console.log('\n✓ All database tests passed!')
  } catch (error) {
    console.error('✗ Database connection failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
