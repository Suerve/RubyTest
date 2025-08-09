
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { AllTestsClient } from './all-tests-client';

export default async function AdminAllTestsPage() {
  let user;
  try {
    user = await requireAdmin();
  } catch {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AllTestsClient />
    </div>
  );
}
