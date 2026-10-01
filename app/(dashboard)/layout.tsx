import { DashboardLayoutClient } from './dashboard-layout-client';
import { UserNav } from './user-nav';
import { createClient } from '@/lib/supabase/server';
import { DashboardBreadcrumbs } from '@/app/(dashboard)/breadcrumbs';
import { MobileNav } from './mobile-nav';
import { Suspense } from 'react';

async function CurrentUserNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <UserNav user={user} />;
}

export default function DashboardLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full h-16 border-b flex items-center px-4 gap-4">
        <Suspense>
          <MobileNav />
        </Suspense>
        <div className="font-bold text-xl">Eval Scheduler</div>
        <div className="h-6 w-px bg-border hidden md:block" />
        <Suspense>
          <DashboardBreadcrumbs />
        </Suspense>
        <div className="ml-auto">
          <Suspense>
            <CurrentUserNav />
          </Suspense>
        </div>
      </nav>

      <Suspense>
        <DashboardLayoutClient>{children}</DashboardLayoutClient>
      </Suspense>
      {modal}
    </div>
  );
}
