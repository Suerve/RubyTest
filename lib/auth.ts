
import { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    include: {
      user_test_access: {
        include: { test_types: true }
      }
    }
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  
  if (user.userType !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  
  return user;
}
