# epiSolve CRM — Campaign Feature Testing Guide

**Audience:** Colleagues testing the drip campaign system for the first time  
**CRM URL:** https://crm.episolve.com  
**What you need:** A login, a real email address to receive test emails

---

## Overview

This guide walks you through the full campaign workflow end-to-end:

1. Load test contacts from CSV
2. Tag and organise contacts
3. Create a campaign and build its steps
4. Preview steps with a test email
5. Create a segment (filtered contact group)
6. Enroll the segment into the campaign
7. Monitor progress as the campaign runs
8. Follow individual contact email history

---

## Step 1 — Import Test Contacts

You need contacts in the system before you can do anything else.

1. Go to **Contacts** in the left sidebar
2. Click the **Import** button (top right)
3. Upload the file at `test-data/contacts.csv` from the repository — this includes ~500 contacts and 55 companies
4. The import will match existing companies and tags, or create new ones

**Verify:** After import, the Contacts list should show contacts with names, companies, and some with tags already populated.

### CSV columns that matter for segmentation

| Column | Used for |
|---|---|
| `tags` | Tag-based segment filters (comma-separated) |
| `status` | Status filter in segments (e.g. "in-contract", "prospect") |
| `company` | Company-based segment filters |
| `linkedin_url` | LinkedIn presence filter |

---

## Step 2 — Tag Some Contacts

Tags are the primary way to build targeted segments. Before creating a campaign, tag a small group of contacts so you have something to enroll.

1. Open any contact from the list
2. Scroll to the **Tags** section (right sidebar or Details tab on mobile)
3. Add a tag like `test-prospect` or `warm-lead`
4. Repeat for 3–5 contacts so you have a testable group

**Why this matters:** When you build a segment in Step 5, you'll filter by this tag to select exactly these contacts for enrollment.

---

## Step 3 — Create a Campaign

1. Go to **Campaigns** in the left sidebar
2. Click **Create**
3. Fill in:
   - **Name:** e.g. `Test Outreach Q2`
   - **Slug:** auto-fills from the name (e.g. `test-outreach-q2`) — leave as-is
   - **Description:** optional, e.g. `Testing the drip system`
   - **Status:** leave as **Draft** for now
4. Click **Save**

You'll land on the campaign detail page with one blank step already created.

---

## Step 4 — Build and Preview Steps

### Edit Step 1

1. Click the step row to expand it, then click the **pencil icon**
2. Set:
   - **Subject:** `Quick question, {first_name}` (the `{first_name}` will be replaced with the contact's first name)
   - **Delay (days):** `0` (sends on the day of enrollment)
   - **Body:** Write a short intro email. Use `{first_name}` anywhere you want personalisation.
3. Click **Save**

### Send a Test Email

Before adding more steps, preview this one:

1. With Step 1 expanded (or while editing), find the **Send test email** panel at the bottom
2. Enter your own email address — it will be remembered for future tests
3. Click **Send test**
4. Check your inbox — the email arrives with `[TEST]` in the subject and a yellow banner

This lets you confirm the HTML renders correctly in your email client before anyone real receives it.

### Add Steps 2 and 3

1. Click **Add step** (below the step list)
2. Edit the new step:
   - **Subject:** e.g. `Following up, {first_name}`
   - **Delay:** `3` (sends 3 days after the previous step)
   - **Body:** A brief follow-up email
3. Save, then add a third step with **Delay: 7** for a final touch

**The ⓘ info button** next to Add step opens a best-practices table if you want guidance on step count and spacing.

:::tip
Keep it to 3–4 steps for testing. You'll see the amber warning at 6+ steps and the add button disables at 8.
:::

---

## Step 5 — Create a Segment

Segments are saved filters that define which contacts to enroll.

1. Go to **Segments** in the left sidebar
2. Click **Create**
3. Name it: `Test Prospects`
4. In the **Filter Builder**:
   - Click the **Tags** section and select `test-prospect` (or whatever tag you used in Step 2)
5. Watch the **live contact count** update below — it should match the number of contacts you tagged
6. Click **Save**

### Other filters you can test

| Filter | What to try |
|---|---|
| **Status** | Select "Prospect" to filter by CRM status |
| **Companies** | Search for a company by name and select it |
| **Industry** | Click an industry sector pill (e.g. Technology) |
| **Has LinkedIn** | Toggle on to filter to contacts with LinkedIn URLs |

These can be combined — the count updates live so you always know how many contacts match.

---

## Step 6 — Enroll the Segment

Now you connect contacts to the campaign.

1. Open the segment you just created (**Segments → Test Prospects**)
2. Verify the contact count looks right
3. Click **Enroll**
4. In the dialog, select your campaign (`Test Outreach Q2`)
5. Click **Enroll** to confirm

The system enrolls every matching contact, skipping any already enrolled. You'll see a success notification with the enrollment count.

**Safe to re-run:** If you enroll the same segment twice, it won't duplicate — it just picks up any new contacts added since the last run.

---

## Step 7 — Activate the Campaign

The campaign is still in **Draft** — the drip sender skips draft campaigns.

1. Go to **Campaigns → Test Outreach Q2**
2. Click **Edit**
3. Change **Status** to **Active**
4. Save

The campaign is now live. The drip sender runs daily at **8am UTC**. On the next run, enrolled contacts at step 0 will receive Step 1.

:::note
For testing purposes, you can keep the campaign in Draft and just verify the enrollment and step setup looks right. You don't need to wait for sends to go out to validate most of the feature.
:::

---

## Step 8 — Monitor Campaign Progress

Once sends start going out, here's where to look:

### Campaign Analytics Header

The campaign detail page shows **6 stat tiles** at the top:

| Tile | What to expect |
|---|---|
| **Enrolled** | Should match your segment enrollment count |
| **Delivered** | Increments as Resend confirms delivery |
| **Open rate** | Updates when contacts open emails |
| **Click rate** | Updates when contacts click links |
| **Completed** | Contacts who've received all steps |
| **Suppressed** | Contacts removed due to bounce/complaint/unsubscribe |

### Enrollments Tab

Click the **Enrollments** tab on the campaign detail page to see per-contact status:

- **Active (step N)** — waiting for the next step
- **Completed** — finished the campaign
- **Suppressed** — removed (reason shown)

Each row also shows mini delivery stats: ✉ sent / 👁 opened / 🖱 clicked.

---

## Step 9 — Follow a Contact's Email History

For any enrolled contact, you can see their full email timeline.

1. Open a contact who was enrolled (Contacts list → click any name)
2. On desktop: click the **Emails** tab (next to Notes)
3. You'll see a timeline grouped by campaign showing:
   - When each email was sent
   - Delivery confirmation
   - Opens (with timestamps)
   - Clicks (with the URL that was clicked)
   - Any bounce, complaint, or unsubscribe event

This is useful for following up — you can see exactly how engaged a contact has been before reaching out manually.

---

## Step 10 — Suppression and Unsubscribes

### What causes suppression

A contact is automatically suppressed from a campaign if:
- Their email **bounced** (hard bounce — address doesn't exist)
- They marked the email as **spam / complained**
- They clicked the **unsubscribe link** in the email footer

Suppressed contacts stop receiving emails from that campaign immediately.

### How to unsuppress manually

If you need to re-enable a suppressed contact (e.g. a test bounce you want to undo):

1. Open the contact's page
2. Scroll to the **Drip Campaigns** section in the right sidebar (or the Campaigns panel on the contact show page)
3. Find the suppressed enrollment and click the **↺ (unsuppress)** button

Use this carefully — re-enabling a genuinely bounced address will just bounce again.

---

## Bonus — Clone a Campaign

If you want to test a variation of your campaign without rebuilding steps from scratch:

1. Open the campaign detail page
2. Click **Clone** in the header
3. Edit the name (pre-filled as "Copy of [original name]") and slug
4. Click **Clone** — you're redirected to the new campaign in Draft status with all steps copied
5. Edit steps, then enroll a different segment

---

## Quick Reference

| What to check | Where to look | What to look for |
|---|---|---|
| Contact enrolled? | Campaign → Enrollments tab | Contact appears with "Active (step 1)" |
| Email sent? | Campaign → Enrollments tab (✉ count) | Count increments after 8am UTC run |
| Email delivered? | Campaign analytics header | Delivered tile increments |
| Contact opened? | Contact → Emails tab | "Opened" event in timeline |
| Contact clicked? | Contact → Emails tab | "Clicked" event with URL |
| Contact bounced? | Campaign → Enrollments tab | Status shows "Suppressed (bounced)" |
| Overall engagement? | Campaign analytics header | Open rate and click rate tiles |
| Segment count right? | Segment detail page | Live count below filter builder |

---

## Troubleshooting

**No contacts in my segment?**  
Check that you tagged contacts in Step 2. Open a contact and verify the tag was saved. Tags are case-sensitive.

**Enrollment count is 0?**  
Confirm the segment filters match at least one contact. The live count on the segment page will tell you before you enroll.

**Test email didn't arrive?**  
Check spam/junk. The test email comes from `rsharp@dm.e-dmm.com`. Add this to your safe senders if needed.

**Campaign says Draft, no emails sending?**  
Change status to Active (Campaign → Edit → Status).

**Contact is suppressed but shouldn't be?**  
Use the ↺ unsuppress button on the contact's drip section. This is most likely a test bounce.
