import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';

export default async function Protected(children: React.ReactNode) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect('/auth/login');
  }
  return <div className="p-8">{children}</div>;
}
