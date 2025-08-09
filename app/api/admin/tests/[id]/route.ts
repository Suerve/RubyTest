
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const testId = params.id;

    // Check if test exists
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

    // Delete test and related data (cascade will handle testResults)
    await prisma.tests.delete({
      where: { id: testId },
    });

    // Log admin action
    await prisma.admin_actions.create({
      data: {
        id: randomUUID(),
        adminUserId: admin.id,
        action: 'TEST_DELETED',
        targetId: testId,
        details: {
          testId: testId,
          userId: test.userId,
          testType: test.test_types.name,
          status: test.status,
        },
      },
    });

    return NextResponse.json({ 
      message: 'Test deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting test:', error);
    return NextResponse.json(
      { message: 'Failed to delete test' },
      { status: 500 }
    );
  }
}
