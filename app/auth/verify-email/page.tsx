
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Logo } from '@/components/ui/logo';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  useEffect(() => {
    if (!token) {
      setError('Verification token is missing');
      setIsLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess(true);
          toast.success('Email verified successfully!');
          setTimeout(() => {
            router.push('/auth/complete-profile');
          }, 2000);
        } else {
          setError(data.error || 'Verification failed');
        }
      } catch (error) {
        setError('Network error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <Logo type="horizontal" size="lg" className="mx-auto" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              {isLoading ? (
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
              ) : success ? (
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              )}
            </div>

            <CardTitle className="text-center">
              {isLoading ? 'Verifying Email...' : success ? 'Email Verified!' : 'Verification Failed'}
            </CardTitle>

            <CardDescription className="text-center">
              {isLoading && 'Please wait while we verify your email address.'}
              {success && 'Your email has been successfully verified. You will be redirected to complete your profile.'}
              {error && 'We encountered an issue verifying your email address.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Redirecting you to complete your profile...</p>
              </div>
            )}

            {!isLoading && (
              <div className="flex gap-2">
                {success ? (
                  <Button className="flex-1" asChild>
                    <Link href="/auth/complete-profile">
                      Complete Profile
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href="/auth/signin">
                        Sign In
                      </Link>
                    </Button>
                    <Button className="flex-1" asChild>
                      <Link href="/auth/signup">
                        Try Again
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
