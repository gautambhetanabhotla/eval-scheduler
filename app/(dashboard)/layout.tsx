import { DashboardLayoutClient } from '@/components/dashboard-layout-client';
import { UserNav } from '@/components/user-nav';
import { createClient } from '@/lib/supabase/server';
import { DashboardBreadcrumbs } from '@/components/dashboard-breadcrumbs';
import { MobileNav } from '@/components/mobile-nav';

export default async function DashboardLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full h-16 border-b flex items-center px-4 gap-4">
        <MobileNav />
        <div className="font-bold text-xl">Eval Scheduler</div>
        <div className="h-6 w-px bg-border hidden md:block" />
        <DashboardBreadcrumbs />
        <div className="ml-auto">
          <UserNav user={user} />
        </div>
      </nav>

      <DashboardLayoutClient>{children}</DashboardLayoutClient>
      {modal}
    </div>
  );
}
