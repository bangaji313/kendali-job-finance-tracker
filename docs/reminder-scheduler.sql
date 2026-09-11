-- Run once in Supabase production after replacing both placeholder values.
-- The project URL and bearer secret are stored in Vault, not in source or cron metadata.
select vault.create_secret('https://your-production-domain.example', 'kendali_site_url');
select vault.create_secret('replace-with-a-long-random-secret', 'kendali_dispatch_secret');

select cron.schedule(
  'kendali-reminders-every-15-minutes',
  '*/15 * * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'kendali_site_url') || '/api/internal/reminders/dispatch',
      headers := jsonb_build_object(
        'content-type', 'application/json',
        'authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'kendali_dispatch_secret')
      ),
      body := '{}'::jsonb
    );
  $$
);
