import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const E2E_TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "E2eTestPass1!";

export type E2eSignupRole =
  | "gp"
  | "nurse"
  | "pharmacist"
  | "practice-manager"
  | "ics-lead"
  | "hospital-executive"
  | "patient"
  | "researcher";

export function uniqueE2eEmail(label: string) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `e2e+${label}+${stamp}@akshhealth.test`;
}

export async function signUpViaApi(
  request: APIRequestContext,
  input: {
    email: string;
    password: string;
    role: E2eSignupRole;
    fullName?: string;
  }
) {
  const response = await request.post("/api/auth/signup", {
    data: {
      email: input.email,
      password: input.password,
      confirmPassword: input.password,
      role: input.role,
      fullName: input.fullName ?? "E2E Test User",
    },
  });

  if (response.status() !== 201) {
    const body = await response.text();
    throw new Error(`Signup failed (${response.status()}): ${body}`);
  }

  return (await response.json()) as { userId: string; email: string; role: string };
}

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

export async function completeOnboardingViaApi(request: APIRequestContext, role: E2eSignupRole) {
  const response = await request.post("/api/onboarding/complete", {
    data: {
      role,
      fullName: "E2E Test User",
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Onboarding complete failed (${response.status()}): ${body}`);
  }
}

export async function createFreshTestUser(
  request: APIRequestContext,
  baseURL: string,
  options: { role: E2eSignupRole; label: string; password?: string }
) {
  const email = uniqueE2eEmail(options.label);
  const password = options.password ?? E2E_TEST_PASSWORD;

  await signUpViaApi(request, {
    email,
    password,
    role: options.role,
  });
  await signInViaApi(request, baseURL, email, password);

  return { email, password };
}

export async function createOnboardedTestUser(
  request: APIRequestContext,
  baseURL: string,
  options: { role: E2eSignupRole; label: string; password?: string }
) {
  const { email, password } = await createFreshTestUser(request, baseURL, options);
  await completeOnboardingViaApi(request, options.role);
  await signInViaApi(request, baseURL, email, password);

  return { email, password };
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
