
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';
import { randomBytes } from 'crypto';

export const dynamic = "force-dynamic";

function generateCode(): string {
  // Generate a 8-character alphanumeric code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { testTypeId, expiresAt, count = 1 } = await request.json();

    if (!testTypeId) {
      return NextResponse.json(
        { message: 'Test type is required' },
        { status: 400 }
      );
    }

    if (count < 1 || count > 50) {
      return NextResponse.json(
        { message: 'Count must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Verify test type exists
    const testType = await prisma.test_types.findUnique({
      where: { id: testTypeId },
    });

    if (!testType) {
      return NextResponse.json(
        { message: 'Test type not found' },
        { status: 404 }
      );
    }

    // Generate unique codes
    const codes = [];
    const attempts = new Set();
    
    for (let i = 0; i < count; i++) {
      let code;
      let attempts_count = 0;
      
      do {
        code = generateCode();
        attempts_count++;
        
        if (attempts_count > 100) {
          return NextResponse.json(
            { message: 'Unable to generate unique codes. Please try again.' },
            { status: 500 }
          );
        }
      } while (attempts.has(code) || await prisma.one_time_codes.findUnique({ where: { code } }));
      
      attempts.add(code);
      codes.push({
        id: randomUUID(),
        code,
        testTypeId,
        createdBy: admin.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
    }

    // Create codes in database
    const createdCodes = await prisma.$transaction(
      codes.map(codeData => 
        prisma.one_time_codes.create({
          data: codeData
        })
      )
    );

    // Log admin action
    await prisma.admin_actions.create({
      data: {
        id: randomUUID(),
        adminUserId: admin.id,
        action: 'USER_CREATED', // We can extend this enum later for CODE_CREATED
        details: {
          action: 'codes_created',
          count: createdCodes.length,
          testType: testType.name,
          expiresAt: expiresAt || null,
        },
      },
    });

    return NextResponse.json({ 
      message: `${createdCodes.length} code(s) created successfully`,
      codes: createdCodes.map(code => ({
        ...code,
        createdAt: code.createdAt.toISOString(),
        expiresAt: code.expiresAt?.toISOString(),
      }))
    });

  } catch (error) {
    console.error('Error creating one-time codes:', error);
    return NextResponse.json(
      { message: 'Failed to create one-time codes' },
      { status: 500 }
    );
  }
}
