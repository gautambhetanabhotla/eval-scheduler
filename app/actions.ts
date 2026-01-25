'use server';

import { createClient } from '@/lib/supabase/server';
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
