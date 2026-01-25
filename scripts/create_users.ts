import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function signUpUser(
  email: string,
  password: string,
  name: string,
  rollNumber: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // options: {
    //   emailRedirectTo: `${window.location.origin}/protected`,
    // },
  });
  if (data.user) {
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      name: name,
      rollnumber: rollNumber,
    });

    if (profileError || error) {
      throw new Error(
        `Error creating profile: ${profileError?.message || error?.message}`
      );
    }
  }
}

for (const fn of ['Alice', 'Bob', 'Charlie']) {
  for (const ln of ['Anderson', 'Brown', 'Clark']) {
    const name = `${fn} ${ln}`;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@iiit.ac.in`;
    const rollNumber = `2025${Math.floor(Math.random() * 900000 + 100000)}`;
    const password = 'password123';

    try {
      await signUpUser(email, password, name, rollNumber);
      console.log(`Created user: ${name} (${email})`);
    } catch (error) {
      console.error(`Error creating user ${name}:`, error);
    }
  }
}
