
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Keyboard, Monitor, Calculator, FileText, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TestType {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
}

interface Props {
  testTypes: TestType[];
  userAccess: Map<string, string>;
  pendingRequests: Map<string, any>;
  userId: string;
}

export function RequestAccessClient({ testTypes, userAccess, pendingRequests, userId }: Props) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const getTestIcon = (testName: string) => {
    switch (testName) {
      case 'typing-10key':
      case 'typing-keyboard':
        return <Keyboard className="h-5 w-5" />;
      case 'digital-literacy':
        return <Monitor className="h-5 w-5" />;
      case 'basic-math':
        return <Calculator className="h-5 w-5" />;
      case 'basic-english':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getAccessStatus = (testTypeId: string) => {
    const access = userAccess.get(testTypeId);
    const pending = pendingRequests.get(testTypeId);
    
    if (pending) {
      return { type: 'pending', label: 'Request Pending', color: 'bg-orange-100 text-orange-800' };
    }
    
    if (access) {
      switch (access) {
        case 'UNLIMITED':
          return { type: 'granted', label: 'Full Access', color: 'bg-green-100 text-green-800' };
        case 'ONE_TIME':
          return { type: 'granted', label: 'One-Time Access', color: 'bg-blue-100 text-blue-800' };
        case 'PRACTICE_ONLY':
          return { type: 'granted', label: 'Practice Only', color: 'bg-yellow-100 text-yellow-800' };
      }
    }
    
    return { type: 'none', label: 'No Access', color: 'bg-gray-100 text-gray-800' };
  };

  const canRequestAccess = (testTypeId: string) => {
    const status = getAccessStatus(testTypeId);
    return status.type === 'none';
  };

  const handleTypeToggle = (testTypeId: string) => {
    if (!canRequestAccess(testTypeId)) return;
    
    setSelectedTypes(prev => 
      prev.includes(testTypeId)
        ? prev.filter(id => id !== testTypeId)
        : [...prev, testTypeId]
    );
  };

  const handleSubmit = async () => {
    if (selectedTypes.length === 0) {
      toast.error('Please select at least one test type');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for your request');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/tests/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testTypeIds: selectedTypes,
          reason: reason.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to submit request');
        return;
      }

      toast.success('Access request submitted successfully!');
      router.push('/dashboard');
      router.refresh();
      
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const availableTestTypes = testTypes.filter(testType => canRequestAccess(testType.id));

  return (
    <div className="space-y-6">
      {availableTestTypes.length === 0 ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            You already have access to all available test types or have pending requests for them.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Test Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Test Types</Label>
            <div className="grid gap-3">
              {testTypes.map((testType) => {
                const status = getAccessStatus(testType.id);
                const isDisabled = !canRequestAccess(testType.id);
                
                return (
                  <div
                    key={testType.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      isDisabled ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        checked={selectedTypes.includes(testType.id)}
                        onCheckedChange={() => handleTypeToggle(testType.id)}
                        disabled={isDisabled}
                      />
                      
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-primary/10 text-primary">
                          {getTestIcon(testType.name)}
                        </div>
                        <div>
                          <div className="font-medium">{testType.displayName}</div>
                          <div className="text-sm text-muted-foreground">
                            {testType.description || 'Professional skills assessment'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Badge className={status.color}>
                      {status.type === 'granted' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {status.type === 'pending' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {status.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-base font-medium">
              Reason for Request *
            </Label>
            <Textarea
              id="reason"
              placeholder="Please explain why you need access to these test types..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Providing a clear reason helps administrators approve your request faster.
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Your request will be reviewed by an administrator.
            </p>
            
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || selectedTypes.length === 0 || !reason.trim()}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Submit Request
                </div>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
