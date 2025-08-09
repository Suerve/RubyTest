
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const createCodeSchema = z.object({
  testTypeId: z.string(),
  expiresIn: z.number().min(1).max(168).default(24), // hours, max 1 week
});

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase() + 
         Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { testTypeId, expiresIn } = createCodeSchema.parse(body);

    // Check if test type exists
    const testType = await prisma.test_types.findUnique({
      where: { id: testTypeId }
    });
    
    if (!testType) {
      return NextResponse.json(
        { error: 'Test type not found' },
        { status: 404 }
      );
    }
    
    const code = generateCode();
    const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
    
    const oneTimeCode = await prisma.one_time_codes.create({
      data: {
        id: crypto.randomUUID(),
        code,
        testTypeId,
        createdBy: admin.id,
        expiresAt,
        isActive: true
      },
      include: {
        test_types: true
      }
    });

    return NextResponse.json({ oneTimeCode });
  } catch (error) {
    console.error('Error creating one-time code:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create one-time code' }, 
      { status: 500 }
    );
  }
}
