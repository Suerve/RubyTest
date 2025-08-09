
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OneTimeCodeEntryProps {
  testTypeName: string;
  onSuccess: () => void;
}

export default function OneTimeCodeEntry({ testTypeName, onSuccess }: OneTimeCodeEntryProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/tests/activate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to activate code');
      }

      setSuccess(data.message);
      toast.success(data.message);
      setCode('');
      
      // Refresh the page after successful activation
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to activate code');
      toast.error(err.message || 'Failed to activate code');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          {success}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive" className="text-xs py-2">
          <AlertCircle className="h-3 w-3" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">or</p>
          <Input 
            placeholder="Enter one-time code" 
            className="mt-1 text-sm h-8"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError('');
            }}
            disabled={loading}
            maxLength={20}
          />
          <Button 
            type="submit" 
            size="sm" 
            variant="ghost" 
            className="mt-1 text-xs h-6"
            disabled={loading || !code.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Activating...
              </>
            ) : (
              'Activate Code'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
