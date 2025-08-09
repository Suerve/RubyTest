
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { prisma } from '@/lib/db';
import PracticeTestClient from './practice-test-client';

interface Props {
  searchParams: { testType?: string };
}

export default async function PracticeTestPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/signin');
  }

  const testType = searchParams.testType;
  
  if (!testType || (testType !== 'typing-keyboard' && testType !== 'typing-10key')) {
    redirect('/tests');
  }

  // Get test type info
  const testTypeRecord = await prisma.test_types.findUnique({
    where: { name: testType },
    include: { 
      practice_test_config: true
    }
  });

  if (!testTypeRecord) {
    redirect('/tests');
  }

  // Check user access for practice (allow anyone to practice since no data is stored)
  const access = await prisma.user_test_access.findUnique({
    where: {
      userId_testTypeId: {
        userId: user.id,
        testTypeId: testTypeRecord.id
      }
    }
  });

  // Allow practice for everyone since it's educational and no data is stored
  const canPractice = true;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <PracticeTestClient
          testType={testType === 'typing-keyboard' ? 'keyboarding' : '10-key'}
          testTypeRecord={testTypeRecord}
          user={user}
          canPractice={canPractice}
          access={access}
        />
      </div>
    </div>
  );
}
