/**
 * Returns HMAC-SHA256(message, secret) as a lowercase hex string.
 * Used by drip-sender to sign unsubscribe tokens and by the
 * unsubscribe function to verify them.
 */
export async function hmacHex(
  message: string,
  secret: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
