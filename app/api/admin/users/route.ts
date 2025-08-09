
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    
    // Get the includeAdmins query parameter
    const { searchParams } = new URL(request.url);
    const includeAdmins = searchParams.get('includeAdmins') === 'true';
    
    // Build the where clause based on includeAdmins parameter
    const whereClause = includeAdmins 
      ? {} // Include all users (both USER and ADMIN)
      : { userType: 'USER' as const }; // Only regular users
    
    const users = await prisma.users.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleInitial: true,
        namePrefix: true,
        nameSuffix: true,
        email: true,
        emailVerified: true,
        phoneNumber: true,
        dateOfBirth: true,
        zipCode: true,
        englishFirst: true,
        educationLevel: true,
        profileImage: true,
        userType: true,
        isPrimaryAdmin: true,
        isDeactivated: true,
        requirePasswordChange: true,
        createdAt: true,
        user_test_access: {
          select: {
            id: true,
            accessType: true,
            grantedAt: true,
            test_types: {
              select: {
                id: true,
                name: true,
                displayName: true
              }
            }
          }
        },
        tests: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: {
            test_types: true
          }
        },
        test_requests: {
          where: { status: 'PENDING' }
        },
        _count: {
          select: {
            tests: true,
            test_requests: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' }, 
      { status: 500 }
    );
  }
}
