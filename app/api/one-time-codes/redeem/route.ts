
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const redeemCodeSchema = z.object({
  code: z.string().min(1).max(16),
});

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
    const { code } = redeemCodeSchema.parse(body);

    // Find the one-time code
    const oneTimeCode = await prisma.one_time_codes.findUnique({
      where: { code },
      include: { test_types: true }
    });

    if (!oneTimeCode) {
      return NextResponse.json(
        { error: 'Invalid code' },
        { status: 404 }
      );
    }

    // Check if code is still active
    if (!oneTimeCode.isActive) {
      return NextResponse.json(
        { error: 'Code has already been used' },
        { status: 400 }
      );
    }

    // Check if code has expired
    if (oneTimeCode.expiresAt && oneTimeCode.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Code has expired' },
        { status: 400 }
      );
    }

    // Check if user already has access to this test type
    const existingAccess = await prisma.user_test_access.findUnique({
      where: {
        userId_testTypeId: {
          userId: user.id,
          testTypeId: oneTimeCode.testTypeId
        }
      }
    });

    if (existingAccess && existingAccess.accessType !== 'NONE') {
      return NextResponse.json(
        { error: 'You already have access to this test type' },
        { status: 409 }
      );
    }

    // Use transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Mark the code as used
      await tx.one_time_codes.update({
        where: { id: oneTimeCode.id },
        data: {
          usedBy: user.id,
          usedAt: new Date(),
          isActive: false
        }
      });

      // Grant or update user access
      const accessData = {
        userId: user.id,
        testTypeId: oneTimeCode.testTypeId,
        accessType: 'ONE_TIME' as const,
        grantedBy: oneTimeCode.createdBy,
        grantedAt: new Date(),
        isActive: true
      };

      const userAccess = await tx.user_test_access.upsert({
        where: {
          userId_testTypeId: {
            userId: user.id,
            testTypeId: oneTimeCode.testTypeId
          }
        },
        create: {
          id: crypto.randomUUID(),
          ...accessData,
          updatedAt: new Date()
        },
        update: {
          accessType: 'ONE_TIME',
          grantedBy: oneTimeCode.createdBy,
          grantedAt: new Date(),
          isActive: true,
          updatedAt: new Date()
        },
        include: {
          test_types: true
        }
      });

      return { userAccess, testType: oneTimeCode.test_types };
    });

    return NextResponse.json({
      success: true,
      testType: result.testType,
      access: result.userAccess
    });

  } catch (error) {
    console.error('Error redeeming one-time code:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid code format', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to redeem code' },
      { status: 500 }
    );
  }
}
