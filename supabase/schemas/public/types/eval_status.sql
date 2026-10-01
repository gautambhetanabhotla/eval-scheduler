CREATE TYPE "public"."eval_status" AS ENUM (
  'not_started',
  'ongoing',
  'done'
);

COMMENT ON TYPE "public"."eval_status" IS 'Evaluation status.';
