
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcryptjs from 'bcryptjs';
import { calculatePasswordStrength } from '@/lib/password';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordStrength = calculatePasswordStrength(password);
    if (passwordStrength.score < 5) {
      return NextResponse.json(
        { error: 'Password must meet all security requirements' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user (without email verification initially)
    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        dateOfBirth: new Date('2000-01-01'), // Temporary - will be set during profile completion
        zipCode: '00000', // Temporary - will be set during profile completion
        userType: 'USER'
      }
    });

    // Create email verification record
    await prisma.emailVerification.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        email: email.toLowerCase(),
        token: verificationToken,
        expires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      }
    });

    // In a real app, you would send an email here
    // For development, we'll just return the token
    console.log(`Verification token for ${email}: ${verificationToken}`);

    return NextResponse.json({
      message: 'Account created successfully. Please check your email to verify your account.',
      verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
