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

// Verifies the Svix-signed webhook payload from Resend.
// See: https://resend.com/docs/dashboard/webhooks/introduction
async function verifySignature(
  headers: Headers,
  rawBody: string,
  secret: string,
): Promise<Response | null> {
  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing Svix headers", { status: 401 });
  }

  // Reject webhooks older than 5 minutes
  const ts = parseInt(svixTimestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
    return new Response("Webhook timestamp out of range", { status: 401 });
  }

  // Secret is "whsec_<base64-encoded-bytes>"
  const secretBytes = Uint8Array.from(
    atob(secret.slice("whsec_".length)),
    (c) => c.charCodeAt(0),
  );

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${svixId}.${svixTimestamp}.${rawBody}`),
  );
  const computed = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

  // svix-signature header may contain multiple space-separated "v1,<sig>" values
  const valid = svixSignature
    .split(" ")
    .some((sig) => sig === `v1,${computed}`);
  if (!valid) {
    return new Response("Invalid signature", { status: 401 });
  }

  return null;
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
