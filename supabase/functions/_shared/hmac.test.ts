import { assertEquals, assertNotEquals } from "jsr:@std/assert";
import { hmacHex } from "./hmac.ts";

Deno.test("hmacHex returns a 64-char lowercase hex string", async () => {
  const result = await hmacHex("hello", "secret");
  assertEquals(result.length, 64);
  assertEquals(result, result.toLowerCase());
  // only hex chars
  assertEquals(/^[0-9a-f]+$/.test(result), true);
});

Deno.test("hmacHex is deterministic — same inputs produce same output", async () => {
  const a = await hmacHex("enrollment_id_42", "my-secret");
  const b = await hmacHex("enrollment_id_42", "my-secret");
  assertEquals(a, b);
});

Deno.test("hmacHex produces different output for different messages", async () => {
  const a = await hmacHex("enrollment_id_42", "my-secret");
  const b = await hmacHex("enrollment_id_43", "my-secret");
  assertNotEquals(a, b);
});

Deno.test("hmacHex produces different output for different secrets", async () => {
  const a = await hmacHex("enrollment_id_42", "secret-a");
  const b = await hmacHex("enrollment_id_42", "secret-b");
  assertNotEquals(a, b);
});

Deno.test("hmacHex known-value: HMAC-SHA256('hello', 'secret')", async () => {
  // Verified independently: echo -n 'hello' | openssl dgst -sha256 -hmac 'secret'
  const result = await hmacHex("hello", "secret");
  assertEquals(
    result,
    "88aab3ede8d3adf94d26ab90d3bafd4a2083070c3bcce9c014ee04a443847c0b",
  );
});
