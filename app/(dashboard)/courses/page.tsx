import Courses from '@/components/courses';
import { Suspense } from 'react';

export default function CoursesPage() {
  return (
    <Suspense fallback={<div>Loading courses...</div>}>
      <Courses />
    </Suspense>
  );
}
