
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { RequestAccessClient } from './request-access-client';

export default async function RequestAccessPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/signin');
  }

  // Get all test types and user's current access
  const [testTypes, userAccess, existingRequests] = await Promise.all([
    prisma.test_types.findMany({
      where: { isActive: true }
    }),
    prisma.user_test_access.findMany({
      where: { 
        userId: user.id,
        isActive: true 
      },
      include: { test_types: true }
    }),
    prisma.test_requests.findMany({
      where: { 
        userId: user.id,
        status: 'PENDING'
      },
      include: { test_types: true }
    })
  ]);

  // Create access lookup
  const accessMap = new Map(
    userAccess.map(access => [access.test_types.id, access.accessType])
  );

  // Create pending request lookup
  const pendingMap = new Map(
    existingRequests.map(request => [request.test_types.id, request])
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 max-w-4xl py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Request Test Access</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Request access to specific test types from your administrator. 
              Provide a reason for your request to help with approval.
            </p>
          </div>

          {/* Request Form */}
          <Card>
            <CardHeader>
              <CardTitle>Select Test Types</CardTitle>
              <CardDescription>
                Choose the test types you need access to and provide a reason for your request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequestAccessClient
                testTypes={testTypes}
                userAccess={accessMap}
                pendingRequests={pendingMap}
                userId={user.id}
              />
            </CardContent>
          </Card>

          {/* Pending Requests */}
          {existingRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>
                  Your current pending test access requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {existingRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{request.test_types.displayName}</div>
                        <div className="text-sm text-muted-foreground">
                          Requested {request.createdAt.toLocaleDateString()}
                        </div>
                        {request.reason && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Reason: {request.reason}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-orange-600 font-medium">
                        Pending Review
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
