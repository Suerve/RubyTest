
'use client';

import { useRouter } from 'next/navigation';
import { AdminDashboardClient } from './admin-dashboard-client';

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

interface AdminDashboardWrapperProps {
  pendingRequests: PendingRequest[];
}

export function AdminDashboardWrapper({ pendingRequests }: AdminDashboardWrapperProps) {
  const router = useRouter();

  const handleRequestUpdate = () => {
    router.refresh();
  };

  return (
    <AdminDashboardClient 
      pendingRequests={pendingRequests}
      onRequestUpdate={handleRequestUpdate}
    />
  );
}
