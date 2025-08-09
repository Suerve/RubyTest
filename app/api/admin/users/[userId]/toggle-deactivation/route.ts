

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const toggleDeactivationSchema = z.object({
  isDeactivated: z.boolean(),
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

    const body = await request.json();
    const { isDeactivated } = toggleDeactivationSchema.parse(body);

    // Get the target user to check permissions
    const targetUser = await prisma.users.findUnique({
      where: { id: params.userId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isCurrentUserPrimaryAdmin = session.user.isPrimaryAdmin === true;
    
    // Regular admin can only manage regular users
    if (!isCurrentUserPrimaryAdmin && targetUser.userType === 'ADMIN') {
      return NextResponse.json(
        { error: 'Only primary admin can manage admin accounts' }, 
        { status: 403 }
      );
    }

    const updatedUser = await prisma.users.update({
      where: { id: params.userId },
      data: {
        isDeactivated,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true,
      user: updatedUser,
      message: isDeactivated ? 'User account deactivated' : 'User account activated'
    });
  } catch (error) {
    console.error('Error toggling user deactivation:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to toggle user deactivation' }, 
      { status: 500 }
    );
  }
}
