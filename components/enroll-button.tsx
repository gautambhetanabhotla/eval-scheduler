'use client';

import { Button } from '@/components/ui/button';
import { enrollInCourse } from '@/app/actions';
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';

export function EnrollButton({ courseCode }: { courseCode: string }) {
  const [isPending, startTransition] = useTransition();

  const handleEnroll = () => {
    startTransition(async () => {
      try {
        await enrollInCourse(courseCode);
      } catch (error) {
        alert('Failed to enroll: ' + (error as Error).message);
      }
    });
  };

  return (
    <Button onClick={handleEnroll} disabled={isPending}>
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isPending ? 'Enrolling...' : 'Enroll in Course'}
    </Button>
  );
}
