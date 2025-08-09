
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { AppSettingsClient } from './app-settings-client';

export default async function AdminAppSettingsPage() {
  let user;
  try {
    user = await requireAdmin();
  } catch {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AppSettingsClient />
    </div>
  );
}
