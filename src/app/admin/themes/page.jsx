import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminThemesClient from './AdminThemesClient';
import { ensureAdminAccount, validateAdminSession } from '@/lib/adminAuth';

export const metadata = {
  title: 'Theme Management - Admin',
  description: 'Manage platform themes and seasonal events',
};

export default async function AdminThemesPage() {
  await ensureAdminAccount();
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  const isAuthorized = await validateAdminSession(token);

  if (!isAuthorized) {
    redirect('/admin/login');
  }

  return <AdminThemesClient />;
}
