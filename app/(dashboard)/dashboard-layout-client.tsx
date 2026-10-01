'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const segment = useSelectedLayoutSegment();

  return (
    <div className="flex-1 w-full p-8 max-w-6xl mx-auto">
      <Tabs
        value={segment || 'evaluations'}
        orientation="vertical"
        className="w-full h-full md:flex"
      >
        <TabsList className="hidden md:flex w-48 shrink-0 flex-col">
          <TabsTrigger value="evaluations" asChild>
            <Link href="/evaluations">Evaluations</Link>
          </TabsTrigger>
          <TabsTrigger value="requests" asChild>
            <Link href="/requests">Requests</Link>
          </TabsTrigger>
          <TabsTrigger value="courses" asChild>
            <Link href="/courses">Courses</Link>
          </TabsTrigger>
          <TabsTrigger value="bookings" asChild>
            <Link href="/bookings">Bookings</Link>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 md:ml-6 h-full">{children}</div>
      </Tabs>
    </div>
  );
}
