/** Two-step sign-in: RFC 6238 vectors, base32, encryption at rest, enrolment, single use, recovery codes, disable. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { confirmEnrolment, decryptSecret, disableMfa, encryptSecret, isMfaEnabled, mfaStatus, startEnrolment, verifySecondFactor } from "../lib/auth/mfa";
import { base32Decode, base32Encode, hotp, stepAt, verifyTotp } from "../lib/auth/totp";
import { closePgPool, getPgPool, isPostgresConfigured } from "../lib/db/client";
import { assertNotProductionDatabase } from "../lib/db/deployment-guard";
import { assertSeedingAllowed } from "../lib/env/deployment";

function pure() {
  // RFC 6238 Appendix B (SHA-1 seed "12345678901234567890"), last 6 of the 8-digit values.
  const seed = Buffer.from("12345678901234567890");
  assert.equal(hotp(seed, stepAt(59_000), 8), "94287082");
  assert.equal(hotp(seed, stepAt(1_111_111_109_000), 8), "07081804");
  assert.equal(hotp(seed, stepAt(59_000)), "287082");
  const b32 = base32Encode(seed);
  assert.equal(b32, "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  assert.deepEqual(base32Decode(b32), seed);
  assert.equal(verifyTotp(b32, "287082", 59_000), stepAt(59_000));
  assert.equal(verifyTotp(b32, "287082", 59_000 + 90_000), null, "outside the ±1 step window");
  assert.equal(verifyTotp(b32, "abc123", 59_000), null);
  const enc = encryptSecret("SECRET");
  assert.notEqual(enc, "SECRET");
  assert.equal(decryptSecret(enc), "SECRET");
  // Flip the second-to-last character relative to itself (not the last char). The previous
  // endsWith("A")? "B":"A" logic was a no-op whenever that character was already the chosen
  // replacement, so AES-GCM integrity did not always fire in CI.
  const flip = enc.at(-2) === "A" ? "B" : "A";
  const tampered = enc.slice(0, -2) + flip + enc.slice(-1);
  assert.notEqual(tampered, enc);
  assert.throws(() => decryptSecret(tampered), /Unsupported state|unable to authenticate|auth/i);
}

async function run() {
  pure();
  if (!isPostgresConfigured()) return console.log("mfa: pure checks PASS; DB part skipped");
  assertSeedingAllowed("mfa-test");
  await assertNotProductionDatabase(getPgPool(), "mfa-test");
  const id = randomUUID();
  await getPgPool().query(`INSERT INTO aksh.users (id, email, password_hash) VALUES ($1, $2, 'x')`, [id, `mfa-${id.slice(0, 8)}@akshhealth.test`]);
  const { secret, uri } = await startEnrolment(id, "mfa@akshhealth.test");
  assert.match(uri, /^otpauth:\/\/totp\/Aksh%20Health%3Amfa%40akshhealth\.test\?secret=/);
  assert.equal(await isMfaEnabled(id), false, "not on until confirmed");
  const stored = (await getPgPool().query(`SELECT secret_enc FROM aksh.user_mfa WHERE user_id = $1`, [id])).rows[0].secret_enc as string;
  assert.ok(!stored.includes(secret), "secret encrypted at rest");
  await assert.rejects(confirmEnrolment(id, "000000"), /INVALID_CODE/);
  const now = Date.now();
  const first = hotp(base32Decode(secret), stepAt(now));
  const { recoveryCodes } = await confirmEnrolment(id, first);
  assert.equal(recoveryCodes.length, 8);
  assert.equal(await isMfaEnabled(id), true);
  await assert.rejects(startEnrolment(id, "x"), /ALREADY_ENABLED/);
  assert.equal(await verifySecondFactor(id, first), null, "the confirming code cannot be replayed");
  // A later step works once.
  const next = hotp(base32Decode(secret), stepAt(now) + 1);
  // verifyTotp allows ±1 step, so the next step's code is accepted now and then never again.
  assert.equal(await verifySecondFactor(id, next), "totp");
  assert.equal(await verifySecondFactor(id, next), null);
  assert.equal(await verifySecondFactor(id, recoveryCodes[0]!.toLowerCase()), "recovery");
  assert.equal(await verifySecondFactor(id, recoveryCodes[0]!), null, "recovery codes are single use");
  assert.equal((await mfaStatus(id)).recoveryCodesLeft, 7);
  await assert.rejects(disableMfa(id, "123456"), /INVALID_CODE/);
  await disableMfa(id, recoveryCodes[1]!);
  assert.equal(await isMfaEnabled(id), false);
  console.log("mfa: RFC 6238 vectors, base32, encryption, enrolment, single use, recovery codes, disable — PASS");
}

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => closePgPool());
