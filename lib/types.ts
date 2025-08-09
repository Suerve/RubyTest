
import { users, tests, test_results, test_types, user_test_access, test_requests, one_time_codes } from '@prisma/client';

export type UserWithAccess = users & {
  user_test_access: (user_test_access & { test_types: test_types })[];
};

export type TestWithDetails = tests & {
  test_types: test_types;
  test_results?: test_results[];
  users?: users;
};

export type TestResultWithDetails = test_results & {
  test: TestWithDetails;
  users: users;
};

export interface PasswordStrength {
  score: number;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export interface TestQuestion {
  id: string;
  content: string;
  questionType: string;
  options?: any;
  correctAnswer: any;
  explanation?: string;
  difficultyLevel?: number;
  gradeLevel?: string;
  metadata?: any;
}

export interface TestAnswer {
  questionId: string;
  answer: any;
  timeSpent?: number;
  isCorrect?: boolean;
}

export interface PrintFormat {
  type: 'scores-only' | 'letterhead' | 'certificate';
  orientation: 'portrait' | 'landscape';
}

declare module 'next-auth' {
  interface User {
    userType?: string;
    firstName?: string;
    lastName?: string;
    isPrimaryAdmin?: boolean;
    isDeactivated?: boolean;
    requirePasswordChange?: boolean;
  }

  interface Session {
    user: User & {
      id: string;
      userType: string;
      firstName: string;
      lastName: string;
      isPrimaryAdmin: boolean;
      isDeactivated: boolean;
      requirePasswordChange: boolean;
    };
    // Impersonation fields
    impersonating?: {
      originalAdmin: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        userType: string;
      };
      impersonatedUser: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        userType: string;
      };
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userType?: string;
    firstName?: string;
    lastName?: string;
    isPrimaryAdmin?: boolean;
    isDeactivated?: boolean;
    requirePasswordChange?: boolean;
    // Impersonation fields
    impersonating?: {
      originalAdmin: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        userType: string;
      };
      impersonatedUser: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        userType: string;
      };
    };
  }
}
