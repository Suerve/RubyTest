
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { UserManagementClient } from './user-management-client';

export default async function AdminUsersPage() {
  let user;
  try {
    user = await requireAdmin();
  } catch {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <UserManagementClient />
    </div>
  );
}
