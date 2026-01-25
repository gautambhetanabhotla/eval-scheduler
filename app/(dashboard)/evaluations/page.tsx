import { createClient } from '@/lib/supabase/server';
import {
  EvaluationsList,
  type Evaluation,
} from '@/components/evaluations-list';

export default async function EvaluationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in to view evaluations.</div>;
  }

  // Fetch all evaluations where user is either student OR TA
  const { data: evaluations } = await supabase
    .from('evaluations')
    .select(
      `
      id,
      status,
      scheduled,
      duration,
      components (
        name,
        courses (
          name,
          code
        )
      ),
      student:users!student (
        id,
        name,
        rollnumber
      ),
      ta:users!ta (
        id,
        name,
        rollnumber
      )
    `
    )
    .or(`student.eq.${user.id},ta.eq.${user.id}`)
    .eq('active', true)
    .order('scheduled', { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Evaluations</h1>
        <p className="text-muted-foreground">
          View and manage all your evaluations in one place.
        </p>
      </div>

      <EvaluationsList
        initialEvaluations={(evaluations as unknown as Evaluation[]) || []}
        currentUserId={user.id}
      />
    </div>
  );
}
