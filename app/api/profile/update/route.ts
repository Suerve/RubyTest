
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      middleInitial,
      namePrefix,
      nameSuffix,
      phoneNumber,
      englishFirst,
      educationLevel,
      zipCode,
      dateOfBirth
    } = body;

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    if (!zipCode?.trim()) {
      return NextResponse.json(
        { error: 'ZIP code is required' },
        { status: 400 }
      );
    }

    // Validate ZIP code
    if (!/^\d{5}$/.test(zipCode.trim())) {
      return NextResponse.json(
        { error: 'ZIP code must be 5 digits' },
        { status: 400 }
      );
    }

    // Validate phone number format if provided
    if (phoneNumber && phoneNumber.trim()) {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return NextResponse.json(
          { error: 'Phone number must be 10 digits' },
          { status: 400 }
        );
      }
    }

    // Check if user is trying to update admin-only fields
    const isAdmin = user.userType === 'ADMIN';
    const updateData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      namePrefix: namePrefix?.trim() || null,
      middleInitial: middleInitial?.trim() || null,
      nameSuffix: nameSuffix?.trim() || null,
      zipCode: zipCode.trim(),
      phoneNumber: phoneNumber?.trim() || null,
      educationLevel: educationLevel?.trim() || null
    };

    // Only allow admins to update these fields
    if (isAdmin) {
      if (dateOfBirth) {
        updateData.dateOfBirth = new Date(dateOfBirth);
      }
      if (englishFirst !== undefined) {
        updateData.englishFirst = englishFirst === 'true' || englishFirst === true;
      }
    }

    // Update user profile
    await prisma.users.update({
      where: { id: user.id },
      data: updateData
    });

    return NextResponse.json({
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
