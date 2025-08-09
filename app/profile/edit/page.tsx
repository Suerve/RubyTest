
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { ProfileEditClient } from './profile-edit-client';

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProfileEditClient user={user} />
    </div>
  );
}
