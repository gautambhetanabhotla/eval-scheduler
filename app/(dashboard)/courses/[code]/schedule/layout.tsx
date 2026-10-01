import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ScheduleTabs } from './schedule-tabs';

interface Props {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}

export default async function ScheduleLayout({ children, params }: Props) {
  const { code } = await params;
  const decodedCode = decodeURIComponent(code);
  console.log('--- Debug Schedule Layout ---');
  console.log('Code:', code, 'Decoded:', decodedCode);

  const supabase = await createClient();

  // 1. Verify User and Access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if TA
  const { data: taShip } = await supabase
    .from('taships')
    .select('*')
    .eq('course', decodedCode)
    .eq('ta', user.id)
    .single();

  if (!taShip) {
    return (
      <div className="p-6">Unauthorized: Only TAs can access this page.</div>
    );
  }

  // 2. Fetch Course Details
  const { data: course } = await supabase
    .from('courses')
    .select('name')
    .eq('code', decodedCode)
    .single();

  if (!course) notFound();

  // 3. Fetch Components
  const { data: components } = await supabase
    .from('components')
    .select('id, name')
    .eq('course', decodedCode)
    .order('name', { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Schedule Evaluations</h1>
        <p className="text-muted-foreground">
          Manage evaluation slots for {course.name} ({decodedCode})
        </p>
      </div>

      <ScheduleTabs components={components || []} courseCode={code}>
        {children}
      </ScheduleTabs>
    </div>
  );
}
