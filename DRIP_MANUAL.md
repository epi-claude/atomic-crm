# epiSolve Drip Campaign — User Manual

## System Overview

```
Contacts (CRM)
    ↓  enroll via Segment or individually
Drip Enrollments (DB)
    ↓  pg_cron fires daily at 8am UTC
drip-sender (Edge Function)
    ↓  sends via Resend API
Recipient inbox
    ↓  bounce / complaint / unsubscribe webhook
resend (Edge Function)
    ↓  suppresses contact globally
CRM contact record
```

**What runs automatically:** The drip sender fires once per day at 8am UTC. It finds every enrollment whose next step is due, sends the email, and advances the step counter. You don't need to do anything once contacts are enrolled.

---

## 1. Seed the System — Import Contacts

1. Go to **Contacts → Import** (top-right user menu → Import data)
2. Upload a CSV. Required columns: `first_name`, `last_name`, one email column.
3. After import, tag contacts and set their status (cold / warm / hot / in-contract) from the contact detail page — these are used by segment filters.

**Verify:** Open a contact record. Confirm the email address appears under Personal info and the status is set correctly.

---

## 2. Create a Campaign

1. Click **Campaigns** in the nav → **New Campaign**
2. Fill in:
   - **Name** — human label (e.g. "Outreach 2026")
   - **Slug** — URL key, lowercase-hyphenated (e.g. `outreach-2026`)
   - **Status** — set to **Draft** while building, **Active** when ready to send
3. Save → you land on the campaign detail page

### Edit Steps

Each campaign has steps pre-seeded (or you can edit them):

1. On the campaign detail page, click the **Steps** tab
2. Click the pencil icon on any step to edit inline
3. Per step, set:
   - **Subject** — email subject line. Use `{first_name}` to personalise.
   - **Delay (days)** — how many days after the previous step to wait. Step 1 is always 0 (sends immediately on enrollment).
   - **Body** — rich text editor (bold, italic, lists, links). Use `{first_name}` anywhere.
4. Click **Save** on each step.

**Current cadence (Outreach 2026):**
| Step | Delay | Notes |
|------|-------|-------|
| 1 | 0 days | Sends immediately on enrollment |
| 2 | 3 days | Sends 3 days after step 1 |
| 3 | 7 days | Sends 7 days after step 2 — final step |

---

## 3. Create a Segment

Segments define which contacts to enroll. Filters are combined with AND logic.

1. Click **Segments** in the nav → **New Segment**
2. Name it (e.g. "Warm contacts — no LinkedIn")
3. Set filters:
   - **Status** — cold / warm / hot / in-contract
   - **Tags** — contact must have ALL selected tags
   - **LinkedIn** — Any / Has LinkedIn / No LinkedIn
4. The **live count** updates as you adjust filters — shows how many contacts match right now
5. Save

---

## 4. Kick Off a Campaign

### Option A — Enroll a Segment (bulk)

1. Go to **Segments** → open your segment
2. Confirm the contact count looks right
3. Click **Enroll in Campaign**
4. Pick the campaign → click **Enroll**
5. A toast confirms how many new contacts were enrolled (already-enrolled contacts are skipped)

### Option B — Enroll an Individual Contact

1. Open any **Contact** detail page
2. In the right sidebar, find **Drip Campaigns**
3. Click **Enroll in campaign** → pick the campaign

### What happens next

- Step 1 emails go out at the **next 8am UTC run** (or manually trigger — see below)
- Step 2 goes out 3 days later, step 3 seven days after that
- Each enrollment tracks independently — enrolling 50 contacts on different days is fine

### Manual trigger (testing / immediate send)

```bash
curl -X POST https://aukumzivxmdkwrbjrdwc.supabase.co/functions/v1/drip-sender \
  -H "Authorization: Bearer <service_role_key>"
```

Or from the Supabase dashboard: **Edge Functions → drip-sender → Test**.

---

## 5. Monitor Enrollment Status

### Per campaign
**Campaigns → [campaign name] → Enrollments tab**

Shows every enrolled contact with:
- 🕐 Pending (enrolled, not yet sent)
- ✉️ Active (at least one step sent)
- ✅ Completed (all steps sent)
- ✗ Suppressed (bounced, complained, or unsubscribed)

### Per contact
Open the contact → **Drip Campaigns** aside section shows:
- Which campaigns they're enrolled in
- Current step number
- Status badge (active / done / suppressed)

---

## 6. Reporting — Opens, Clicks, Delivery

**Our database only tracks suppression events** (bounce, complaint, unsubscribe). Opens and clicks are not stored in the CRM — they live in Resend.

### Where to look

**Resend dashboard → [resend.com/emails](https://resend.com/emails)**

| What you want | Where |
|---|---|
| Individual email delivery status | Emails → search by recipient address |
| Open / click events per email | Emails → click any email → Events timeline |
| Bounce / complaint log | Emails → filter by status |
| Domain-level stats | Domains → dm.e-dmm.com → Stats |
| Aggregate campaign stats | Broadcasts (note: drip emails are transactional, not broadcasts — check per-email) |

### Key Resend event types
| Event | What it means | CRM effect |
|---|---|---|
| `email.sent` | Accepted by Resend | None |
| `email.delivered` | Accepted by recipient server | None |
| `email.opened` | Recipient opened | None (tracked in Resend only) |
| `email.clicked` | Recipient clicked a link | None (tracked in Resend only) |
| `email.bounced` | Hard bounce | Contact suppressed globally |
| `email.complained` | Marked as spam | Contact suppressed globally |
| `email.unsubscribed` | Clicked unsubscribe link | Contact suppressed globally |

### Suppressed contacts

When a contact is suppressed:
- Their enrollment stops immediately (no further steps send)
- `contacts.drip_unsubscribed = true` — they will never be re-enrolled in any campaign
- Visible in the contact record sidebar with a red "suppressed" badge

To manually override a suppression (e.g. a bounce was a temporary server error):
1. Open the contact in Supabase dashboard → Table Editor → contacts
2. Set `drip_unsubscribed = false`
3. Re-enroll from the contact detail page

---

## 7. Quick Reference

| Task | Where |
|---|---|
| Import contacts | Contacts → user menu → Import data |
| Create campaign | Campaigns → New Campaign |
| Edit step copy | Campaigns → [name] → Steps tab → pencil icon |
| Create segment | Segments → New Segment |
| Bulk enroll | Segments → [name] → Enroll in Campaign |
| Enroll one contact | Contact detail → Drip Campaigns sidebar |
| View enrollment status | Campaigns → [name] → Enrollments tab |
| Check opens/clicks | resend.com/emails |
| Manual send trigger | Edge Functions → drip-sender → Test |
| Fix suppressed contact | Supabase Table Editor → contacts → drip_unsubscribed |
