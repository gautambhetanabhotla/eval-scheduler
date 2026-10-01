CREATE TABLE "public"."users" (
  "id"         uuid NOT NULL,
  "rollnumber" text NOT NULL,
  "name"       text,
  CONSTRAINT "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "users_pkey" PRIMARY KEY (id),
  CONSTRAINT "users_rollnumber_key" UNIQUE (rollnumber)
);

ALTER TABLE "public"."users"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of users" ON "public"."users"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "Enable read for authenticated users only" ON "public"."users"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "Public can insert users" ON "public"."users"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "service_role";

REVOKE ALL ON TABLE "public"."users" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "postgres";
