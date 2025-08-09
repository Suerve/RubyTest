
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
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
    const { reason } = body;

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
          status: 'DENIED',
          reviewedBy: admin.id,
          reviewedAt: new Date(),
          response: reason || 'Request denied by administrator'
        }
      });

      // Log admin action
      await tx.admin_actions.create({
        data: {
          id: randomUUID(),
          adminUserId: admin.id,
          action: 'ACCESS_REVOKED',
          targetId: testRequest.userId,
          details: {
            testType: testRequest.test_types.name,
            action: 'REQUEST_DENIED',
            requestId: testRequest.id,
            reason
          }
        }
      });

      return updatedRequest;
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Test request rejected successfully',
      request: result 
    });

  } catch (error) {
    console.error('Error rejecting test request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reject test request' },
      { status: 500 }
    );
  }
}
