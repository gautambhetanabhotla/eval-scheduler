SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";


COMMENT ON SCHEMA "public" IS 'standard public schema';


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";


CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";


CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";


CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


CREATE TYPE "public"."eval_status" AS ENUM (
    'not_started',
    'ongoing',
    'done'
);


ALTER TYPE "public"."eval_status" OWNER TO "postgres";


COMMENT ON TYPE "public"."eval_status" IS 'Evaluation status.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."components" (
    "name" "text" NOT NULL,
    "course" "text" DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."components" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "code" "text" NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evaluations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student" "uuid",
    "ta" "uuid",
    "component" "uuid",
    "scheduled" timestamp with time zone DEFAULT "now"(),
    "end" timestamp with time zone,
    "duration" bigint DEFAULT '30'::bigint NOT NULL,
    "start" timestamp with time zone,
    "status" "public"."eval_status" DEFAULT 'not_started'::"public"."eval_status" NOT NULL,
    "slot" "uuid",
    "active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."evaluations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."evaluations"."duration" IS 'In minutes.';


COMMENT ON COLUMN "public"."evaluations"."slot" IS 'The booking slot from which this evaluation was created. NULL if it was manually created.';


COMMENT ON COLUMN "public"."evaluations"."active" IS 'Whether or not it gets shown on the course main page.';


CREATE TABLE IF NOT EXISTS "public"."slots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "start" timestamp with time zone NOT NULL,
    "end" timestamp with time zone NOT NULL,
    "ta" "uuid" NOT NULL,
    "component" "uuid" NOT NULL,
    "booked_by" "uuid"
);


ALTER TABLE "public"."slots" OWNER TO "postgres";


COMMENT ON TABLE "public"."slots" IS 'These are evaluation slots which are bookable.';


CREATE TABLE IF NOT EXISTS "public"."studentships" (
    "student" "uuid" NOT NULL,
    "course" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."studentships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."swap_requests" (
    "src_eval" "uuid" NOT NULL,
    "target_eval" "uuid" NOT NULL,
    "accepted_at" timestamp with time zone,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rejected_at" timestamp with time zone,
    "reason" "text"
);


ALTER TABLE "public"."swap_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."taships" (
    "ta" "uuid" NOT NULL,
    "course" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."taships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "rollnumber" "text" NOT NULL,
    "name" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."components"
    ADD CONSTRAINT "components_id_key" UNIQUE ("id");


ALTER TABLE ONLY "public"."components"
    ADD CONSTRAINT "components_name_key" UNIQUE ("name");


ALTER TABLE ONLY "public"."components"
    ADD CONSTRAINT "components_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("code");


ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."slots"
    ADD CONSTRAINT "slots_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."studentships"
    ADD CONSTRAINT "studentships_pkey" PRIMARY KEY ("student", "course");


ALTER TABLE ONLY "public"."swap_requests"
    ADD CONSTRAINT "swap_requests_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."taships"
    ADD CONSTRAINT "taships_pkey" PRIMARY KEY ("ta", "course");


ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_rollnumber_key" UNIQUE ("rollnumber");


ALTER TABLE ONLY "public"."components"
    ADD CONSTRAINT "components_course_fkey" FOREIGN KEY ("course") REFERENCES "public"."courses"("code") ON UPDATE CASCADE ON DELETE CASCADE;


ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_component_fkey" FOREIGN KEY ("component") REFERENCES "public"."components"("id") ON UPDATE CASCADE ON DELETE CASCADE;


ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_slot_fkey" FOREIGN KEY ("slot") REFERENCES "public"."slots"("id") ON UPDATE CASCADE ON DELETE SET NULL;


ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_student_fkey" FOREIGN KEY ("student") REFERENCES "public"."users"("id");


ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_ta_fkey" FOREIGN KEY ("ta") REFERENCES "public"."users"("id");


ALTER TABLE ONLY "public"."slots"
    ADD CONSTRAINT "slots_booked_by_fkey" FOREIGN KEY ("booked_by") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET DEFAULT;


ALTER TABLE ONLY "public"."slots"
    ADD CONSTRAINT "slots_component_fkey" FOREIGN KEY ("component") REFERENCES "public"."components"("id") ON UPDATE CASCADE ON DELETE CASCADE;


ALTER TABLE ONLY "public"."slots"
    ADD CONSTRAINT "slots_ta_fkey" FOREIGN KEY ("ta") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;


ALTER TABLE ONLY "public"."studentships"
    ADD CONSTRAINT "studentships_course_fkey" FOREIGN KEY ("course") REFERENCES "public"."courses"("code") ON UPDATE CASCADE ON DELETE CASCADE;


ALTER TABLE ONLY "public"."studentships"
    ADD CONSTRAINT "studentships_student_fkey" FOREIGN KEY ("student") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;


ALTER TABLE ONLY "public"."swap_requests"
    ADD CONSTRAINT "swap_requests_src_eval_fkey" FOREIGN KEY ("src_eval") REFERENCES "public"."evaluations"("id") ON UPDATE CASCADE ON DELETE CASCADE;


ALTER TABLE ONLY "public"."swap_requests"
    ADD CONSTRAINT "swap_requests_target_eval_fkey" FOREIGN KEY ("target_eval") REFERENCES "public"."evaluations"("id") ON UPDATE CASCADE ON DELETE CASCADE;


ALTER TABLE ONLY "public"."taships"
    ADD CONSTRAINT "taships_course_fkey" FOREIGN KEY ("course") REFERENCES "public"."courses"("code") ON UPDATE CASCADE ON DELETE CASCADE;


ALTER TABLE ONLY "public"."taships"
    ADD CONSTRAINT "taships_ta_fkey" FOREIGN KEY ("ta") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;


ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;


CREATE POLICY "Allow public read of components" ON "public"."components" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "Allow public read of courses" ON "public"."courses" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "Allow public read of taships" ON "public"."taships" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "Allow public read of users" ON "public"."users" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "Enable delete for students" ON "public"."evaluations" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "student"));


CREATE POLICY "Enable delete for users based on user_id" ON "public"."studentships" FOR DELETE USING (((( SELECT "auth"."uid"() AS "uid") = "student") OR (EXISTS ( SELECT 1
   FROM "public"."taships"
  WHERE (("taships"."ta" = ( SELECT "auth"."uid"() AS "uid")) AND ("taships"."course" = "taships"."course"))))));


CREATE POLICY "Enable delete for users based on user_id" ON "public"."taships" FOR DELETE USING (((( SELECT "auth"."uid"() AS "uid") = "ta") OR (EXISTS ( SELECT 1
   FROM "public"."taships" "taships_1"
  WHERE (("taships_1"."ta" = ( SELECT "auth"."uid"() AS "uid")) AND ("taships_1"."course" = "taships_1"."course"))))));


CREATE POLICY "Enable insert for authenticated users only" ON "public"."components" FOR INSERT TO "authenticated" WITH CHECK (true);


CREATE POLICY "Enable insert for authenticated users only" ON "public"."courses" FOR INSERT TO "authenticated" WITH CHECK (true);


CREATE POLICY "Enable insert for authenticated users only" ON "public"."studentships" FOR INSERT TO "authenticated" WITH CHECK (true);


CREATE POLICY "Enable insert for authenticated users only" ON "public"."swap_requests" FOR INSERT TO "authenticated" WITH CHECK (true);


CREATE POLICY "Enable insert for authenticated users only" ON "public"."taships" FOR INSERT TO "authenticated" WITH CHECK (true);


CREATE POLICY "Enable insert for valid bookings only" ON "public"."evaluations" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "student") AND (EXISTS ( SELECT 1
   FROM "public"."slots"
  WHERE (("slots"."booked_by" = "auth"."uid"()) AND ("slots"."component" = "evaluations"."component") AND ("slots"."ta" = "evaluations"."ta") AND ("slots"."start" = "evaluations"."scheduled"))))));


CREATE POLICY "Enable read access for all users" ON "public"."components" FOR SELECT USING (true);


CREATE POLICY "Enable read access for all users" ON "public"."courses" FOR SELECT USING (true);


CREATE POLICY "Enable read access for all users" ON "public"."slots" FOR SELECT USING (true);


CREATE POLICY "Enable read access for all users" ON "public"."swap_requests" FOR SELECT USING (true);


CREATE POLICY "Enable read for authenticated users only" ON "public"."evaluations" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "Enable read for authenticated users only" ON "public"."studentships" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "Enable read for authenticated users only" ON "public"."taships" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "Enable read for authenticated users only" ON "public"."users" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "Enable read of own studentships" ON "public"."studentships" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "student"));


CREATE POLICY "Enable update for TAs" ON "public"."evaluations" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "ta")) WITH CHECK (("auth"."uid"() = "ta"));


CREATE POLICY "Let TAs create an eval under them" ON "public"."evaluations" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "ta"));


CREATE POLICY "Let authenticated users update" ON "public"."swap_requests" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);


CREATE POLICY "Let only TAs of a course create a slot for evaluating a compone" ON "public"."slots" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "ta") AND (EXISTS ( SELECT 1
   FROM ("public"."components" "c"
     JOIN "public"."taships" "t" ON (("c"."course" = "t"."course")))
  WHERE (("c"."id" = "slots"."component") AND ("t"."ta" = "auth"."uid"()))))));


CREATE POLICY "Public can insert users" ON "public"."users" FOR INSERT WITH CHECK (true);


CREATE POLICY "Who can book/unbook slots?" ON "public"."slots" FOR UPDATE USING ((("booked_by" IS NULL) OR ("booked_by" = "auth"."uid"()) OR ("ta" = "auth"."uid"()))) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "booked_by") OR (( SELECT "auth"."uid"() AS "uid") = "ta") OR ("booked_by" = NULL::"uuid")));


ALTER TABLE "public"."components" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."evaluations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."slots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."studentships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."swap_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."taships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."evaluations";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."slots";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."swap_requests";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


GRANT ALL ON TABLE "public"."components" TO "postgres";
GRANT ALL ON TABLE "public"."components" TO "anon";
GRANT ALL ON TABLE "public"."components" TO "authenticated";
GRANT ALL ON TABLE "public"."components" TO "service_role";


GRANT ALL ON TABLE "public"."courses" TO "postgres";
GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";


GRANT ALL ON TABLE "public"."evaluations" TO "postgres";
GRANT ALL ON TABLE "public"."evaluations" TO "anon";
GRANT ALL ON TABLE "public"."evaluations" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluations" TO "service_role";


GRANT ALL ON TABLE "public"."slots" TO "postgres";
GRANT ALL ON TABLE "public"."slots" TO "anon";
GRANT ALL ON TABLE "public"."slots" TO "authenticated";
GRANT ALL ON TABLE "public"."slots" TO "service_role";


GRANT ALL ON TABLE "public"."studentships" TO "postgres";
GRANT ALL ON TABLE "public"."studentships" TO "anon";
GRANT ALL ON TABLE "public"."studentships" TO "authenticated";
GRANT ALL ON TABLE "public"."studentships" TO "service_role";


GRANT ALL ON TABLE "public"."swap_requests" TO "postgres";
GRANT ALL ON TABLE "public"."swap_requests" TO "anon";
GRANT ALL ON TABLE "public"."swap_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."swap_requests" TO "service_role";


GRANT ALL ON TABLE "public"."taships" TO "postgres";
GRANT ALL ON TABLE "public"."taships" TO "anon";
GRANT ALL ON TABLE "public"."taships" TO "authenticated";
GRANT ALL ON TABLE "public"."taships" TO "service_role";


GRANT ALL ON TABLE "public"."users" TO "postgres";
GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";


ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


