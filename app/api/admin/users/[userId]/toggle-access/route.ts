
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const toggleAccessSchema = z.object({
  testTypeId: z.string(),
  grant: z.boolean(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { testTypeId, grant } = toggleAccessSchema.parse(body);
    
    if (grant) {
      // Grant access
      await prisma.user_test_access.upsert({
        where: {
          userId_testTypeId: {
            userId: params.userId,
            testTypeId: testTypeId
          }
        },
        update: {
          grantedAt: new Date(),
          grantedBy: admin.id
        },
        create: {
          id: randomUUID(),
          updatedAt: new Date(),
          userId: params.userId,
          testTypeId: testTypeId,
          grantedAt: new Date(),
          grantedBy: admin.id
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
    } else {
      // Remove access
      await prisma.user_test_access.deleteMany({
        where: {
          userId: params.userId,
          testTypeId: testTypeId
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error toggling access:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to toggle access' }, 
      { status: 500 }
    );
  }
}
