-- Tighten write policies so the app can use the signed-in user's client
-- everywhere (no service-role / admin client), and move the swap-accept
-- transaction into the database.

-- ---------------------------------------------------------------------------
-- components: only TAs of the course can add components
-- ---------------------------------------------------------------------------
drop policy "Enable insert for authenticated users only" on public.components;

create policy "TAs can add components to their courses"
on public.components for insert
to authenticated
with check (
  exists (
    select 1 from public.taships t
    where t.course = components.course
      and t.ta = (select auth.uid())
  )
);

-- ---------------------------------------------------------------------------
-- taships: TAs manage TAs of their own course. The creator of a course claims
-- it by adding themselves while it has no TAs yet.
-- ---------------------------------------------------------------------------
drop policy "Enable insert for authenticated users only" on public.taships;
drop policy "Enable delete for users based on user_id" on public.taships;

create policy "TAs can add TAs; creators can claim an unclaimed course"
on public.taships for insert
to authenticated
with check (
  exists (
    select 1 from public.taships t
    where t.course = taships.course
      and t.ta = (select auth.uid())
  )
  or (
    ta = (select auth.uid())
    and not exists (
      select 1 from public.taships t where t.course = taships.course
    )
  )
);

create policy "TAs can remove TAs of their course"
on public.taships for delete
to authenticated
using (
  exists (
    select 1 from public.taships t
    where t.course = taships.course
      and t.ta = (select auth.uid())
  )
);

-- ---------------------------------------------------------------------------
-- studentships: students enroll/unenroll themselves; TAs manage their course
-- ---------------------------------------------------------------------------
drop policy "Enable insert for authenticated users only" on public.studentships;
drop policy "Enable delete for users based on user_id" on public.studentships;

create policy "Students enroll themselves; TAs enroll their students"
on public.studentships for insert
to authenticated
with check (
  student = (select auth.uid())
  or exists (
    select 1 from public.taships t
    where t.course = studentships.course
      and t.ta = (select auth.uid())
  )
);

create policy "Students unenroll themselves; TAs remove their students"
on public.studentships for delete
to authenticated
using (
  student = (select auth.uid())
  or exists (
    select 1 from public.taships t
    where t.course = studentships.course
      and t.ta = (select auth.uid())
  )
);

-- ---------------------------------------------------------------------------
-- slots: fix the update check (`booked_by = NULL` is never true, so students
-- could not cancel) and let TAs delete their own slots
-- ---------------------------------------------------------------------------
drop policy "Who can book/unbook slots?" on public.slots;

create policy "Students book/unbook slots; TAs manage their slots"
on public.slots for update
to authenticated
using (
  booked_by is null
  or booked_by = (select auth.uid())
  or ta = (select auth.uid())
)
with check (
  booked_by is null
  or booked_by = (select auth.uid())
  or ta = (select auth.uid())
);

create policy "TAs can delete their slots"
on public.slots for delete
to authenticated
using (ta = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- swap_requests: only the owner of the source evaluation can request; only
-- the target student can reject. Accepting goes through accept_swap_request().
-- ---------------------------------------------------------------------------
drop policy "Enable insert for authenticated users only" on public.swap_requests;
drop policy "Let authenticated users update" on public.swap_requests;

create policy "Students request swaps for their own evaluations"
on public.swap_requests for insert
to authenticated
with check (
  exists (
    select 1 from public.evaluations e
    where e.id = swap_requests.src_eval
      and e.student = (select auth.uid())
  )
);

create policy "Target students can reject pending swap requests"
on public.swap_requests for update
to authenticated
using (
  accepted_at is null
  and rejected_at is null
  and exists (
    select 1 from public.evaluations e
    where e.id = swap_requests.target_eval
      and e.student = (select auth.uid())
  )
)
with check (
  accepted_at is null
  and exists (
    select 1 from public.evaluations e
    where e.id = swap_requests.target_eval
      and e.student = (select auth.uid())
  )
);

-- ---------------------------------------------------------------------------
-- accept_swap_request: swaps the two evaluations' slots atomically.
--
-- SECURITY DEFINER because the accepting student has to modify the other
-- student's evaluation and slot, which RLS (correctly) forbids. The function
-- does its own authorization: only the target student of a pending request
-- can accept it.
-- ---------------------------------------------------------------------------
create or replace function public.accept_swap_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

revoke execute on function public.accept_swap_request(uuid) from public, anon;
grant execute on function public.accept_swap_request(uuid) to authenticated;
