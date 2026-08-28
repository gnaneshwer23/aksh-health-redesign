import assert from "node:assert/strict";

import {
  getEmailDeliveryMode,
  getEmailDeliveryUserHint,
  isResendSandboxMode,
} from "../lib/email/delivery-status";

function withEnv(overrides: Record<string, string | undefined>, fn: () => void) {
  const previous = { ...process.env };
  Object.assign(process.env, overrides);
  try {
    fn();
  } finally {
    process.env = previous;
  }
}

function testResendSandboxDetection() {
  withEnv(
    {
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: "Aksh Health <onboarding@resend.dev>",
      SMTP_HOST: undefined,
    },
    () => {
      assert.equal(getEmailDeliveryMode(), "resend_sandbox");
      assert.equal(isResendSandboxMode(), true);
      assert.ok(getEmailDeliveryUserHint()?.includes("demo launch"));
    }
  );
}

function testVerifiedDomain() {
  withEnv(
    {
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: "Aksh Health <noreply@akshhealth.com>",
    },
    () => {
      assert.equal(getEmailDeliveryMode(), "verified_domain");
      assert.equal(isResendSandboxMode(), false);
      assert.equal(getEmailDeliveryUserHint(), null);
    }
  );
}

function testUnconfigured() {
  withEnv(
    {
      RESEND_API_KEY: undefined,
      SMTP_HOST: undefined,
      EMAIL_FROM: undefined,
    },
    () => {
      assert.equal(getEmailDeliveryMode(), "unconfigured");
      assert.ok(getEmailDeliveryUserHint()?.includes("not configured"));
    }
  );
}

async function main() {
  testResendSandboxDetection();
  testVerifiedDomain();
  testUnconfigured();
  console.log("Email delivery status tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
