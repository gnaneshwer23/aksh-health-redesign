import { expect, type APIRequestContext, type Page } from "@playwright/test";

import { DEMO_PASSWORD } from "../../lib/auth/demo-users";

export { DEMO_PASSWORD };

export const DEMO_GP = {
  email: "gp@demo.akshhealth.com",
  password: DEMO_PASSWORD,
} as const;

export const DEMO_PATIENT = {
  email: "patient@demo.akshhealth.com",
  password: DEMO_PASSWORD,
} as const;

export const DEMO_ONBOARDING = {
  email: "onboarding@demo.akshhealth.com",
  password: DEMO_PASSWORD,
} as const;

export async function signInViaApi(
  request: APIRequestContext,
  baseURL: string,
  email: string,
  password: string
) {
  const csrfResponse = await request.get("/api/auth/csrf");
  if (!csrfResponse.ok()) {
    throw new Error(`/api/auth/csrf returned ${csrfResponse.status()}`);
  }

  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
  const signInResponse = await request.post("/api/auth/callback/credentials?json=true", {
    form: {
      csrfToken,
      email,
      password,
      callbackUrl: baseURL,
      json: "true",
    },
  });

  if (!signInResponse.ok()) {
    throw new Error(`Credentials sign-in returned ${signInResponse.status()}`);
  }
}

export async function applyApiCookiesToPage(page: Page, request: APIRequestContext) {
  const state = await request.storageState();
  if (state.cookies.length > 0) {
    await page.context().addCookies(state.cookies);
  }
}

export async function signInViaUi(page: Page, email: string, password: string) {
  await page.goto("/signin");
  const emailInput = page.getByTestId("signin-email");
  const passwordInput = page.getByTestId("signin-password");
  await emailInput.waitFor({ state: "visible" });
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.getByTestId("signin-submit").click();

  await expect
    .poll(
      async () => {
        const response = await page.request.get("/api/auth/session");
        const session = (await response.json()) as { user?: { email?: string } };
        return session.user?.email ?? null;
      },
      { timeout: 20_000 }
    )
    .toBe(email);
}
