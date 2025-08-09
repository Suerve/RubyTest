
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, Shield, UserX, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function Header() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };

  const handleExitImpersonation = async () => {
    if (!session?.impersonating) return;

    try {
      const response = await fetch('/api/admin/impersonate/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (response.ok) {
        // Clear impersonation data from storage and session
        sessionStorage.removeItem('impersonationData');
        
        // Update session to clear impersonation
        await update({ impersonating: null });
        
        toast.success(data.message);
        
        // Redirect to admin panel
        router.push('/admin');
      } else {
        throw new Error(data.error || 'Failed to exit impersonation');
      }
    } catch (error) {
      console.error('Error exiting impersonation:', error);
      toast.error('Failed to exit impersonation');
    }
  };

  // Handle impersonation setup from URL params - prevent infinite loops
  useEffect(() => {
    const handleImpersonationSetup = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const impersonateParam = urlParams.get('impersonate');
      
      // Only run if we have the impersonate param and no current impersonation
      if (impersonateParam === 'start' && !session?.impersonating) {
        const storedData = sessionStorage.getItem('impersonationData');
        if (storedData) {
          try {
            const impersonationData = JSON.parse(storedData);
            // Trigger session update with impersonation data
            await update({ impersonating: impersonationData });
            // Clean up URL to prevent re-triggering
            router.replace('/dashboard');
            // Clear the stored data to prevent future triggers
            sessionStorage.removeItem('impersonationData');
          } catch (error) {
            console.error('Error setting up impersonation:', error);
            sessionStorage.removeItem('impersonationData');
          }
        }
      }
    };

    // Only run when status changes to authenticated, not when session updates
    if (status === 'authenticated' && !session?.impersonating) {
      handleImpersonationSetup();
    }
  }, [status, update, router]); // Removed 'session' to prevent infinite loops

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          <Logo type="horizontal" size="md" href="/" />

          <nav className="flex items-center gap-4">
            {status === 'loading' ? (
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded" />
            ) : session ? (
              <div className="flex items-center gap-4">
                {/* Impersonation Indicator */}
                {session.impersonating && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Acting as {session.user.firstName} {session.user.lastName}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleExitImpersonation}
                      className="text-orange-800 border-orange-300 hover:bg-orange-50"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Exit to Admin
                    </Button>
                  </div>
                )}

                {/* Normal Admin Panel Button - only show if not impersonating */}
                {session.user.userType === 'ADMIN' && !session.impersonating && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Panel
                    </Link>
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      {session.user.firstName} {session.user.lastName}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      {session.impersonating ? 'Impersonated Account' : 'My Account'}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {!session.impersonating && (
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <Settings className="h-4 w-4 mr-2" />
                          Profile Settings
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {session.impersonating && (
                      <>
                        <DropdownMenuItem onClick={handleExitImpersonation}>
                          <UserX className="h-4 w-4 mr-2" />
                          Exit to Admin
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
