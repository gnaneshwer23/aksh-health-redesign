export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendEmailResult = {
  sent: boolean;
  provider: "resend" | "smtp" | "none";
  messageId?: string;
};

function getFromAddress() {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    "Aksh Health <noreply@akshhealth.com>"
  );
}

function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_PORT?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  );
}

async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as { id?: string };
  return { sent: true, provider: "resend", messageId: payload.id };
}

async function sendViaSmtp(input: SendEmailInput): Promise<SendEmailResult> {
  const nodemailer = await import("nodemailer");

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: getFromAddress(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  return { sent: true, provider: "smtp", messageId: info.messageId };
}

/**
 * Sends email via Resend (preferred) or SMTP. If no provider is configured, logs a warning
 * in development and returns sent: false without throwing.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (process.env.RESEND_API_KEY?.trim()) {
    return sendViaResend(input);
  }

  if (isSmtpConfigured()) {
    return sendViaSmtp(input);
  }

  const isDev = process.env.NODE_ENV !== "production";
  const warning = `[email] No provider configured. Would send to ${input.to}: ${input.subject}`;

  if (isDev) {
    console.warn(warning);
    console.warn(input.text);
  } else {
    console.error(warning);
  }

  return { sent: false, provider: "none" };
}

export function isEmailProviderConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() || isSmtpConfigured());
}
