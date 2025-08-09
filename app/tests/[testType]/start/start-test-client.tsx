
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  testType: string;
  testTypeId: string;
  userId: string;
}

export function StartTestClient({ testType, testTypeId, userId }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStartTest = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/tests/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testTypeId,
          isPractice: false
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to start test');
        return;
      }

      toast.success('Test started successfully!');
      router.push(`/tests/${testType}/${data.testId}`);
      
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleStartTest} disabled={isLoading}>
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          Starting...
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4" />
          Start Test
        </div>
      )}
    </Button>
  );
}
