CREATE TABLE "public"."slots" (
  "id"        uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "start"     timestamp with time zone NOT NULL,
  "end"       timestamp with time zone NOT NULL,
  "ta"        uuid                     NOT NULL,
  "component" uuid                     NOT NULL,
  "booked_by" uuid,
  CONSTRAINT "slots_component_fkey" FOREIGN KEY (component) REFERENCES public.components(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "slots_pkey" PRIMARY KEY (id),
  CONSTRAINT "slots_booked_by_fkey" FOREIGN KEY (booked_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET DEFAULT,
  CONSTRAINT "slots_ta_fkey" FOREIGN KEY (ta) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE "public"."slots"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON "public"."slots"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Let only TAs of a course create a slot for evaluating a compone" ON "public"."slots"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((auth.uid() = ta) AND (EXISTS ( SELECT 1
   FROM (public.components c
     JOIN public.taships t ON ((c.course = t.course)))
  WHERE ((c.id = slots.component) AND (t.ta = auth.uid()))))));

CREATE POLICY "Students book/unbook slots; TAs manage their slots" ON "public"."slots"
  FOR UPDATE
  TO "authenticated"
  USING (((booked_by IS NULL) OR (booked_by = ( SELECT auth.uid() AS uid)) OR (ta = ( SELECT auth.uid() AS uid))))
  WITH CHECK (((booked_by IS NULL) OR (booked_by = ( SELECT auth.uid() AS uid)) OR (ta = ( SELECT auth.uid() AS uid))));

CREATE POLICY "TAs can delete their slots" ON "public"."slots"
  FOR DELETE
  TO "authenticated"
  USING ((ta = ( SELECT auth.uid() AS uid)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."slots" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."slots" TO "service_role";

COMMENT ON TABLE "public"."slots" IS 'These are evaluation slots which are bookable.';

REVOKE ALL ON TABLE "public"."slots" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."slots" TO "postgres";
