
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth-config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    const token = await getToken({ req: request });

    if (!session?.user || !token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if currently impersonating
    if (!session.impersonating) {
      return NextResponse.json({ error: 'Not currently impersonating any user' }, { status: 400 });
    }

    const originalAdmin = session.impersonating.originalAdmin;

    // Return success - the client will handle clearing the impersonation
    return NextResponse.json({ 
      success: true,
      originalAdmin,
      message: `Stopped impersonating, returning to admin panel`
    });

  } catch (error) {
    console.error('Impersonation end error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
