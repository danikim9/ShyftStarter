-- ===========================================================================
-- 0002 — Personal mode, teams, personal goals, coaching cards, shift prep,
-- campaigns, visibility scopes and the redesigned 5-second reflection.
-- Column names mirror src/types/bellatrix.ts.
-- ===========================================================================

do $$ begin
  create type visibility_scope as enum ('private','team','manager_visible','aggregated');
  create type job_category as enum ('electronics','beauty','fashion','telecom','other');
  create type shift_source as enum ('self','roster');
  create type goal_source as enum ('self','recommended');
  create type action_source as enum ('personal','team','manager','ai','system');
  create type action_kind as enum ('personal_goal','team_action','coaching_card');
  create type tried_level as enum ('yes','partly','no');
  create type customer_reaction as enum ('positive','neutral','negative','no_chance');
  create type confidence_feel as enum ('low','ok','high');
  create type team_role as enum ('member','manager');
exception when duplicate_object then null; end $$;

alter type action_event_type add value if not exists 'attempted';
alter type action_event_type add value if not exists 'helpful';
alter type action_event_type add value if not exists 'not_helpful';

-- ---------------------------------------------------------------------------
-- users: personal mode (no store), profile, consent
-- ---------------------------------------------------------------------------
alter table users alter column store_id drop not null;
alter table users add column if not exists team_id text;
alter table users add column if not exists job_category job_category not null default 'other';
alter table users add column if not exists interests behaviour_type[] not null default '{}';
alter table users add column if not exists consent jsonb not null default '{"share_reflections_with_manager": false, "share_goal_progress_with_team": false}'::jsonb;
alter table users add column if not exists is_demo boolean not null default false;

create table if not exists teams (
  id          text primary key default gen_random_uuid()::text,
  store_id    text references stores(id),
  name        text not null,
  join_code   text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists team_memberships (
  id         text primary key default gen_random_uuid()::text,
  team_id    text not null references teams(id) on delete cascade,
  user_id    text not null references users(id) on delete cascade,
  role       team_role not null default 'member',
  joined_at  timestamptz not null default now(),
  unique (team_id, user_id)
);

alter table users add constraint users_team_fk foreign key (team_id) references teams(id) on delete set null;

-- shifts: self-registered, store optional
alter table shifts alter column store_id drop not null;
alter table shifts add column if not exists source shift_source not null default 'roster';

-- ---------------------------------------------------------------------------
-- New entities
-- ---------------------------------------------------------------------------
create table if not exists coaching_cards (
  id                  text primary key default gen_random_uuid()::text,
  job_category        job_category not null,
  behaviour_type      behaviour_type not null,
  target_metric       target_metric not null default 'none',
  headline            text not null,
  script              text not null,
  product_point       text not null default '',
  objection           text not null default '',
  objection_response  text not null default '',
  cross_sell_tip      text not null default '',
  active              boolean not null default true,
  created_at          timestamptz not null default now()
);

create table if not exists personal_goals (
  id                text primary key default gen_random_uuid()::text,
  user_id           text not null references users(id) on delete cascade,
  title             text not null,
  behaviour_type    behaviour_type not null,
  target_count      int,
  source            goal_source not null default 'self',
  coaching_card_id  text references coaching_cards(id),
  active            boolean not null default true,
  visibility        visibility_scope not null default 'private' check (visibility = 'private'),
  created_at        timestamptz not null default now()
);
create index if not exists personal_goals_user_idx on personal_goals(user_id);

create table if not exists shift_preps (
  id                    text primary key default gen_random_uuid()::text,
  user_id               text not null references users(id) on delete cascade,
  shift_id              text not null references shifts(id) on delete cascade,
  shift_date            date not null,
  coaching_card_id      text not null references coaching_cards(id),
  personal_goal_id      text references personal_goals(id) on delete set null,
  action_assignment_id  text references action_assignments(id) on delete set null,
  accepted_at           timestamptz not null default now(),
  visibility            visibility_scope not null default 'private'
);
create index if not exists shift_preps_user_date_idx on shift_preps(user_id, shift_date);

create table if not exists campaigns (
  id              text primary key default gen_random_uuid()::text,
  store_id        text not null references stores(id),
  name            text not null,
  behaviour_type  behaviour_type not null,
  target_metric   target_metric not null,
  start_date      date not null,
  end_date        date not null,
  active          boolean not null default true
);

alter table action_assignments add column if not exists campaign_id text references campaigns(id);

-- ---------------------------------------------------------------------------
-- action_events: full analysis context
-- ---------------------------------------------------------------------------
alter table action_events alter column action_assignment_id drop not null;
alter table action_events add column if not exists action_kind action_kind not null default 'team_action';
alter table action_events add column if not exists personal_goal_id text references personal_goals(id) on delete cascade;
alter table action_events add column if not exists coaching_card_id text references coaching_cards(id);
alter table action_events add column if not exists action_id text references actions(id);
alter table action_events add column if not exists source action_source not null default 'manager';
alter table action_events add column if not exists store_id text references stores(id);
alter table action_events add column if not exists team_id text references teams(id);
alter table action_events add column if not exists campaign_id text references campaigns(id);
alter table action_events add column if not exists self_report boolean not null default true;
alter table action_events add column if not exists visibility visibility_scope not null default 'manager_visible';
alter table action_events add constraint action_events_one_target check (
  (action_assignment_id is not null)::int + (personal_goal_id is not null)::int + (coaching_card_id is not null)::int = 1
);

alter table behaviour_evidence add column if not exists visibility visibility_scope not null default 'manager_visible';

-- ---------------------------------------------------------------------------
-- shift_reflections: 5-second design (replaces the 3-question version)
-- ---------------------------------------------------------------------------
drop table if exists shift_reflections;
create table shift_reflections (
  id                    text primary key default gen_random_uuid()::text,
  user_id               text not null references users(id) on delete cascade,
  shift_id              text not null references shifts(id) on delete cascade,
  shift_date            date not null,
  coaching_card_id      text references coaching_cards(id),
  personal_goal_id      text references personal_goals(id) on delete set null,
  action_assignment_id  text references action_assignments(id) on delete set null,
  tried                 tried_level not null,
  customer_reaction     customer_reaction not null,
  try_again             boolean not null,
  tip_helpful           boolean,
  confidence            confidence_feel,
  win_note              text,
  visibility            visibility_scope not null default 'private',
  created_at            timestamptz not null default now(),
  unique (user_id, shift_id)
);

-- ---------------------------------------------------------------------------
-- RLS — personal rows never reach a manager
-- ---------------------------------------------------------------------------
alter table teams             enable row level security;
alter table team_memberships  enable row level security;
alter table coaching_cards    enable row level security;
alter table personal_goals    enable row level security;
alter table shift_preps       enable row level security;
alter table campaigns         enable row level security;
alter table shift_reflections enable row level security;

create or replace function bx_current_team() returns text
language sql stable security definer set search_path = public as $$
  select team_id from users where id = auth.uid()::text
$$;

-- teams: look up by join code is done through the rpc below; members read their own team
create policy teams_read_member on teams for select using (id = bx_current_team() or bx_is_manager_of(coalesce(store_id, '')));
create policy team_memberships_read on team_memberships for select using (
  bx_is_self(user_id) or team_id = bx_current_team()
);
create policy team_memberships_insert_self on team_memberships for insert with check (bx_is_self(user_id));

-- join by code: security definer so the code lookup does not expose the teams table
create or replace function bx_join_team(p_code text) returns teams
language plpgsql security definer set search_path = public as $$
declare t teams;
begin
  select * into t from teams where upper(join_code) = upper(trim(p_code));
  if t.id is null then raise exception 'invalid_code'; end if;
  insert into team_memberships (team_id, user_id, role) values (t.id, auth.uid()::text, 'member') on conflict do nothing;
  update users set team_id = t.id, store_id = coalesce(t.store_id, store_id) where id = auth.uid()::text;
  return t;
end $$;

create or replace function bx_leave_team() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from team_memberships where user_id = auth.uid()::text;
  update users set team_id = null, store_id = null where id = auth.uid()::text and role = 'employee';
end $$;

create policy coaching_cards_read on coaching_cards for select using (auth.uid() is not null);
create policy campaigns_read on campaigns for select using (store_id = bx_current_store() or bx_is_manager_of(store_id));
create policy campaigns_manager_write on campaigns for insert with check (bx_is_manager_of(store_id));

-- personal goals: strictly the owner
create policy personal_goals_owner on personal_goals for all using (bx_is_self(user_id)) with check (bx_is_self(user_id));

-- shift preps: owner; managers only when not private
create policy shift_preps_owner on shift_preps for all using (bx_is_self(user_id)) with check (bx_is_self(user_id));
create policy shift_preps_manager_read on shift_preps for select using (
  visibility <> 'private' and exists (select 1 from users u where u.id = user_id and bx_is_manager_of(coalesce(u.store_id, '')))
);

-- reflections: owner; managers only when the employee opted in (visibility != private)
create policy reflections_owner on shift_reflections for all using (bx_is_self(user_id)) with check (bx_is_self(user_id));
create policy reflections_manager_read on shift_reflections for select using (
  visibility <> 'private' and exists (select 1 from users u where u.id = user_id and bx_is_manager_of(coalesce(u.store_id, '')))
);

-- shifts: employees may register their own
drop policy if exists shifts_read on shifts;
create policy shifts_read on shifts for select using (bx_is_self(user_id) or (store_id is not null and bx_is_manager_of(store_id)));
create policy shifts_self_insert on shifts for insert with check (bx_is_self(user_id) and source = 'self');
create policy shifts_self_delete on shifts for delete using (bx_is_self(user_id) and source = 'self');

-- action events: managers never see private (personal-goal) events
drop policy if exists action_events_read on action_events;
create policy action_events_read on action_events for select using (
  bx_is_self(user_id)
  or (visibility <> 'private' and store_id is not null and bx_is_manager_of(store_id))
);

-- behaviour evidence: private self-report notes stay private
drop policy if exists evidence_read on behaviour_evidence;
create policy evidence_read on behaviour_evidence for select using (
  bx_is_self(user_id) or (visibility <> 'private' and bx_is_manager_of(store_id))
);

-- users: self-update of profile/consent
drop policy if exists users_update_self on users;
create policy users_update_self on users for update using (bx_is_self(id)) with check (bx_is_self(id) and role = bx_current_role());

-- profile trigger: personal sign-up without a store
create or replace function bx_handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_store text; v_role user_role; v_name text; v_job job_category;
begin
  v_store := new.raw_user_meta_data->>'store_id';
  v_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'employee');
  v_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  v_job := coalesce((new.raw_user_meta_data->>'job_category')::job_category, 'other');
  insert into users (id, name, email, role, store_id, company_id, job_category)
  values (new.id::text, v_name, new.email, v_role, v_store, (select company_id from stores where id = v_store), v_job)
  on conflict (id) do nothing;
  return new;
end $$;
