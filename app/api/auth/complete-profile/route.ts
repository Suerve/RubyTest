
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      namePrefix,
      middleInitial,
      nameSuffix,
      dateOfBirth,
      zipCode,
      phoneNumber,
      englishFirst,
      educationLevel
    } = body;

    // Validate required fields
    if (!dateOfBirth || !zipCode) {
      return NextResponse.json(
        { error: 'Date of birth and ZIP code are required' },
        { status: 400 }
      );
    }

    // Validate ZIP code
    if (!/^\d{5}$/.test(zipCode)) {
      return NextResponse.json(
        { error: 'ZIP code must be 5 digits' },
        { status: 400 }
      );
    }

    // Update user profile
    await prisma.users.update({
      where: { email: session.user.email },
      data: {
        namePrefix: namePrefix || null,
        middleInitial: middleInitial || null,
        nameSuffix: nameSuffix || null,
        dateOfBirth: new Date(dateOfBirth),
        zipCode,
        phoneNumber: phoneNumber || null,
        englishFirst: englishFirst ? englishFirst === 'true' : null,
        educationLevel: educationLevel || null
      }
    });

    return NextResponse.json({
      message: 'Profile completed successfully'
    });

  } catch (error) {
    console.error('Complete profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
