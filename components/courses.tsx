import { createClient } from '@/lib/supabase/server';
import { CoursesClient } from '@/components/courses-client';

export default async function Courses() {
  const supabase = await createClient();

  // 1. Get User
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Fetch All Courses
  const { data: allCourses, error: coursesError } = await supabase
    .from('courses')
    .select('*');

  if (coursesError) {
    console.error('Error fetching courses:', coursesError);
    return <div>Error loading courses.</div>;
  }

  const courses = allCourses || [];
  const myCourseCodes = new Set<string>();

  if (user) {
    // 3. Fetch My Enrolments
    const { data: studentships } = await supabase
      .from('studentships')
      .select('course')
      .eq('student', user.id);

    const { data: taships } = await supabase
      .from('taships')
      .select('course')
      .eq('ta', user.id);

    studentships?.forEach(s => myCourseCodes.add(s.course));
    taships?.forEach(t => myCourseCodes.add(t.course));
  }

  // 4. Split
  const myCourses = courses.filter(c => myCourseCodes.has(c.code));
  const otherCourses = courses.filter(c => !myCourseCodes.has(c.code));

  return <CoursesClient myCourses={myCourses} otherCourses={otherCourses} />;
}
