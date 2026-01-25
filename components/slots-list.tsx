'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { bookSlot, cancelBooking } from '@/app/actions';
import { format } from 'date-fns';
import { Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Slot {
  id: string;
  start: string;
  end: string;
  booked_by: string | null;
  ta: {
    name: string;
  };
  components: {
    name: string;
    courses: {
      code: string;
      name: string;
    };
  };
}

interface Props {
  slots: Slot[];
  currentUserId: string;
}

export function SlotsList({ slots, currentUserId }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleBook = async (slotId: string) => {
    setLoadingId(slotId);
    try {
      await bookSlot(slotId);
      toast.success('Success', {
        description: 'Slot booked successfully.',
      });
    } catch (error: any) {
      toast.error('Error', {
        description: error.message,
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancel = async (slotId: string) => {
    setLoadingId(slotId);
    try {
      await cancelBooking(slotId);
      toast.info('Cancelled', {
        description: 'Booking cancelled successfully.',
      });
    } catch (error: any) {
      toast.error('Error', {
        description: error.message,
      });
    } finally {
      setLoadingId(null);
    }
  };

  const groupedSlots = slots.reduce(
    (acc, slot) => {
      const key = `${slot.components.courses.code}: ${slot.components.name}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(slot);
      return acc;
    },
    {} as Record<string, Slot[]>
  );

  if (slots.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground border rounded-lg">
        No slots available at the moment.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedSlots).map(([groupName, groupSlots]) => (
        <div key={groupName} className="space-y-3">
          <h3 className="font-semibold text-lg border-b pb-2">{groupName}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupSlots.map(slot => {
              const isBooked = !!slot.booked_by;
              const isMyBooking = slot.booked_by === currentUserId;
              const isPast = new Date(slot.start) < new Date();

              return (
                <Card
                  key={slot.id}
                  className={`${isMyBooking ? 'border-primary' : ''} ${isBooked && !isMyBooking ? 'opacity-50' : ''}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge
                        variant={
                          isMyBooking
                            ? 'default'
                            : isBooked
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {isMyBooking
                          ? 'Booked by You'
                          : isBooked
                            ? 'Booked'
                            : 'Open'}
                      </Badge>
                      {isMyBooking && (
                        <Calendar className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="font-medium">
                      {format(new Date(slot.start), 'MMM d, p')} -{' '}
                      {format(new Date(slot.end), 'p')}
                    </p>
                    <p className="text-muted-foreground mt-1">
                      TA: {slot.ta?.name}
                    </p>
                  </CardContent>
                  <CardFooter>
                    {isMyBooking ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => handleCancel(slot.id)}
                        disabled={loadingId === slot.id || isPast}
                      >
                        {loadingId === slot.id && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Cancel Booking
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        disabled={isBooked || loadingId === slot.id || isPast}
                        onClick={() => handleBook(slot.id)}
                      >
                        {loadingId === slot.id && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isBooked ? 'Unavailable' : 'Book Slot'}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
