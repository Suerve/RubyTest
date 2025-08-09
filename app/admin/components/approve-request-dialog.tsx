
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Clock, Infinity, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ApproveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: {
    id: string;
    users: {
      firstName: string;
      lastName: string;
    };
    test_types: {
      displayName: string;
    };
  };
  onSuccess: () => void;
}

export function ApproveRequestDialog({
  open,
  onOpenChange,
  request,
  onSuccess
}: ApproveRequestDialogProps) {
  const [accessType, setAccessType] = useState<'ONE_TIME' | 'UNLIMITED'>('ONE_TIME');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    if (!accessType) {
      toast.error('Please select an access type');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/test-requests/${request.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessType, response })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve request');
      }

      toast.success('Request approved successfully');
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setAccessType('ONE_TIME');
      setResponse('');
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Approve Test Request
          </DialogTitle>
          <DialogDescription>
            Grant access to {request.users.firstName} {request.users.lastName} for{' '}
            {request.test_types.displayName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Access Type Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Access Type</Label>
            <RadioGroup value={accessType} onValueChange={(value) => setAccessType(value as 'ONE_TIME' | 'UNLIMITED')}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="ONE_TIME" id="one-time" />
                  <div className="flex items-center space-x-2 flex-1">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <Label htmlFor="one-time" className="cursor-pointer">
                      <div className="font-medium">One-Time Access</div>
                      <div className="text-xs text-muted-foreground">
                        User can take the test once only
                      </div>
                    </Label>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="UNLIMITED" id="unlimited" />
                  <div className="flex items-center space-x-2 flex-1">
                    <Infinity className="h-4 w-4 text-green-600" />
                    <Label htmlFor="unlimited" className="cursor-pointer">
                      <div className="font-medium">Unlimited Access</div>
                      <div className="text-xs text-muted-foreground">
                        User can retake the test multiple times
                      </div>
                    </Label>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Optional Response Message */}
          <div>
            <Label htmlFor="response" className="text-sm font-medium">
              Message to User (Optional)
            </Label>
            <Textarea
              id="response"
              placeholder="Add a message for the user (optional)..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Approve Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
