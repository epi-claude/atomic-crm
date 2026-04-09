// Handles unsubscribe requests from email links.
//
// GET  /unsubscribe?eid=<id>&token=<hmac>
//   → Renders a confirmation page and processes the unsubscribe.
//
// POST /unsubscribe?eid=<id>&token=<hmac>
//   → Processes one-click unsubscribe (RFC 8058 / List-Unsubscribe-Post).
//   → Returns 200 with no body.
//
// On success: sets drip_enrollments.suppressed + contacts.drip_unsubscribed.
// Token = HMAC-SHA256(enrollment_id, RESEND_WEBHOOK_SECRET) to prevent enumeration.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { hmacHex } from "../_shared/hmac.ts";

const WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET");
if (!WEBHOOK_SECRET) {
  throw new Error("Missing RESEND_WEBHOOK_SECRET env variable");
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const eid = url.searchParams.get("eid");
  const token = url.searchParams.get("token");

  if (!eid || !token) {
    return new Response("Invalid unsubscribe link", { status: 400 });
  }

  const expected = await hmacHex(eid, WEBHOOK_SECRET!);
  if (expected !== token) {
    return new Response("Invalid unsubscribe token", { status: 403 });
  }

  const enrollmentId = parseInt(eid, 10);
  if (isNaN(enrollmentId)) {
    return new Response("Invalid enrollment id", { status: 400 });
  }

  const { data: enrollment, error: fetchError } = await supabaseAdmin
    .from("drip_enrollments")
    .select("contact_id")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (fetchError || !enrollment) {
    return new Response("Enrollment not found", { status: 404 });
  }

  await Promise.all([
    supabaseAdmin
      .from("drip_enrollments")
      .update({ suppressed: true, suppressed_reason: "unsubscribe" })
      .eq("id", enrollmentId),
    supabaseAdmin
      .from("contacts")
      .update({
        drip_unsubscribed: true,
        drip_unsubscribed_at: new Date().toISOString(),
      })
      .eq("id", enrollment.contact_id),
  ]);

  if (req.method === "POST") {
    return new Response(null, { status: 200 });
  }

  return new Response(unsubscribePage(), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});

function unsubscribePage(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Unsubscribed</title>
  <style>
    body { font-family: sans-serif; max-width: 480px; margin: 80px auto;
           padding: 0 16px; color: #111; text-align: center; }
    h1 { font-size: 1.4rem; margin-bottom: 8px; }
    p  { color: #666; line-height: 1.6; }
  </style>
</head>
<body>
  <h1>You've been unsubscribed.</h1>
  <p>You won't receive any further emails from this campaign.</p>
</body>
</html>`;
}
