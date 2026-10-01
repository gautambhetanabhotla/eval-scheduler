CREATE OR REPLACE FUNCTION public.accept_swap_request (
  request_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  req public.swap_requests;
  a public.evaluations;  -- requester's evaluation
  b public.evaluations;  -- target's evaluation (the caller)
  slot_a uuid;
  slot_b uuid;
begin
  select * into req from public.swap_requests where id = request_id for update;
  if not found then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;
  if req.accepted_at is not null or req.rejected_at is not null then
    raise exception 'Request has already been resolved';
  end if;

  select * into a from public.evaluations where id = req.src_eval for update;
  select * into b from public.evaluations where id = req.target_eval for update;
  if a.id is null or b.id is null then
    raise exception 'Could not find evaluations for this request';
  end if;

  if b.student is distinct from (select auth.uid()) then
    raise exception 'Only the target student can accept this request'
      using errcode = '42501';
  end if;

  -- Older evaluations may not link their slot; fall back to TA + start time.
  slot_a := coalesce(a.slot, (
    select s.id from public.slots s where s.ta = a.ta and s.start = a.scheduled limit 1
  ));
  slot_b := coalesce(b.slot, (
    select s.id from public.slots s where s.ta = b.ta and s.start = b.scheduled limit 1
  ));

  update public.evaluations
  set slot = slot_b, scheduled = b.scheduled, ta = b.ta
  where id = a.id;

  update public.evaluations
  set slot = slot_a, scheduled = a.scheduled, ta = a.ta
  where id = b.id;

  if slot_a is not null and slot_b is not null then
    update public.slots set booked_by = b.student where id = slot_a;
    update public.slots set booked_by = a.student where id = slot_b;
  end if;

  update public.swap_requests set accepted_at = now() where id = request_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."accept_swap_request"(uuid) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."accept_swap_request"(uuid) TO "service_role";

REVOKE ALL ON FUNCTION "public"."accept_swap_request"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."accept_swap_request"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."accept_swap_request"(uuid) FROM PUBLIC, "anon";
