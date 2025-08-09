
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
    const { testTypeIds, reason } = body;

    if (!testTypeIds || !Array.isArray(testTypeIds) || testTypeIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one test type must be selected' },
        { status: 400 }
      );
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Reason for request is required' },
        { status: 400 }
      );
    }

    // Validate test types exist
    const validTestTypes = await prisma.test_types.findMany({
      where: { 
        id: { in: testTypeIds },
        isActive: true 
      }
    });

    if (validTestTypes.length !== testTypeIds.length) {
      return NextResponse.json(
        { error: 'Invalid test type selected' },
        { status: 400 }
      );
    }

    // Check for existing requests or access
    const existingRequests = await prisma.test_requests.findMany({
      where: {
        userId: user.id,
        testTypeId: { in: testTypeIds },
        status: 'PENDING'
      }
    });

    const existingAccess = await prisma.user_test_access.findMany({
      where: {
        userId: user.id,
        testTypeId: { in: testTypeIds },
        isActive: true,
        accessType: { not: 'NONE' }
      }
    });

    const blockedTypes = [
      ...existingRequests.map(req => req.testTypeId),
      ...existingAccess.map(access => access.testTypeId)
    ];

    const allowedTypes = testTypeIds.filter(id => !blockedTypes.includes(id));

    if (allowedTypes.length === 0) {
      return NextResponse.json(
        { error: 'You already have access or pending requests for all selected test types' },
        { status: 400 }
      );
    }

    // Create test requests
    await prisma.test_requests.createMany({
      data: allowedTypes.map(testTypeId => ({
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        userId: user.id,
        testTypeId,
        reason: reason.trim(),
        status: 'PENDING'
      }))
    });

    return NextResponse.json({
      message: `Successfully submitted ${allowedTypes.length} test access request${allowedTypes.length > 1 ? 's' : ''}`,
      requestedCount: allowedTypes.length
    });

  } catch (error) {
    console.error('Request access error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
