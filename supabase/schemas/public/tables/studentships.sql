CREATE TABLE "public"."studentships" (
  "student" uuid NOT NULL,
  "course"  text NOT NULL DEFAULT ''::text,
  CONSTRAINT "studentships_course_fkey" FOREIGN KEY (course) REFERENCES public.courses(code) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "studentships_pkey" PRIMARY KEY (student, course),
  CONSTRAINT "studentships_student_fkey" FOREIGN KEY (student) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE "public"."studentships"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users only" ON "public"."studentships"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "Enable read of own studentships" ON "public"."studentships"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = student));

CREATE POLICY "Students enroll themselves; TAs enroll their students" ON "public"."studentships"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((student = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.taships t
  WHERE ((t.course = studentships.course) AND (t.ta = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY "Students unenroll themselves; TAs remove their students" ON "public"."studentships"
  FOR DELETE
  TO "authenticated"
  USING (((student = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.taships t
  WHERE ((t.course = studentships.course) AND (t.ta = ( SELECT auth.uid() AS uid)))))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."studentships" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."studentships" TO "service_role";

REVOKE ALL ON TABLE "public"."studentships" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."studentships" TO "postgres";
