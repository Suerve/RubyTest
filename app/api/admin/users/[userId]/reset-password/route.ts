
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8),
  temporaryPassword: z.boolean().optional().default(false)
});

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { newPassword, temporaryPassword } = resetPasswordSchema.parse(body);
    
    const hashedPassword = await hashPassword(newPassword);
    
    await prisma.users.update({
      where: { 
        id: params.userId,
        userType: 'USER'
      },
      data: {
        password: hashedPassword,
        // If it's a temporary password, user should change it on next login
        ...(temporaryPassword && {
          // You could add a field like mustChangePassword: true if needed
        }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to reset password' }, 
      { status: 500 }
    );
  }
}
