
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    const token = await getToken({ req: request });

    if (!session?.user || !token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if already impersonating
    if (session.impersonating) {
      return NextResponse.json({ error: 'Already impersonating a user' }, { status: 400 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Prevent self-impersonation
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot impersonate yourself' }, { status: 400 });
    }

    // Get the user to impersonate
    const userToImpersonate = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        emailVerified: true
      }
    });

    if (!userToImpersonate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!userToImpersonate.emailVerified) {
      return NextResponse.json({ error: 'Cannot impersonate unverified user' }, { status: 400 });
    }

    // Only primary admin can impersonate other admins
    if (userToImpersonate.userType === 'ADMIN' && !session.user.isPrimaryAdmin) {
      return NextResponse.json({ error: 'Only primary admin can impersonate other administrators' }, { status: 400 });
    }

    // Create impersonation data
    const impersonationData = {
      originalAdmin: {
        id: session.user.id,
        email: session.user.email!,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        userType: session.user.userType
      },
      impersonatedUser: {
        id: userToImpersonate.id,
        email: userToImpersonate.email,
        firstName: userToImpersonate.firstName,
        lastName: userToImpersonate.lastName,
        userType: userToImpersonate.userType
      }
    };

    // Return the impersonation data to be set by the client
    return NextResponse.json({ 
      success: true,
      impersonationData,
      message: `Started impersonating ${userToImpersonate.firstName} ${userToImpersonate.lastName}`
    });

  } catch (error) {
    console.error('Impersonation start error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
