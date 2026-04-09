-- Bulk-enrolls all contacts matching a segment's filter_criteria into a campaign.
-- Skips contacts already enrolled in that campaign (ON CONFLICT DO NOTHING).
-- Returns the number of new rows inserted.
--
-- Called by the Segments UI enroll action.

CREATE OR REPLACE FUNCTION public.enroll_segment_contacts(
  p_segment_id bigint,
  p_campaign_id bigint
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_criteria  jsonb;
  v_inserted  bigint;
BEGIN
  SELECT filter_criteria INTO v_criteria
  FROM public.segments
  WHERE id = p_segment_id;

  IF v_criteria IS NULL THEN
    RAISE EXCEPTION 'Segment % not found', p_segment_id;
  END IF;

  WITH matched AS (
    SELECT c.id AS contact_id
    FROM public.contacts c
    WHERE
      (v_criteria->>'status'     IS NULL OR c.status     = v_criteria->>'status')
      AND (v_criteria->'company_id' IS NULL OR c.company_id = (v_criteria->>'company_id')::bigint)
      AND (
        v_criteria->'has_linkedin' IS NULL
        OR CASE WHEN (v_criteria->>'has_linkedin')::boolean
                THEN c.linkedin_url IS NOT NULL
                ELSE c.linkedin_url IS NULL
           END
      )
      AND (
        v_criteria->'tags' IS NULL
        OR jsonb_array_length(v_criteria->'tags') = 0
        OR c.tags @> ARRAY(
             SELECT jsonb_array_elements_text(v_criteria->'tags')::bigint
           )
      )
      AND c.drip_unsubscribed = false
  ),
  ins AS (
    INSERT INTO public.drip_enrollments (contact_id, campaign_id, step, enrolled_at, suppressed)
    SELECT m.contact_id, p_campaign_id, 0, now(), false
    FROM matched m
    ON CONFLICT (contact_id, campaign_id) DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_inserted FROM ins;

  RETURN v_inserted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.enroll_segment_contacts(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enroll_segment_contacts(bigint, bigint) TO service_role;
