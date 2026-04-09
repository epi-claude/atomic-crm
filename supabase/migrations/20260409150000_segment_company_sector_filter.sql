-- Extends segment filters with multi-company and multi-sector targeting.
-- Replaces single company_id (never exposed in UI) with:
--   company_ids:     bigint[]  — contacts at ANY of these companies
--   company_sectors: text[]    — contacts whose company.sector is ANY of these
--
-- Both count_segment_contacts and enroll_segment_contacts are updated.

CREATE OR REPLACE FUNCTION public.count_segment_contacts(criteria jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  result bigint;
BEGIN
  SELECT count(*) INTO result
  FROM public.contacts c
  WHERE
    (criteria->>'status' IS NULL OR c.status = criteria->>'status')
    AND (
      criteria->'company_ids' IS NULL
      OR jsonb_array_length(criteria->'company_ids') = 0
      OR c.company_id = ANY(
           ARRAY(SELECT jsonb_array_elements_text(criteria->'company_ids')::bigint)
         )
    )
    AND (
      criteria->'company_sectors' IS NULL
      OR jsonb_array_length(criteria->'company_sectors') = 0
      OR EXISTS (
           SELECT 1 FROM public.companies co
           WHERE co.id = c.company_id
           AND co.sector = ANY(
                 ARRAY(SELECT jsonb_array_elements_text(criteria->'company_sectors'))
               )
         )
    )
    AND (
      criteria->'has_linkedin' IS NULL
      OR CASE WHEN (criteria->>'has_linkedin')::boolean
              THEN c.linkedin_url IS NOT NULL
              ELSE c.linkedin_url IS NULL
         END
    )
    AND (
      criteria->'tags' IS NULL
      OR jsonb_array_length(criteria->'tags') = 0
      OR c.tags @> ARRAY(SELECT jsonb_array_elements_text(criteria->'tags')::bigint)
    );
  RETURN result;
END;
$$;

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
      (v_criteria->>'status' IS NULL OR c.status = v_criteria->>'status')
      AND (
        v_criteria->'company_ids' IS NULL
        OR jsonb_array_length(v_criteria->'company_ids') = 0
        OR c.company_id = ANY(
             ARRAY(SELECT jsonb_array_elements_text(v_criteria->'company_ids')::bigint)
           )
      )
      AND (
        v_criteria->'company_sectors' IS NULL
        OR jsonb_array_length(v_criteria->'company_sectors') = 0
        OR EXISTS (
             SELECT 1 FROM public.companies co
             WHERE co.id = c.company_id
             AND co.sector = ANY(
                   ARRAY(SELECT jsonb_array_elements_text(v_criteria->'company_sectors'))
                 )
           )
      )
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
