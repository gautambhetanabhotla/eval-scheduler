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
