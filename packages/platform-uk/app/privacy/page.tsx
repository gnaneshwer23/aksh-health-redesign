import type { Metadata } from "next";

import { LegalPageLayout } from "@/components/marketing/legal-page-layout";

export const metadata: Metadata = {
  title: "Privacy Policy ",
  description:
    "How Aksh Health Ltd processes personal and health data under UK GDPR, including special category data under Article 9.",
};

const DATA_CONTROLLER = "Aksh Health Ltd";
const CONTACT_EMAIL = "legal@akshhealth.com";

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="This policy explains how Aksh Health Ltd collects, uses, stores, and protects personal data when you use our clinical AI platform, website, and related services."
      lastUpdated="11 July 2026"
      sections={[
        {
          title: "Who we are",
          content: (
            <>
              <p>
                {DATA_CONTROLLER} is the data controller for personal data processed through the Aksh Health platform
                and this website. For privacy enquiries, contact us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary hover:underline">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </>
          ),
        },
        {
          title: "What data we collect",
          content: (
            <>
              <p>Depending on how you use Aksh Health, we may process:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Account details such as name, email address, role, and organisation</li>
                <li>Authentication and session data required to secure your account</li>
                <li>Clinical workflow data you submit or review within the platform</li>
                <li>Health data classified as special category data under UK GDPR Article 9</li>
                <li>Technical logs, audit records, and security events</li>
                <li>Organisation enquiry details submitted via our access request form</li>
              </ul>
              <p>
                Production deployments process patient data under organisation agreements, with role-based access,
                audit logging, and UK GDPR Article 9 safeguards for special category health data.
              </p>
            </>
          ),
        },
        {
          title: "Lawful basis and Article 9 health data",
          content: (
            <>
              <p>
                We process personal data where necessary to perform our contract with you, comply with legal
                obligations, pursue legitimate interests in operating a secure clinical platform, or with your
                consent where required.
              </p>
              <p>
                Health data is special category data under UK GDPR Article 9. We process it only where a valid
                condition applies, which may include explicit consent, provision of health or social care, or
                other lawful bases agreed for your deployment. We apply purpose limitation, data minimisation, and
                access controls so only authorised users can view data required for their role.
              </p>
            </>
          ),
        },
        {
          title: "How we use your data",
          content: (
            <>
              <ul className="list-disc space-y-2 pl-5">
                <li>Provide, secure, and maintain your account and authenticated sessions</li>
                <li>Deliver clinical workflow features with human review before outputs are finalised</li>
                <li>Record audit trails of AI recommendations and clinician decisions</li>
                <li>Respond to organisation enquiries and support requests</li>
                <li>Improve reliability, safety, and performance of the platform</li>
                <li>Meet regulatory, security, and clinical safety obligations</li>
              </ul>
              <p>
                Aksh Health is a clinical decision support tool. It does not provide medical advice and does not
                replace professional clinical judgement.
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies and similar technologies",
          content: (
            <>
              <p>
                We use essential cookies to keep you signed in and to protect the platform. We do not currently use
                analytics cookies. Optional analytics, if enabled in future, will only run with your consent. You can
                manage preferences using the banner on this site.
              </p>
              <p>
                For a full list of cookies and storage we use, see our{" "}
                <a href="/cookies" className="font-medium text-primary hover:underline">
                  Cookie Policy
                </a>
                .
              </p>
            </>
          ),
        },
        {
          title: "Data sharing and processors",
          content: (
            <>
              <p>
                We use infrastructure and service providers that process data on our instructions, including
                hosting, database, and email delivery providers. We require appropriate contractual safeguards and
                do not sell personal data.
              </p>
              <p>
                Where your organisation connects Aksh Health to clinical systems, data sharing is governed by your
                organisation&apos;s agreements and deployment configuration.
              </p>
            </>
          ),
        },
        {
          title: "International transfers",
          content: (
            <p>
              We design for UK and EU data residency appropriate to NHS workloads. Where data is transferred
              outside the UK, we use appropriate safeguards such as standard contractual clauses or equivalent
              protections.
            </p>
          ),
        },
        {
          title: "Retention and security",
          content: (
            <>
              <p>
                We retain personal data only for as long as needed for the purposes described in this policy,
                including legal, audit, and clinical safety requirements. We apply encryption in transit,
                access controls, role-based permissions, and monitoring to protect data.
              </p>
            </>
          ),
        },
        {
          title: "Your rights",
          content: (
            <>
              <p>Under UK GDPR you may have rights to:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Access your personal data</li>
                <li>Rectify inaccurate data</li>
                <li>Erase data in certain circumstances</li>
                <li>Restrict or object to processing in certain circumstances</li>
                <li>Data portability where applicable</li>
                <li>Withdraw consent where processing is based on consent</li>
              </ul>
              <p>
                To exercise your rights, contact{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary hover:underline">
                  {CONTACT_EMAIL}
                </a>
                . You may also complain to the Information Commissioner&apos;s Office (ICO).
              </p>
            </>
          ),
        },
        {
          title: "Changes to this policy",
          content: (
            <p>
              We may update this policy from time to time. Material changes will be reflected on this page with an
              updated date. Continued use of the platform after changes take effect constitutes acceptance of the
              revised policy where permitted by law.
            </p>
          ),
        },
      ]}
    />
  );
}
