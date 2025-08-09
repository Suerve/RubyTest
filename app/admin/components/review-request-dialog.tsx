
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Eye,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Languages,
  CheckCircle,
  XCircle,
  Loader2,
  TestTube,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface ReviewRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  onSuccess: () => void;
  onApprove: (request: { id: string; users: { firstName: string; lastName: string; }; test_types: { displayName: string; }; }) => void;
}

interface RequestDetails {
  request: {
    id: string;
    reason?: string;
    createdAt: string;
    users: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      zipCode: string;
      phoneNumber?: string;
      educationLevel?: string;
      englishFirst?: boolean;
      createdAt: string;
    };
    test_types: {
      displayName: string;
      description?: string;
    };
  };
  currentAccess?: {
    accessType: string;
    grantedAt?: string;
    isActive: boolean;
  };
  testHistory: Array<{
    id: string;
    status: string;
    startedAt: string;
    completedAt?: string;
    test_results?: {
      score: number;
      accuracy?: number;
    };
  }>;
}

export function ReviewRequestDialog({
  open,
  onOpenChange,
  requestId,
  onSuccess,
  onApprove
}: ReviewRequestDialogProps) {
  const [details, setDetails] = useState<RequestDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/test-requests/${requestId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch request details');
      }
      const data = await res.json();
      setDetails(data);
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast.error('Failed to load request details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && requestId) {
      fetchDetails();
    }
  }, [open, requestId]);

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/test-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject request');
      }

      toast.success('Request rejected successfully');
      onSuccess();
      onOpenChange(false);
      setAction(null);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject request');
    } finally {
      setIsProcessing(false);
    }
  };

  const getAccessBadgeColor = (accessType: string) => {
    switch (accessType) {
      case 'UNLIMITED': return 'bg-[#c4d600] text-black';
      case 'ONE_TIME': return 'bg-[#f8951d] text-white';
      case 'PRACTICE_ONLY': return 'bg-blue-100 text-blue-800';
      default: return 'bg-[#8a8a8d] text-white';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'STARTED': return 'bg-blue-100 text-blue-800';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!details) return null;

  const { request, currentAccess, testHistory } = details;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Review Test Request
          </DialogTitle>
          <DialogDescription>
            {request.users.firstName} {request.users.lastName} • {request.test_types.displayName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Request Details */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Request Information
              </h3>
              <div className="space-y-2 text-sm">
                <div><strong>Test:</strong> {request.test_types.displayName}</div>
                <div><strong>Requested:</strong> {new Date(request.createdAt).toLocaleDateString()}</div>
                {request.reason && (
                  <div>
                    <strong>Reason:</strong>
                    <div className="bg-muted p-2 rounded mt-1">{request.reason}</div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* User Information */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                User Profile
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {request.users.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Born: {new Date(request.users.dateOfBirth).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    Zip: {request.users.zipCode}
                  </div>
                </div>
                <div className="space-y-2">
                  {request.users.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {request.users.phoneNumber}
                    </div>
                  )}
                  {request.users.educationLevel && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-3 w-3" />
                      {request.users.educationLevel}
                    </div>
                  )}
                  {request.users.englishFirst !== null && (
                    <div className="flex items-center gap-2">
                      <Languages className="h-3 w-3" />
                      English first: {request.users.englishFirst ? 'Yes' : 'No'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Current Access */}
            <div>
              <h3 className="font-semibold mb-3">Current Access Level</h3>
              {currentAccess ? (
                <div className="flex items-center gap-2">
                  <Badge className={getAccessBadgeColor(currentAccess.accessType)}>
                    {currentAccess.accessType.replace('_', ' ')}
                  </Badge>
                  {currentAccess.grantedAt && (
                    <span className="text-sm text-muted-foreground">
                      Granted: {new Date(currentAccess.grantedAt).toLocaleDateString()}
                    </span>
                  )}
                  {!currentAccess.isActive && (
                    <Badge variant="outline" className="text-red-600">Inactive</Badge>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge className={getAccessBadgeColor('NONE')}>
                    No Access
                  </Badge>
                </div>
              )}
            </div>

            {/* Test History */}
            {testHistory.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Test History
                  </h3>
                  <div className="space-y-2">
                    {testHistory.map((test) => (
                      <div key={test.id} className="flex items-center justify-between p-2 border rounded text-sm">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusBadgeColor(test.status)}>
                              {test.status}
                            </Badge>
                            <span>Started: {new Date(test.startedAt).toLocaleDateString()}</span>
                          </div>
                          {test.completedAt && (
                            <div className="text-muted-foreground">
                              Completed: {new Date(test.completedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        {test.test_results && (
                          <div className="text-right">
                            <div className="font-medium">Score: {Math.round(test.test_results.score)}%</div>
                            {test.test_results.accuracy && (
                              <div className="text-muted-foreground">
                                Accuracy: {Math.round(test.test_results.accuracy * 100)}%
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Reject Reason Input (only shown when rejecting) */}
            {action === 'reject' && (
              <>
                <Separator />
                <div>
                  <Label htmlFor="reject-reason" className="text-sm font-medium">
                    Reason for Rejection <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="reject-reason"
                    placeholder="Please provide a reason for rejecting this request..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    className="mt-2"
                    required
                  />
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          {action === 'reject' ? (
            <>
              <Button variant="outline" onClick={() => setAction(null)} disabled={isProcessing}>
                Back
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
                {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm Rejection
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button variant="destructive" onClick={() => setAction('reject')}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button onClick={() => {
                onApprove({
                  id: request.id,
                  users: { firstName: request.users.firstName, lastName: request.users.lastName },
                  test_types: { displayName: request.test_types.displayName }
                });
                onOpenChange(false);
              }}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
