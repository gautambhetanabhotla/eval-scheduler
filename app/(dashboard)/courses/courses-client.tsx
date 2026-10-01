'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Course {
  code: string;
  name: string;
}

interface CoursesClientProps {
  myCourses: Course[];
  otherCourses: Course[];
}

export function CoursesClient({ myCourses, otherCourses }: CoursesClientProps) {
  const [filter, setFilter] = useState('');

  const filteredOtherCourses = otherCourses.filter(
    course =>
      course.name.toLowerCase().includes(filter.toLowerCase()) ||
      course.code.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Me Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Courses</h2>
          <Button asChild>
            <Link href="/courses/new">Create</Link>
          </Button>
        </div>
        {myCourses.length === 0 ? (
          <p className="text-muted-foreground">
            You are not enrolled in any courses.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCourses.map(course => (
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

      {/* All (Rest) section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">All Courses</h2>
          <div className="w-full max-w-sm ml-4">
            <Input
              placeholder="Filter courses..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
        </div>

        {filteredOtherCourses.length === 0 ? (
          <p className="text-muted-foreground">No other courses found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOtherCourses.map(course => (
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
    </div>
  );
}
