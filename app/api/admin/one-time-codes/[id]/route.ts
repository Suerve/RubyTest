
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
    const codeId = params.id;

    // Check if code exists and hasn't been used
    const code = await prisma.one_time_codes.findUnique({
      where: { id: codeId },
      include: { 
        test_types: true,
        _count: {
          select: {
            tests: true,
          }
        }
      }
    });

    if (!code) {
      return NextResponse.json(
        { message: 'Code not found' },
        { status: 404 }
      );
    }

    if (code.usedBy || code._count.tests > 0) {
      return NextResponse.json(
        { message: 'Cannot delete used code. Consider deactivating instead.' },
        { status: 400 }
      );
    }

    // Delete the code
    await prisma.one_time_codes.delete({
      where: { id: codeId },
    });

    // Log admin action
    await prisma.admin_actions.create({
      data: {
        id: randomUUID(),
        adminUserId: admin.id,
        action: 'USER_DELETED', // We can extend enum later for CODE_DELETED
        targetId: codeId,
        details: {
          action: 'code_deleted',
          code: code.code,
          testType: code.test_types.name,
        },
      },
    });

    return NextResponse.json({ 
      message: 'Code deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting code:', error);
    return NextResponse.json(
      { message: 'Failed to delete code' },
      { status: 500 }
    );
  }
}
