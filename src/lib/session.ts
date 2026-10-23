import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import type { UserRole } from '@/models/User';

export async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

export async function ensureSession(allowedRoles?: UserRole[]) {
  const session = await getSession();

  if (!session?.user) {
    redirect('/auth/sign-in');
  }

  const userRole = ((session.user as any).role || 'patient') as UserRole;

  if (allowedRoles && allowedRoles.length > 0) {
    // superadmin has universal access
    if (userRole !== 'superadmin' && !allowedRoles.includes(userRole)) {
      // Redirect to their own dashboard
      if (userRole === 'doctor') {
        redirect('/doctor');
      } else if (userRole === 'admin') {
        redirect('/admin');
      } else {
        redirect('/patient');
      }
    }
  }

  return session;
}
