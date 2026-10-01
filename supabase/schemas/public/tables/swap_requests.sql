CREATE TABLE "public"."swap_requests" (
  "src_eval"    uuid                     NOT NULL,
  "target_eval" uuid                     NOT NULL,
  "accepted_at" timestamp with time zone,
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "rejected_at" timestamp with time zone,
  "reason"      text,
  CONSTRAINT "swap_requests_pkey" PRIMARY KEY (id),
  CONSTRAINT "swap_requests_src_eval_fkey" FOREIGN KEY (src_eval) REFERENCES public.evaluations(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "swap_requests_target_eval_fkey" FOREIGN KEY (target_eval) REFERENCES public.evaluations(id) ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE "public"."swap_requests"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON "public"."swap_requests"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Students request swaps for their own evaluations" ON "public"."swap_requests"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.evaluations e
  WHERE ((e.id = swap_requests.src_eval) AND (e.student = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Target students can reject pending swap requests" ON "public"."swap_requests"
  FOR UPDATE
  TO "authenticated"
  USING (((accepted_at IS NULL) AND (rejected_at IS NULL) AND (EXISTS ( SELECT 1
   FROM public.evaluations e
  WHERE ((e.id = swap_requests.target_eval) AND (e.student = ( SELECT auth.uid() AS uid)))))))
  WITH CHECK (((accepted_at IS NULL) AND (EXISTS ( SELECT 1
   FROM public.evaluations e
  WHERE ((e.id = swap_requests.target_eval) AND (e.student = ( SELECT auth.uid() AS uid)))))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."swap_requests" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."swap_requests" TO "service_role";

REVOKE ALL ON TABLE "public"."swap_requests" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."swap_requests" TO "postgres";
