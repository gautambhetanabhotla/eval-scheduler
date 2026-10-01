'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { acceptSwapRequest, rejectSwapRequest } from '@/app/actions'; // We need to create these
import { toast } from 'sonner';

export function SwapRequestActions({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const result = await acceptSwapRequest(requestId);
      if (result?.error) throw new Error(result.error);
      toast.success('Swap accepted successfully!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const result = await rejectSwapRequest(requestId);
      if (result?.error) throw new Error(result.error);
      toast.success('Request declined');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 justify-end">
      <Button
        variant="outline"
        size="sm"
        onClick={handleReject}
        disabled={loading}
      >
        Decline
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={handleAccept}
        disabled={loading}
      >
        Accept Swap
      </Button>
    </div>
  );
}
