
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

    const { userId } = params;

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

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hour expiration

    // Delete any existing verification records for this user and create a new one
    await prisma.emailVerification.deleteMany({
      where: { userId: userId, verified: false }
    });

    // Create new verification record
    await prisma.emailVerification.create({
      data: {
        id: crypto.randomUUID(),
        userId: userId,
        email: user.email,
        token: token,
        expires: expires,
        verified: false,
        createdAt: new Date()
      }
    });

    // In a real application, you would send an email here
    // For this implementation, we'll just return the verification link
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

    return NextResponse.json({
      message: 'Verification email would be sent',
      verificationUrl: verificationUrl,
      note: 'In production, this would send an actual email to the user'
    });

  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
