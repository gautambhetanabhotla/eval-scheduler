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
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

  // 5. Fetch Scheduled Evaluations (if student or TA)
  let scheduledEvaluations: any[] = [];
  let userTaId: string | null = null;

  if (isEnrolled) {
    // Get components for this course to filter evals
    const { data: components } = await supabase
      .from('components')
      .select('id')
      .eq('course', decodedCode);

    const componentIds = components?.map(c => c.id) || [];

    if (componentIds.length > 0) {
      if (isStudent) {
        // Find if student has a booking to determine "Their TA"
        console.log(user.id);
        const { data: myBooking } = await supabase
          .from('evaluations')
          .select('ta')
          .eq('student', user.id)
          .in('component', componentIds)
          .limit(1);

        if (myBooking && myBooking.length > 0) {
          userTaId = myBooking[0].ta;
        }
      } else if (isTA) {
        userTaId = user.id;
      }

      // If we identified a relevant TA, fetch all their evals for this course
      if (userTaId) {
        const { data: evals } = await supabase
          .from('evaluations')
          .select(
            `
            id,
            scheduled,
            duration,
            status,
            student:users!evaluations_student_fkey(name, rollnumber),
            ta:users!evaluations_ta_fkey(name, rollnumber),
            component:components!evaluations_component_fkey(name)
          `
          )
          .eq('ta', userTaId)
          .in('component', componentIds)
          .order('scheduled', { ascending: true });

        scheduledEvaluations = evals || [];
        console.dir(scheduledEvaluations);
      }
    }
  }

  // 6. Combine data for the table
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

      {scheduledEvaluations.length > 0 && (
        <div className="border rounded-lg p-6 bg-card text-card-foreground shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Scheduled Evaluations{' '}
            {userTaId && isStudent ? '(Under Your TA)' : ''} (
            {scheduledEvaluations.length})
          </h2>
          <div className="space-y-4">
            {scheduledEvaluations.map(evalItem => (
              <div
                key={evalItem.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">
                    {evalItem.student?.name || 'Unknown Student'} (
                    {evalItem.student?.rollnumber || 'N/A'})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {evalItem.component?.name} •{' '}
                    {format(new Date(evalItem.scheduled), 'PP p')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      evalItem.status === 'completed' ? 'default' : 'secondary'
                    }
                  >
                    {evalItem.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
