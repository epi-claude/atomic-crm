// Receives Resend delivery event webhooks and updates drip state.
// Mirrors the postmark function pattern.
//
// Required env vars:
//   RESEND_WEBHOOK_SECRET  — signing secret from the Resend dashboard (whsec_...)
//
// Events handled:
//   email.delivered    → record delivery event
//   email.opened       → record open event
//   email.clicked      → record click event (with URL)
//   email.bounced      → record event + suppress enrollment + globally suppress contact
//   email.complained   → record event + suppress enrollment + globally suppress contact
//   email.unsubscribed → record event + suppress enrollment + globally suppress contact

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { verifySignature } from "../_shared/svix.ts";

const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");
if (!webhookSecret) {
  throw new Error("Missing RESEND_WEBHOOK_SECRET env variable");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  const rawBody = await req.text();

  const verifyError = await verifySignature(
    req.headers,
    rawBody,
    webhookSecret!,
  );
  if (verifyError) return verifyError;

  let payload: ResendWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const enrollmentId = payload.data?.tags?.enrollment_id;
  if (!enrollmentId) {
    // Not a drip campaign email — ignore silently
    return new Response("OK");
  }

  const id = parseInt(enrollmentId, 10);
  if (isNaN(id)) {
    return new Response("Invalid enrollment_id tag", { status: 400 });
  }

  const eventType = payload.type.replace("email.", ""); // "opened", "clicked", etc.
  const emailId = payload.data?.email_id ?? null;
  const url = (payload.data as { click?: { link?: string } })?.click?.link ?? null;

  switch (payload.type) {
    case "email.delivered":
    case "email.opened":
    case "email.clicked":
      await recordEvent(id, emailId, eventType, url);
      break;

    case "email.bounced":
      await recordEvent(id, emailId, "bounced", null);
      await suppressEnrollmentAndContact(id, "bounce");
      break;

    case "email.complained":
      await recordEvent(id, emailId, "complained", null);
      await suppressEnrollmentAndContact(id, "complaint");
      break;

    case "email.unsubscribed":
      await recordEvent(id, emailId, "unsubscribed", null);
      await suppressEnrollmentAndContact(id, "unsubscribe");
      break;

    default:
      break;
  }

  return new Response("OK");
});

async function recordEvent(
  enrollmentId: number,
  resendEmailId: string | null,
  eventType: string,
  url: string | null,
) {
  await supabaseAdmin.from("email_events").insert({
    enrollment_id: enrollmentId,
    resend_email_id: resendEmailId,
    event_type: eventType,
    occurred_at: new Date().toISOString(),
    url,
  });
}

async function suppressEnrollmentAndContact(
  enrollmentId: number,
  reason: "bounce" | "complaint" | "unsubscribe",
) {
  // Fetch contact_id before updating so we can globally suppress the contact
  const { data: enrollment } = await supabaseAdmin
    .from("drip_enrollments")
    .select("contact_id")
    .eq("id", enrollmentId)
    .maybeSingle();

  const now = new Date().toISOString();

  await Promise.all([
    supabaseAdmin
      .from("drip_enrollments")
      .update({ suppressed: true, suppressed_reason: reason })
      .eq("id", enrollmentId),
    enrollment?.contact_id &&
      supabaseAdmin
        .from("contacts")
        .update({ drip_unsubscribed: true, drip_unsubscribed_at: now })
        .eq("id", enrollment.contact_id),
  ]);
}


interface ResendWebhookPayload {
  type: string;
  data: {
    email_id: string;
    tags?: Record<string, string>;
    click?: { link?: string };
    [key: string]: unknown;
  };
}
