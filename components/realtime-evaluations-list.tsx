'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateEvaluationStatus, deactivateEvaluation } from '@/app/actions';
import { toast } from 'sonner';
import { Clock, AlertTriangle, CheckCircle, Timer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Evaluation {
  id: string;
  scheduled: string;
  duration: number;
  status: 'not_started' | 'ongoing' | 'done';
  student: { name: string; rollnumber: string } | null;
  ta: { name: string; rollnumber: string } | null;
  component: { name: string } | null;
}

interface Props {
  initialEvaluations: Evaluation[];
  componentIds: string[];
  taId: string;
  isTA: boolean;
  isStudent: boolean;
}

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'done', label: 'Completed' },
];

function getStatusVariant(status: string) {
  switch (status) {
    case 'done':
      return 'default';
    case 'ongoing':
      return 'outline';
    default:
      return 'secondary';
  }
}

interface ScheduleStatus {
  type: 'ahead' | 'behind' | 'on_time' | 'idle';
  delayMinutes: number;
  currentEval: Evaluation | null;
  nextEval: Evaluation | null;
}

function calculateScheduleStatus(evaluations: Evaluation[]): ScheduleStatus {
  // Sort by scheduled time
  const sorted = [...evaluations].sort(
    (a, b) => new Date(a.scheduled).getTime() - new Date(b.scheduled).getTime()
  );

  // Find the current ongoing evaluation
  const ongoingIndex = sorted.findIndex(ev => ev.status === 'ongoing');

  if (ongoingIndex === -1) {
    // No ongoing eval - check if we're idle or haven't started
    const now = Date.now();
    const nextNotStarted = sorted.find(ev => ev.status === 'not_started');

    if (nextNotStarted) {
      const nextStart = new Date(nextNotStarted.scheduled).getTime();
      if (now > nextStart) {
        // We should have started but haven't - we're behind
        const delayMs = now - nextStart;
        return {
          type: 'behind',
          delayMinutes: Math.floor(delayMs / 60000),
          currentEval: null,
          nextEval: nextNotStarted,
        };
      }
    }

    return {
      type: 'idle',
      delayMinutes: 0,
      currentEval: null,
      nextEval: nextNotStarted || null,
    };
  }

  const currentEval = sorted[ongoingIndex];
  const nextEval = sorted[ongoingIndex + 1] || null;

  if (!nextEval) {
    // Last evaluation - no delay calculation possible
    return { type: 'on_time', delayMinutes: 0, currentEval, nextEval: null };
  }

  // Calculate when current eval should end
  const currentStart = new Date(currentEval.scheduled).getTime();
  const currentExpectedEnd = currentStart + currentEval.duration * 60000;
  const nextStart = new Date(nextEval.scheduled).getTime();

  const delayMs = currentExpectedEnd - nextStart;
  const delayMinutes = Math.round(delayMs / 60000);

  if (delayMinutes > 2) {
    return { type: 'behind', delayMinutes, currentEval, nextEval };
  } else if (delayMinutes < -2) {
    return {
      type: 'ahead',
      delayMinutes: Math.abs(delayMinutes),
      currentEval,
      nextEval,
    };
  } else {
    return { type: 'on_time', delayMinutes: 0, currentEval, nextEval };
  }
}

function ScheduleIndicator({ status }: { status: ScheduleStatus }) {
  if (status.type === 'idle') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm p-3 bg-muted/50 rounded-lg">
        <Timer className="w-4 h-4" />
        <span>
          {status.nextEval
            ? `Next evaluation starts at ${format(new Date(status.nextEval.scheduled), 'p')}`
            : 'All evaluations completed'}
        </span>
      </div>
    );
  }

  if (status.type === 'behind') {
    return (
      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm p-3 bg-orange-100 dark:bg-orange-950/30 rounded-lg">
        <AlertTriangle className="w-4 h-4" />
        <span>
          Running <strong>{status.delayMinutes} min</strong> behind schedule
          {status.currentEval && (
            <span className="text-muted-foreground ml-1">
              • Currently: {status.currentEval.student?.name}
            </span>
          )}
        </span>
      </div>
    );
  }

  if (status.type === 'ahead') {
    return (
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm p-3 bg-green-100 dark:bg-green-950/30 rounded-lg">
        <CheckCircle className="w-4 h-4" />
        <span>
          Running <strong>{status.delayMinutes} min</strong> ahead of schedule
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm p-3 bg-blue-100 dark:bg-blue-950/30 rounded-lg">
      <Clock className="w-4 h-4" />
      <span>
        On schedule
        {status.currentEval && (
          <span className="text-muted-foreground ml-1">
            • Currently: {status.currentEval.student?.name}
          </span>
        )}
      </span>
    </div>
  );
}

export function RealtimeEvaluationsList({
  initialEvaluations,
  componentIds,
  taId,
  isTA,
  isStudent,
}: Props) {
  const [evaluations, setEvaluations] =
    useState<Evaluation[]>(initialEvaluations);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Recalculate schedule status when evaluations change
  const scheduleStatus = useMemo(
    () => calculateScheduleStatus(evaluations),
    [evaluations]
  );

  // Update the "behind schedule" calculation every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to changes on evaluations for these components and TA
    const channel = supabase
      .channel(`evaluations-${taId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evaluations',
          filter: `ta=eq.${taId}`,
        },
        async payload => {
          console.log('Realtime update:', payload);

          if (payload.eventType === 'UPDATE') {
            // Update the evaluation in state
            setEvaluations(prev =>
              prev.map(ev =>
                ev.id === payload.new.id
                  ? { ...ev, status: payload.new.status }
                  : ev
              )
            );
          } else if (payload.eventType === 'INSERT') {
            // Fetch the full evaluation with joins
            const { data } = await supabase
              .from('evaluations')
              .select(
                `
                id,
                scheduled,
                duration,
                status,
                student:users!evaluations_student_fkey(name, rollnumber),
                ta:users!evaluations_ta_fkey(name, rollnumber),
                component:components!evaluations_component_fkey(name)
              `
              )
              .eq('id', payload.new.id)
              .single();

            if (data && componentIds.includes(payload.new.component)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setEvaluations(prev => [...prev, data as any]);
            }
          } else if (payload.eventType === 'DELETE') {
            setEvaluations(prev => prev.filter(ev => ev.id !== payload.old.id));
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Realtime subscription status:', status);
        if (err) console.error('Realtime subscription error:', err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taId, componentIds]);

  const handleStatusChange = async (evalId: string, newStatus: string) => {
    setUpdatingId(evalId);
    try {
      const result = await updateEvaluationStatus(
        evalId,
        newStatus as 'not_started' | 'ongoing' | 'done'
      );
      if (result.error) {
        toast.error(result.error);
      }
      // Don't need to update state - realtime will handle it
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeactivate = async (evalId: string) => {
    setDeactivatingId(evalId);
    try {
      const result = await deactivateEvaluation(evalId);
      if (result.error) {
        toast.error(result.error);
      } else {
        // Remove from local state since it's no longer active
        setEvaluations(prev => prev.filter(ev => ev.id !== evalId));
        toast.success('Evaluation deactivated');
      }
    } catch {
      toast.error('Failed to deactivate evaluation');
    } finally {
      setDeactivatingId(null);
    }
  };

  if (evaluations.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg p-6 bg-card text-card-foreground shadow-sm">
      <h2 className="text-xl font-semibold mb-4">
        Scheduled evaluations {isStudent ? 'under your TA' : ''} (
        {evaluations.length})
      </h2>

      <div className="mb-4">
        <ScheduleIndicator status={scheduleStatus} />
      </div>

      <div className="space-y-4">
        {evaluations.map(evalItem => (
          <div
            key={evalItem.id}
            className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
          >
            <div>
              <p className="font-medium">
                {evalItem.student?.name || 'Unknown Student'} (
                {evalItem.student?.rollnumber || 'N/A'})
              </p>
              <p className="text-sm text-muted-foreground">
                {evalItem.component?.name} •{' '}
                {format(new Date(evalItem.scheduled), 'PP p')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isTA ? (
                <>
                  <Select
                    value={evalItem.status}
                    onValueChange={value =>
                      handleStatusChange(evalItem.id, value)
                    }
                    disabled={updatingId === evalItem.id}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {evalItem.status === 'done' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeactivate(evalItem.id)}
                      disabled={deactivatingId === evalItem.id}
                      title="Deactivate evaluation"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </>
              ) : (
                <Badge variant={getStatusVariant(evalItem.status)}>
                  {evalItem.status.replace('_', ' ')}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
