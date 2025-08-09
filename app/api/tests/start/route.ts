
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { testTypeId, isPractice = false } = body;

    if (!testTypeId) {
      return NextResponse.json(
        { error: 'Test type ID is required' },
        { status: 400 }
      );
    }

    // Get test type info
    const testType = await prisma.test_types.findUnique({
      where: { id: testTypeId }
    });

    if (!testType) {
      return NextResponse.json(
        { error: 'Invalid test type' },
        { status: 400 }
      );
    }

    if (!isPractice) {
      // Check user access for actual tests
      const access = await prisma.user_test_access.findUnique({
        where: {
          userId_testTypeId: {
            userId: user.id,
            testTypeId: testTypeId
          }
        }
      });

      if (!access || (access.accessType !== 'UNLIMITED' && access.accessType !== 'ONE_TIME')) {
        return NextResponse.json(
          { error: 'Access denied for this test type' },
          { status: 403 }
        );
      }

      // Check for existing active tests
      const activeTest = await prisma.tests.findFirst({
        where: {
          userId: user.id,
          testTypeId: testTypeId,
          status: { in: ['STARTED', 'PAUSED'] }
        }
      });

      if (activeTest) {
        return NextResponse.json(
          { error: 'You already have an active test for this type', testId: activeTest.id },
          { status: 400 }
        );
      }
    }

    // Determine time limit based on test type
    let timeLimit: number | null = null;
    if (testType.name === 'typing-keyboard' || testType.name === 'typing-10key') {
      timeLimit = isPractice ? 30 : 60; // seconds
    } else if (testType.name === 'digital-literacy') {
      timeLimit = 60; // seconds per question
    }

    // Create the test and handle one-time access transition
    const result = await prisma.$transaction(async (tx) => {
      // Create the test
      const test = await tx.tests.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          userId: user.id,
          testTypeId: testTypeId,
          isPractice,
          status: 'STARTED',
          timeLimit,
          startedAt: new Date(),
          questionsOrder: [], // Will be populated when questions are generated
          answers: {}
        }
      });

      // If this is not a practice test and user had ONE_TIME access, consume it
      if (!isPractice) {
        const userAccess = await tx.user_test_access.findUnique({
          where: {
            userId_testTypeId: {
              userId: user.id,
              testTypeId: testTypeId
            }
          }
        });

        if (userAccess && userAccess.accessType === 'ONE_TIME') {
          // Change ONE_TIME access to NONE after starting the test
          await tx.user_test_access.update({
            where: { id: userAccess.id },
            data: {
              accessType: 'NONE',
              updatedAt: new Date()
            }
          });
        }
      }

      return test;
    });

    return NextResponse.json({
      message: 'Test started successfully',
      testId: result.id,
      timeLimit: timeLimit
    });

  } catch (error) {
    console.error('Start test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
