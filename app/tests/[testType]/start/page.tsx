
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Keyboard, 
  Monitor, 
  Calculator, 
  FileText, 
  Clock,
  AlertTriangle,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { StartTestClient } from './start-test-client';

interface Props {
  params: { testType: string };
}

export default async function StartTestPage({ params }: Props) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/signin');
  }

  // Get test type info
  const testType = await prisma.test_types.findUnique({
    where: { name: params.testType },
    include: { practice_test_config: true }
  });

  if (!testType) {
    redirect('/tests');
  }

  // Check user access
  const access = await prisma.user_test_access.findUnique({
    where: {
      userId_testTypeId: {
        userId: user.id,
        testTypeId: testType.id
      }
    }
  });

  if (!access || (access.accessType !== 'UNLIMITED' && access.accessType !== 'ONE_TIME')) {
    redirect('/tests');
  }

  // Check for active tests
  const activeTest = await prisma.tests.findFirst({
    where: {
      userId: user.id,
      testTypeId: testType.id,
      status: { in: ['STARTED', 'PAUSED'] }
    }
  });

  if (activeTest) {
    redirect(`/tests/${testType.name}/${activeTest.id}`);
  }

  const getTestIcon = (testName: string) => {
    switch (testName) {
      case 'typing-10key':
      case 'typing-keyboard':
        return <Keyboard className="h-8 w-8" />;
      case 'digital-literacy':
        return <Monitor className="h-8 w-8" />;
      case 'basic-math':
        return <Calculator className="h-8 w-8" />;
      case 'basic-english':
        return <FileText className="h-8 w-8" />;
      default:
        return <FileText className="h-8 w-8" />;
    }
  };

  const getTestInstructions = (testName: string) => {
    switch (testName) {
      case 'typing-10key':
        return {
          timeLimit: '1 minute',
          instructions: [
            'This test measures your 10-key numeric keypad typing speed and accuracy.',
            'Ensure Num Lock is enabled before starting.',
            'Type the numbers exactly as shown.',
            'The test will automatically end after 1 minute.',
            'Your score will be calculated based on speed and accuracy.'
          ],
          requirements: ['Num Lock must be enabled', 'Use numeric keypad only']
        };
      
      case 'typing-keyboard':
        return {
          timeLimit: '1 minute',
          instructions: [
            'This test measures your keyboard typing speed and accuracy.',
            'Type the passage exactly as shown, including capitalization and punctuation.',
            'The test will automatically end after 1 minute.',
            'Press spacebar or Enter to begin when prompted.',
            'Your score will include raw speed, accuracy, and weighted speed.'
          ],
          requirements: ['Full keyboard access required', 'No mobile devices']
        };
      
      case 'digital-literacy':
        return {
          timeLimit: '60 seconds per question',
          instructions: [
            'This test assesses your computer and technology knowledge.',
            'Questions cover hardware, software, internet, and email skills.',
            'You have 60 seconds per question.',
            'Some questions include simulated software environments.',
            'Choose the best answer for each question.',
            'You cannot return to previous questions after time expires.'
          ],
          requirements: ['At least 25 questions', 'Simulated environments included']
        };
      
      case 'basic-math':
        return {
          timeLimit: 'Adaptive timing',
          instructions: [
            'This test measures your math skills from 5th to 12th grade level.',
            'The test adapts to your performance level.',
            'Answer each question to the best of your ability.',
            'The test ends when you reach your skill ceiling or complete 12th grade level.',
            'No calculators or external tools allowed.'
          ],
          requirements: ['Adaptive difficulty', 'No external tools']
        };
      
      case 'basic-english':
        return {
          timeLimit: 'Variable',
          instructions: [
            'This test assesses English language skills and reading comprehension.',
            'Questions cover grammar, vocabulary, spelling, and reading passages.',
            'Read each question carefully before answering.',
            'Some questions include reading passages.',
            'Answer to the best of your ability.'
          ],
          requirements: ['Grammar and comprehension', 'Reading passages included']
        };
      
      default:
        return {
          timeLimit: 'Variable',
          instructions: ['Complete the assessment to the best of your ability.'],
          requirements: []
        };
    }
  };

  const testInfo = getTestInstructions(testType.name);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 max-w-4xl py-8">
        <div className="space-y-8">
          {/* Test Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-lg bg-primary/10 text-primary">
                {getTestIcon(testType.name)}
              </div>
            </div>
            <h1 className="text-3xl font-bold">{testType.displayName}</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {testType.description}
            </p>
          </div>

          {/* Test Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Test Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Limit
                  </h3>
                  <p className="text-sm text-muted-foreground">{testInfo.timeLimit}</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Access Type</h3>
                  <p className="text-sm text-muted-foreground">
                    {access?.accessType === 'UNLIMITED' ? 'Unlimited attempts' : 'One-time use'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
              <CardDescription>Please read carefully before starting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-2">
                {testInfo.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm">{instruction}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Requirements */}
          {testInfo.requirements.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Requirements:</strong>
                <ul className="mt-1 ml-4 list-disc">
                  {testInfo.requirements.map((req, index) => (
                    <li key={index} className="text-sm">{req}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Ready to begin?</h3>
                  <p className="text-sm text-muted-foreground">
                    Make sure you understand the instructions before starting.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/tests">Back to Tests</Link>
                  </Button>
                  <StartTestClient 
                    testType={testType.name} 
                    testTypeId={testType.id} 
                    userId={user.id}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
