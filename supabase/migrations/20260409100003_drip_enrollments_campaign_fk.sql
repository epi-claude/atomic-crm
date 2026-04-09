-- Migrate drip_enrollments.campaign (text slug) → campaign_id (FK → campaigns).
--
-- The campaigns table and seed data must exist before this migration runs
-- (handled by 20260409100000_campaigns.sql).

-- 1. Add nullable campaign_id alongside the existing text column
alter table "public"."drip_enrollments"
    add column "campaign_id" bigint;

-- 2. Populate from the campaigns table using the slug
update "public"."drip_enrollments" de
set campaign_id = c.id
from "public"."campaigns" c
where c.slug = de.campaign;

-- 3. Drop the old unique constraint (was on contact_id + campaign text)
alter table "public"."drip_enrollments"
    drop constraint "drip_enrollments_contact_campaign_key";

-- 4. New unique constraint on (contact_id, campaign_id)
CREATE UNIQUE INDEX drip_enrollments_contact_campaign_id_key
    ON public.drip_enrollments USING btree (contact_id, campaign_id);

alter table "public"."drip_enrollments"
    add constraint "drip_enrollments_contact_campaign_id_key"
    UNIQUE using index "drip_enrollments_contact_campaign_id_key";

-- 5. FK to campaigns — RESTRICT on delete so you can't delete a campaign with active enrollments
alter table "public"."drip_enrollments"
    add constraint "drip_enrollments_campaign_id_fkey"
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."drip_enrollments" validate constraint "drip_enrollments_campaign_id_fkey";

-- 6. Make NOT NULL now that all rows are populated
alter table "public"."drip_enrollments"
    alter column "campaign_id" set not null;

-- 7. Drop the old text column
alter table "public"."drip_enrollments"
    drop column "campaign";
