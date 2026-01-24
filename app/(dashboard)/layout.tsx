'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';

export default function DashboardLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const segment = useSelectedLayoutSegment();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full h-16 border-b flex items-center px-4">
        <div className="font-bold text-xl">Eval Scheduler</div>
        <div className="ml-auto">
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth/sign-up">Sign up</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth/login">Login</Link>
          </Button>
        </div>
      </nav>

      <div className="flex-1 w-full p-8 max-w-6xl mx-auto">
        <Tabs
          value={segment || 'evaluations'}
          orientation="vertical"
          className="w-full h-full"
        >
          <TabsList className="w-48 shrink-0">
            <TabsTrigger value="evaluations" asChild>
              <Link href="/evaluations">Evaluations</Link>
            </TabsTrigger>
            <TabsTrigger value="requests" asChild>
              <Link href="/requests">Requests</Link>
            </TabsTrigger>
            <TabsTrigger value="courses" asChild>
              <Link href="/courses">Courses</Link>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 ml-6 h-full">{children}</div>
        </Tabs>
      </div>
      {modal}
    </div>
  );
}
