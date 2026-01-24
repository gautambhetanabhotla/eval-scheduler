'use client';

import { Button } from '@/components/ui/button';
import { unenrollFromCourse } from '@/app/actions';
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';

export function UnenrollButton({ courseCode }: { courseCode: string }) {
  const [isPending, startTransition] = useTransition();

  const handleUnenroll = () => {
    if (!confirm('Are you sure you want to un-enroll from this course?'))
      return;

    startTransition(async () => {
      try {
        await unenrollFromCourse(courseCode);
      } catch (error) {
        alert('Failed to un-enroll: ' + (error as Error).message);
      }
    });
  };

  return (
    <Button onClick={handleUnenroll} disabled={isPending} variant="destructive">
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isPending ? 'Un-enrolling...' : 'Un-enroll'}
    </Button>
  );
}
