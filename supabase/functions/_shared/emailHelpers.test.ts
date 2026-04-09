import { assertEquals, assertStringIncludes } from "jsr:@std/assert";
import { interpolate, getPrimaryEmail, buildEmailHtml } from "./emailHelpers.ts";

// ─── interpolate ────────────────────────────────────────────────────────────

Deno.test("interpolate replaces {first_name} with the given name", () => {
  assertEquals(interpolate("Hi {first_name}!", "Randy"), "Hi Randy!");
});

Deno.test("interpolate replaces multiple occurrences", () => {
  assertEquals(
    interpolate("{first_name}, hey {first_name}.", "Randy"),
    "Randy, hey Randy.",
  );
});

Deno.test("interpolate leaves other placeholders untouched", () => {
  assertEquals(interpolate("Hello {last_name}", "Randy"), "Hello {last_name}");
});

Deno.test("interpolate handles empty first_name gracefully", () => {
  assertEquals(interpolate("Hi {first_name}!", ""), "Hi !");
});

// ─── getPrimaryEmail ─────────────────────────────────────────────────────────

Deno.test("getPrimaryEmail returns null for null input", () => {
  assertEquals(getPrimaryEmail(null), null);
});

Deno.test("getPrimaryEmail returns null for empty array", () => {
  assertEquals(getPrimaryEmail([]), null);
});

Deno.test("getPrimaryEmail returns null for non-array input", () => {
  assertEquals(getPrimaryEmail("not-an-array"), null);
  assertEquals(getPrimaryEmail(42), null);
  assertEquals(getPrimaryEmail({}), null);
});

Deno.test("getPrimaryEmail returns Work email when present", () => {
  const emails = [
    { email: "personal@example.com", type: "Personal" },
    { email: "work@example.com", type: "Work" },
  ];
  assertEquals(getPrimaryEmail(emails), "work@example.com");
});

Deno.test("getPrimaryEmail falls back to first entry when no Work type", () => {
  const emails = [
    { email: "first@example.com", type: "Personal" },
    { email: "second@example.com", type: "Other" },
  ];
  assertEquals(getPrimaryEmail(emails), "first@example.com");
});

Deno.test("getPrimaryEmail handles single entry with no type", () => {
  assertEquals(getPrimaryEmail([{ email: "solo@example.com" }]), "solo@example.com");
});

Deno.test("getPrimaryEmail returns null when email field is missing", () => {
  assertEquals(getPrimaryEmail([{ type: "Work" }]), null);
});

// ─── buildEmailHtml ──────────────────────────────────────────────────────────

Deno.test("buildEmailHtml includes the body fragment", () => {
  const html = buildEmailHtml("<p>Hello!</p>", "https://example.com/unsub");
  assertStringIncludes(html, "<p>Hello!</p>");
});

Deno.test("buildEmailHtml includes the unsubscribe URL", () => {
  const url = "https://example.com/unsub?eid=42&token=abc";
  const html = buildEmailHtml("<p>Hi</p>", url);
  assertStringIncludes(html, url);
});

Deno.test("buildEmailHtml is a valid HTML document", () => {
  const html = buildEmailHtml("<p>Test</p>", "https://example.com/unsub");
  assertStringIncludes(html, "<!DOCTYPE html>");
  assertStringIncludes(html, "<html>");
  assertStringIncludes(html, "</html>");
  assertStringIncludes(html, "Unsubscribe");
});
