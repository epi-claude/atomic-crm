-- Global drip suppression flag on contacts.
--
-- Set automatically by the Resend webhook on unsubscribe, hard bounce, or complaint.
-- Can be manually cleared by an admin (the "manual override" capability).
-- The drip-sender edge function checks this before every send — a contact with
-- drip_unsubscribed = true will not receive any campaign emails regardless of
-- their individual enrollment state.

alter table "public"."contacts"
    add column "drip_unsubscribed"    boolean not null default false;

alter table "public"."contacts"
    add column "drip_unsubscribed_at" timestamp with time zone;

-- Rebuild contacts_summary to include the new columns.

drop view "public"."contacts_summary";

create view "public"."contacts_summary" as
select
    co.id,
    co.first_name,
    co.last_name,
    co.gender,
    co.title,
    co.email_jsonb,
    jsonb_path_query_array(co.email_jsonb, '$[*].email')::text as email_fts,
    co.phone_jsonb,
    jsonb_path_query_array(co.phone_jsonb, '$[*].number')::text as phone_fts,
    co.background,
    co.avatar,
    co.first_seen,
    co.last_seen,
    co.has_newsletter,
    co.status,
    co.tags,
    co.company_id,
    co.sales_id,
    co.linkedin_url,
    co.drip_unsubscribed,
    co.drip_unsubscribed_at,
    c.name as company_name,
    count(distinct t.id) as nb_tasks
from
    contacts co
left join
    tasks t on co.id = t.contact_id
left join
    companies c on co.company_id = c.id
group by
    co.id, c.name;
