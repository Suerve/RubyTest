

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PasswordStrength {
  score: number;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

function checkPasswordStrength(password: string): PasswordStrength {
  return {
    score: password.length >= 8 ? 1 : 0,
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
}

export default function ChangePasswordPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = checkPasswordStrength(newPassword);
  const isPasswordStrong = passwordStrength.hasMinLength && 
    passwordStrength.hasUppercase && 
    passwordStrength.hasLowercase && 
    passwordStrength.hasNumber;

  // Redirect if not logged in or password change not required
  if (!session?.user) {
    router.push('/auth/signin');
    return null;
  }

  if (!(session.user as any)?.requirePasswordChange) {
    router.push('/dashboard');
    return null;
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (!isPasswordStrong) {
      setError('Password does not meet strength requirements');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update the session to remove requirePasswordChange flag
        await update({
          ...session,
          user: {
            ...session.user,
            requirePasswordChange: false
          }
        });

        toast.success('Password changed successfully');
        router.push('/dashboard');
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 max-w-md py-8">
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Change Password Required</CardTitle>
            <CardDescription>
              You must change your password before continuing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your administrator has required you to change your password before accessing the system.
              </AlertDescription>
            </Alert>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                />
                {newPassword && (
                  <div className="mt-2 space-y-1 text-xs">
                    <div className={`flex items-center gap-1 ${passwordStrength.hasMinLength ? 'text-green-600' : 'text-red-600'}`}>
                      <CheckCircle className="h-3 w-3" />
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-1 ${passwordStrength.hasUppercase ? 'text-green-600' : 'text-red-600'}`}>
                      <CheckCircle className="h-3 w-3" />
                      One uppercase letter
                    </div>
                    <div className={`flex items-center gap-1 ${passwordStrength.hasLowercase ? 'text-green-600' : 'text-red-600'}`}>
                      <CheckCircle className="h-3 w-3" />
                      One lowercase letter
                    </div>
                    <div className={`flex items-center gap-1 ${passwordStrength.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                      <CheckCircle className="h-3 w-3" />
                      One number
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => signOut()}
                  disabled={loading}
                >
                  Sign Out
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !isPasswordStrong}
                  className="min-w-32"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
