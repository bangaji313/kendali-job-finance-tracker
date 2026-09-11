-- Curated fresh-graduate opportunities, manual timelines, and idempotent application conversion.
create type public.job_opportunity_status as enum (
  'saved',
  'reviewing',
  'ready',
  'applied',
  'dismissed',
  'expired'
);

create type public.job_program_type as enum (
  'graduate_program',
  'entry_level',
  'internship',
  'apprenticeship',
  'other'
);

create table public.job_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null check (char_length(company_name) between 1 and 160),
  title text not null check (char_length(title) between 1 and 160),
  official_apply_url text not null check (
    char_length(official_apply_url) <= 2048
    and official_apply_url ~* '^https?://[^[:space:]]+$'
  ),
  source_url text check (
    source_url is null
    or (char_length(source_url) <= 2048 and source_url ~* '^https?://[^[:space:]]+$')
  ),
  source_name text check (source_name is null or char_length(source_name) <= 120),
  program_type public.job_program_type not null default 'entry_level',
  employment_type public.employment_type,
  location text check (location is null or char_length(location) <= 160),
  work_mode public.work_mode,
  published_at date,
  deadline_at date,
  deadline_kind text not null default 'unknown' check (
    deadline_kind in ('exact', 'estimated', 'rolling', 'unknown')
  ),
  status public.job_opportunity_status not null default 'saved',
  is_fresh_graduate boolean not null default true,
  experience_max_years smallint check (
    experience_max_years is null or experience_max_years between 0 and 10
  ),
  education text check (education is null or char_length(education) <= 240),
  requirements text,
  notes text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (id, user_id)
);

create unique index job_opportunities_active_source_idx
  on public.job_opportunities (user_id, lower(title), official_apply_url)
  where archived_at is null;

create index job_opportunities_user_status_deadline_idx
  on public.job_opportunities (user_id, status, deadline_at)
  where archived_at is null;

create index job_opportunities_user_program_created_idx
  on public.job_opportunities (user_id, program_type, created_at desc)
  where archived_at is null;

create table public.job_opportunity_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id uuid not null,
  title text not null check (char_length(title) between 1 and 160),
  due_at timestamptz,
  completed_at timestamptz,
  notes text,
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_opportunity_milestones_owner_fk
    foreign key (opportunity_id, user_id)
    references public.job_opportunities(id, user_id)
    on delete cascade
);

create index job_opportunity_milestones_opportunity_idx
  on public.job_opportunity_milestones (opportunity_id, sort_order, due_at);

create index job_opportunity_milestones_user_due_idx
  on public.job_opportunity_milestones (user_id, due_at)
  where completed_at is null;

alter table public.applications
  add column source_opportunity_id uuid;

alter table public.applications
  add constraint applications_source_opportunity_owner_fk
  foreign key (source_opportunity_id, user_id)
  references public.job_opportunities(id, user_id);

create unique index applications_source_opportunity_idx
  on public.applications (user_id, source_opportunity_id)
  where source_opportunity_id is not null;

create trigger set_updated_at
  before update on public.job_opportunities
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.job_opportunity_milestones
  for each row execute function public.set_updated_at();

alter table public.job_opportunities enable row level security;
alter table public.job_opportunity_milestones enable row level security;

create policy job_opportunities_select_owner
  on public.job_opportunities for select to authenticated
  using ((select auth.uid()) = user_id);

create policy job_opportunities_insert_owner
  on public.job_opportunities for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy job_opportunities_update_owner
  on public.job_opportunities for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy job_opportunities_delete_owner
  on public.job_opportunities for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy job_opportunity_milestones_select_owner
  on public.job_opportunity_milestones for select to authenticated
  using ((select auth.uid()) = user_id);

create policy job_opportunity_milestones_insert_owner
  on public.job_opportunity_milestones for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy job_opportunity_milestones_update_owner
  on public.job_opportunity_milestones for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy job_opportunity_milestones_delete_owner
  on public.job_opportunity_milestones for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete
  on public.job_opportunities, public.job_opportunity_milestones
  to authenticated;
