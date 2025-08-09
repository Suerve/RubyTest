

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

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
  const { data: session } = useSession();
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

  // Redirect if not logged in
  if (!session?.user) {
    router.push('/auth/signin');
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
        toast.success('Password changed successfully');
        router.push('/profile');
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
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/profile" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Link>
        </Button>
      </div>

      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Change Password</CardTitle>
          <CardDescription>
            Update your account password
          </CardDescription>
        </CardHeader>
        <CardContent>
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

            <Button
              type="submit"
              disabled={loading || !isPasswordStrong}
              className="w-full"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
