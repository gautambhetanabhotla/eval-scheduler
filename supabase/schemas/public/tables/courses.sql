CREATE TABLE "public"."courses" (
  "code" text NOT NULL,
  "name" text NOT NULL,
  CONSTRAINT "courses_pkey" PRIMARY KEY (code)
);

ALTER TABLE "public"."courses"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of courses" ON "public"."courses"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."courses"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON "public"."courses"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."courses" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."courses" TO "service_role";

REVOKE ALL ON TABLE "public"."courses" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."courses" TO "postgres";
