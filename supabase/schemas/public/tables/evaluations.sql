CREATE TABLE "public"."evaluations" (
  "id"        uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "student"   uuid,
  "ta"        uuid,
  "component" uuid,
  "scheduled" timestamp with time zone DEFAULT now(),
  "end"       timestamp with time zone,
  "duration"  bigint                   NOT NULL DEFAULT '30'::bigint,
  "start"     timestamp with time zone,
  "slot"      uuid,
  "active"    boolean                  NOT NULL DEFAULT true,
  CONSTRAINT "evaluations_component_fkey" FOREIGN KEY (component) REFERENCES public.components(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "evaluations_pkey" PRIMARY KEY (id),
  CONSTRAINT "evaluations_slot_fkey" FOREIGN KEY (slot) REFERENCES public.slots(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "evaluations_student_fkey" FOREIGN KEY (student) REFERENCES public.users(id),
  CONSTRAINT "evaluations_ta_fkey" FOREIGN KEY (ta) REFERENCES public.users(id)
);

ALTER TABLE "public"."evaluations"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."evaluations"
  ADD COLUMN "status" public.eval_status NOT NULL DEFAULT 'not_started'::public.eval_status;

CREATE POLICY "Enable delete for students" ON "public"."evaluations"
  FOR DELETE
  TO "authenticated"
  USING ((auth.uid() = student));

CREATE POLICY "Enable insert for valid bookings only" ON "public"."evaluations"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((auth.uid() = student) AND (EXISTS ( SELECT 1
   FROM public.slots
  WHERE ((slots.booked_by = auth.uid()) AND (slots.component = evaluations.component) AND (slots.ta = evaluations.ta) AND (slots.start = evaluations.scheduled))))));

CREATE POLICY "Enable read for authenticated users only" ON "public"."evaluations"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "Enable update for TAs" ON "public"."evaluations"
  FOR UPDATE
  TO "authenticated"
  USING ((auth.uid() = ta))
  WITH CHECK ((auth.uid() = ta));

CREATE POLICY "Let TAs create an eval under them" ON "public"."evaluations"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((( SELECT auth.uid() AS uid) = ta));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."evaluations" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."evaluations" TO "service_role";

COMMENT ON COLUMN "public"."evaluations"."active" IS 'Whether or not it gets shown on the course main page.';

COMMENT ON COLUMN "public"."evaluations"."duration" IS 'In minutes.';

COMMENT ON COLUMN "public"."evaluations"."slot" IS 'The booking slot from which this evaluation was created. NULL if it was manually created.';

REVOKE ALL ON TABLE "public"."evaluations" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."evaluations" TO "postgres";
