-- FIX: Ensure all referenced tables are readable by the student
-- If these tables have RLS enabled but no policies, the joins in the evaluations policy will fail.

-- 1. USERS: Everyone needs to be able to read names/rolls of others (for the UI)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read of users" ON users FOR SELECT TO authenticated USING (true);

-- 2. COURSES: Publicly readable by verified users
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read of courses" ON courses FOR SELECT TO authenticated USING (true);

-- 3. COMPONENTS: Publicly readable
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read of components" ON components FOR SELECT TO authenticated USING (true);

-- 4. STUDENTSHIPS: Students should see themselves.
-- IMPORANT: For the 'evaluations' RLS to work, the user needs to be able to find THEMSELVES in studentships.
ALTER TABLE studentships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read of own studentships" ON studentships FOR SELECT TO authenticated USING (auth.uid() = student);

-- 5. TASHIPS: Publicly readable (to know who TAs are)
ALTER TABLE taships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read of taships" ON taships FOR SELECT TO authenticated USING (true);
