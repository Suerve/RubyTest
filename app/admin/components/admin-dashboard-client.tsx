
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Eye } from 'lucide-react';
import { ApproveRequestDialog } from './approve-request-dialog';
import { ReviewRequestDialog } from './review-request-dialog';

interface PendingRequest {
  id: string;
  createdAt: Date;
  users: {
    firstName: string;
    lastName: string;
  };
  test_types: {
    displayName: string;
  };
}

interface AdminDashboardClientProps {
  pendingRequests: PendingRequest[];
  onRequestUpdate: () => void;
}

export function AdminDashboardClient({ 
  pendingRequests, 
  onRequestUpdate 
}: AdminDashboardClientProps) {
  const [approveDialog, setApproveDialog] = useState<{
    open: boolean;
    request: PendingRequest | null;
  }>({ open: false, request: null });

  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    requestId: string | null;
  }>({ open: false, requestId: null });

  const handleApprove = (request: PendingRequest) => {
    setApproveDialog({ open: true, request });
  };

  const handleReview = (requestId: string) => {
    setReviewDialog({ open: true, requestId });
  };

  const handleSuccess = () => {
    onRequestUpdate();
  };

  const handleApproveFromReview = (requestData: { id: string; users: { firstName: string; lastName: string; }; test_types: { displayName: string; }; }) => {
    const fullRequest = pendingRequests.find(r => r.id === requestData.id);
    if (fullRequest) {
      setReviewDialog({ open: false, requestId: null });
      setApproveDialog({ open: true, request: fullRequest });
    }
  };

  return (
    <>
      <div className="space-y-3">
        {pendingRequests.map((request) => (
          <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">
                {request.users.firstName} {request.users.lastName}
              </div>
              <div className="text-sm text-muted-foreground">
                Requested access to {request.test_types.displayName}
              </div>
              <div className="text-xs text-muted-foreground">
                {request.createdAt.toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleApprove(request)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleReview(request.id)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Review
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Approve Request Dialog */}
      {approveDialog.request && (
        <ApproveRequestDialog
          open={approveDialog.open}
          onOpenChange={(open) => setApproveDialog({ open, request: null })}
          request={approveDialog.request}
          onSuccess={handleSuccess}
        />
      )}

      {/* Review Request Dialog */}
      {reviewDialog.requestId && (
        <ReviewRequestDialog
          open={reviewDialog.open}
          onOpenChange={(open) => setReviewDialog({ open, requestId: null })}
          requestId={reviewDialog.requestId}
          onSuccess={handleSuccess}
          onApprove={handleApproveFromReview}
        />
      )}
    </>
  );
}
