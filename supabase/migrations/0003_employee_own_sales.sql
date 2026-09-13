-- 0003 — Employees may read outcome rows that are explicitly theirs
-- (employee_id from a POS feed or CSV). Store-level rows stay manager-only.
create policy outcomes_employee_own_read on outcome_events for select using (
  user_id is not null and bx_is_self(user_id)
);
