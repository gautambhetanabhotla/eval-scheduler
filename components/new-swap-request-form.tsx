'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createSwapRequest } from '@/app/actions';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ArrowRight, Plus } from 'lucide-react';

interface Evaluation {
  id: string;
  scheduled: string;
  component: { name: string } | { name: string }[];
  student:
    | { name: string; rollnumber: string }
    | { name: string; rollnumber: string }[];
}

interface Props {
  myEvaluations: Evaluation[];
  otherEvaluations: Evaluation[];
}

// Helper to unwrap potential array from Supabase join
function unwrap<T>(val: T | T[]): T | undefined {
  return Array.isArray(val) ? val[0] : val;
}

export function NewSwapRequestForm({ myEvaluations, otherEvaluations }: Props) {
  const [srcEvalId, setSrcEvalId] = useState<string>('');
  const [targetEvalId, setTargetEvalId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async () => {
    if (!srcEvalId || !targetEvalId) {
      toast.error('Please select both slots');
      return;
    }

    if (srcEvalId === targetEvalId) {
      toast.error('Cannot swap with your own slot');
      return;
    }

    setLoading(true);
    try {
      const result = await createSwapRequest(srcEvalId, targetEvalId);
      if (result?.error) throw new Error(result.error);
      toast.success('Swap request sent!');
      setSrcEvalId('');
      setTargetEvalId('');
      setIsExpanded(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to send request'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <Button onClick={() => setIsExpanded(true)} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        New Swap Request
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create Swap Request</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
          {/* My Slot */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Your Slot (to give up)
            </label>
            <Select value={srcEvalId} onValueChange={setSrcEvalId}>
              <SelectTrigger>
                <SelectValue placeholder="Select your slot..." />
              </SelectTrigger>
              <SelectContent>
                {myEvaluations.map(ev => {
                  const comp = unwrap(ev.component);
                  return (
                    <SelectItem key={ev.id} value={ev.id}>
                      {comp?.name} — {format(new Date(ev.scheduled), 'PP p')}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <ArrowRight className="hidden md:block text-muted-foreground w-5 h-5 mb-2" />

          {/* Target Slot */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Requested Slot (to receive)
            </label>
            <Select value={targetEvalId} onValueChange={setTargetEvalId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target slot..." />
              </SelectTrigger>
              <SelectContent>
                {otherEvaluations.map(ev => {
                  const student = unwrap(ev.student);
                  return (
                    <SelectItem key={ev.id} value={ev.id}>
                      {student?.name} ({student?.rollnumber}) —{' '}
                      {format(new Date(ev.scheduled), 'PP p')}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Sending...' : 'Send Request'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
