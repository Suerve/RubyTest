
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Header } from '@/components/layout/header';
import TypingTestClient from './typing-test-client';

interface Props {
  params: { testType: string };
  searchParams: { practice?: string };
}

export default async function TestTypePage({ params, searchParams }: Props) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/signin');
  }

  // Get test type info
  const testType = await prisma.test_types.findUnique({
    where: { name: params.testType },
    include: { 
      practice_test_config: true,
      questions: {
        where: { isActive: true },
        take: 1 // Just to check if content exists
      }
    }
  });

  if (!testType) {
    redirect('/tests');
  }

  // Check if this is a typing test
  const isTypingTest = testType.name === 'typing-keyboard' || testType.name === 'typing-10key';
  
  if (!isTypingTest) {
    // Redirect to existing test start page for non-typing tests
    redirect(`/tests/${params.testType}/start`);
  }

  // Check user access for typing tests
  const access = await prisma.user_test_access.findUnique({
    where: {
      userId_testTypeId: {
        userId: user.id,
        testTypeId: testType.id
      }
    }
  });

  const hasAccess = Boolean(access && access.accessType !== 'NONE');
  const isPractice = searchParams.practice === 'true';

  // Check for active tests
  const activeTest = await prisma.tests.findFirst({
    where: {
      userId: user.id,
      testTypeId: testType.id,
      status: { in: ['STARTED', 'PAUSED'] }
    }
  });

  // Determine typing test type
  const typingTestType = testType.name === 'typing-keyboard' ? 'keyboarding' : '10-key';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <TypingTestClient
          testType={typingTestType}
          testTypeRecord={testType}
          user={user}
          hasAccess={hasAccess}
          access={access}
          activeTest={activeTest}
          isPractice={isPractice || false}
        />
      </div>
    </div>
  );
}
