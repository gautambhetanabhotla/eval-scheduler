import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ParticipantsTable,
  Participant,
} from '@/components/participants-table';
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

async function CourseContent({ params }: { params: Promise<{ code: string }> }) {
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

  // 5. Combine data for the table
  const participants: Participant[] = [
    ...(tas?.map(ta => ({
      id: ta.ta,
      name: ta.users?.name || 'Unknown',
      roll_number: ta.users?.rollnumber || 'N/A',
      role: 'TA' as const,
    })) || []),
    ...(students?.map(student => ({
      id: student.student,
      name: student.users?.name || 'Unknown',
      roll_number: student.users?.rollnumber || 'N/A',
      role: 'Student' as const,
    })) || []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{course.name}</h1>
          <p className="text-muted-foreground">{course.code}</p>
        </div>
        {isTA && (
          <Button asChild>
            <Link href={`/courses/${code}/schedule`}>Schedule Evaluations</Link>
          </Button>
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
