"use client";

import { FormEvent, useState } from "react";

import { container } from "@/components/marketing/marketing-ui";

export default function NewsletterBand() {
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="owkin-newsletter" aria-label="Newsletter signup">
      <div className={`${container} owkin-newsletter__row`}>
        <h2 className="owkin-newsletter__title">Sign up to our newsletter</h2>
        {submitted ? (
          <p className="owkin-newsletter__thanks" role="status">
            Thanks — we&apos;ll be in touch when there&apos;s something worth your inbox.
          </p>
        ) : (
          <form className="owkin-newsletter__form" onSubmit={onSubmit}>
            <label>
              <span>First name</span>
              <input name="firstName" type="text" autoComplete="given-name" required />
            </label>
            <label>
              <span>Last name</span>
              <input name="lastName" type="text" autoComplete="family-name" required />
            </label>
            <label>
              <span>Email</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <button type="submit" className="owkin-btn-ink owkin-newsletter__submit">
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
