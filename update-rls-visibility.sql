-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Enable read access for stakeholders" ON evaluations;

-- Create a new broader SELECT policy
-- Allows access if:
-- 1. User is the student (owner)
-- 2. User is the TA (marker)
-- 3. User is a student enrolled in the same course (peer - for swaps)
-- 4. User is a TA for the same course (co-ta - for visibility)

CREATE POLICY "Enable read access for course participants"
ON evaluations
FOR SELECT
TO authenticated
USING (
  -- 1. Direct involvement
  auth.uid() = student 
  OR auth.uid() = ta
  
  -- 2. Enrolled Student in the same course
  OR EXISTS (
    SELECT 1 
    FROM components c
    JOIN studentships s ON s.course = c.course
    WHERE c.id = evaluations.component
    AND s.student = auth.uid()
  )
  
  -- 3. TA for the same course
  OR EXISTS (
    SELECT 1 
    FROM components c
    JOIN taships t ON t.course = c.course
    WHERE c.id = evaluations.component
    AND t.ta = auth.uid()
  )
);
