
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TestTube, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { AdminDashboardClient } from './components/admin-dashboard-client';
import { AdminDashboardWrapper } from './components/admin-dashboard-wrapper';

export default async function AdminDashboardPage() {
  let user;
  try {
    user = await requireAdmin();
  } catch {
    redirect('/auth/signin');
  }

  // Fetch admin dashboard data
  const [
    pendingRequests,
    totalUsers,
    totalTests,
    recentTests,
    oneTimeCodes
  ] = await Promise.all([
    prisma.test_requests.findMany({
      where: { status: 'PENDING' },
      include: { 
        users: true, 
        test_types: true 
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.users.count({ where: { userType: 'USER' } }),
    prisma.tests.count(),
    prisma.tests.findMany({
      include: {
        users: true,
        test_types: true
      },
      orderBy: { startedAt: 'desc' },
      take: 10
    }),
    prisma.one_time_codes.findMany({
      where: { isActive: true },
      include: { test_types: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'STARTED':
        return 'bg-blue-100 text-blue-800';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 max-w-7xl py-8">
        {/* Admin Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Manage users, tests, and system settings for Rubicon Programs.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <h3 className="text-2xl font-bold">{totalUsers}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TestTube className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                  <h3 className="text-2xl font-bold">{totalTests}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                  <h3 className="text-2xl font-bold">{pendingRequests.length}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Codes</p>
                  <h3 className="text-2xl font-bold">{oneTimeCodes.length}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Test Requests */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Pending Test Requests
                    </CardTitle>
                    <CardDescription>
                      Review and approve user requests for test access
                    </CardDescription>
                  </div>
                  {pendingRequests.length > 0 && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      {pendingRequests.length} pending
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {pendingRequests.length > 0 ? (
                  <AdminDashboardWrapper pendingRequests={pendingRequests} />
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending requests</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Tests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Test Activity
                </CardTitle>
                <CardDescription>
                  Latest test activity across all users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {test.users?.firstName} {test.users?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {test.test_types.displayName} • Started {test.startedAt.toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(test.status)}>
                          {test.status}
                        </Badge>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/tests/${test.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/admin/users">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/admin/tests">
                    <TestTube className="h-4 w-4 mr-2" />
                    All Tests
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/admin/one-time-codes">
                    <FileText className="h-4 w-4 mr-2" />
                    One-Time Codes
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/admin/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    App Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Active One-Time Codes */}
            {oneTimeCodes.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Active One-Time Codes</CardTitle>
                    <Button size="sm" asChild>
                      <Link href="/admin/one-time-codes/create">
                        <Plus className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {oneTimeCodes.map((code) => (
                      <div key={code.id} className="flex items-center justify-between text-sm">
                        <div>
                          <div className="font-mono">{code.code}</div>
                          <div className="text-muted-foreground">
                            {code.test_types.displayName}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-muted-foreground">
                            {code.usedBy ? 'Used' : 'Available'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
