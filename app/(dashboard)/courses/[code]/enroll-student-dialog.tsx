'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { enrollStudentByRollNumber } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';

export function EnrollStudentDialog({ courseCode }: { courseCode: string }) {
  const [open, setOpen] = useState(false);
  const [rollNumber, setRollNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber.trim()) return;

    setLoading(true);
    try {
      await enrollStudentByRollNumber(courseCode, rollNumber);
      setOpen(false);
      setRollNumber('');
      setSuccess('Student enrolled successfully');
      setError(null);
      router.refresh();
    } catch (error) {
      setError(
        (error as Error).message ||
          'An error occurred while enrolling the student'
      );
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Enroll Student">
          <UserPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enroll Student</DialogTitle>
          <DialogDescription>
            Enter the roll number of the student you want to add to this course.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rollNumber" className="text-right">
                Roll Number
              </Label>
              <Input
                id="rollNumber"
                value={rollNumber}
                onChange={e => setRollNumber(e.target.value)}
                className="col-span-3"
                placeholder="Ex: 2025123456"
              />
            </div>
            {error && <p className="text-red-500">{error}</p>}
            {success && <p className="text-green-500">{success}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enrolling...' : 'Enroll'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
