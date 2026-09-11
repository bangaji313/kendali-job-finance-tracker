begin;

create extension if not exists pgcrypto with schema extensions;

create type public.application_stage as enum ('saved','applied','screening','assessment','interview','offer','accepted','rejected','withdrawn','archived');
create type public.employment_type as enum ('internship','contract','permanent','part_time','freelance','temporary','other');
create type public.work_mode as enum ('onsite','hybrid','remote');
create type public.transaction_kind as enum ('income','expense','transfer');
create type public.transaction_state as enum ('draft','posted','void');
create type public.account_kind as enum ('cash','bank','ewallet','other');
create type public.recurrence_frequency as enum ('weekly','monthly','yearly');
create type public.reminder_state as enum ('pending','done','snoozed','cancelled');
create type public.delivery_state as enum ('processing','sent','failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  locale text not null default 'id-ID' check (locale = 'id-ID'),
  timezone text not null default 'Asia/Jakarta',
  currency text not null default 'IDR' check (currency = 'IDR'),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.access_allowlist (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email)),
  role text not null default 'member' check (role in ('member','admin')),
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email)
);

create table public.companies (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160), website text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);
create unique index companies_user_name_unique on public.companies (user_id, lower(name));

create table public.applications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict,
  position text not null check (char_length(position) between 1 and 160),
  stage public.application_stage not null default 'saved', employment_type public.employment_type not null default 'permanent',
  applied_at date, location text, work_mode public.work_mode, source text,
  compensation_amount numeric(18,2) check (compensation_amount is null or compensation_amount >= 0),
  currency text not null default 'IDR' check (currency = 'IDR'),
  pay_period text check (pay_period is null or pay_period in ('hourly','daily','monthly','yearly')),
  contract_months integer check (contract_months is null or contract_months between 1 and 600),
  contract_start date, contract_end date, notes text, next_action text, next_action_at timestamptz,
  import_fingerprint text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  check (contract_end is null or contract_start is null or contract_end >= contract_start)
);
create index applications_user_stage_updated_idx on public.applications(user_id, stage, updated_at desc);
create index applications_user_next_action_idx on public.applications(user_id, next_action_at) where next_action_at is not null and archived_at is null;
create unique index applications_import_fingerprint_unique on public.applications(user_id, import_fingerprint) where import_fingerprint is not null;

create table public.application_activities (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  kind text not null check (kind in ('created','stage_changed','note','reminder','document')),
  from_stage public.application_stage, to_stage public.application_stage, body text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index application_activities_user_application_idx on public.application_activities(user_id, application_id, created_at desc);

create table public.contacts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  name text not null, role text, email text, phone text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  storage_path text not null, original_name text not null, mime_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id, storage_path),
  check (mime_type in ('application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp'))
);

create table public.labels (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40), color_token text not null default 'neutral',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, name)
);
create table public.application_labels (
  user_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key(application_id, label_id)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, kind public.account_kind not null, opening_balance numeric(18,2) not null default 0,
  currency text not null default 'IDR' check (currency = 'IDR'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  unique(user_id, name)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, kind text not null check (kind in ('income','expense')),
  is_seed boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  unique(user_id, name, kind)
);

create table public.recurring_rules (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  kind public.transaction_kind not null check (kind in ('income','expense')), frequency public.recurrence_frequency not null,
  amount numeric(18,2) not null check (amount > 0), description text not null,
  source_account_id uuid references public.accounts(id) on delete restrict,
  destination_account_id uuid references public.accounts(id) on delete restrict,
  category_id uuid references public.categories(id) on delete set null,
  source_application_id uuid references public.applications(id) on delete set null,
  starts_on date not null, ends_on date, next_occurrence_on date not null, is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on),
  check ((kind = 'income' and source_account_id is null and destination_account_id is not null) or (kind = 'expense' and source_account_id is not null and destination_account_id is null)),
  unique(source_application_id)
);

create table public.money_transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  kind public.transaction_kind not null, state public.transaction_state not null default 'posted',
  amount numeric(18,2) not null check (amount > 0), currency text not null default 'IDR' check (currency = 'IDR'),
  occurred_at date not null, description text not null,
  source_account_id uuid references public.accounts(id) on delete restrict,
  destination_account_id uuid references public.accounts(id) on delete restrict,
  category_id uuid references public.categories(id) on delete set null,
  recurring_rule_id uuid references public.recurring_rules(id) on delete set null,
  occurrence_key text, import_fingerprint text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  check (
    (kind = 'income' and source_account_id is null and destination_account_id is not null) or
    (kind = 'expense' and source_account_id is not null and destination_account_id is null) or
    (kind = 'transfer' and source_account_id is not null and destination_account_id is not null and source_account_id <> destination_account_id)
  )
);
create index money_transactions_user_date_idx on public.money_transactions(user_id, occurred_at desc);
create index money_transactions_user_category_idx on public.money_transactions(user_id, category_id, occurred_at desc) where state = 'posted';
create unique index money_transactions_occurrence_unique on public.money_transactions(user_id, occurrence_key) where occurrence_key is not null;
create unique index money_transactions_import_unique on public.money_transactions(user_id, import_fingerprint) where import_fingerprint is not null;

create table public.budgets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  month date not null check (date_trunc('month', month)::date = month), limit_amount numeric(18,2) not null check (limit_amount > 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, category_id, month)
);

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, target_amount numeric(18,2) not null check (target_amount > 0), target_date date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);
create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  goal_id uuid not null references public.savings_goals(id) on delete cascade,
  transaction_id uuid references public.money_transactions(id) on delete set null,
  amount numeric(18,2) not null check (amount > 0), contributed_at date not null, note text,
  is_manual boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((is_manual and transaction_id is null) or (not is_manual and transaction_id is not null))
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  title text not null, due_at timestamptz not null, state public.reminder_state not null default 'pending', snoozed_until timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), completed_at timestamptz
);
create index reminders_due_idx on public.reminders(user_id, due_at) where state in ('pending','snoozed');

create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  reminder_id uuid references public.reminders(id) on delete cascade, title text not null, body text,
  read_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null, p256dh text not null, auth text not null, user_agent text, is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, endpoint)
);
create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  reminder_id uuid not null references public.reminders(id) on delete cascade,
  push_subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  idempotency_key text not null unique, state public.delivery_state not null, sent_at timestamptz, failed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.import_batches (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('applications','transactions')), state text not null check (state in ('validated','committed','failed')),
  row_count integer not null default 0, error_count integer not null default 0, checksum text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), committed_at timestamptz
);

alter table public.companies add unique (id,user_id);
alter table public.applications add unique (id,user_id), add constraint applications_company_owner_fk foreign key(company_id,user_id) references public.companies(id,user_id);
alter table public.accounts add unique (id,user_id);
alter table public.categories add unique (id,user_id);
alter table public.labels add unique (id,user_id);
alter table public.recurring_rules add unique (id,user_id),
  add constraint rules_source_owner_fk foreign key(source_account_id,user_id) references public.accounts(id,user_id),
  add constraint rules_destination_owner_fk foreign key(destination_account_id,user_id) references public.accounts(id,user_id),
  add constraint rules_category_owner_fk foreign key(category_id,user_id) references public.categories(id,user_id),
  add constraint rules_application_owner_fk foreign key(source_application_id,user_id) references public.applications(id,user_id);
alter table public.money_transactions add unique (id,user_id),
  add constraint transactions_source_owner_fk foreign key(source_account_id,user_id) references public.accounts(id,user_id),
  add constraint transactions_destination_owner_fk foreign key(destination_account_id,user_id) references public.accounts(id,user_id),
  add constraint transactions_category_owner_fk foreign key(category_id,user_id) references public.categories(id,user_id),
  add constraint transactions_rule_owner_fk foreign key(recurring_rule_id,user_id) references public.recurring_rules(id,user_id);
alter table public.savings_goals add unique (id,user_id);
alter table public.reminders add unique (id,user_id);
alter table public.push_subscriptions add unique (id,user_id);
alter table public.application_activities add constraint activities_application_owner_fk foreign key(application_id,user_id) references public.applications(id,user_id);
alter table public.contacts add constraint contacts_application_owner_fk foreign key(application_id,user_id) references public.applications(id,user_id);
alter table public.documents add constraint documents_application_owner_fk foreign key(application_id,user_id) references public.applications(id,user_id);
alter table public.application_labels add constraint application_labels_application_owner_fk foreign key(application_id,user_id) references public.applications(id,user_id), add constraint application_labels_label_owner_fk foreign key(label_id,user_id) references public.labels(id,user_id);
alter table public.budgets add constraint budgets_category_owner_fk foreign key(category_id,user_id) references public.categories(id,user_id);
alter table public.goal_contributions add constraint contributions_goal_owner_fk foreign key(goal_id,user_id) references public.savings_goals(id,user_id), add constraint contributions_transaction_owner_fk foreign key(transaction_id,user_id) references public.money_transactions(id,user_id);
alter table public.reminders add constraint reminders_application_owner_fk foreign key(application_id,user_id) references public.applications(id,user_id);
alter table public.notifications add constraint notifications_reminder_owner_fk foreign key(reminder_id,user_id) references public.reminders(id,user_id);
alter table public.notification_deliveries add constraint deliveries_reminder_owner_fk foreign key(reminder_id,user_id) references public.reminders(id,user_id), add constraint deliveries_subscription_owner_fk foreign key(push_subscription_id,user_id) references public.push_subscriptions(id,user_id);

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
do $$ declare table_name text; begin foreach table_name in array array['profiles','access_allowlist','companies','applications','application_activities','contacts','documents','labels','application_labels','accounts','categories','recurring_rules','money_transactions','budgets','savings_goals','goal_contributions','reminders','notifications','push_subscriptions','notification_deliveries','import_batches'] loop execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name); end loop; end $$;

create function public.record_application_stage() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.application_activities(user_id, application_id, kind, to_stage) values(new.user_id, new.id, 'created', new.stage);
  elsif old.stage is distinct from new.stage then
    insert into public.application_activities(user_id, application_id, kind, from_stage, to_stage) values(new.user_id, new.id, 'stage_changed', old.stage, new.stage);
  end if;
  return new;
end; $$;
create trigger applications_record_stage after insert or update of stage on public.applications for each row execute function public.record_application_stage();

create function public.seed_categories() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.categories(user_id,name,kind,is_seed) values
    (new.id,'Gaji','income',true),(new.id,'Bonus','income',true),(new.id,'Freelance','income',true),
    (new.id,'Makanan','expense',true),(new.id,'Transportasi','expense',true),(new.id,'Tempat tinggal','expense',true),
    (new.id,'Tagihan','expense',true),(new.id,'Kesehatan','expense',true),(new.id,'Pendidikan','expense',true),
    (new.id,'Hiburan','expense',true),(new.id,'Keluarga','expense',true),(new.id,'Lainnya','expense',true)
  on conflict do nothing;
  return new;
end; $$;
create trigger profiles_seed_categories after insert on public.profiles for each row execute function public.seed_categories();

create view public.account_balances with (security_invoker = true) as
select a.id,a.user_id,a.name,a.kind,a.currency,
  a.opening_balance + coalesce(sum(case when t.state <> 'posted' then 0 when t.destination_account_id = a.id then t.amount when t.source_account_id = a.id then -t.amount else 0 end),0)::numeric(18,2) as balance
from public.accounts a left join public.money_transactions t on (t.source_account_id = a.id or t.destination_account_id = a.id) and t.archived_at is null
where a.archived_at is null group by a.id;

create view public.budget_progress with (security_invoker = true) as
select b.id,b.user_id,c.name as category,b.month,b.limit_amount,
  coalesce(sum(t.amount) filter (where t.state='posted' and t.kind='expense' and t.archived_at is null and date_trunc('month',t.occurred_at)::date=b.month),0)::numeric(18,2) as spent_amount
from public.budgets b join public.categories c on c.id=b.category_id left join public.money_transactions t on t.category_id=b.category_id and t.user_id=b.user_id
group by b.id,c.name;

create view public.goal_progress with (security_invoker = true) as
select g.id,g.user_id,g.name,g.target_amount,g.target_date,coalesce(sum(gc.amount),0)::numeric(18,2) as saved_amount
from public.savings_goals g left join public.goal_contributions gc on gc.goal_id=g.id where g.archived_at is null group by g.id;

create view public.due_reminders with (security_invoker = true) as
select r.id,r.user_id,r.title,r.due_at from public.reminders r
where r.state in ('pending','snoozed') and coalesce(r.snoozed_until,r.due_at) <= now()
and not exists (select 1 from public.notification_deliveries d where d.reminder_id=r.id and d.state='sent');

create function public.commit_application_import(p_rows jsonb) returns integer language plpgsql security invoker set search_path = '' as $$
declare item jsonb; company_id uuid; imported integer := 0;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  for item in select value from jsonb_array_elements(p_rows) loop
    select id into company_id from public.companies where user_id=auth.uid() and lower(name)=lower(item->>'companyName');
    if company_id is null then
      insert into public.companies(user_id,name) values(auth.uid(),item->>'companyName') returning id into company_id;
    end if;
    insert into public.applications(user_id,company_id,position,stage,employment_type,applied_at,location,source,next_action,next_action_at,import_fingerprint)
    values(auth.uid(),company_id,item->>'position',(item->>'stage')::public.application_stage,(item->>'employmentType')::public.employment_type,
      nullif(item->>'appliedAt','')::date,nullif(item->>'location',''),nullif(item->>'source',''),nullif(item->>'nextAction',''),nullif(item->>'nextActionAt','')::timestamptz,item->>'fingerprint');
    imported := imported + 1;
  end loop;
  insert into public.import_batches(user_id,kind,state,row_count,committed_at) values(auth.uid(),'applications','committed',imported,now());
  return imported;
end; $$;

create function public.commit_transaction_import(p_rows jsonb) returns integer language plpgsql security invoker set search_path = '' as $$
declare item jsonb; imported integer := 0;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  for item in select value from jsonb_array_elements(p_rows) loop
    insert into public.money_transactions(user_id,kind,state,amount,occurred_at,description,source_account_id,destination_account_id,category_id,import_fingerprint)
    values(auth.uid(),(item->>'kind')::public.transaction_kind,(item->>'state')::public.transaction_state,(item->>'amount')::numeric,
      (item->>'occurredAt')::date,item->>'description',nullif(item->>'sourceAccountId','')::uuid,nullif(item->>'destinationAccountId','')::uuid,
      nullif(item->>'categoryId','')::uuid,item->>'fingerprint');
    imported := imported + 1;
  end loop;
  insert into public.import_batches(user_id,kind,state,row_count,committed_at) values(auth.uid(),'transactions','committed',imported,now());
  return imported;
end; $$;

-- Internal, audited scheduler function. It is the sole SECURITY DEFINER routine in Kendali.
-- search_path is empty, every object is schema-qualified, and execution is restricted to service_role.
create function public.internal_generate_recurring_drafts(p_through date default current_date) returns integer
language plpgsql security definer set search_path = '' as $$
declare rule_row public.recurring_rules%rowtype; generated integer := 0; occurrence date;
begin
  for rule_row in select * from public.recurring_rules where is_active and next_occurrence_on <= p_through and (ends_on is null or next_occurrence_on <= ends_on) for update loop
    occurrence := rule_row.next_occurrence_on;
    while occurrence <= p_through and (rule_row.ends_on is null or occurrence <= rule_row.ends_on) loop
      insert into public.money_transactions(user_id,kind,state,amount,occurred_at,description,source_account_id,destination_account_id,category_id,recurring_rule_id,occurrence_key)
      values(rule_row.user_id,rule_row.kind,'draft',rule_row.amount,occurrence,rule_row.description,rule_row.source_account_id,rule_row.destination_account_id,rule_row.category_id,rule_row.id,rule_row.id::text||':'||occurrence::text)
      on conflict (user_id,occurrence_key) where occurrence_key is not null do nothing;
      generated := generated + 1;
      occurrence := case rule_row.frequency when 'weekly' then occurrence + 7 when 'monthly' then (occurrence + interval '1 month')::date else (occurrence + interval '1 year')::date end;
    end loop;
    update public.recurring_rules set next_occurrence_on=occurrence, is_active=(ends_on is null or occurrence <= ends_on) where id=rule_row.id;
  end loop;
  return generated;
end; $$;

do $$ declare table_name text; begin foreach table_name in array array['profiles','companies','applications','application_activities','contacts','documents','labels','application_labels','accounts','categories','recurring_rules','money_transactions','budgets','savings_goals','goal_contributions','reminders','notifications','push_subscriptions','notification_deliveries','import_batches'] loop
  execute format('alter table public.%I enable row level security',table_name);
  execute format('create policy %I on public.%I for select to authenticated using (auth.uid() = %s)',table_name||'_select_owner',table_name,case when table_name='profiles' then 'id' else 'user_id' end);
  execute format('create policy %I on public.%I for insert to authenticated with check (auth.uid() = %s)',table_name||'_insert_owner',table_name,case when table_name='profiles' then 'id' else 'user_id' end);
  execute format('create policy %I on public.%I for update to authenticated using (auth.uid() = %s) with check (auth.uid() = %s)',table_name||'_update_owner',table_name,case when table_name='profiles' then 'id' else 'user_id' end,case when table_name='profiles' then 'id' else 'user_id' end);
  execute format('create policy %I on public.%I for delete to authenticated using (auth.uid() = %s)',table_name||'_delete_owner',table_name,case when table_name='profiles' then 'id' else 'user_id' end);
end loop; end $$;

alter table public.access_allowlist enable row level security;
create policy allowlist_select_self on public.access_allowlist for select to authenticated
using (email = lower(auth.jwt()->>'email'));
create policy allowlist_admin_all on public.access_allowlist for all to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin))
with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin));

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to authenticated;
grant select,insert,update,delete on public.profiles,public.access_allowlist,public.companies,public.applications,public.application_activities,public.contacts,public.documents,public.labels,public.application_labels,public.accounts,public.categories,public.recurring_rules,public.money_transactions,public.budgets,public.savings_goals,public.goal_contributions,public.reminders,public.notifications,public.push_subscriptions,public.notification_deliveries,public.import_batches to authenticated;
grant select on public.account_balances,public.budget_progress,public.goal_progress to authenticated;
grant execute on function public.commit_application_import(jsonb), public.commit_transaction_import(jsonb) to authenticated;
revoke execute on function public.commit_application_import(jsonb), public.commit_transaction_import(jsonb) from public, anon;
revoke execute on function public.internal_generate_recurring_drafts(date) from public, anon, authenticated;
grant execute on function public.internal_generate_recurring_drafts(date) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('application-documents','application-documents',false,10485760,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp']) on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy documents_storage_select on storage.objects for select to authenticated using(bucket_id='application-documents' and (storage.foldername(name))[1]=auth.uid()::text);
create policy documents_storage_insert on storage.objects for insert to authenticated with check(bucket_id='application-documents' and (storage.foldername(name))[1]=auth.uid()::text);
create policy documents_storage_update on storage.objects for update to authenticated using(bucket_id='application-documents' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='application-documents' and (storage.foldername(name))[1]=auth.uid()::text);
create policy documents_storage_delete on storage.objects for delete to authenticated using(bucket_id='application-documents' and (storage.foldername(name))[1]=auth.uid()::text);

commit;
