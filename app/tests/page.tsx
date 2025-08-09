
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Keyboard, 
  Monitor, 
  Calculator, 
  FileText, 
  Play,
  Timer,
  Users,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { OneTimeCodeModal } from './one-time-code-modal';

export default async function TestsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/signin');
  }

  // Get all test types and user's access
  const [testTypes, userAccess, activeTests] = await Promise.all([
    prisma.test_types.findMany({
      where: { isActive: true },
      include: {
        practice_test_config: true
      }
    }),
    prisma.user_test_access.findMany({
      where: { 
        userId: user.id,
        isActive: true 
      },
      include: { test_types: true }
    }),
    prisma.tests.findMany({
      where: {
        userId: user.id,
        status: { in: ['STARTED', 'PAUSED'] }
      },
      include: { test_types: true }
    })
  ]);

  // Create access lookup
  const accessMap = new Map(
    userAccess.map(access => [access.test_types.name, access.accessType])
  );

  // Create active test lookup
  const activeTestMap = new Map(
    activeTests.map(test => [test.test_types.name, test])
  );

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

  const getAccessBadge = (testName: string) => {
    const access = accessMap.get(testName);
    
    if (!access || access === 'NONE') {
      return (
        <Badge variant="outline" style={{ backgroundColor: '#8a8a8d', color: 'white' }}>
          <Lock className="h-3 w-3 mr-1" />
          No Access
        </Badge>
      );
    }
    
    switch (access) {
      case 'UNLIMITED':
        return (
          <Badge style={{ backgroundColor: '#c4d600', color: 'white' }}>
            <Unlock className="h-3 w-3 mr-1" />
            Unlimited Access
          </Badge>
        );
      case 'ONE_TIME':
        return (
          <Badge style={{ backgroundColor: '#f8951d', color: 'white' }}>
            <Timer className="h-3 w-3 mr-1" />
            One-Time Access
          </Badge>
        );
      case 'PRACTICE_ONLY':
        return (
          <Badge className="bg-purple-100 text-purple-800">
            <Play className="h-3 w-3 mr-1" />
            Practice Only
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" style={{ backgroundColor: '#8a8a8d', color: 'white' }}>
            Unknown
          </Badge>
        );
    }
  };

  const canStartTest = (testName: string) => {
    const access = accessMap.get(testName);
    const activeTest = activeTestMap.get(testName);
    
    if (activeTest && activeTest.status === 'STARTED') {
      return false; // Test in progress
    }
    
    return access === 'UNLIMITED' || access === 'ONE_TIME';
  };

  const canPractice = (testName: string) => {
    const access = accessMap.get(testName);
    const activeTest = activeTestMap.get(testName);
    
    // Block practice only for STARTED tests (not PAUSED) and only for non-UNLIMITED users
    if (activeTest && activeTest.status === 'STARTED' && access !== 'UNLIMITED') {
      return false; // Test in progress blocks practice for non-unlimited users
    }
    
    // Allow practice for UNLIMITED, PRACTICE_ONLY, and ONE_TIME users
    // ONE_TIME users can practice until they use their formal test access
    return access === 'UNLIMITED' || access === 'PRACTICE_ONLY' || access === 'ONE_TIME';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 max-w-7xl py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Skills Tests</h1>
          <p className="text-muted-foreground">
            Choose from four professional skill assessments to measure your capabilities.
          </p>
        </div>

        {/* Active Tests Alert */}
        {activeTests.length > 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have {activeTests.length} active test{activeTests.length > 1 ? 's' : ''}. 
              Please complete or cancel existing tests before starting new ones.
              <div className="mt-2">
                {activeTests.map(test => (
                  <Button key={test.id} size="sm" variant="outline" className="mr-2 mb-2" asChild>
                    <Link href={`/tests/${test.test_types.name}/${test.id}`}>
                      Continue {test.test_types.displayName}
                    </Link>
                  </Button>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Test Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {testTypes.map((testType) => {
            const hasAccess = accessMap.has(testType.name);
            const activeTest = activeTestMap.get(testType.name);
            
            return (
              <Card key={testType.id} className="transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary">
                        {getTestIcon(testType.name)}
                      </div>
                      <div>
                        <CardTitle>{testType.displayName}</CardTitle>
                        <CardDescription className="mt-1">
                          {testType.description}
                        </CardDescription>
                      </div>
                    </div>
                    {getAccessBadge(testType.name)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Test Details */}
                  <div className="space-y-2 text-sm">
                    {testType.name.startsWith('typing') && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Timer className="h-4 w-4" />
                        <span>Timed assessment - measures speed and accuracy</span>
                      </div>
                    )}
                    {testType.name === 'digital-literacy' && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>5-point scale assessment with simulated environments</span>
                      </div>
                    )}
                    {(testType.name === 'basic-math' || testType.name === 'basic-english') && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Adaptive testing with grade-level scoring (5th-12th grade)</span>
                      </div>
                    )}
                  </div>

                  {/* Active Test Status */}
                  {activeTest && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Test {activeTest.status.toLowerCase()} - Started {activeTest.startedAt.toLocaleDateString()}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {hasAccess ? (
                      <>
                        {/* Official Test Button */}
                        {activeTest ? (
                          <Button className="flex-1" asChild>
                            <Link href={`/tests/${testType.name}/${activeTest.id}`}>
                              <Play className="h-4 w-4 mr-2" />
                              Continue Test
                            </Link>
                          </Button>
                        ) : canStartTest(testType.name) ? (
                          <Button className="flex-1" asChild>
                            <Link href={`/tests/${testType.name}/start`}>
                              <Play className="h-4 w-4 mr-2" />
                              Start Official Test
                            </Link>
                          </Button>
                        ) : null}

                        {/* Practice Button - Enhanced for typing tests */}
                        {(testType.name === 'typing-keyboard' || testType.name === 'typing-10key') ? (
                          <Button 
                            variant="outline" 
                            className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50" 
                            asChild
                          >
                            <Link href={`/tests/practice?testType=${testType.name}`}>
                              <Timer className="h-4 w-4 mr-2" />
                              Practice Typing
                            </Link>
                          </Button>
                        ) : canPractice(testType.name) && (
                          <Button variant="outline" className="flex-1" asChild>
                            <Link href={`/tests/${testType.name}/practice`}>
                              <Timer className="h-4 w-4 mr-2" />
                              Practice
                            </Link>
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="flex-1 space-y-2">
                        {/* Practice button for users without access - typing tests only */}
                        {(testType.name === 'typing-keyboard' || testType.name === 'typing-10key') && (
                          <Button 
                            variant="outline" 
                            className="w-full border-blue-300 text-blue-600 hover:bg-blue-50" 
                            asChild
                          >
                            <Link href={`/tests/practice?testType=${testType.name}`}>
                              <Timer className="h-4 w-4 mr-2" />
                              Try Practice Mode (Free)
                            </Link>
                          </Button>
                        )}
                        
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/request-access">
                            <Lock className="h-4 w-4 mr-2" />
                            Request Official Access
                          </Link>
                        </Button>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">or</p>
                        </div>
                        <OneTimeCodeModal />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need Help Getting Started?</CardTitle>
            <CardDescription>
              Learn more about each test type and how to get access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              To take tests, you need appropriate access permissions. You can:
            </p>
            <ul className="text-sm space-y-1 ml-4">
              <li>• <strong>Request access</strong> from your administrator</li>
              <li>• <strong>Use a one-time code</strong> provided to you</li>
              <li>• <strong>Practice tests</strong> are available with practice-only access</li>
            </ul>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/request-access">Request Access</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/help">Learn More</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
