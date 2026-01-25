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
