

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export const dynamic = "force-dynamic";

const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  tempPassword: z.string().min(6, 'Password must be at least 6 characters'),
  dateOfBirth: z.string().optional(),
  zipCode: z.string().optional(),
  userType: z.enum(['USER', 'ADMIN']),
  requirePasswordChange: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const data = createUserSchema.parse(body);

    // Only primary admin can create admin accounts
    if (data.userType === 'ADMIN' && session.user.isPrimaryAdmin !== true) {
      return NextResponse.json(
        { error: 'Only primary admin can create admin accounts' }, 
        { status: 403 }
      );
    }

    // Validate required fields for USER accounts
    if (data.userType === 'USER') {
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

    // Check if email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email address is already in use' }, 
        { status: 409 }
      );
    }

    // Hash the temporary password
    const hashedPassword = await bcrypt.hash(data.tempPassword, 12);

    // Create the user
    const newUser = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : new Date(),
        zipCode: data.zipCode || '',
        userType: data.userType,
        requirePasswordChange: data.requirePasswordChange,
        emailVerified: new Date(), // Auto-verify admin-created accounts
        isDeactivated: false,
        isPrimaryAdmin: false, // New accounts are never primary admin by default
      },
      include: {
        user_test_access: {
          include: {
            test_types: true
          }
        }
      }
    });

    // Remove password from response
    const { password: _, ...userResponse } = newUser;

    return NextResponse.json({ 
      success: true,
      user: userResponse,
      message: `${data.userType.toLowerCase()} account created successfully`
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create user' }, 
      { status: 500 }
    );
  }
}
