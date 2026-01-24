import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { CourseScheduler } from '@/components/course-scheduler';
import { Suspense } from 'react';

interface Props {
  params: Promise<{ code: string }>;
}

export default async function SchedulePage({ params }: Props) {
  const { code } = await params;
  const decodedCode = decodeURIComponent(code);
  const supabase = await createClient();

  // 1. Verify User
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // 2. Fetch Course
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('code', decodedCode)
    .single();

  if (error || !course) {
    return notFound();
  }

  // 3. Verify TA status (Only TAs can schedule)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Schedule Evaluations</h1>
        <p className="text-muted-foreground">
          Manage evaluation slots for {course.name} ({course.code})
        </p>
      </div>

      <Suspense fallback={<div>Loading scheduler...</div>}>
        <CourseSchedulerWrapper courseCode={decodedCode} userId={user.id} />
      </Suspense>
    </div>
  );
}

async function CourseSchedulerWrapper({
  courseCode,
  userId,
}: {
  courseCode: string;
  userId: string;
}) {
  const supabase = await createClient();

  // Fetch existing components
  const { data: components } = await supabase
    .from('components')
    .select('*')
    .eq('course', courseCode);
  console.dir(components);

  // Fetch students for the dropdown
  const { data: students } = await supabase
    .from('studentships')
    .select('student, users(name, rollnumber)')
    .eq('course', courseCode);

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
    <CourseScheduler
      initialComponents={components || []}
      courseCode={courseCode}
      students={formattedStudents}
      currentUserId={userId}
    />
  );
}
