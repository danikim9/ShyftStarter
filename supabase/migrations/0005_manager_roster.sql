-- 0005 — Managers maintain the store roster (create/update/cancel shifts of their store).
drop policy if exists shifts_manager_update on shifts;
create policy shifts_manager_update on shifts for update using (store_id is not null and bx_is_manager_of(store_id)) with check (store_id is not null and bx_is_manager_of(store_id));
create policy shifts_manager_delete on shifts for delete using (store_id is not null and bx_is_manager_of(store_id) and source = 'roster');
