
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  TestTube, 
  Play, 
  Settings, 
  Clock, 
  CheckCircle, 
  XCircle,
  Pause,
  FileText,
  Keyboard,
  Monitor,
  Calculator
} from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { DashboardOneTimeCodeModal } from './dashboard-one-time-code-modal';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/signin');
  }

  // Check if profile is incomplete (dateOfBirth is placeholder)
  if (user.dateOfBirth.getFullYear() === 2000) {
    redirect('/auth/complete-profile');
  }

  // Fetch user's tests and access
  const [userTests, userAccess] = await Promise.all([
    prisma.tests.findMany({
      where: { userId: user.id },
      include: {
        test_types: true,
        test_results: true
      },
      orderBy: { startedAt: 'desc' }
    }),
    prisma.user_test_access.findMany({
      where: { 
        userId: user.id,
        isActive: true 
      },
      include: { test_types: true }
    })
  ]);

  const testsByStatus = {
    started: userTests.filter(test => test.status === 'STARTED'),
    paused: userTests.filter(test => test.status === 'PAUSED'),
    completed: userTests.filter(test => test.status === 'COMPLETED'),
    cancelled: userTests.filter(test => test.status === 'CANCELLED')
  };

  const getTestIcon = (testName: string) => {
    switch (testName) {
      case 'typing-10key':
      case 'typing-keyboard':
        return <Keyboard className="h-5 w-5" />;
      case 'digital-literacy':
        return <Monitor className="h-5 w-5" />;
      case 'basic-math':
        return <Calculator className="h-5 w-5" />;
      case 'basic-english':
        return <FileText className="h-5 w-5" />;
      default:
        return <TestTube className="h-5 w-5" />;
    }
  };

  const getAccessBadge = (accessType: string) => {
    switch (accessType) {
      case 'UNLIMITED':
        return (
          <Badge style={{ backgroundColor: '#c4d600', color: 'white' }}>
            UNLIMITED ACCESS
          </Badge>
        );
      case 'ONE_TIME':
        return (
          <Badge style={{ backgroundColor: '#f8951d', color: 'white' }}>
            ONE-TIME ACCESS
          </Badge>
        );
      case 'PRACTICE_ONLY':
        return (
          <Badge className="bg-purple-100 text-purple-800">
            PRACTICE ONLY
          </Badge>
        );
      case 'NONE':
        return (
          <Badge style={{ backgroundColor: '#8a8a8d', color: 'white' }}>
            NO ACCESS
          </Badge>
        );
      default:
        return (
          <Badge style={{ backgroundColor: '#8a8a8d', color: 'white' }}>
            NO ACCESS
          </Badge>
        );
    }
  };

  const hasActiveTests = testsByStatus.started.length > 0 || testsByStatus.paused.length > 0;
  const hasCompletedTests = testsByStatus.completed.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 max-w-7xl py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Access your skills testing dashboard and track your progress.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Manage your profile and start testing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start h-auto p-4" asChild>
                    <Link href="/profile">
                      <User className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">Profile Settings</div>
                        <div className="text-sm text-muted-foreground">Update your information</div>
                      </div>
                    </Link>
                  </Button>

                  <Button variant="outline" className="justify-start h-auto p-4" asChild>
                    <Link href="/tests">
                      <TestTube className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">Browse Tests</div>
                        <div className="text-sm text-muted-foreground">View all available tests</div>
                      </div>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Tests */}
            {hasActiveTests && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Active Tests
                  </CardTitle>
                  <CardDescription>
                    Continue your in-progress tests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...testsByStatus.started, ...testsByStatus.paused].map((test) => (
                      <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTestIcon(test.test_types.name)}
                          <div>
                            <div className="font-medium">{test.test_types.displayName}</div>
                            <div className="text-sm text-muted-foreground">
                              Started {test.startedAt.toLocaleDateString()}
                              {test.status === 'PAUSED' && test.pausedAt && (
                                <span> • Paused {test.pausedAt.toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={test.status === 'STARTED' ? 'default' : 'secondary'}>
                            {test.status === 'STARTED' ? (
                              <>
                                <Play className="h-3 w-3 mr-1" />
                                In Progress
                              </>
                            ) : (
                              <>
                                <Pause className="h-3 w-3 mr-1" />
                                Paused
                              </>
                            )}
                          </Badge>
                          <Button size="sm" asChild>
                            <Link href={`/tests/${test.test_types.name}/${test.id}`}>
                              Continue
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Test History */}
            {hasCompletedTests && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Test History
                  </CardTitle>
                  <CardDescription>
                    View your completed tests and results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {testsByStatus.completed.slice(0, 5).map((test) => (
                      <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTestIcon(test.test_types.name)}
                          <div>
                            <div className="font-medium">{test.test_types.displayName}</div>
                            <div className="text-sm text-muted-foreground">
                              Completed {test.completedAt?.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/results/${test.id}`}>
                              View Results
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                    {testsByStatus.completed.length > 5 && (
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/tests/history">
                          View All Test History ({testsByStatus.completed.length} total)
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Tests Message */}
            {!hasActiveTests && !hasCompletedTests && (
              <Card>
                <CardHeader>
                  <CardTitle>No Tests Started</CardTitle>
                  <CardDescription>
                    You haven't started any tests yet. Browse available tests to get started.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link href="/tests">
                      <TestTube className="h-4 w-4 mr-2" />
                      Browse Tests
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Test Access */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Test Access
                    </CardTitle>
                    <CardDescription>
                      Your current test permissions
                    </CardDescription>
                  </div>
                  <DashboardOneTimeCodeModal />
                </div>
              </CardHeader>
              <CardContent>
                {userAccess.length > 0 ? (
                  <div className="space-y-3">
                    {userAccess.map((access) => (
                      <div key={access.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTestIcon(access.test_types.name)}
                          <span className="text-sm font-medium">
                            {access.test_types.displayName}
                          </span>
                        </div>
                        {getAccessBadge(access.accessType)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      No test access granted yet.
                    </p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/request-access">
                        Request Test Access
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Tests:</span>
                  <span className="font-medium">{userTests.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completed:</span>
                  <span className="font-medium text-green-600">{testsByStatus.completed.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">In Progress:</span>
                  <span className="font-medium text-blue-600">{testsByStatus.started.length + testsByStatus.paused.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Test Types Access:</span>
                  <span className="font-medium">{userAccess.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
