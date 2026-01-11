
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';
import { ensureAdminAccount, validateAdminSession } from '@/lib/adminAuth';

export default async function AdminDashboard() {
  await ensureAdminAccount();
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  const isAuthorized = await validateAdminSession(token);

  if (!isAuthorized) {
    redirect('/admin/login');
  }

  return <AdminDashboardClient />;
}
