
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AccessType } from '@prisma/client';
import { randomUUID } from 'crypto';

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const admin = await requireAdmin();
    const { requestId } = params;
    const body = await request.json();
    const { accessType, response } = body;

    if (!accessType || !['ONE_TIME', 'UNLIMITED'].includes(accessType)) {
      return NextResponse.json(
        { error: 'Invalid access type. Must be ONE_TIME or UNLIMITED.' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get the test request
      const testRequest = await tx.test_requests.findUnique({
        where: { id: requestId },
        include: { users: true, test_types: true }
      });

      if (!testRequest) {
        throw new Error('Test request not found');
      }

      if (testRequest.status !== 'PENDING') {
        throw new Error('This request has already been processed');
      }

      // Update the test request status
      const updatedRequest = await tx.test_requests.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedBy: admin.id,
          reviewedAt: new Date(),
          response: response || `Access granted: ${accessType.toLowerCase().replace('_', '-')} access`
        }
      });

      // Grant or update user access
      await tx.user_test_access.upsert({
        where: {
          userId_testTypeId: {
            userId: testRequest.userId,
            testTypeId: testRequest.testTypeId
          }
        },
        update: {
          accessType: accessType as AccessType,
          grantedBy: admin.id,
          grantedAt: new Date(),
          isActive: true
        },
        create: {
          id: randomUUID(),
          userId: testRequest.userId,
          testTypeId: testRequest.testTypeId,
          accessType: accessType as AccessType,
          grantedBy: admin.id,
          grantedAt: new Date(),
          isActive: true,
          updatedAt: new Date()
        }
      });

      // Log admin action
      await tx.admin_actions.create({
        data: {
          id: randomUUID(),
          adminUserId: admin.id,
          action: 'ACCESS_GRANTED',
          targetId: testRequest.userId,
          details: {
            testType: testRequest.test_types.name,
            accessType,
            requestId: testRequest.id
          }
        }
      });

      return updatedRequest;
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Test request approved successfully',
      request: result 
    });

  } catch (error) {
    console.error('Error approving test request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to approve test request' },
      { status: 500 }
    );
  }
}
