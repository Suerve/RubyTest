
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    await requireAdmin();
    const { requestId } = params;

    const testRequest = await prisma.test_requests.findUnique({
      where: { id: requestId },
      include: { 
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            zipCode: true,
            phoneNumber: true,
            educationLevel: true,
            englishFirst: true,
            createdAt: true
          }
        }, 
        test_types: true 
      }
    });

    if (!testRequest) {
      return NextResponse.json(
        { error: 'Test request not found' },
        { status: 404 }
      );
    }

    // Get user's current test access for this test type
    const currentAccess = await prisma.user_test_access.findUnique({
      where: {
        userId_testTypeId: {
          userId: testRequest.userId,
          testTypeId: testRequest.testTypeId
        }
      }
    });

    // Get user's test history for this test type
    const testHistory = await prisma.tests.findMany({
      where: {
        userId: testRequest.userId,
        testTypeId: testRequest.testTypeId
      },
      include: {
        test_results: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return NextResponse.json({
      request: testRequest,
      currentAccess,
      testHistory
    });

  } catch (error) {
    console.error('Error fetching test request details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test request details' },
      { status: 500 }
    );
  }
}
