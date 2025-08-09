
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const codes = await prisma.one_time_codes.findMany({
      include: {
        test_types: {
          select: {
            id: true,
            name: true,
            displayName: true,
          }
        },
        _count: {
          select: {
            tests: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch user data separately for createdBy and usedBy
    const userIds = [...new Set([...codes.map(c => c.createdBy), ...codes.filter(c => c.usedBy).map(c => c.usedBy!)])];
    const users = await prisma.users.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      }
    });

    const userMap = users.reduce((map, user) => {
      map[user.id] = user;
      return map;
    }, {} as Record<string, any>);

    const codesWithUsers = codes.map(code => ({
      ...code,
      createdByUser: userMap[code.createdBy] || null,
      usedByUser: code.usedBy ? userMap[code.usedBy] || null : null,
    }));

    // Calculate stats
    const now = new Date();
    const stats = {
      total: codesWithUsers.length,
      active: codesWithUsers.filter(code => 
        code.isActive && 
        !code.usedBy && 
        (!code.expiresAt || new Date(code.expiresAt) > now)
      ).length,
      used: codesWithUsers.filter(code => code.usedBy).length,
      expired: codesWithUsers.filter(code => 
        code.expiresAt && 
        new Date(code.expiresAt) <= now && 
        !code.usedBy
      ).length,
      totalUsage: codesWithUsers.reduce((sum, code) => sum + code._count.tests, 0),
    };

    return NextResponse.json({ 
      codes: codesWithUsers.map(code => ({
        ...code,
        createdAt: code.createdAt.toISOString(),
        expiresAt: code.expiresAt?.toISOString(),
        usedAt: code.usedAt?.toISOString(),
      })),
      stats
    });

  } catch (error) {
    console.error('Error fetching one-time codes:', error);
    return NextResponse.json(
      { message: 'Failed to fetch one-time codes' },
      { status: 500 }
    );
  }
}
