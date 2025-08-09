
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { randomUUID } from 'crypto';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test types
  console.log('📝 Creating test types...');
  const testTypes = [
    {
      name: 'typing-10key',
      displayName: '10-Key Typing Test',
      description: 'Test numeric keypad typing speed and accuracy'
    },
    {
      name: 'typing-keyboard',
      displayName: 'Keyboard Typing Test',
      description: 'Test general keyboard typing speed and accuracy'
    },
    {
      name: 'digital-literacy',
      displayName: 'Digital Literacy Test',
      description: 'Test computer and technology literacy skills'
    },
    {
      name: 'basic-math',
      displayName: 'Basic Math Test',
      description: 'Test mathematical skills from 5th to 12th grade level'
    },
    {
      name: 'basic-english',
      displayName: 'Basic English Test',
      description: 'Test language mastery and reading comprehension skills'
    }
  ];

  for (const testType of testTypes) {
    const existing = await prisma.test_types.findUnique({
      where: { name: testType.name }
    });

    if (!existing) {
      await prisma.test_types.create({ 
        data: {
          id: crypto.randomUUID(),
          ...testType
        }
      });
      console.log(`✅ Created test type: ${testType.displayName}`);
    } else {
      console.log(`⏭️  Test type already exists: ${testType.displayName}`);
    }
  }

  // Create practice test configurations
  console.log('⚙️  Creating practice test configurations...');
  const testTypeRecords = await prisma.test_types.findMany();
  
  for (const testType of testTypeRecords) {
    const existing = await prisma.practice_test_config.findUnique({
      where: { testTypeId: testType.id }
    });

    if (!existing) {
      const config = {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        testTypeId: testType.id,
        questionCount: 5,
        timeLimit: testType.name.startsWith('typing') ? 30 : null, // 30 seconds for typing tests
        minBankQuestions: testType.name === 'digital-literacy' ? 5 : 0
      };

      await prisma.practice_test_config.create({ data: config });
      console.log(`⚙️  Created practice config for: ${testType.displayName}`);
    }
  }

  // Create typing test content
  console.log('✍️  Creating typing test content...');
  
  // Get typing test types
  const keyboardTestType = await prisma.test_types.findUnique({
    where: { name: 'typing-keyboard' }
  });
  const tenKeyTestType = await prisma.test_types.findUnique({
    where: { name: 'typing-10key' }
  });

  // Keyboarding test passages
  if (keyboardTestType) {
    const keyboardingPassages = [
      {
        content: "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet at least once, making it perfect for typing practice.",
        passageText: "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet at least once, making it perfect for typing practice.",
        wordCount: 25,
        characterCount: 138
      },
      {
        content: "Technology has revolutionized the way we communicate, work, and live. From smartphones to artificial intelligence, innovation continues to shape our future in remarkable ways.",
        passageText: "Technology has revolutionized the way we communicate, work, and live. From smartphones to artificial intelligence, innovation continues to shape our future in remarkable ways.",
        wordCount: 25,
        characterCount: 158
      },
      {
        content: "Success in life requires dedication, persistence, and hard work. Every challenge presents an opportunity to grow stronger and wiser. Never give up on your dreams and aspirations!",
        passageText: "Success in life requires dedication, persistence, and hard work. Every challenge presents an opportunity to grow stronger and wiser. Never give up on your dreams and aspirations!",
        wordCount: 29,
        characterCount: 174
      },
      {
        content: "The art of cooking combines creativity with technique. Fresh ingredients, proper timing, and attention to detail transform simple foods into extraordinary culinary experiences.",
        passageText: "The art of cooking combines creativity with technique. Fresh ingredients, proper timing, and attention to detail transform simple foods into extraordinary culinary experiences.",
        wordCount: 25,
        characterCount: 157
      },
      {
        content: "Reading opens doors to new worlds and perspectives. Books transport us to different places, times, and cultures, enriching our understanding of humanity and ourselves.",
        passageText: "Reading opens doors to new worlds and perspectives. Books transport us to different places, times, and cultures, enriching our understanding of humanity and ourselves.",
        wordCount: 26,
        characterCount: 148
      }
    ];

    for (const passage of keyboardingPassages) {
      const existing = await prisma.questions.findFirst({
        where: { 
          testTypeId: keyboardTestType.id,
          content: passage.content 
        }
      });

      if (!existing) {
        await prisma.questions.create({
          data: {
            id: randomUUID(),
            testTypeId: keyboardTestType.id,
            content: passage.content,
            questionType: 'TYPING_PASSAGE',
            correctAnswer: { text: passage.passageText },
            metadata: {
              passageText: passage.passageText,
              wordCount: passage.wordCount,
              characterCount: passage.characterCount,
              testType: 'keyboarding'
            },
            updatedAt: new Date()
          }
        });
      }
    }
    console.log('✅ Created keyboarding test content');
  }

  // 10-key test sequences
  if (tenKeyTestType) {
    const tenKeySequences = [
      { sequence: "123456789", description: "Basic sequential numbers" },
      { sequence: "147258369", description: "Keypad pattern practice" },
      { sequence: "987654321", description: "Reverse sequential numbers" },
      { sequence: "456789123", description: "Middle row start pattern" },
      { sequence: "789456123", description: "Top row start pattern" },
      { sequence: "123789456", description: "Bottom row start pattern" },
      { sequence: "159357246", description: "Diagonal keypad pattern" },
      { sequence: "852741963", description: "Complex keypad pattern" }
    ];

    for (const seq of tenKeySequences) {
      const repeatedSequence = Array(8).fill(seq.sequence).join(' ');
      
      const existing = await prisma.questions.findFirst({
        where: { 
          testTypeId: tenKeyTestType.id,
          content: { contains: repeatedSequence }
        }
      });

      if (!existing) {
        await prisma.questions.create({
          data: {
            id: randomUUID(),
            testTypeId: tenKeyTestType.id,
            content: `Type the following number sequence: ${repeatedSequence}`,
            questionType: 'TYPING_PASSAGE',
            correctAnswer: { sequence: repeatedSequence },
            metadata: { 
              description: seq.description,
              expectedText: repeatedSequence,
              characterCount: repeatedSequence.length,
              testType: '10-key'
            },
            updatedAt: new Date()
          }
        });
      }
    }
    console.log('✅ Created 10-key test content');
  }

  // Create initial app settings
  console.log('🔧 Creating app settings...');
  const existingSettings = await prisma.app_settings.findFirst();
  
  if (!existingSettings) {
    await prisma.app_settings.create({
      data: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        twoFactorEnabled: false,
        customSignatureEnabled: false,
        signatureName: 'Management, Rubicon Programs',
        testPausingEnabled: true,
        pdfDownloadEnabled: true,
        practiceTestEnabled: true
      }
    });
    console.log('✅ Created initial app settings');
  } else {
    console.log('⏭️  App settings already exist');
  }

  // Create initial admin user
  console.log('👤 Creating initial admin user...');
  const adminEmail = 'donteb@rubiconprograms.org';
  const existingAdmin = await prisma.users.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcryptjs.hash('RubiconPrograms2025!', 12);
    
    const adminUser = await prisma.users.create({
      data: {
        id: randomUUID(),
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Donté',
        lastName: 'Blue',
        dateOfBirth: new Date('1990-01-01'), // Placeholder date
        zipCode: '00000', // Placeholder zip
        userType: 'ADMIN',
        isPrimaryAdmin: true,
        primaryAdminDate: new Date(),
        emailVerified: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Created initial admin user: Donté Blue');

    // Grant unlimited access to all test types for admin (for testing purposes)
    for (const testType of testTypeRecords) {
      await prisma.user_test_access.create({
        data: {
          id: randomUUID(),
          userId: adminUser.id,
          testTypeId: testType.id,
          accessType: 'UNLIMITED',
          grantedBy: adminUser.id,
          grantedAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    console.log('✅ Granted test access to admin user');
  } else {
    console.log('⏭️  Admin user already exists');
  }

  // Create test admin user for demonstration (as mentioned in requirements)
  console.log('👤 Creating test admin user...');
  const testEmail = 'john@doe.com';
  const existingTestUser = await prisma.users.findUnique({
    where: { email: testEmail }
  });

  if (!existingTestUser) {
    const hashedTestPassword = await bcryptjs.hash('johndoe123', 12);
    
    const testAdmin = await prisma.users.create({
      data: {
        id: randomUUID(),
        email: testEmail,
        password: hashedTestPassword,
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        zipCode: '12345',
        userType: 'ADMIN',
        isPrimaryAdmin: true,
        primaryAdminDate: new Date(),
        isDeactivated: false,
        requirePasswordChange: false,
        emailVerified: new Date(),
        updatedAt: new Date()
      }
    });

    // Grant unlimited access to all test types for test admin
    for (const testType of testTypeRecords) {
      await prisma.user_test_access.create({
        data: {
          id: randomUUID(),
          userId: testAdmin.id,
          testTypeId: testType.id,
          accessType: 'UNLIMITED',
          grantedBy: testAdmin.id,
          grantedAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    console.log('✅ Created test admin user: John Doe (Primary Admin)');
  } else {
    console.log('⏭️  Test admin user already exists');
  }

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
