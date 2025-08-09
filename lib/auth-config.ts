

import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/db';
import bcryptjs from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        const user = await prisma.users.findUnique({
          where: { email: credentials.email.toLowerCase() }
        });

        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        if (!user.emailVerified) {
          throw new Error('Please verify your email address before signing in');
        }

        const isPasswordValid = await bcryptjs.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          isPrimaryAdmin: user.isPrimaryAdmin,
          isDeactivated: user.isDeactivated,
          requirePasswordChange: user.requirePasswordChange
        };
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userType = user.userType;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.isPrimaryAdmin = user.isPrimaryAdmin;
        token.isDeactivated = user.isDeactivated;
        token.requirePasswordChange = user.requirePasswordChange;
      }
      
      // Refresh user data on each token refresh to get current status
      if (token.sub && !user) {
        try {
          const currentUser = await prisma.users.findUnique({
            where: { id: token.sub },
            select: {
              isDeactivated: true,
              requirePasswordChange: true,
              isPrimaryAdmin: true,
              userType: true
            }
          });
          
          if (currentUser) {
            token.isDeactivated = currentUser.isDeactivated;
            token.requirePasswordChange = currentUser.requirePasswordChange;
            token.isPrimaryAdmin = currentUser.isPrimaryAdmin;
            token.userType = currentUser.userType;
          }
        } catch (error) {
          console.error('Error refreshing user data in JWT callback:', error);
        }
      }
      
      // Handle session updates (including impersonation)
      if (trigger === 'update') {
        if (session?.impersonating) {
          token.impersonating = session.impersonating;
        } else if (session?.impersonating === null) {
          // Clear impersonation
          delete token.impersonating;
        }
        
        // Handle other session updates
        if (session?.user) {
          token.isDeactivated = session.user.isDeactivated;
          token.requirePasswordChange = session.user.requirePasswordChange;
          token.isPrimaryAdmin = session.user.isPrimaryAdmin;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // If impersonating, use the impersonated user's data for the session user
        if (token.impersonating) {
          session.user.id = token.impersonating.impersonatedUser.id;
          session.user.email = token.impersonating.impersonatedUser.email;
          session.user.firstName = token.impersonating.impersonatedUser.firstName;
          session.user.lastName = token.impersonating.impersonatedUser.lastName;
          session.user.userType = token.impersonating.impersonatedUser.userType;
          session.user.name = `${token.impersonating.impersonatedUser.firstName} ${token.impersonating.impersonatedUser.lastName}`;
          session.user.isPrimaryAdmin = false; // Impersonated users are never admins
          session.user.isDeactivated = false; // Impersonated users are not deactivated in the session
          session.user.requirePasswordChange = false; // Skip password change for impersonated users
          session.impersonating = token.impersonating;
        } else {
          // Normal session
          session.user.id = token.sub!;
          session.user.userType = token.userType as string;
          session.user.firstName = token.firstName as string;
          session.user.lastName = token.lastName as string;
          session.user.isPrimaryAdmin = token.isPrimaryAdmin as boolean;
          session.user.isDeactivated = token.isDeactivated as boolean;
          session.user.requirePasswordChange = token.requirePasswordChange as boolean;
        }
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  secret: process.env.NEXTAUTH_SECRET
};
