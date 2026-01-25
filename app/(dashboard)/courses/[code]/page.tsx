import { AddComponentDialog } from '@/components/add-component-dialog';
import { EnrollStudentDialog } from '@/components/enroll-student-dialog';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ParticipantsTable,
  Participant,
} from '@/components/participants-table';
import { EnrollButton } from '@/components/enroll-button';
import { UnenrollButton } from '@/components/unenroll-button';
import { Suspense } from 'react';

interface Props {
  params: Promise<{ code: string }>;
}

export default async function CoursePage({ params }: Props) {
  return (
    <Suspense fallback={<div className="p-6">Loading course...</div>}>
      <CourseContent params={params} />
    </Suspense>
  );
}

async function CourseContent({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const decodedCode = decodeURIComponent(code);
  const supabase = await createClient();

  // 1. Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-4">Please log in to view this course.</div>;
  }

  // 2. Fetch course details
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('code', decodedCode)
    .single();

  if (courseError || !course) {
    console.error('Error fetching course:', courseError);
    return notFound();
  }

  // 3. Fetch Students
  const { data: students, error: studentsError } = await supabase
    .from('studentships')
    .select('student, users(name, rollnumber)')
    .eq('course', decodedCode);

  // 4. Fetch TAs
  const { data: tas, error: tasError } = await supabase
    .from('taships')
    .select('ta, users(name, rollnumber)')
    .eq('course', decodedCode);

  if (studentsError) {
    console.error('Error fetching students:', studentsError);
  }
  if (tasError) {
    console.error('Error fetching TAs:', tasError);
  }

  const isTA = tas?.some(ta => ta.ta === user.id);
  const isStudent = students?.some(s => s.student === user.id);
  const isEnrolled = isTA || isStudent;

  // 5. Combine data for the table
  const participants: Participant[] = [
    ...(tas?.map(ta => {
      const user = Array.isArray(ta.users) ? ta.users[0] : ta.users;
      return {
        id: ta.ta,
        name: user?.name || 'Unknown',
        roll_number: user?.rollnumber || 'N/A',
        role: 'TA' as const,
      };
    }) || []),
    ...(students?.map(student => {
      const user = Array.isArray(student.users)
        ? student.users[0]
        : student.users;
      return {
        id: student.student,
        name: user?.name || 'Unknown',
        roll_number: user?.rollnumber || 'N/A',
        role: 'Student' as const,
      };
    }) || []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{course.name}</h1>
          <p className="text-muted-foreground">{course.code}</p>
        </div>
        {!isEnrolled && <EnrollButton courseCode={course.code} />}
        {isStudent && <UnenrollButton courseCode={course.code} />}
        {isTA && (
          <div className="flex gap-2">
            <EnrollStudentDialog courseCode={decodedCode} />
            <AddComponentDialog courseCode={decodedCode} />
            <Button asChild>
              <Link href={`/courses/${decodedCode}/schedule`}>
                Schedule Evaluations
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="border rounded-lg p-6 bg-card text-card-foreground shadow-sm">
        <h2 className="text-xl font-semibold mb-4">
          Participants ({participants.length})
        </h2>
        <ParticipantsTable data={participants} />
      </div>
    </div>
  );
}
