-- ===========================================================================
-- Bellatrix core schema — Frontline Behavioral Intelligence
-- Intervention → Behaviour → Outcome data chain + Row Level Security.
--
-- Column names mirror src/types/bellatrix.ts exactly.
-- Apply with:  supabase db push   (or paste into the SQL editor)
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('employee','manager','admin');
  create type shift_status as enum ('scheduled','in_progress','completed','cancelled');
  create type behaviour_type as enum ('discovery','demo','recommendation','cross_sell','closing','product_knowledge','operational','other');
  create type intervention_type as enum ('action','micro_coaching','mini_quest');
  create type target_metric as enum ('cvr','atv','upt','attach_rate','revenue','none');
  create type attach_rate_definition as enum ('accessory_units_per_transaction','accessory_transactions_per_transaction','accessory_units_per_unit');
  create type assignment_status as enum ('assigned','accepted','in_progress','completed','skipped','expired');
  create type action_event_type as enum ('viewed','accepted','started','progress_updated','completed','skipped','expired');
  create type evidence_source as enum ('employee_self_report','manager_observation','digital_signal','system_inference');
  create type confidence_level as enum ('low','medium','high');
  create type helpfulness_level as enum ('not_really','a_little','very_helpful');
  create type outcome_source as enum ('manual','csv','api');
  create type perceived_sales_level as enum ('lower','similar','higher');
  create type pilot_status as enum ('planned','active','completed');
  create type pilot_group as enum ('intervention','control');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists companies (
  id          text primary key,
  name        text not null,
  vertical    text not null default 'retail',
  created_at  timestamptz not null default now()
);

create table if not exists stores (
  id                      text primary key,
  company_id              text not null references companies(id) on delete cascade,
  name                    text not null,
  location                text,
  vertical                text not null default 'retail',
  attach_rate_definition  attach_rate_definition not null default 'accessory_units_per_transaction',
  focus_metric            target_metric not null default 'attach_rate',
  created_at              timestamptz not null default now()
);

-- Profile row per auth user. id == auth.users.id (uuid stored as text so demo
-- ids and real ids share one column type).
create table if not exists users (
  id          text primary key,
  name        text not null,
  email       text not null unique,
  role        user_role not null default 'employee',
  store_id    text not null references stores(id),
  company_id  text references companies(id),
  created_at  timestamptz not null default now()
);

create table if not exists shifts (
  id          text primary key default gen_random_uuid()::text,
  user_id     text not null references users(id) on delete cascade,
  store_id    text not null references stores(id),
  start_at    timestamptz not null,
  end_at      timestamptz not null,
  status      shift_status not null default 'scheduled',
  created_at  timestamptz not null default now(),
  check (end_at > start_at)
);
create index if not exists shifts_store_start_idx on shifts(store_id, start_at);
create index if not exists shifts_user_start_idx on shifts(user_id, start_at);

-- Reusable intervention / behaviour definitions.
create table if not exists actions (
  id                    text primary key default gen_random_uuid()::text,
  title                 text not null,
  description           text not null default '',
  behaviour_type        behaviour_type not null,
  intervention_type     intervention_type not null default 'action',
  target_metric         target_metric not null default 'none',
  default_target_count  int,
  coaching_text         text,
  active                boolean not null default true,
  created_at            timestamptz not null default now()
);

create table if not exists action_assignments (
  id                   text primary key default gen_random_uuid()::text,
  action_id            text not null references actions(id),
  assigned_by_user_id  text not null references users(id),
  assigned_to_user_id  text not null references users(id) on delete cascade,
  store_id             text not null references stores(id),
  shift_id             text references shifts(id) on delete set null,
  assigned_date        date not null,
  target_count         int,
  target_metric        target_metric,
  status               assignment_status not null default 'assigned',
  created_at           timestamptz not null default now()
);
create index if not exists assignments_store_date_idx on action_assignments(store_id, assigned_date);
create index if not exists assignments_user_date_idx on action_assignments(assigned_to_user_id, assigned_date);

-- CRITICAL: engagement timeline. Append-only.
create table if not exists action_events (
  id                    text primary key default gen_random_uuid()::text,
  action_assignment_id  text not null references action_assignments(id) on delete cascade,
  user_id               text not null references users(id) on delete cascade,
  shift_id              text references shifts(id) on delete set null,
  event_type            action_event_type not null,
  event_at              timestamptz not null default now(),
  progress_value        int,
  metadata              jsonb
);
create index if not exists action_events_assignment_idx on action_events(action_assignment_id, event_at);
create index if not exists action_events_user_at_idx on action_events(user_id, event_at);

-- CRITICAL: evidence that a behaviour happened. Self-report ≠ verified.
create table if not exists behaviour_evidence (
  id                    text primary key default gen_random_uuid()::text,
  user_id               text not null references users(id) on delete cascade,
  store_id              text not null references stores(id),
  shift_id              text references shifts(id) on delete set null,
  action_id             text references actions(id),
  action_assignment_id  text references action_assignments(id) on delete set null,
  behaviour_type        behaviour_type not null,
  evidence_source       evidence_source not null,
  evidence_value        text not null,
  confidence_level      confidence_level not null,
  observer_user_id      text references users(id),
  helpfulness           helpfulness_level,
  coaching_needed       boolean,
  note                  text,
  observed_at           timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  check (evidence_source <> 'manager_observation' or observer_user_id is not null)
);
create index if not exists evidence_store_at_idx on behaviour_evidence(store_id, observed_at);
create index if not exists evidence_user_at_idx on behaviour_evidence(user_id, observed_at);

-- CRITICAL: business outcome per store/day (optionally per employee).
create table if not exists outcome_events (
  id                      text primary key default gen_random_uuid()::text,
  company_id              text references companies(id),
  store_id                text not null references stores(id),
  user_id                 text references users(id) on delete set null,
  shift_id                text references shifts(id) on delete set null,
  outcome_date            date not null,
  visitors                numeric,
  transactions            numeric,
  revenue                 numeric,
  units                   numeric,
  accessory_units         numeric,
  accessory_transactions  numeric,
  cvr                     numeric,
  atv                     numeric,
  upt                     numeric,
  attach_rate             numeric,
  source                  outcome_source not null default 'manual',
  created_at              timestamptz not null default now()
);
-- One row per store/day (store-level) — user-level rows are keyed separately.
create unique index if not exists outcome_store_day_uidx on outcome_events(store_id, outcome_date, coalesce(user_id, ''));

create table if not exists shift_reflections (
  id                    text primary key default gen_random_uuid()::text,
  user_id               text not null references users(id) on delete cascade,
  shift_id              text not null references shifts(id) on delete cascade,
  dominant_behaviour    behaviour_type not null,
  perceived_sales_level perceived_sales_level not null,
  coaching_helpfulness  smallint not null check (coaching_helpfulness between 1 and 5),
  note                  text,
  created_at            timestamptz not null default now(),
  unique (user_id, shift_id)
);

create table if not exists pilots (
  id                text primary key default gen_random_uuid()::text,
  company_id        text not null references companies(id),
  store_id          text references stores(id),
  name              text not null,
  start_date        date not null,
  end_date          date not null,
  target_behaviour  behaviour_type not null,
  target_metric     target_metric not null,
  status            pilot_status not null default 'planned'
);

create table if not exists pilot_participants (
  id          text primary key default gen_random_uuid()::text,
  pilot_id    text not null references pilots(id) on delete cascade,
  user_id     text not null references users(id) on delete cascade,
  group_type  pilot_group not null,
  unique (pilot_id, user_id)
);

-- Product analytics (section 30) — stored in-database, no third-party SDK.
create table if not exists product_events (
  id           text primary key default gen_random_uuid()::text,
  user_id      text not null references users(id) on delete cascade,
  event_name   text not null,
  occurred_at  timestamptz not null default now(),
  properties   jsonb
);
create index if not exists product_events_user_at_idx on product_events(user_id, occurred_at);

-- ---------------------------------------------------------------------------
-- Helper functions for RLS (security definer so they can read users)
-- ---------------------------------------------------------------------------
create or replace function bx_current_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from users where id = auth.uid()::text
$$;

create or replace function bx_current_store() returns text
language sql stable security definer set search_path = public as $$
  select store_id from users where id = auth.uid()::text
$$;

create or replace function bx_is_manager_of(p_store_id text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from users u
    where u.id = auth.uid()::text
      and (u.role = 'admin' or (u.role = 'manager' and u.store_id = p_store_id))
  )
$$;

create or replace function bx_is_self(p_user_id text) returns boolean
language sql stable as $$
  select p_user_id = auth.uid()::text
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Principles:
--  * employees: read/write only their own rows; read store-level reference data
--  * managers: read/write rows for their own store only
--  * KPI (outcome_events) is store business data → managers only
--  * nothing is deletable from the client; service role handles admin ops
-- ---------------------------------------------------------------------------
alter table companies           enable row level security;
alter table stores              enable row level security;
alter table users               enable row level security;
alter table shifts              enable row level security;
alter table actions             enable row level security;
alter table action_assignments  enable row level security;
alter table action_events       enable row level security;
alter table behaviour_evidence  enable row level security;
alter table outcome_events      enable row level security;
alter table shift_reflections   enable row level security;
alter table pilots              enable row level security;
alter table pilot_participants  enable row level security;
alter table product_events      enable row level security;

-- companies / stores: readable by members of the store
create policy companies_read on companies for select using (
  id = (select company_id from users where id = auth.uid()::text)
);
create policy stores_read on stores for select using (id = bx_current_store() or bx_is_manager_of(id));

-- users: same-store visibility (names needed for team views); self-update of name only
create policy users_read_same_store on users for select using (store_id = bx_current_store() or bx_is_manager_of(store_id));
create policy users_update_self on users for update using (bx_is_self(id)) with check (bx_is_self(id) and role = bx_current_role() and store_id = bx_current_store());

-- shifts
create policy shifts_read on shifts for select using (bx_is_self(user_id) or bx_is_manager_of(store_id));
create policy shifts_manager_write on shifts for insert with check (bx_is_manager_of(store_id));
create policy shifts_manager_update on shifts for update using (bx_is_manager_of(store_id));

-- actions: catalogue readable by everyone signed in; managers/admins may add
create policy actions_read on actions for select using (auth.uid() is not null);
create policy actions_manager_insert on actions for insert with check (bx_current_role() in ('manager','admin'));

-- action_assignments
create policy assignments_read on action_assignments for select using (bx_is_self(assigned_to_user_id) or bx_is_manager_of(store_id));
create policy assignments_manager_insert on action_assignments for insert with check (bx_is_manager_of(store_id) and assigned_by_user_id = auth.uid()::text);
create policy assignments_update on action_assignments for update using (bx_is_self(assigned_to_user_id) or bx_is_manager_of(store_id));

-- action_events: employee writes own; manager reads store
create policy action_events_read on action_events for select using (
  bx_is_self(user_id) or exists (select 1 from action_assignments a where a.id = action_assignment_id and bx_is_manager_of(a.store_id))
);
create policy action_events_insert_self on action_events for insert with check (bx_is_self(user_id));

-- behaviour_evidence: employees see their own (incl. observations about them),
-- write only self-reports; managers read/write observations for their store
create policy evidence_read on behaviour_evidence for select using (bx_is_self(user_id) or bx_is_manager_of(store_id));
create policy evidence_insert_self_report on behaviour_evidence for insert with check (
  bx_is_self(user_id) and evidence_source = 'employee_self_report' and store_id = bx_current_store()
);
create policy evidence_insert_observation on behaviour_evidence for insert with check (
  bx_is_manager_of(store_id) and evidence_source in ('manager_observation','system_inference','digital_signal') and observer_user_id = auth.uid()::text
);

-- outcome_events: managers of the store only
create policy outcomes_manager_all on outcome_events for all using (bx_is_manager_of(store_id)) with check (bx_is_manager_of(store_id));

-- shift_reflections: own rows; manager can read store rows via the shift
create policy reflections_read on shift_reflections for select using (
  bx_is_self(user_id) or exists (select 1 from shifts s where s.id = shift_id and bx_is_manager_of(s.store_id))
);
create policy reflections_insert_self on shift_reflections for insert with check (bx_is_self(user_id));

-- pilots
create policy pilots_read on pilots for select using (store_id is null or store_id = bx_current_store() or bx_is_manager_of(store_id));
create policy pilot_participants_read on pilot_participants for select using (
  bx_is_self(user_id) or exists (select 1 from pilots p where p.id = pilot_id and bx_is_manager_of(coalesce(p.store_id, bx_current_store())))
);

-- product_events: write own, managers read store
create policy product_events_insert_self on product_events for insert with check (bx_is_self(user_id));
create policy product_events_read on product_events for select using (
  bx_is_self(user_id) or exists (select 1 from users u where u.id = user_id and bx_is_manager_of(u.store_id))
);

-- ---------------------------------------------------------------------------
-- Auto-create a profile when an auth user signs up with invite metadata:
--   raw_user_meta_data: { "name": "...", "role": "employee", "store_id": "st_gangnam" }
-- ---------------------------------------------------------------------------
create or replace function bx_handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_store text; v_role user_role; v_name text;
begin
  v_store := new.raw_user_meta_data->>'store_id';
  if v_store is null then return new; end if;
  v_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'employee');
  v_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  insert into users (id, name, email, role, store_id, company_id)
  values (new.id::text, v_name, new.email, v_role, v_store, (select company_id from stores where id = v_store))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists bx_on_auth_user_created on auth.users;
create trigger bx_on_auth_user_created after insert on auth.users
  for each row execute function bx_handle_new_auth_user();
