
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { OneTimeCodesClient } from './one-time-codes-client';

export default async function AdminOneTimeCodesPage() {
  let user;
  try {
    user = await requireAdmin();
  } catch {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <OneTimeCodesClient />
    </div>
  );
}
