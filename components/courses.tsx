import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export async function getCourses() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('courses').select('*');

  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }

  return data;
}

export default async function Courses() {
  const courses = await getCourses();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-bold">Courses</h2>
        <Button asChild>
          <Link href="/courses/new">Create</Link>
        </Button>
      </div>
      {courses.length === 0 ? (
        <p className="text-muted-foreground">No courses available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <Link key={course.code} href={`/courses/${course.code}`}>
              <Card className="border rounded-lg p-4 bg-card text-card-foreground shadow-sm hover:bg-accent transition-colors cursor-pointer min-h-[9rem] flex flex-col justify-between">
                <h3 className="text-xl font-semibold">{course.name}</h3>
                <p className="text-sm text-muted-foreground">{course.code}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
