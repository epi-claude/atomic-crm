/**
 * Pure helper functions for building and interpolating drip campaign emails.
 * Extracted from drip-sender/index.ts so they can be unit-tested.
 */

/**
 * Replaces {first_name} placeholder in a template string.
 */
export function interpolate(template: string, firstName: string): string {
  return template.replace(/\{first_name\}/g, firstName);
}

/**
 * Picks the best email address from the contacts.email JSONB column.
 * Returns the "Work" address if present, otherwise the first entry.
 */
export function getPrimaryEmail(emailJsonb: unknown): string | null {
  if (!Array.isArray(emailJsonb) || emailJsonb.length === 0) return null;
  const work = emailJsonb.find((e: { type?: string }) => e.type === "Work");
  return ((work ?? emailJsonb[0]) as { email?: string })?.email ?? null;
}

/**
 * Wraps an HTML body fragment in a full email shell with an unsubscribe footer.
 */
export function buildEmailHtml(
  bodyFragment: string,
  unsubscribeUrl: string,
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px 16px;color:#111;line-height:1.6;">
  ${bodyFragment}
  <p style="margin-top:40px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999;">
    <a href="${unsubscribeUrl}" style="color:#999;">Unsubscribe</a>
  </p>
</body>
</html>`;
}
