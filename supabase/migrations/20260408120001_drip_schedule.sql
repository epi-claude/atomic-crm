-- Schedules the drip-sender edge function to run daily at 8am UTC via pg_cron.
-- Follows the same URL resolution pattern as 20260304104600_note_attachments_trigger.sql.
--
-- For production, set the base URL once after deploying:
--   ALTER DATABASE postgres SET "app.supabase_url" = 'https://<ref>.supabase.co';
-- Locally the Docker fallback handles it automatically.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Resolves the drip-sender edge function URL.
-- Priority: app.supabase_url setting → SB_JWT_ISSUER-derived → Docker fallback
CREATE OR REPLACE FUNCTION public.get_drip_sender_url()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  configured_url text;
  issuer         text;
  base_url       text;
BEGIN
  -- 1. Explicit override (required for production pg_cron; no request context)
  configured_url := nullif(current_setting('app.supabase_url', true), '');
  IF configured_url IS NOT NULL THEN
    RETURN rtrim(configured_url, '/') || '/functions/v1/drip-sender';
  END IF;

  -- 2. Derive from JWT issuer (works when called inside a request context)
  issuer := coalesce(
    nullif(current_setting('request.jwt.claim.iss', true), ''),
    (coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'iss')
  );
  issuer := nullif(issuer, '');
  IF issuer IS NOT NULL THEN
    issuer := rtrim(issuer, '/');
    IF right(issuer, 8) = '/auth/v1' THEN
      base_url := left(issuer, length(issuer) - 8);
      base_url := replace(base_url, 'http://127.0.0.1:', 'http://host.docker.internal:');
      base_url := replace(base_url, 'http://localhost:',  'http://host.docker.internal:');
      RETURN base_url || '/functions/v1/drip-sender';
    END IF;
  END IF;

  -- 3. Local dev fallback
  RETURN 'http://host.docker.internal:54321/functions/v1/drip-sender';
END;
$$;

-- Daily at 8am UTC.
-- drip-sender has verify_jwt = false, so no Authorization header is needed.
SELECT cron.schedule(
  'drip-sender-daily',
  '0 8 * * *',
  $$
    SELECT net.http_post(
      url     := public.get_drip_sender_url(),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body    := '{}'::jsonb
    );
  $$
);
