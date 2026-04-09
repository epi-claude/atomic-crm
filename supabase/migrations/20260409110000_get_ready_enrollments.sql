-- RPC called by the drip-sender edge function.
-- Returns all enrollments whose next step is due, joined with contact and step data.
-- is_last_step = true when no further step exists in campaign_steps for this campaign.

CREATE OR REPLACE FUNCTION public.get_ready_enrollments()
RETURNS TABLE (
  enrollment_id bigint,
  contact_id    bigint,
  current_step  smallint,
  campaign_id   bigint,
  step_number   smallint,
  subject       text,
  html_body     text,
  first_name    text,
  last_name     text,
  email_jsonb   jsonb,
  is_last_step  boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    e.id              AS enrollment_id,
    e.contact_id,
    e.step            AS current_step,
    e.campaign_id,
    cs.step_number,
    cs.subject,
    cs.html_body,
    c.first_name,
    c.last_name,
    c.email_jsonb,
    NOT EXISTS (
      SELECT 1 FROM public.campaign_steps ncs
      WHERE ncs.campaign_id = e.campaign_id
        AND ncs.step_number = cs.step_number + 1
    ) AS is_last_step
  FROM public.drip_enrollments e
  JOIN public.campaign_steps cs
    ON  cs.campaign_id = e.campaign_id
    AND cs.step_number = e.step + 1
  JOIN public.contacts c
    ON  c.id = e.contact_id
  WHERE e.suppressed    = false
    AND e.completed_at  IS NULL
    AND c.drip_unsubscribed = false
    AND (
      cs.delay_days = 0
      OR e.last_sent_at <= now() - (cs.delay_days || ' days')::interval
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_ready_enrollments() TO service_role;
