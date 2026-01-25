import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  params: Promise<{ code: string }>;
}

export default async function ScheduleIndexPage({ params }: Props) {
  const { code } = await params;
  const decodedCode = decodeURIComponent(code);
  const supabase = await createClient();

  // Fetch Components to decide redirect
  const { data: components } = await supabase
    .from('components')
    .select('name')
    .eq('course', decodedCode)
    .order('name', { ascending: true })
    .limit(1);

  if (components && components.length > 0) {
    redirect(
      `/courses/${code}/schedule/${encodeURIComponent(components[0].name)}`
    );
  }

  return (
    <div className="text-center py-12 border rounded-lg bg-muted/20">
      <h3 className="text-lg font-semibold mb-2">No Components Found</h3>
      <p className="text-muted-foreground mb-4">
        You need to create an evaluation component (like &ldquo;Midterm&rdquo;)
        before you can schedule slots.
      </p>
      <Button asChild>
        <Link href={`/courses/${code}`}>Go to Course Page</Link>
      </Button>
    </div>
  );
}
