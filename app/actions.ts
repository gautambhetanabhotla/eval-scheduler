'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function enrollInCourse(courseCode: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { error } = await supabase.from('studentships').insert({
    student: user.id,
    course: courseCode,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/courses/${courseCode}`);
  revalidatePath('/courses');
}

export async function unenrollFromCourse(courseCode: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { error } = await supabase
    .from('studentships')
    .delete()
    .eq('student', user.id)
    .eq('course', courseCode);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/courses/${courseCode}`);
  revalidatePath('/courses');
}

export async function promoteToTA(courseCode: string, userId: string) {
  const supabase = await createClient();
  const adminClient = await createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  // Verify current user is a TA for this course
  const { data: taship } = await supabase
    .from('taships')
    .select('ta')
    .eq('course', courseCode)
    .eq('ta', user.id)
    .single();

  if (!taship) {
    return { error: 'Only TAs can promote users' };
  }

  // Remove from studentships if exists (use admin client to bypass RLS)
  const { error: deleteError } = await adminClient
    .from('studentships')
    .delete()
    .eq('student', userId)
    .eq('course', courseCode);

  if (deleteError) {
    return { error: `Failed to remove studentship: ${deleteError.message}` };
  }

  // Add to taships
  const { error } = await adminClient.from('taships').insert({
    ta: userId,
    course: courseCode,
  });

  if (error) {
    if (error.code === '23505') {
      return { error: 'User is already a TA' };
    }
    return { error: error.message };
  }

  revalidatePath(`/courses/${courseCode}`);
  return { success: true };
}

export async function demoteToStudent(courseCode: string, userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  // Can't demote yourself
  if (user.id === userId) {
    return { error: 'You cannot demote yourself' };
  }

  // Verify current user is a TA for this course
  const { data: taship } = await supabase
    .from('taships')
    .select('ta')
    .eq('course', courseCode)
    .eq('ta', user.id)
    .single();

  if (!taship) {
    return { error: 'Only TAs can demote users' };
  }

  // Remove from taships
  const { error: deleteError } = await supabase
    .from('taships')
    .delete()
    .eq('ta', userId)
    .eq('course', courseCode);

  if (deleteError) {
    return { error: deleteError.message };
  }

  // Add to studentships
  const { error } = await supabase.from('studentships').insert({
    student: userId,
    course: courseCode,
  });

  if (error) {
    if (error.code === '23505') {
      return { error: 'User is already a student' };
    }
    return { error: error.message };
  }

  revalidatePath(`/courses/${courseCode}`);
  return { success: true };
}

export async function createComponent(courseCode: string, name: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('components').insert({
    course: courseCode,
    name: name,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/courses/${courseCode}`);
  revalidatePath(`/courses/${courseCode}/schedule`);
}

export async function enrollStudentByRollNumber(
  courseCode: string,
  rollNumber: string
) {
  const supabase = await createClient();

  // 1. Find user by roll number
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('rollnumber', rollNumber)
    .single();

  if (userError || !user) {
    throw new Error('User with this roll number not found.');
  }

  // 2. Enroll in course
  const { error: enrollError } = await supabase.from('studentships').insert({
    student: user.id,
    course: courseCode,
  });

  if (enrollError) {
    if (enrollError.code === '23505') {
      // Unique violation
      throw new Error('Student is already enrolled.');
    }
    throw new Error(enrollError.message);
  }

  revalidatePath(`/courses/${courseCode}`);
}

export async function createSlots(
  componentId: string,
  start: string,
  end: string,
  count: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const duration = endTime - startTime;
  const slotDuration = duration / count;

  const slots = [];
  for (let i = 0; i < count; i++) {
    const s = new Date(startTime + i * slotDuration);
    const e = new Date(startTime + (i + 1) * slotDuration);
    slots.push({
      component: componentId,
      ta: user.id,
      start: s.toISOString(),
      end: e.toISOString(),
    });
  }

  const { error } = await supabase.from('slots').insert(slots);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/bookings');
}

export async function bookSlot(slotId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // We must chain .select().single() to get the updated row back
  const { data: slot, error: slotError } = await supabase
    .from('slots')
    .update({ booked_by: user.id })
    .eq('id', slotId)
    .is('booked_by', null) // Ensure it's not already booked
    .select()
    .single();

  if (slotError || !slot) {
    throw new Error(slotError?.message || 'Could not book slot (maybe taken?)');
  }

  // Insert Evaluation
  const { error: evalError } = await supabase.from('evaluations').insert({
    student: user.id,
    ta: slot.ta,
    component: slot.component,
    scheduled: slot.start,
    slot: slotId, // Link to the slot
    duration: Math.floor(
      (new Date(slot.end).getTime() - new Date(slot.start).getTime()) / 60000
    ),
    status: 'not_started',
  });

  if (evalError) {
    console.error('Eval creation failed', evalError);
    // Ideally revert slot booking here
  }

  revalidatePath('/bookings');
}

export async function cancelBooking(slotId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('slots')
    .update({ booked_by: null })
    .eq('id', slotId)
    .eq('booked_by', user.id);

  if (error) {
    throw new Error(error.message);
  }

  // Fetch slot details to find evaluation (even though we unbooked it)
  const { data: slotData } = await supabase
    .from('slots')
    .select('component, start')
    .eq('id', slotId)
    .single();

  if (slotData) {
    await supabase
      .from('evaluations')
      .delete()
      .eq('student', user.id)
      .eq('component', slotData.component)
      .eq('scheduled', slotData.start);
  }

  revalidatePath('/bookings');
}

// ... existing code ...

// --- Swap Requests ---

export async function createSwapRequest(
  srcEvalId: string,
  targetEvalId: string,
  reason: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // 1. Verify srcEval belongs to user
  const { data: src } = await supabase
    .from('evaluations')
    .select('student')
    .eq('id', srcEvalId)
    .single();
  if (src?.student !== user.id)
    return { error: 'You do not own the source slot' };

  const { error } = await supabase.from('swap_requests').insert({
    src_eval: srcEvalId,
    target_eval: targetEvalId,
    reason,
  });

  if (error) return { error: error.message };
  revalidatePath('/requests');
  revalidatePath('/courses');
  return { success: true };
}

export async function rejectSwapRequest(requestId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('swap_requests')
    .update({ rejected_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) return { error: error.message };
  revalidatePath('/requests');
  return { success: true };
}

export async function acceptSwapRequest(requestId: string) {
  // Use admin client to bypass RLS for the swap transaction
  const supabase = await createAdminClient();

  // 1. Fetch Request with full evaluation and slot details
  const { data: req, error: reqError } = await supabase
    .from('swap_requests')
    .select(
      `
      *,
      src:evaluations!src_eval(id, student, slot, scheduled, ta),
      target:evaluations!target_eval(id, student, slot, scheduled, ta)
    `
    )
    .eq('id', requestId)
    .single();

  if (reqError || !req) {
    console.error('Failed to fetch request:', reqError);
    return { error: 'Request not found' };
  }

  const evalA = req.src; // Requester's evaluation
  const evalB = req.target; // Target's evaluation (person accepting)
  console.dir({ evalA, evalB });

  if (!evalA || !evalB) {
    return { error: 'Could not find evaluations for this request' };
  }

  console.log('Swapping:', { evalA, evalB });

  // 2. Swap the slot assignments in evaluations
  // evalA gets evalB's slot details, evalB gets evalA's slot details
  const { error: updateAError } = await supabase
    .from('evaluations')
    .update({
      slot: evalB.slot,
      scheduled: evalB.scheduled,
      ta: evalB.ta,
    })
    .eq('id', evalA.id);

  if (updateAError) {
    console.error('Failed to update evalA:', updateAError);
    return { error: 'Failed to update source evaluation' };
  }

  const { error: updateBError } = await supabase
    .from('evaluations')
    .update({
      slot: evalA.slot,
      scheduled: evalA.scheduled,
      ta: evalA.ta,
    })
    .eq('id', evalB.id);

  if (updateBError) {
    console.error('Failed to update evalB:', updateBError);
    return { error: 'Failed to update target evaluation' };
  }

  // 3. Swap booked_by in slots
  // Find slots by ID if available, otherwise by ta+scheduled
  let slotAId = evalA.slot;
  let slotBId = evalB.slot;

  if (!slotAId) {
    const { data: foundSlotA } = await supabase
      .from('slots')
      .select('id')
      .eq('ta', evalA.ta)
      .eq('start', evalA.scheduled)
      .single();
    slotAId = foundSlotA?.id;
  }

  if (!slotBId) {
    const { data: foundSlotB } = await supabase
      .from('slots')
      .select('id')
      .eq('ta', evalB.ta)
      .eq('start', evalB.scheduled)
      .single();
    slotBId = foundSlotB?.id;
  }

  console.log('Swapping slots:', { slotAId, slotBId });

  if (slotAId && slotBId) {
    const { error: slotAError } = await supabase
      .from('slots')
      .update({ booked_by: evalB.student })
      .eq('id', slotAId);
    if (slotAError) console.error('Failed to update slotA:', slotAError);

    const { error: slotBError } = await supabase
      .from('slots')
      .update({ booked_by: evalA.student })
      .eq('id', slotBId);
    if (slotBError) console.error('Failed to update slotB:', slotBError);

    // Also update the slot FK in evaluations if they were null
    if (!evalA.slot) {
      await supabase
        .from('evaluations')
        .update({ slot: slotBId })
        .eq('id', evalA.id);
    }
    if (!evalB.slot) {
      await supabase
        .from('evaluations')
        .update({ slot: slotAId })
        .eq('id', evalB.id);
    }
  } else {
    console.error('Could not find slots to swap');
  }

  // 4. Mark request accepted
  await supabase
    .from('swap_requests')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', requestId);

  revalidatePath('/requests');
  revalidatePath('/courses');
  revalidatePath('/bookings');
  revalidatePath('/evaluations');
  return { success: true };
}

export async function updateEvaluationStatus(
  evaluationId: string,
  status: 'not_started' | 'ongoing' | 'done'
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  // Verify user is the TA for this evaluation
  const { data: evaluation } = await supabase
    .from('evaluations')
    .select('ta, status, start, end')
    .eq('id', evaluationId)
    .single();

  if (evaluation?.ta !== user.id) {
    return { error: 'Only the assigned TA can update status' };
  }

  const oldStatus = evaluation?.status;
  let startTime = evaluation?.start;
  let endTime = evaluation?.end;

  if (oldStatus !== status && status === 'done') {
    endTime = new Date().toISOString();
  } else if (oldStatus !== status && status === 'ongoing') {
    startTime = new Date().toISOString();
  }

  const { error } = await supabase
    .from('evaluations')
    .update({ status, start: startTime, end: endTime })
    .eq('id', evaluationId);

  if (error) return { error: error.message };

  // Don't revalidate - let realtime handle the UI update
  return { success: true };
}

export async function deactivateEvaluation(evaluationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  // Verify user is the TA for this evaluation
  const { data: evaluation } = await supabase
    .from('evaluations')
    .select('ta, status')
    .eq('id', evaluationId)
    .single();

  if (evaluation?.ta !== user.id) {
    return { error: 'Only the assigned TA can deactivate this evaluation' };
  }

  if (evaluation?.status !== 'done') {
    return { error: 'Only completed evaluations can be deactivated' };
  }

  const { error } = await supabase
    .from('evaluations')
    .update({ active: false })
    .eq('id', evaluationId);

  if (error) return { error: error.message };

  return { success: true };
}
