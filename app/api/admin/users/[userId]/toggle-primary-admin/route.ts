

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const togglePrimaryAdminSchema = z.object({
  isPrimaryAdmin: z.boolean(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    // Only primary admin can modify admin privileges
    if (session.user.isPrimaryAdmin !== true) {
      return NextResponse.json(
        { error: 'Only primary admin can modify admin privileges' }, 
        { status: 403 }
      );
    }

    const body = await request.json();
    const { isPrimaryAdmin } = togglePrimaryAdminSchema.parse(body);

    // Get the target user to check it's an admin
    const targetUser = await prisma.users.findUnique({
      where: { id: params.userId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Primary admin privileges can only be granted to admin accounts' }, 
        { status: 400 }
      );
    }

    const updatedUser = await prisma.users.update({
      where: { id: params.userId },
      data: {
        isPrimaryAdmin,
        primaryAdminDate: isPrimaryAdmin ? new Date() : null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true,
      user: updatedUser,
      message: isPrimaryAdmin 
        ? 'Primary admin privileges granted' 
        : 'Primary admin privileges revoked'
    });
  } catch (error) {
    console.error('Error toggling primary admin status:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to toggle primary admin status' }, 
      { status: 500 }
    );
  }
}
