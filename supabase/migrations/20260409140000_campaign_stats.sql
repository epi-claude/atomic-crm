-- Returns aggregate stats for a single campaign.
-- Used by the campaign show page analytics header.
CREATE OR REPLACE FUNCTION get_campaign_stats(p_campaign_id bigint)
RETURNS TABLE (
  total_enrolled  bigint,
  total_completed bigint,
  total_suppressed bigint,
  total_delivered bigint,
  unique_opens    bigint,
  unique_clicks   bigint
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT
    count(*)                                                    AS total_enrolled,
    count(*) FILTER (WHERE e.completed_at IS NOT NULL)          AS total_completed,
    count(*) FILTER (WHERE e.suppressed = true)                 AS total_suppressed,
    coalesce(sum(s.delivered_count), 0)                         AS total_delivered,
    count(*) FILTER (WHERE coalesce(s.open_count, 0) > 0)      AS unique_opens,
    count(*) FILTER (WHERE coalesce(s.click_count, 0) > 0)     AS unique_clicks
  FROM drip_enrollments e
  LEFT JOIN enrollment_event_summary s ON s.enrollment_id = e.id
  WHERE e.campaign_id = p_campaign_id;
$$;

GRANT EXECUTE ON FUNCTION get_campaign_stats(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION get_campaign_stats(bigint) TO service_role;
