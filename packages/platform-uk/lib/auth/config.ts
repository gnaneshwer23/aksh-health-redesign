/**
 * OAuth and clinical identity provider configuration scaffold.
 * No live secrets — proof-mode federation placeholder only.
 */

export type ClinicalIdentityProvider = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

export const clinicalIdentityProviders: ClinicalIdentityProvider[] = [
  {
    id: "clinical-oauth",
    name: "Clinical identity provider",
    description: "Enterprise OAuth 2.0 federation for clinicians and care-team roles.",
    enabled: process.env.CLINICAL_OAUTH_ENABLED === "true"
  }
];

export const authConfig = {
  clinicalOAuth: {
    clientId: process.env.CLINICAL_OAUTH_CLIENT_ID ?? "",
    clientSecret: process.env.CLINICAL_OAUTH_CLIENT_SECRET ?? "",
    issuer: process.env.CLINICAL_OAUTH_ISSUER ?? "https://identity.example.clinical/oauth",
    authorizationUrl: process.env.CLINICAL_OAUTH_AUTHORIZATION_URL ?? "",
    tokenUrl: process.env.CLINICAL_OAUTH_TOKEN_URL ?? "",
    scopes: (process.env.CLINICAL_OAUTH_SCOPES ?? "openid profile clinical_role").split(" ")
  },
  proofMode: process.env.AKSH_AUTH_PROOF_MODE !== "false"
};

export function isClinicalOAuthConfigured() {
  return (
    authConfig.clinicalOAuth.clientId.trim().length > 0 &&
    authConfig.clinicalOAuth.authorizationUrl.trim().length > 0
  );
}

export function buildClinicalOAuthSignInUrl(callbackUrl: string) {
  if (!isClinicalOAuthConfigured()) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: authConfig.clinicalOAuth.clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: authConfig.clinicalOAuth.scopes.join(" ")
  });

  return `${authConfig.clinicalOAuth.authorizationUrl}?${params.toString()}`;
}
