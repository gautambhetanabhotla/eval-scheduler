'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
}

interface ComponentSchedulerProps {
  componentId: string;
  componentName: string;
  students: Student[];
  currentUserId: string;
}

export function ComponentScheduler({
  componentId,
  componentName,
  students,
  currentUserId,
}: ComponentSchedulerProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('20');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const handleScheduleEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!componentId || !selectedStudent || !date || !time) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time
      const scheduledAt = new Date(date);
      const [hours, minutes] = time.split(':');
      scheduledAt.setHours(parseInt(hours), parseInt(minutes));

      const { error } = await supabase.from('evaluations').insert({
        component: componentId,
        student: selectedStudent,
        ta: currentUserId,
        duration: parseInt(duration),
        scheduled: scheduledAt.toISOString(),
        start: scheduledAt.toISOString(),
      });

      if (error) throw error;

      //   alert('Evaluation scheduled successfully!');
      setSelectedStudent('');
      router.refresh();
    } catch (error: any) {
      alert('Error scheduling evaluation: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Evaluation for {componentName}</CardTitle>
        <CardDescription>Assign a student to a time slot.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleScheduleEvaluation} className="space-y-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.rollNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 flex flex-col">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              min="1"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Scheduling...' : 'Schedule Evaluation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
