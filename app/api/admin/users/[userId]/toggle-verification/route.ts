
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { isVerified } = body;
    const { userId } = params;

    if (typeof isVerified !== 'boolean') {
      return NextResponse.json(
        { error: 'isVerified must be a boolean' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.userType === 'ADMIN' && !session.user.isPrimaryAdmin) {
      return NextResponse.json(
        { error: 'Only primary admin can modify admin accounts' },
        { status: 403 }
      );
    }

    // Update email verification status
    await prisma.users.update({
      where: { id: userId },
      data: { 
        emailVerified: isVerified ? new Date() : null
      }
    });

    return NextResponse.json({
      message: isVerified ? 'Email marked as verified' : 'Email verification status removed'
    });

  } catch (error) {
    console.error('Toggle verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
