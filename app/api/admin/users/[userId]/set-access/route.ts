

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const setAccessSchema = z.object({
  testTypeId: z.string(),
  accessType: z.enum(['NONE', 'ONE_TIME', 'UNLIMITED']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { testTypeId, accessType } = setAccessSchema.parse(body);
    
    if (accessType === 'NONE') {
      // Remove access
      await prisma.user_test_access.deleteMany({
        where: {
          userId: params.userId,
          testTypeId: testTypeId
        }
      });
    } else {
      // Grant or update access
      await prisma.user_test_access.upsert({
        where: {
          userId_testTypeId: {
            userId: params.userId,
            testTypeId: testTypeId
          }
        },
        update: {
          accessType: accessType,
          grantedAt: new Date(),
          grantedBy: admin.id,
          isActive: true
        },
        create: {
          id: randomUUID(),
          updatedAt: new Date(),
          userId: params.userId,
          testTypeId: testTypeId,
          accessType: accessType,
          grantedAt: new Date(),
          grantedBy: admin.id,
          isActive: true
        }
      });
      
      // Mark any pending requests as approved
      await prisma.test_requests.updateMany({
        where: {
          userId: params.userId,
          testTypeId: testTypeId,
          status: 'PENDING'
        },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: admin.id
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting access:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to set access' }, 
      { status: 500 }
    );
  }
}
