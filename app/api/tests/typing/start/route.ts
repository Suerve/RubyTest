
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

interface StartTypingTestRequest {
  testType: 'keyboarding' | '10-key';
  isPractice: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { testType, isPractice }: StartTypingTestRequest = await request.json();

    // Get test type
    const testTypeName = testType === 'keyboarding' ? 'typing-keyboard' : 'typing-10key';
    const testTypeRecord = await prisma.test_types.findUnique({
      where: { name: testTypeName }
    });

    if (!testTypeRecord) {
      return NextResponse.json({ error: 'Test type not found' }, { status: 404 });
    }

    // Check user access
    const userAccess = await prisma.user_test_access.findUnique({
      where: {
        userId_testTypeId: {
          userId: user.id,
          testTypeId: testTypeRecord.id
        }
      }
    });

    if (!userAccess || userAccess.accessType === 'NONE') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if there's already an active test
    if (!isPractice) {
      const activeTest = await prisma.tests.findFirst({
        where: {
          userId: user.id,
          testTypeId: testTypeRecord.id,
          status: { in: ['STARTED', 'PAUSED'] }
        }
      });

      if (activeTest) {
        return NextResponse.json({ error: 'You already have an active test' }, { status: 409 });
      }
    }

    // Get content from question bank
    const questions = await prisma.questions.findMany({
      where: {
        testTypeId: testTypeRecord.id,
        questionType: 'TYPING_PASSAGE',
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Select random question
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    
    if (!randomQuestion) {
      return NextResponse.json({ error: 'No content available' }, { status: 404 });
    }

    // Create test session
    const timeLimit = isPractice ? 30 : 60; // 30 seconds for practice, 60 for actual test
    
    const test = await prisma.tests.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        testTypeId: testTypeRecord.id,
        isPractice,
        status: 'STARTED',
        timeLimit,
        questionsOrder: [randomQuestion.id],
        currentQuestionId: randomQuestion.id,
        additionalData: {
          testType,
          startedAt: new Date().toISOString()
        },
        updatedAt: new Date()
      }
    });

    // Store typing test session data in test additionalData
    const metadata = randomQuestion.metadata as any;
    const passageText = metadata?.passageText || randomQuestion.content;
    const expectedText = metadata?.expectedText || metadata?.passageText || randomQuestion.content;
    
    // Update test with typing session data
    const updatedTest = await prisma.tests.update({
      where: { id: test.id },
      data: {
        additionalData: {
          testType,
          startedAt: new Date().toISOString(),
          passageText,
          expectedText,
          currentPosition: 0,
          currentWordIndex: 0,
          typedText: '',
          statistics: {
            wpm: 0,
            accuracy: 100,
            weightedWpm: 0,
            correctCharacters: 0,
            totalCharacters: 0,
            timeElapsed: 0
          }
        }
      }
    });

    const typingSession = {
      id: randomUUID(),
      testId: test.id,
      userId: user.id,
      testType,
      passageText,
      expectedText,
      startedAt: new Date()
    };

    // Update access for ONE_TIME users
    if (!isPractice && userAccess.accessType === 'ONE_TIME') {
      await prisma.user_test_access.update({
        where: { id: userAccess.id },
        data: { accessType: 'NONE' }
      });
    }

    return NextResponse.json({
      test: updatedTest,
      session: typingSession,
      question: {
        id: randomQuestion.id,
        content: randomQuestion.content,
        passageText,
        expectedText,
        metadata: randomQuestion.metadata
      },
      timeLimit
    });

  } catch (error) {
    console.error('Start typing test error:', error);
    return NextResponse.json(
      { error: 'Failed to start typing test' },
      { status: 500 }
    );
  }
}
