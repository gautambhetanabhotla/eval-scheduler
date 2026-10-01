'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSlots } from '@/app/actions';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  teachingComponents: {
    id: string;
    name: string;
    course: string;
  }[];
}

export function SlotsManager({ teachingComponents }: Props) {
  const [selectedComponent, setSelectedComponent] = useState<string>('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!selectedComponent || !start || !end || count < 1) return;
    setLoading(true);
    try {
      await createSlots(selectedComponent, start, end, count);
      toast.success('Slots created', {
        description: `Successfully created ${count} slots.`,
      });
      // Reset form slightly?
    } catch (error: any) {
      toast.error('Error', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (teachingComponents.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Evaluation Slots</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Component</Label>
          <Select
            value={selectedComponent}
            onValueChange={setSelectedComponent}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a component" />
            </SelectTrigger>
            <SelectContent>
              {teachingComponents.map(comp => (
                <SelectItem key={comp.id} value={comp.id}>
                  {comp.course}: {comp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input
              type="datetime-local"
              value={start}
              onChange={e => setStart(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <Input
              type="datetime-local"
              value={end}
              onChange={e => setEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Number of Slots</Label>
          <Input
            type="number"
            min={1}
            value={count}
            onChange={e => setCount(parseInt(e.target.value))}
          />
        </div>

        <Button
          onClick={handleCreate}
          disabled={loading || !selectedComponent || !start || !end}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate Slots
        </Button>
      </CardContent>
    </Card>
  );
}
