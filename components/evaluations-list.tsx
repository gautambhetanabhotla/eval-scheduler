'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  format,
  getHours,
  getMinutes,
  parseISO,
  startOfDay,
  differenceInMinutes,
  isSameDay,
} from 'date-fns';
import { LayoutList, ChartGantt, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface Evaluation {
  id: string;
  status: string;
  scheduled: string;
  duration: number;
  student: {
    id: string;
    name: string;
    rollnumber: string;
  };
  ta: {
    id: string;
    name: string;
    rollnumber: string;
  };
  components: {
    name: string;
    courses: {
      name: string;
      code: string;
    };
  };
}

interface EvaluationsListProps {
  initialEvaluations: Evaluation[];
  currentUserId: string;
}

export function EvaluationsList({
  initialEvaluations,
  currentUserId,
}: EvaluationsListProps) {
  const [filter, setFilter] = useState<'all' | 'student' | 'ta'>('all');
  const [view, setView] = useState<'list' | 'timeline'>('list');
  const [search, setSearch] = useState('');

  const filteredEvaluations = initialEvaluations.filter(evalItem => {
    // Role Filter
    if (filter === 'student' && evalItem.student.id !== currentUserId)
      return false;
    if (filter === 'ta' && evalItem.ta.id !== currentUserId) return false;

    // Search Filter
    const searchTerm = search.toLowerCase();
    const componentName = evalItem.components?.name?.toLowerCase() || '';
    const courseName = evalItem.components?.courses?.name?.toLowerCase() || '';
    const courseCode = evalItem.components?.courses?.code?.toLowerCase() || '';

    // Determine the 'other' person's name based on role
    const isStudent = evalItem.student.id === currentUserId;
    const otherPersonName = isStudent
      ? evalItem.ta?.name?.toLowerCase() || ''
      : evalItem.student?.name?.toLowerCase() || '';
    const otherPersonRollNo = isStudent
      ? evalItem.ta?.rollnumber?.toLowerCase() || ''
      : evalItem.student?.rollnumber?.toLowerCase() || '';
    // const otherPerson = isStudent ? otherPersonRollNo : otherPersonRollNo;

    return (
      componentName.includes(searchTerm) ||
      courseName.includes(searchTerm) ||
      courseCode.includes(searchTerm) ||
      otherPersonName.includes(searchTerm) ||
      otherPersonRollNo.includes(searchTerm)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <Tabs
          value={filter}
          onValueChange={v => setFilter(v as any)}
          className="w-full md:w-auto"
        >
          <TabsList className="flex flex-row">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="student">As Student</TabsTrigger>
            <TabsTrigger value="ta">As TA</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2 w-full md:w-auto items-center">
          <Input
            placeholder="Search evaluations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-[250px]"
          />
          <div className="flex items-center border rounded-md bg-muted/20 p-1 shrink-0">
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="px-2 h-8"
              title="List View"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'timeline' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('timeline')}
              className="px-2 h-8"
              title="Timeline View"
            >
              <ChartGantt className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {view === 'list' ? (
        <div className="grid gap-4">
          {filteredEvaluations.length > 0 ? (
            filteredEvaluations.map(evalItem => (
              <EvaluationItem
                key={evalItem.id}
                evaluation={evalItem}
                currentUserId={currentUserId}
              />
            ))
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground">
                No evaluations found matching your filters.
              </p>
            </div>
          )}
        </div>
      ) : (
        <TimelineView
          evaluations={filteredEvaluations}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}

function TimelineView({
  evaluations,
  currentUserId,
}: {
  evaluations: Evaluation[];
  currentUserId: string;
}) {
  if (evaluations.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">
          No evaluations found matching your filters.
        </p>
      </div>
    );
  }

  // Group by Date
  const groups = evaluations.reduce(
    (acc, curr) => {
      if (!curr.scheduled) return acc;
      const dateKey = format(parseISO(curr.scheduled), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(curr);
      return acc;
    },
    {} as Record<string, Evaluation[]>
  );

  const sortedDates = Object.keys(groups).sort();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {sortedDates.map(date => {
        const evals = groups[date];
        // Sort evals by time
        evals.sort(
          (a, b) =>
            new Date(a.scheduled).getTime() - new Date(b.scheduled).getTime()
        );
        const dayStart = startOfDay(parseISO(date));

        return (
          <div key={date} className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              {format(parseISO(date), 'EEEE, MMMM do, yyyy')}
            </h3>
            <div className="relative border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden select-none">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="min-w-[800px]">
                  {/* Scale Header */}
                  <div className="h-8 border-b bg-muted/40 relative text-xs text-muted-foreground">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-l border-border/20 pl-1"
                        style={{ left: `${(i / 24) * 100}%` }}
                      >
                        {i % 2 === 0 ? (
                          <span className="hidden sm:inline">
                            {i.toString().padStart(2, '0')}:00
                          </span>
                        ) : (
                          ''
                        )}
                        {i % 4 === 0 ? (
                          <span className="sm:hidden">
                            {i.toString().padStart(2, '0')}
                          </span>
                        ) : (
                          ''
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Timeline Track */}
                  <div className="relative h-20 w-full bg-background/50">
                    {/* Grid Lines */}
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-l border-border/10 h-full pointer-events-none"
                        style={{ left: `${(i / 24) * 100}%` }}
                      />
                    ))}

                    {/* Event Bars */}
                    {evals.map(evalItem => {
                      const start = parseISO(evalItem.scheduled);
                      const startMinutes = differenceInMinutes(start, dayStart);
                      const duration = evalItem.duration || 30;
                      const left = (startMinutes / 1440) * 100;
                      // Ensure visible width
                      const width = Math.max((duration / 1440) * 100, 1.5);

                      const isDone = evalItem.status === 'done';
                      const isOngoing = evalItem.status === 'ongoing';

                      const colorClass = isDone
                        ? 'bg-blue-500/20 border-blue-500 text-blue-700 hover:bg-blue-500/30'
                        : isOngoing
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-700 hover:bg-yellow-500/30'
                          : 'bg-slate-200 dark:bg-slate-800 border-slate-400 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700';

                      return (
                        <Popover key={evalItem.id}>
                          <PopoverTrigger asChild>
                            <button
                              className={cn(
                                'absolute top-4 h-12 rounded-md border shadow-sm transition-all z-10 px-2 flex items-center overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                                colorClass
                              )}
                              style={{
                                left: `${left}%`,
                                width: `${width}%`,
                              }}
                            >
                              <span className="truncate text-xs font-semibold w-full block">
                                {evalItem.components.name}
                              </span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0" align="start">
                            <EvaluationItem
                              evaluation={evalItem}
                              currentUserId={currentUserId}
                              className="border-0 shadow-none rounded-none"
                            />
                          </PopoverContent>
                        </Popover>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EvaluationItem({
  evaluation,
  currentUserId,
  className,
}: {
  evaluation: Evaluation;
  currentUserId: string;
  className?: string;
}) {
  const component = evaluation.components;
  const course = component?.courses;
  const isStudent = evaluation.student.id === currentUserId;

  const roleLabel = isStudent ? 'Student' : 'TA';
  const otherPerson = isStudent ? evaluation.ta : evaluation.student;
  const otherRoleLabel = isStudent ? 'TA' : 'Student';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'default';
      case 'ongoing':
        return 'secondary';
      case 'not_started':
      default:
        return 'outline';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{roleLabel}</Badge>
              <CardTitle className="text-lg">
                {course?.code}: {component?.name}
              </CardTitle>
            </div>
            <div className="text-sm text-muted-foreground">{course?.name}</div>
          </div>
          <Badge variant={getStatusColor(evaluation.status)}>
            {evaluation.status?.replace('_', ' ') || 'Pending'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-2">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Scheduled For</span>
            <span className="font-medium">
              {evaluation.scheduled
                ? format(new Date(evaluation.scheduled), 'PPP p')
                : 'Unscheduled'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium">{evaluation.duration} minutes</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">{otherRoleLabel}</span>
            <span className="font-medium">
              {otherPerson?.name || 'Unknown'}
              <span className="text-muted-foreground text-xs ml-1">
                {otherRoleLabel === 'Student' && otherPerson?.rollnumber
                  ? `(${otherPerson.rollnumber})`
                  : ''}
              </span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
