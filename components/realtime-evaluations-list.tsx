'use client';

import { useEffect, useState } from 'react';
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
import { updateEvaluationStatus } from '@/app/actions';
import { toast } from 'sonner';

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

export function RealtimeEvaluationsList({
  initialEvaluations,
  componentIds,
  taId,
  isTA,
  isStudent,
}: Props) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>(initialEvaluations);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  if (evaluations.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg p-6 bg-card text-card-foreground shadow-sm">
      <h2 className="text-xl font-semibold mb-4">
        Scheduled evaluations {isStudent ? 'under your TA' : ''} ({evaluations.length})
      </h2>
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
                <Select
                  value={evalItem.status}
                  onValueChange={value => handleStatusChange(evalItem.id, value)}
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
