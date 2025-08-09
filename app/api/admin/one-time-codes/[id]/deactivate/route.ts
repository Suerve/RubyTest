
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
    const codeId = params.id;

    // Check if code exists
    const code = await prisma.one_time_codes.findUnique({
      where: { id: codeId },
      include: { test_types: true }
    });

    if (!code) {
      return NextResponse.json(
        { message: 'Code not found' },
        { status: 404 }
      );
    }

    if (!code.isActive) {
      return NextResponse.json(
        { message: 'Code is already inactive' },
        { status: 400 }
      );
    }

    if (code.usedBy) {
      return NextResponse.json(
        { message: 'Cannot deactivate used code' },
        { status: 400 }
      );
    }

    // Deactivate the code
    const updatedCode = await prisma.one_time_codes.update({
      where: { id: codeId },
      data: { isActive: false },
    });

    // Log admin action
    await prisma.admin_actions.create({
      data: {
        id: randomUUID(),
        adminUserId: admin.id,
        action: 'ACCESS_REVOKED', // Close enough for code deactivation
        targetId: codeId,
        details: {
          action: 'code_deactivated',
          code: code.code,
          testType: code.test_types.name,
        },
      },
    });

    return NextResponse.json({ 
      message: 'Code deactivated successfully',
      code: updatedCode
    });

  } catch (error) {
    console.error('Error deactivating code:', error);
    return NextResponse.json(
      { message: 'Failed to deactivate code' },
      { status: 500 }
    );
  }
}
