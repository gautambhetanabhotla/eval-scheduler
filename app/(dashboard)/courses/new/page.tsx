// 'use client';

// import Link from 'next/link';
// import { Button } from '@/components/ui/button';
import CourseCreationForm from '@/app/(dashboard)/courses/new/course_creation_form';
import { HelperMessage } from '@/components/helper-message';

export default function NewCoursePage() {
  return (
    <div className="container mx-auto py-10">
      <div className="border rounded-lg p-6 bg-card text-card-foreground shadow-sm max-w-lg mx-auto">
        <HelperMessage />
        <div className="my-4" />
        <CourseCreationForm />
      </div>
    </div>
  );
}
