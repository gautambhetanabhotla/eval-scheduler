import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Ensure Test Course exists
  // Assuming 'code' is a unique column or primary key.
  const courseCode = 'TEST-LIVE-101';
  const { error: courseError } = await supabase
    .from('courses')
    .upsert(
      { code: courseCode, name: 'Live Testing Course' },
      { onConflict: 'code' as any }
    );

  if (courseError) {
    return NextResponse.json(
      { error: `Course Error: ${courseError.message}` },
      { status: 500 }
    );
  }

  // 2. Ensure Test Component exists
  // Check if it exists first to avoid duplicates if name isn't unique constraint
  let componentId = '';
  const componentName = 'Live Test Component';

  const { data: existingComponent } = await supabase
    .from('components')
    .select('id')
    .eq('course', courseCode)
    .eq('name', componentName)
    .maybeSingle();

  if (existingComponent) {
    componentId = existingComponent.id;
  } else {
    const { data: newComponent, error: compError } = await supabase
      .from('components')
      .insert({ course: courseCode, name: componentName })
      .select('id')
      .single();

    if (compError) {
      return NextResponse.json(
        { error: `Component Error: ${compError.message}` },
        { status: 500 }
      );
    }
    componentId = newComponent.id;
  }

  // 3. Insert Evaluations
  const now = new Date();
  const past = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
  const future = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day from now

  const evals = [
    {
      student: user.id,
      ta: user.id, // Self-eval for testing so it appears in both tabs/filters
      component: componentId,
      scheduled: past.toISOString(),
      status: 'done',
      duration: 30,
    },
    {
      student: user.id,
      ta: user.id,
      component: componentId,
      scheduled: now.toISOString(),
      status: 'ongoing',
      duration: 45,
    },
    {
      student: user.id,
      ta: user.id,
      component: componentId,
      scheduled: future.toISOString(),
      status: 'not_started',
      duration: 60,
    },
  ];

  const { error: evalError } = await supabase.from('evaluations').insert(evals);

  if (evalError) {
    return NextResponse.json(
      { error: `Evaluations Error: ${evalError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Seeded test data successfully. Visit /evaluations to see them.',
    details: {
      course: courseCode,
      component: componentName,
      evaluations_created: 3,
    },
  });
}
