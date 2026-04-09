// Sends a test/preview email for a single campaign step to a specified address.
// Called from the campaign step card UI.
//
// POST body: { step_id: number, to_email: string }
// Auth: requires a valid user JWT (authenticated)
//
// Required env vars:
//   RESEND_API_KEY       — Resend Pro API key
//   RESEND_FROM_ADDRESS  — verified sender address
//   SUPABASE_URL         — injected automatically

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { buildEmailHtml, interpolate } from "../_shared/emailHelpers.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_ADDRESS = Deno.env.get("RESEND_FROM_ADDRESS");

if (!RESEND_API_KEY || !RESEND_FROM_ADDRESS) {
  throw new Error("Missing RESEND_API_KEY or RESEND_FROM_ADDRESS");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  // Verify caller is authenticated
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { step_id?: unknown; to_email?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const stepId = Number(body.step_id);
  const toEmail = String(body.to_email ?? "").trim();

  if (!stepId || isNaN(stepId)) {
    return new Response("Missing step_id", { status: 400 });
  }
  if (!toEmail || !EMAIL_RE.test(toEmail)) {
    return new Response("Invalid to_email", { status: 400 });
  }

  // Fetch step + campaign name
  const { data: step, error: stepError } = await supabaseAdmin
    .from("campaign_steps")
    .select("subject, html_body, campaign_id, campaigns(name)")
    .eq("id", stepId)
    .maybeSingle();

  if (stepError || !step) {
    return new Response("Step not found", { status: 404 });
  }

  const campaignName =
    (step.campaigns as { name?: string } | null)?.name ?? "Campaign";
  const firstName = "Test User";
  const subject = `[TEST] ${interpolate(step.subject, firstName)}`;
  const html = buildEmailHtml(
    `<p style="background:#fffbe6;border:1px solid #ffe58f;border-radius:4px;padding:8px 12px;font-size:12px;color:#7c6b00;margin-bottom:16px;">
      This is a test send from <strong>${campaignName}</strong>. {first_name} is shown as "Test User".
    </p>` + interpolate(step.html_body, firstName),
    "#", // no real unsubscribe URL for test sends
  );

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_ADDRESS,
      to: [toEmail],
      subject,
      html,
      tags: [{ name: "test_send", value: "true" }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend error:", res.status, text);
    return new Response(
      JSON.stringify({ error: `Resend error: ${res.status}` }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
