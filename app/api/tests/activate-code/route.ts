
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

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
    const { code } = body;

    if (!code?.trim()) {
      return NextResponse.json(
        { error: 'Access code is required' },
        { status: 400 }
      );
    }

    // Find the one-time code
    const oneTimeCode = await prisma.one_time_codes.findUnique({
      where: { 
        code: code.trim().toUpperCase() 
      },
      include: {
        test_types: true
      }
    });

    if (!oneTimeCode) {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 400 }
      );
    }

    // Check if code is still active
    if (!oneTimeCode.isActive) {
      return NextResponse.json(
        { error: 'This access code has been deactivated' },
        { status: 400 }
      );
    }

    // Check if code has expired
    if (oneTimeCode.expiresAt && oneTimeCode.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This access code has expired' },
        { status: 400 }
      );
    }

    // Check if code has already been used
    if (oneTimeCode.usedBy) {
      return NextResponse.json(
        { error: 'This access code has already been used' },
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

    let accessType: 'UNLIMITED' | 'ONE_TIME' | 'PRACTICE_ONLY' | 'NONE' = 'UNLIMITED'; // Default access type for one-time codes

    if (existingAccess) {
      // Update existing access if it's lower than what the code provides
      if (existingAccess.accessType === 'NONE' || existingAccess.accessType === 'PRACTICE_ONLY') {
        await prisma.user_test_access.update({
          where: { id: existingAccess.id },
          data: {
            accessType: accessType,
            isActive: true,
            updatedAt: new Date()
          }
        });
      } else {
        // User already has equal or better access
        await prisma.one_time_codes.update({
          where: { id: oneTimeCode.id },
          data: {
            usedBy: user.id,
            usedAt: new Date()
          }
        });
        
        return NextResponse.json({
          message: `You already have access to ${oneTimeCode.test_types.displayName}`,
          testType: oneTimeCode.test_types.displayName
        });
      }
    } else {
      // Create new access
      await prisma.user_test_access.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          testTypeId: oneTimeCode.testTypeId,
          accessType: accessType,
          isActive: true,
          updatedAt: new Date()
        }
      });
    }

    // Mark code as used
    await prisma.one_time_codes.update({
      where: { id: oneTimeCode.id },
      data: {
        usedBy: user.id,
        usedAt: new Date()
      }
    });

    return NextResponse.json({
      message: `Successfully activated access to ${oneTimeCode.test_types.displayName}`,
      testType: oneTimeCode.test_types.displayName,
      accessType: accessType
    });

  } catch (error) {
    console.error('Activate code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
