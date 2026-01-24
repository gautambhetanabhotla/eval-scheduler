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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar'; // Ensure you have this component or use native date picker
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Component {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  rollNumber: string;
}

interface CourseSchedulerProps {
  initialComponents: Component[];
  courseCode: string;
  students: Student[];
  currentUserId: string;
}

export function CourseScheduler({
  initialComponents,
  courseCode,
  students,
  currentUserId,
}: CourseSchedulerProps) {
  const [components, setComponents] = useState<Component[]>(initialComponents);
  const [newComponentName, setNewComponentName] = useState('');
  const [selectedComponentId, setSelectedComponentId] = useState<string>(
    initialComponents[0]?.id || ''
  );

  // Evaluation form state
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('20');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const handleCreateComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComponentName.trim()) return;

    const { data, error } = await supabase
      .from('components')
      .insert({
        course: courseCode,
        name: newComponentName,
      })
      .select()
      .single();

    if (error) {
      alert('Error creating component: ' + error.message);
      return;
    }

    setComponents([data, ...components]);
    setNewComponentName('');
    if (!selectedComponentId) setSelectedComponentId(data.id);
  };

  const handleScheduleEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComponentId || !selectedStudent || !date || !time) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    // Combine date and time
    const scheduledAt = new Date(date);
    const [hours, minutes] = time.split(':');
    scheduledAt.setHours(parseInt(hours), parseInt(minutes));

    const { error } = await supabase.from('evaluations').insert({
      component_id: selectedComponentId,
      student_id: selectedStudent,
      ta_id: currentUserId,
      duration_minutes: parseInt(duration),
      scheduled_at: scheduledAt.toISOString(),
    });

    setIsSubmitting(false);

    if (error) {
      alert('Error scheduling evaluation: ' + error.message);
    } else {
      alert('Evaluation scheduled successfully!');
      // Reset form or navigate
      setSelectedStudent('');
      router.refresh();
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left Column: Manage Components */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Components</CardTitle>
            <CardDescription>
              Create components (assignments, exams) for this course.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateComponent} className="flex gap-2">
              <Input
                placeholder="New Component Name (e.g. Assignment 1)"
                value={newComponentName}
                onChange={e => setNewComponentName(e.target.value)}
              />
              <Button type="submit">Add</Button>
            </form>

            <div className="mt-4 space-y-2">
              {components.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No components yet.
                </p>
              ) : (
                <ul className="space-y-1">
                  {components.map(c => (
                    <li
                      key={c.id}
                      className={cn(
                        'p-2 rounded border cursor-pointer hover:bg-accent',
                        selectedComponentId === c.id
                          ? 'bg-accent border-primary'
                          : ''
                      )}
                      onClick={() => setSelectedComponentId(c.id)}
                    >
                      {c.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Schedule Evaluation */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Schedule an Evaluation</CardTitle>
            <CardDescription>
              Assign a student to a time slot for the selected component.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedComponentId ? (
              <div className="text-center p-6 text-muted-foreground">
                Please select or create a component first.
              </div>
            ) : (
              <form onSubmit={handleScheduleEvaluation} className="space-y-4">
                <div className="space-y-2">
                  <Label>Selected Component</Label>
                  <div className="font-medium p-2 bg-secondary rounded">
                    {components.find(c => c.id === selectedComponentId)?.name}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select
                    value={selectedStudent}
                    onValueChange={setSelectedStudent}
                  >
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
                          {date ? (
                            format(date, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Scheduling...' : 'Schedule Evaluation'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
