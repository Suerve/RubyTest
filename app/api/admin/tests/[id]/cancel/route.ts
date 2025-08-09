
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const { reason } = await request.json();
    const testId = params.id;

    // Check if test exists and is in progress
    const test = await prisma.tests.findUnique({
      where: { id: testId },
      include: { users: true, test_types: true }
    });

    if (!test) {
      return NextResponse.json(
        { message: 'Test not found' },
        { status: 404 }
      );
    }

    if (test.status !== 'STARTED' && test.status !== 'PAUSED') {
      return NextResponse.json(
        { message: 'Test cannot be cancelled in its current state' },
        { status: 400 }
      );
    }

    // Cancel the test
    const updatedTest = await prisma.tests.update({
      where: { id: testId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason || 'Cancelled by admin',
      },
    });

    // Log admin action
    await prisma.admin_actions.create({
      data: {
        id: randomUUID(),
        adminUserId: admin.id,
        action: 'TEST_CANCELLED',
        targetId: testId,
        details: {
          testId: testId,
          userId: test.userId,
          testType: test.test_types.name,
          reason: reason || 'Cancelled by admin',
        },
      },
    });

    return NextResponse.json({ 
      message: 'Test cancelled successfully',
      test: updatedTest
    });

  } catch (error) {
    console.error('Error cancelling test:', error);
    return NextResponse.json(
      { message: 'Failed to cancel test' },
      { status: 500 }
    );
  }
}
