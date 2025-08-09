
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export const dynamic = "force-dynamic";

const updateUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleInitial: z.string().optional(),
  namePrefix: z.string().optional(),
  nameSuffix: z.string().optional(),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  zipCode: z.string().optional(),
  englishFirst: z.boolean().optional(),
  educationLevel: z.string().optional(),
  isPrimaryAdmin: z.boolean().optional(),
  isDeactivated: z.boolean().optional(),
  requirePasswordChange: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const data = updateUserSchema.parse(body);
    
    // Get the target user to check permissions
    const targetUser = await prisma.users.findUnique({
      where: { id: params.userId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Permission checks
    const isCurrentUserPrimaryAdmin = session.user.isPrimaryAdmin === true;
    
    // Regular admin can only manage regular users
    if (!isCurrentUserPrimaryAdmin && targetUser.userType === 'ADMIN') {
      return NextResponse.json(
        { error: 'Only primary admin can manage admin accounts' }, 
        { status: 403 }
      );
    }

    // Only primary admin can change primary admin status
    if (data.isPrimaryAdmin !== undefined && !isCurrentUserPrimaryAdmin) {
      return NextResponse.json(
        { error: 'Only primary admin can modify admin privileges' }, 
        { status: 403 }
      );
    }

    // Validate required fields for USER accounts
    if (targetUser.userType === 'USER') {
      if (!data.dateOfBirth) {
        return NextResponse.json(
          { error: 'Date of birth is required for user accounts' }, 
          { status: 400 }
        );
      }
      if (!data.zipCode) {
        return NextResponse.json(
          { error: 'Zip code is required for user accounts' }, 
          { status: 400 }
        );
      }
    }

    const user = await prisma.users.update({
      where: { 
        id: params.userId
      },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        user_test_access: {
          include: {
            test_types: true
          }
        }
      }
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update user' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    // Get the target user to check permissions
    const targetUser = await prisma.users.findUnique({
      where: { id: params.userId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isCurrentUserPrimaryAdmin = session.user.isPrimaryAdmin === true;
    
    // Only primary admin can delete admin accounts
    if (targetUser.userType === 'ADMIN' && !isCurrentUserPrimaryAdmin) {
      return NextResponse.json(
        { error: 'Only primary admin can delete admin accounts' }, 
        { status: 403 }
      );
    }

    // Delete user and all related data (cascade)
    await prisma.users.delete({
      where: { 
        id: params.userId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' }, 
      { status: 500 }
    );
  }
}
