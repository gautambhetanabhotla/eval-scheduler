import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ComponentScheduler } from '@/components/component-scheduler';

interface Props {
  params: Promise<{ code: string; componentName: string }>;
}

export default async function ComponentSchedulePage({ params }: Props) {
  const { code, componentName } = await params;
  const decodedCode = decodeURIComponent(code);
  const decodedComponentName = decodeURIComponent(componentName);

  console.log('--- Debug Component Page ---');
  console.log('Code:', code, 'Decoded:', decodedCode);
  console.log(
    'ComponentName:',
    componentName,
    'Decoded:',
    decodedComponentName
  );

  const supabase = await createClient();

  // 1. Get current user (needed for TA ID in scheduler)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null; // Should be handled by layout/middleware

  // 2. Fetch specific component details
  const { data: component } = await supabase
    .from('components')
    .select('id, name')
    .eq('course', decodedCode)
    .eq('name', decodedComponentName)
    .single();

  if (!component) {
    return notFound();
  }

  // 3. Fetch students for the dropdown
  const { data: students } = await supabase
    .from('studentships')
    .select('student, users(name, rollnumber)')
    .eq('course', decodedCode);

  const formattedStudents =
    students?.map(s => {
      const user = Array.isArray(s.users) ? s.users[0] : s.users;
      return {
        id: s.student,
        name: user?.name || 'Unknown',
        rollNumber: user?.rollnumber || 'N/A',
      };
    }) || [];

  return (
    <ComponentScheduler
      componentId={component.id}
      componentName={component.name}
      students={formattedStudents}
      currentUserId={user.id}
    />
  );
}
