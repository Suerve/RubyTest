
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Key, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function OneTimeCodeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast.error('Please enter a code');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/one-time-codes/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Access granted for ${data.testType.displayName}!`);
        setIsOpen(false);
        setCode('');
        router.refresh(); // Refresh the page to show new access
      } else {
        toast.error(data.error || 'Invalid or expired code');
      }
    } catch (error) {
      console.error('Error redeeming code:', error);
      toast.error('Failed to redeem code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Key className="h-4 w-4 mr-2" />
          Enter One-Time Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enter One-Time Access Code</DialogTitle>
          <DialogDescription>
            Enter the code provided to you to gain access to a specific test.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">Access Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter code here..."
                className="text-center text-lg font-mono tracking-wider"
                maxLength={16}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Codes are not case-sensitive and expire after use or timeout.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !code.trim()}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Activate Code
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
