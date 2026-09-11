begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

select has_table('public','applications','applications table exists');
select has_table('public','money_transactions','transactions table exists');
select col_type_is('public','money_transactions','amount','numeric(18,2)','money uses numeric(18,2)');
select policies_are('public','applications',array['applications_delete_owner','applications_insert_owner','applications_select_owner','applications_update_owner'],'applications has explicit owner policies');

insert into auth.users(id,email) values
  ('10000000-0000-4000-8000-000000000001','owner@example.test'),
  ('20000000-0000-4000-8000-000000000002','other@example.test');
insert into public.profiles(id,display_name) values
  ('10000000-0000-4000-8000-000000000001','Owner'),
  ('20000000-0000-4000-8000-000000000002','Other');
insert into public.companies(id,user_id,name) values
  ('11000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Company A'),
  ('22000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','Company B');
insert into public.applications(user_id,company_id,position) values
  ('10000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001','Engineer'),
  ('20000000-0000-4000-8000-000000000002','22000000-0000-4000-8000-000000000002','Designer');

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select results_eq('select count(*)::bigint from public.applications',array[1::bigint],'owner sees one own application');
select lives_ok($$insert into public.accounts(user_id,name,kind) values('10000000-0000-4000-8000-000000000001','Bank','bank')$$,'owner can insert own account');
select throws_ok($$insert into public.accounts(user_id,name,kind) values('20000000-0000-4000-8000-000000000002','Intrusion','bank')$$,'42501',null,'owner cannot insert for another user');
select throws_ok($$insert into public.money_transactions(user_id,kind,state,amount,occurred_at,description,source_account_id,destination_account_id) values('10000000-0000-4000-8000-000000000001','transfer','posted',100,'2026-09-07','Invalid',(select id from public.accounts limit 1),(select id from public.accounts limit 1))$$,'23514',null,'transfer accounts must differ');

reset role;
select * from finish();
rollback;
