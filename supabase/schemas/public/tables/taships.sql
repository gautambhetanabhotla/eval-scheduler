CREATE TABLE "public"."taships" (
  "ta"     uuid NOT NULL,
  "course" text NOT NULL DEFAULT ''::text,
  CONSTRAINT "taships_course_fkey" FOREIGN KEY (course) REFERENCES public.courses(code) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "taships_pkey" PRIMARY KEY (ta, course),
  CONSTRAINT "taships_ta_fkey" FOREIGN KEY (ta) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE "public"."taships"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of taships" ON "public"."taships"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "Enable read for authenticated users only" ON "public"."taships"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "TAs can add TAs; creators can claim an unclaimed course" ON "public"."taships"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((EXISTS ( SELECT 1
   FROM public.taships t
  WHERE ((t.course = taships.course) AND (t.ta = ( SELECT auth.uid() AS uid))))) OR ((ta = ( SELECT auth.uid() AS uid)) AND (NOT (EXISTS ( SELECT 1
   FROM public.taships t
  WHERE (t.course = taships.course)))))));

CREATE POLICY "TAs can remove TAs of their course" ON "public"."taships"
  FOR DELETE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.taships t
  WHERE ((t.course = taships.course) AND (t.ta = ( SELECT auth.uid() AS uid))))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."taships" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."taships" TO "service_role";

REVOKE ALL ON TABLE "public"."taships" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."taships" TO "postgres";
