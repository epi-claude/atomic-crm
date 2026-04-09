// Scheduled daily at 8am UTC via pg_cron.
// Queries get_ready_enrollments() for contacts whose next step is due,
// sends via Resend, then advances the enrollment step.
//
// Required env vars:
//   RESEND_API_KEY         — Resend Pro API key
//   RESEND_FROM_ADDRESS    — verified sender address
//   RESEND_WEBHOOK_SECRET  — used to sign unsubscribe tokens
//   SUPABASE_URL           — injected automatically by Supabase

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { hmacHex } from "../_shared/hmac.ts";
import {
  buildEmailHtml,
  getPrimaryEmail,
  interpolate,
} from "../_shared/emailHelpers.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_ADDRESS = Deno.env.get("RESEND_FROM_ADDRESS");
const WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

if (
  !RESEND_API_KEY ||
  !RESEND_FROM_ADDRESS ||
  !WEBHOOK_SECRET ||
  !SUPABASE_URL
) {
  throw new Error(
    "Missing RESEND_API_KEY, RESEND_FROM_ADDRESS, RESEND_WEBHOOK_SECRET, or SUPABASE_URL",
  );
}

const UNSUBSCRIBE_BASE = `${SUPABASE_URL}/functions/v1/unsubscribe`;

Deno.serve(async () => {
  const { data: enrollments, error } = await supabaseAdmin.rpc(
    "get_ready_enrollments",
  );

  if (error) {
    console.error("get_ready_enrollments failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!enrollments?.length) {
    console.warn("drip-sender: no enrollments ready");
    return new Response(JSON.stringify({ processed: 0, failed: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const now = new Date();
  const results = await Promise.allSettled(
    enrollments.map((e: ReadyEnrollment) => processEnrollment(e, now)),
  );

  const failed = results.filter((r) => r.status === "rejected");
  failed.forEach((r) =>
    console.error("Enrollment failed:", (r as PromiseRejectedResult).reason),
  );

  if (failed.length === 0) {
    console.warn(`drip-sender: processed ${enrollments.length} enrollments`);
  }

  return new Response(
    JSON.stringify({ processed: enrollments.length, failed: failed.length }),
    { headers: { "Content-Type": "application/json" } },
  );
});

async function processEnrollment(enrollment: ReadyEnrollment, now: Date) {
  const email = getPrimaryEmail(enrollment.email_jsonb);
  if (!email) {
    console.warn(`No email for contact ${enrollment.contact_id} — skipping`);
    return;
  }

  const firstName = enrollment.first_name ?? "";
  const subject = interpolate(enrollment.subject, firstName);
  const token = await hmacHex(
    String(enrollment.enrollment_id),
    WEBHOOK_SECRET!,
  );
  const unsubscribeUrl = `${UNSUBSCRIBE_BASE}?eid=${enrollment.enrollment_id}&token=${token}`;
  const html = buildEmailHtml(
    interpolate(enrollment.html_body, firstName),
    unsubscribeUrl,
  );

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_ADDRESS,
      to: [email],
      subject,
      html,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      tags: [
        { name: "enrollment_id", value: String(enrollment.enrollment_id) },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Resend error for enrollment ${enrollment.enrollment_id}: ${res.status} ${body}`,
    );
  }

  const { error } = await supabaseAdmin
    .from("drip_enrollments")
    .update({
      step: enrollment.step_number,
      last_sent_at: now.toISOString(),
      ...(enrollment.is_last_step ? { completed_at: now.toISOString() } : {}),
    })
    .eq("id", enrollment.enrollment_id);

  if (error) {
    throw new Error(
      `DB update failed for enrollment ${enrollment.enrollment_id}: ${error.message}`,
    );
  }
}


interface ReadyEnrollment {
  enrollment_id: number;
  contact_id: number;
  current_step: number;
  campaign_id: number;
  step_number: number;
  subject: string;
  html_body: string;
  first_name: string | null;
  last_name: string | null;
  email_jsonb: unknown;
  is_last_step: boolean;
}
