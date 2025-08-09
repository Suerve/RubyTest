
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const [tests, stats] = await Promise.all([
      // Fetch all tests with related data
      prisma.tests.findMany({
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          test_types: {
            select: {
              id: true,
              name: true,
              displayName: true,
              description: true,
            }
          },
          one_time_codes: {
            select: {
              id: true,
              code: true,
            }
          },
          test_results: true,
        },
        orderBy: { startedAt: 'desc' },
      }),
      // Calculate stats
      prisma.tests.aggregate({
        _count: { id: true },
        _avg: { score: true },
      })
    ]);

    // Calculate additional stats
    const completed = tests.filter(test => test.status === 'COMPLETED').length;
    const inProgress = tests.filter(test => test.status === 'STARTED' || test.status === 'PAUSED').length;
    const cancelled = tests.filter(test => test.status === 'CANCELLED').length;

    // Calculate average time for completed tests
    const completedTests = tests.filter(test => test.completedAt && test.startedAt);
    const averageTime = completedTests.length > 0 
      ? completedTests.reduce((acc, test) => {
          const duration = new Date(test.completedAt!).getTime() - new Date(test.startedAt).getTime();
          return acc + Math.floor(duration / 1000);
        }, 0) / completedTests.length
      : 0;

    const statsData = {
      total: stats._count?.id || 0,
      completed,
      inProgress,
      cancelled,
      averageScore: stats._avg?.score || 0,
      averageTime,
    };

    return NextResponse.json({ 
      tests: tests.map(test => ({
        ...test,
        startedAt: test.startedAt.toISOString(),
        pausedAt: test.pausedAt?.toISOString(),
        completedAt: test.completedAt?.toISOString(),
        cancelledAt: test.cancelledAt?.toISOString(),
      })),
      stats: statsData
    });

  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json(
      { message: 'Failed to fetch tests' },
      { status: 500 }
    );
  }
}
