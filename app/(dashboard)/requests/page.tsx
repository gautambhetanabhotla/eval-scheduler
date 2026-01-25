import { createClient } from '@/lib/supabase/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowRight, Clock } from 'lucide-react';
import { SwapRequestActions } from '@/components/swap-request-actions';
import { NewSwapRequestForm } from '@/components/new-swap-request-form';

export default async function RequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in to view requests.</div>;
  }

  // Fetch MY evaluations (for the "create request" form)
  const { data: myEvaluations } = await supabase
    .from('evaluations')
    .select(
      `
      id,
      scheduled,
      ta,
      component:components!evaluations_component_fkey (id, name),
      student:users!evaluations_student_fkey (name, rollnumber)
    `
    )
    .eq('student', user.id)
    .gte('scheduled', new Date().toISOString())
    .order('scheduled', { ascending: true });

  // Fetch OTHER students' evaluations (potential swap targets)
  // We need evaluations where: same component as one of mine, but different student
  const myComponentIds = [
    ...new Set(
      (myEvaluations || [])
        .map(e => {
          const comp = Array.isArray(e.component)
            ? e.component[0]
            : e.component;
          return comp?.id;
        })
        .filter(Boolean)
    ),
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let otherEvaluations: any[] = [];
  if (myComponentIds.length > 0) {
    const { data } = await supabase
      .from('evaluations')
      .select(
        `
        id,
        scheduled,
        component:components!evaluations_component_fkey (id, name),
        student:users!evaluations_student_fkey (name, rollnumber)
      `
      )
      .in('component', myComponentIds)
      .neq('student', user.id)
      .gte('scheduled', new Date().toISOString())
      .order('scheduled', { ascending: true });

    otherEvaluations = data || [];
  }

  // Get my evaluation IDs first (for filtering requests)
  const myEvalIds = (myEvaluations || []).map(e => e.id);
  console.log('DEBUG: myEvalIds =', myEvalIds);

  // DEBUG: Fetch ALL swap requests to see what's in the table
  const { data: allRequests, error: allReqError } = await supabase
    .from('swap_requests')
    .select('*');
  console.log('DEBUG: All swap_requests =', allRequests, 'Error:', allReqError);

  // Fetch Incoming Requests (People want MY slot)
  // Filter: target_eval is one of my evaluations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let incomingRaw: any[] = [];
  if (myEvalIds.length > 0) {
    const { data, error } = await supabase
      .from('swap_requests')
      .select(
        `
        id,
        accepted_at,
        src_eval:evaluations!src_eval (
          scheduled,
          student:users!student (name, rollnumber),
          component:components!evaluations_component_fkey (name)
        ),
        target_eval:evaluations!target_eval (
          id, scheduled
        )
      `
      )
      .in('target_eval', myEvalIds)
      .is('accepted_at', null)
      .is('rejected_at', null);
    console.log('DEBUG: Incoming query result =', data, 'Error:', error);
    incomingRaw = data || [];
  }

  // Fetch Outgoing Requests (I want THEIR slot)
  // Filter: src_eval is one of my evaluations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let outgoingRaw: any[] = [];
  if (myEvalIds.length > 0) {
    const { data } = await supabase
      .from('swap_requests')
      .select(
        `
        id,
        accepted_at,
        src_eval:evaluations!src_eval (
          id, scheduled
        ),
        target_eval:evaluations!target_eval (
          scheduled,
          student:users!student (name, rollnumber),
          component:components!evaluations_component_fkey (name)
        )
      `
      )
      .in('src_eval', myEvalIds)
      .is('accepted_at', null)
      .is('rejected_at', null);
    outgoingRaw = data || [];
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Swap Requests</h2>
        <p className="text-muted-foreground">
          Manage your slot exchange proposals.
        </p>
      </div>

      {/* New Request Form */}
      <NewSwapRequestForm
        myEvaluations={myEvaluations || []}
        otherEvaluations={otherEvaluations}
      />

      <Tabs defaultValue="incoming" className="w-full">
        <TabsList>
          <TabsTrigger value="incoming">
            Incoming ({incomingRaw?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="outgoing">
            Outgoing ({outgoingRaw?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="mt-4 space-y-4">
          {incomingRaw?.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              No incoming requests.
            </div>
          )}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {incomingRaw?.map((req: any) => (
            <Card key={req.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex justify-between items-center">
                  <span>{req.src_eval?.component?.name}</span>
                  <Badge variant="outline">Pending</Badge>
                </CardTitle>
                <CardDescription>
                  Request from {req.src_eval?.student?.name} (
                  {req.src_eval?.student?.rollnumber})
                </CardDescription>
                <CardDescription>
                  Reason: {req.reason || 'Not provided'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-muted-foreground text-xs uppercase">
                      Your Slot
                    </p>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-primary" />
                      {format(new Date(req.target_eval.scheduled), 'PPP p')}
                    </div>
                  </div>
                  <ArrowRight className="text-muted-foreground w-5 h-5" />
                  <div className="space-y-1 text-right">
                    <p className="font-semibold text-muted-foreground text-xs uppercase">
                      Proposed Slot
                    </p>
                    <div className="flex items-center justify-end">
                      {format(new Date(req.src_eval.scheduled), 'PPP p')}
                      <Clock className="w-4 h-4 ml-2 text-primary" />
                    </div>
                  </div>
                </div>

                <SwapRequestActions requestId={req.id} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="outgoing" className="mt-4 space-y-4">
          {outgoingRaw?.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              No active outgoing requests.
            </div>
          )}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {outgoingRaw?.map((req: any) => (
            <Card key={req.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex justify-between items-center">
                  <span>{req.target_eval?.component?.name}</span>
                  <Badge variant="secondary">Waiting</Badge>
                </CardTitle>
                <CardDescription>
                  Request sent to {req.target_eval?.student?.name} (
                  {req.target_eval?.student?.rollnumber})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-1">
                    <p className="font-semibold text-muted-foreground text-xs uppercase">
                      Your Slot
                    </p>
                    {format(new Date(req.src_eval.scheduled), 'PPP p')}
                  </div>
                  <ArrowRight className="text-muted-foreground w-5 h-5" />
                  <div className="space-y-1 text-right">
                    <p className="font-semibold text-muted-foreground text-xs uppercase">
                      Requested Slot
                    </p>
                    {format(new Date(req.target_eval.scheduled), 'PPP p')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
