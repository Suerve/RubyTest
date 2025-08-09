
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const testTypes = await prisma.test_types.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
      },
      orderBy: { displayName: 'asc' },
    });

    return NextResponse.json({ testTypes });

  } catch (error) {
    console.error('Error fetching test types:', error);
    return NextResponse.json(
      { message: 'Failed to fetch test types' },
      { status: 500 }
    );
  }
}
