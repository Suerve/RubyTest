

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, UserX, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { redirect } from 'next/navigation';

export default async function RestrictedAccessPage() {
  const session = await getServerSession(authOptions);

  // If not logged in, redirect to sign in
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // If user is not deactivated, redirect to dashboard
  if (!(session.user as any)?.isDeactivated) {
    redirect('/dashboard');
  }

  return (
    <main className="container mx-auto px-4 max-w-2xl py-8">
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <UserX className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">Account Deactivated</CardTitle>
            <CardDescription>
              Your account has been temporarily deactivated by an administrator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-800">
                    Access Temporarily Restricted
                  </p>
                  <p className="text-sm text-amber-700">
                    Your account access has been suspended. This may be due to:
                  </p>
                  <ul className="text-sm text-amber-700 list-disc list-inside space-y-1 ml-2">
                    <li>Administrative review in progress</li>
                    <li>Account maintenance or updates</li>
                    <li>Security or policy compliance</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-foreground">What you can do:</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 rounded-lg border">
                  <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Contact Support</p>
                    <p className="text-sm text-muted-foreground">
                      Reach out to your administrator for assistance
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 rounded-lg border">
                  <Phone className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Alternative Access</p>
                    <p className="text-sm text-muted-foreground">
                      Contact your organization directly if urgent access is needed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Account: {session.user.firstName} {session.user.lastName}
              </p>
              <p className="text-sm text-center text-muted-foreground">
                Email: {session.user.email}
              </p>
              
              <div className="flex justify-center">
                <Button asChild variant="outline">
                  <Link href="/api/auth/signout">
                    Sign Out
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
