/** Real NextAuth JWT-session validation + product API + local PostgreSQL. No password-login test. */
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { encode } from "next-auth/jwt";
const base = process.env.HSI_TEST_WEB_URL ?? "http://127.0.0.1:3109";
const url = new URL(base);
if (!["127.0.0.1", "localhost"].includes(url.hostname)) throw new Error("Browser harness refuses non-local servers");
const token = await encode({ secret: "hsi-step3-local-test-secret", token: { id: "usr_hsi_browser", email: "local-research@example.invalid", role: "researcher", onboardingComplete: true, isEmailVerified: true, mfaVerified: true }, maxAge: 300 });
await mkdir("/tmp/hsi-step3-ui", { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.HSI_TEST_CHROMIUM ?? "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
try {
  const anonymous = await browser.newPage(); await anonymous.goto(`${base}/internal-research`); assert.match(anonymous.url(), /signin/); await anonymous.close();
  for (const viewport of [{ width: 1440, height: 1050 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, acceptDownloads: true });
    await context.addCookies([{ name: "next-auth.session-token", value: token, url: base }]);
    const page = await context.newPage(); await page.goto(`${base}/internal-research`);
    await page.getByRole("button", { name: "Reject all", exact: true }).click();
    await page.getByRole("button", { name: "Start investigation", exact: true }).click();
    await page.getByRole("heading", { name: "Human review required", exact: true }).waitFor();
    await page.getByLabel("Review rationale").fill("Browser engineering scenario: obtain verified source passages before scientific assessment.");
    await page.getByRole("button", { name: "Request revision", exact: true }).click();
    await page.getByRole("button", { name: "Download Markdown dossier", exact: true }).waitFor();
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download Markdown dossier", exact: true }).click()]);
    const content = await readFile((await download.path())!, "utf8"); assert.match(content, /request_revision/); assert.match(content, /Research only/);
    await page.reload();
    await page.getByRole("button", { name: /What verified research evidence is available for concept/ }).first().click();
    await page.getByRole("button", { name: "Download JSON dossier", exact: true }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "No horizontal page overflow");
    await page.screenshot({ path: `/tmp/hsi-step3-ui/aksh-${viewport.width}.png`, fullPage: true });
    await context.close();
  }
  console.log("PASS: real NextAuth session, private UI, durable reopen/review/download, desktop and mobile layouts");
} finally { await browser.close(); }
