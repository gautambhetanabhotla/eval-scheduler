CREATE TABLE "public"."components" (
  "name"   text NOT NULL,
  "course" text NOT NULL DEFAULT now(),
  "id"     uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT "components_name_key" UNIQUE (name),
  CONSTRAINT "components_pkey" PRIMARY KEY (id),
  CONSTRAINT "components_course_fkey" FOREIGN KEY (course) REFERENCES public.courses(code) ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE "public"."components"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."components"
  ADD CONSTRAINT "components_id_key" UNIQUE (id);

CREATE POLICY "Allow public read of components" ON "public"."components"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."components"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "TAs can add components to their courses" ON "public"."components"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.taships t
  WHERE ((t.course = components.course) AND (t.ta = ( SELECT auth.uid() AS uid))))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."components" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."components" TO "service_role";

REVOKE ALL ON TABLE "public"."components" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."components" TO "postgres";
