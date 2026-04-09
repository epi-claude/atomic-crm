-- Returns the full drip email history for a single contact.
-- One row per email event (LEFT JOIN so enrollments with no events still appear).
-- Frontend groups by enrollment_id.
CREATE OR REPLACE FUNCTION get_contact_email_history(p_contact_id bigint)
RETURNS TABLE (
  enrollment_id     bigint,
  campaign_id       bigint,
  campaign_name     text,
  step              smallint,
  enrolled_at       timestamptz,
  completed_at      timestamptz,
  suppressed        boolean,
  suppressed_reason text,
  event_id          bigint,
  event_type        text,
  occurred_at       timestamptz,
  url               text
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT
    e.id              AS enrollment_id,
    e.campaign_id,
    c.name            AS campaign_name,
    e.step,
    e.enrolled_at,
    e.completed_at,
    e.suppressed,
    e.suppressed_reason,
    ev.id             AS event_id,
    ev.event_type,
    ev.occurred_at,
    ev.url
  FROM public.drip_enrollments e
  JOIN public.campaigns c ON c.id = e.campaign_id
  LEFT JOIN public.email_events ev ON ev.enrollment_id = e.id
  WHERE e.contact_id = p_contact_id
  ORDER BY e.enrolled_at DESC, ev.occurred_at ASC NULLS FIRST;
$$;

GRANT EXECUTE ON FUNCTION get_contact_email_history(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION get_contact_email_history(bigint) TO service_role;
