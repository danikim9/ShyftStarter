-- 0006 — Teammates may read each other's shift times (the 근무표). Shift rows
-- carry no private content; goals, preps, reflections stay owner-only.
create or replace function bx_current_team() returns text
language sql stable security definer set search_path = public as $$
  select team_id from users where id = auth.uid()::text
$$;

drop policy if exists shifts_read on shifts;
create policy shifts_read on shifts for select using (
  bx_is_self(user_id)
  or (store_id is not null and bx_is_manager_of(store_id))
  or (bx_current_team() is not null and exists (select 1 from users u where u.id = user_id and u.team_id = bx_current_team()))
);
