import type { Metadata } from "next";

import { LegalPageLayout } from "@/components/marketing/legal-page-layout";

export const metadata: Metadata = {
  title: "Terms of Service | Aksh Health",
  description:
    "Terms governing use of the Aksh Health clinical AI platform, including acceptable use, account responsibilities, and synthetic demo boundaries.",
};

const COMPANY = "Aksh Health Ltd";
const CONTACT_EMAIL = "legal@akshhealth.com";

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description={`These terms govern your access to and use of the Aksh Health platform and website operated by ${COMPANY}.`}
      lastUpdated="11 July 2026"
      sections={[
        {
          title: "Agreement to terms",
          content: (
            <p>
              By creating an account, signing in, or otherwise using Aksh Health, you agree to these Terms of
              Service and our Privacy Policy. If you use the platform on behalf of an organisation, you confirm
              that you have authority to bind that organisation.
            </p>
          ),
        },
        {
          title: "The service",
          content: (
            <>
              <p>
                Aksh Health provides clinical workflow software with AI-assisted features designed for UK health
                and care settings. The platform supports human review of AI outputs before they are used in
                clinical workflows.
              </p>
              <p>
                Features, integrations, and availability may change as the product develops. We do not guarantee
                uninterrupted access or compatibility with every clinical system without a configured deployment.
              </p>
            </>
          ),
        },
        {
          title: "Not medical advice",
          content: (
            <p>
              Aksh Health is a clinical decision support tool. It does not provide medical advice, diagnosis, or
              treatment. AI-generated content is provisional until reviewed and approved by a qualified clinician.
              You remain responsible for all clinical decisions and patient care.
            </p>
          ),
        },
        {
          title: "Synthetic demo boundary",
          content: (
            <>
              <p>
                Public demonstrations, walkthroughs, and unconfigured environments use synthetic data only. In
                those contexts:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>No real patient identifiers are processed</li>
                <li>No live electronic health record write-back occurs</li>
                <li>Outputs must not be used for real clinical decisions</li>
              </ul>
              <p>
                Production deployments with live clinical data require appropriate organisational agreements,
                lawful basis, and technical configuration.
              </p>
            </>
          ),
        },
        {
          title: "Account responsibilities",
          content: (
            <>
              <p>You are responsible for:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Keeping your login credentials confidential</li>
                <li>All activity that occurs under your account</li>
                <li>Providing accurate registration information</li>
                <li>Using the platform only for lawful purposes within your role</li>
                <li>Promptly notifying us of suspected unauthorised access</li>
              </ul>
              <p>
                We may suspend or terminate accounts that violate these terms or pose a security or safety risk.
              </p>
            </>
          ),
        },
        {
          title: "Acceptable use",
          content: (
            <>
              <p>You must not:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Attempt to access data or areas of the platform without authorisation</li>
                <li>Interfere with platform security, availability, or integrity</li>
                <li>Upload malicious code or attempt to reverse engineer restricted components</li>
                <li>Use the service in a way that breaches patient confidentiality or applicable law</li>
                <li>Misrepresent AI outputs as final clinical records without required human review</li>
                <li>Use synthetic demo environments to process real patient data</li>
              </ul>
            </>
          ),
        },
        {
          title: "Intellectual property",
          content: (
            <p>
              Aksh Health, its software, branding, and documentation remain the property of {COMPANY} or its
              licensors. You receive a limited, non-exclusive right to use the platform according to these terms
              and any applicable organisation agreement.
            </p>
          ),
        },
        {
          title: "Data protection",
          content: (
            <p>
              Our processing of personal data is described in the Privacy Policy. Where your organisation acts as
              data controller for patient information, you are responsible for ensuring a lawful basis and
              appropriate agreements are in place for your use of Aksh Health.
            </p>
          ),
        },
        {
          title: "Disclaimer and limitation of liability",
          content: (
            <>
              <p>
                The platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis to the extent
                permitted by law. We do not warrant that AI outputs are error-free or suitable for any particular
                clinical purpose without human review.
              </p>
              <p>
                To the fullest extent permitted by law, {COMPANY} is not liable for indirect, consequential, or
                special damages arising from use of the platform. Nothing in these terms limits liability that
                cannot be limited under applicable law.
              </p>
            </>
          ),
        },
        {
          title: "Changes and contact",
          content: (
            <>
              <p>
                We may update these terms from time to time. Continued use after changes are posted constitutes
                acceptance where permitted by law.
              </p>
              <p>
                Questions about these terms:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary hover:underline">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
