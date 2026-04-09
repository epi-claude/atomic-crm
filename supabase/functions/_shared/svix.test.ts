import { assertEquals, assertNotEquals } from "jsr:@std/assert";
import { verifySignature, computeSvixSignature } from "./svix.ts";

// Test secret in whsec_ format (base64-encoded random bytes)
const TEST_SECRET = "whsec_dGVzdHNlY3JldGZvcnVuaXR0ZXN0aW5n"; // base64("testsecretforunittesting")

function nowTs(): string {
  return String(Math.floor(Date.now() / 1000));
}

async function makeHeaders(
  id: string,
  timestamp: string,
  body: string,
  secret: string,
): Promise<Headers> {
  const sig = await computeSvixSignature(id, timestamp, body, secret);
  const h = new Headers();
  h.set("svix-id", id);
  h.set("svix-timestamp", timestamp);
  h.set("svix-signature", sig);
  return h;
}

// ─── valid signature ─────────────────────────────────────────────────────────

Deno.test("verifySignature returns null for a valid signature", async () => {
  const body = JSON.stringify({ type: "email.delivered" });
  const headers = await makeHeaders("msg_123", nowTs(), body, TEST_SECRET);
  const result = await verifySignature(headers, body, TEST_SECRET);
  assertEquals(result, null);
});

Deno.test("verifySignature accepts multiple sigs in svix-signature header", async () => {
  const body = JSON.stringify({ type: "email.opened" });
  const ts = nowTs();
  const validSig = await computeSvixSignature("msg_456", ts, body, TEST_SECRET);
  const headers = new Headers();
  headers.set("svix-id", "msg_456");
  headers.set("svix-timestamp", ts);
  headers.set("svix-signature", `v1,invalidsig ${validSig}`);
  const result = await verifySignature(headers, body, TEST_SECRET);
  assertEquals(result, null);
});

// ─── missing headers ─────────────────────────────────────────────────────────

Deno.test("verifySignature returns 401 when svix-id is missing", async () => {
  const headers = new Headers();
  headers.set("svix-timestamp", nowTs());
  headers.set("svix-signature", "v1,abc");
  const result = await verifySignature(headers, "{}", TEST_SECRET);
  assertNotEquals(result, null);
  assertEquals(result!.status, 401);
});

Deno.test("verifySignature returns 401 when all Svix headers are missing", async () => {
  const result = await verifySignature(new Headers(), "{}", TEST_SECRET);
  assertNotEquals(result, null);
  assertEquals(result!.status, 401);
});

// ─── stale timestamp ─────────────────────────────────────────────────────────

Deno.test("verifySignature returns 401 for timestamp older than 5 minutes", async () => {
  const staleTs = String(Math.floor(Date.now() / 1000) - 400); // 400s ago
  const body = "{}";
  const sig = await computeSvixSignature("msg_old", staleTs, body, TEST_SECRET);
  const headers = new Headers();
  headers.set("svix-id", "msg_old");
  headers.set("svix-timestamp", staleTs);
  headers.set("svix-signature", sig);
  const result = await verifySignature(headers, body, TEST_SECRET);
  assertNotEquals(result, null);
  assertEquals(result!.status, 401);
});

Deno.test("verifySignature returns 401 for non-numeric timestamp", async () => {
  const headers = new Headers();
  headers.set("svix-id", "msg_x");
  headers.set("svix-timestamp", "not-a-number");
  headers.set("svix-signature", "v1,abc");
  const result = await verifySignature(headers, "{}", TEST_SECRET);
  assertNotEquals(result, null);
  assertEquals(result!.status, 401);
});

// ─── wrong signature ─────────────────────────────────────────────────────────

Deno.test("verifySignature returns 401 when signature does not match body", async () => {
  const ts = nowTs();
  const sig = await computeSvixSignature("msg_789", ts, "original body", TEST_SECRET);
  const headers = new Headers();
  headers.set("svix-id", "msg_789");
  headers.set("svix-timestamp", ts);
  headers.set("svix-signature", sig);
  // Pass a different body than what was signed
  const result = await verifySignature(headers, "tampered body", TEST_SECRET);
  assertNotEquals(result, null);
  assertEquals(result!.status, 401);
});

Deno.test("verifySignature returns 401 for wrong secret", async () => {
  const body = "{}";
  const ts = nowTs();
  const sig = await computeSvixSignature("msg_abc", ts, body, TEST_SECRET);
  const headers = new Headers();
  headers.set("svix-id", "msg_abc");
  headers.set("svix-timestamp", ts);
  headers.set("svix-signature", sig);
  const wrongSecret = "whsec_d3JvbmdzZWNyZXRmb3J1bml0dGVzdGluZw=="; // different bytes
  const result = await verifySignature(headers, body, wrongSecret);
  assertNotEquals(result, null);
  assertEquals(result!.status, 401);
});
