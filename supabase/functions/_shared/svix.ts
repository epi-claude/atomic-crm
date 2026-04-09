/**
 * Svix webhook signature verification for Resend webhooks.
 * Extracted from resend/index.ts so it can be unit-tested.
 *
 * Spec: https://docs.svix.com/receiving/verifying-payloads/how-manual
 * - Sign:  HMAC-SHA256(key=base64decode(secret[6:]), msg="{id}.{timestamp}.{body}")
 * - Header svix-signature may contain multiple space-separated "v1,<base64sig>" values
 * - Reject if timestamp is more than 5 minutes old
 */

/** Returns an error Response or null if valid. */
export async function verifySignature(
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

  const ts = parseInt(svixTimestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
    return new Response("Webhook timestamp out of range", { status: 401 });
  }

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
  const computed = btoa(
    String.fromCharCode(...new Uint8Array(signatureBytes)),
  );

  const valid = svixSignature
    .split(" ")
    .some((sig) => sig === `v1,${computed}`);

  if (!valid) {
    return new Response("Invalid signature", { status: 401 });
  }

  return null;
}

/** Compute the expected svix-signature header value for a given payload. */
export async function computeSvixSignature(
  svixId: string,
  svixTimestamp: string,
  rawBody: string,
  secret: string,
): Promise<string> {
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
  const b64 = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
  return `v1,${b64}`;
}
