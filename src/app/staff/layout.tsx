import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import StaffSidebar from '@/components/staff/StaffSidebar';

export const metadata = {
  title: 'Staff Panel | Centro Infantil DULMAR',
  description: 'Panel de gestión para el personal',
};

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Check if user is logged in
  if (!session || !session.user) {
    redirect('/login');
  }

  // Check if user has staff or admin role
  if (session.user.role !== 'staff' && session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <StaffSidebar user={session.user} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
