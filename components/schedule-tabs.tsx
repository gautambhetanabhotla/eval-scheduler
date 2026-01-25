'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';

interface Component {
  id: string;
  name: string;
}

export function ScheduleTabs({
  components,
  courseCode,
  children,
}: {
  components: Component[];
  courseCode: string; // encoded
  children: React.ReactNode;
}) {
  const segment = useSelectedLayoutSegment();
  const activeTab = segment
    ? decodeURIComponent(segment)
    : components.length > 0
      ? components[0].name
      : '';

  return (
    <Tabs value={activeTab} className="w-full">
      <div className="flex items-center justify-between mb-4 overflow-x-auto">
        <TabsList className="flex-row">
          {components.map(c => (
            <TabsTrigger key={c.id} value={c.name} asChild>
              <Link
                href={`/courses/${courseCode}/schedule/${encodeURIComponent(c.name)}`}
              >
                {c.name}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
}
