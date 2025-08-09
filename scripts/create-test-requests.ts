
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function createTestRequests() {
  try {
    console.log('🔧 Creating test requests...');

    // Get test types
    const testTypes = await prisma.test_types.findMany();
    
    // Create a test user if it doesn't exist
    let testUser = await prisma.users.findUnique({
      where: { email: 'testuser@example.com' }
    });

    if (!testUser) {
      testUser = await prisma.users.create({
        data: {
          id: randomUUID(),
          email: 'testuser@example.com',
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: new Date('1990-01-01'),
          zipCode: '12345',
          password: '$2a$10$example', // dummy password hash
          updatedAt: new Date()
        }
      });
    }

    // Create test requests for different test types
    for (const testType of testTypes.slice(0, 3)) { // Create requests for first 3 test types
      const existingRequest = await prisma.test_requests.findUnique({
        where: {
          userId_testTypeId: {
            userId: testUser.id,
            testTypeId: testType.id
          }
        }
      });

      if (!existingRequest) {
        await prisma.test_requests.create({
          data: {
            id: randomUUID(),
            userId: testUser.id,
            testTypeId: testType.id,
            status: 'PENDING',
            reason: `I need access to ${testType.displayName} for my work requirements.`,
            updatedAt: new Date()
          }
        });
        console.log(`✅ Created test request for ${testType.displayName}`);
      } else {
        console.log(`⏭️  Test request already exists for ${testType.displayName}`);
      }
    }

    console.log('🎉 Test requests creation completed!');
  } catch (error) {
    console.error('❌ Error creating test requests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestRequests();
