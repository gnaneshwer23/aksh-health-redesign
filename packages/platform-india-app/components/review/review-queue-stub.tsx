import Link from "next/link";

import { reviewCases } from "@/lib/types";
import { deriveSafetyFlags, deriveFinalizationState } from "@/lib/types";
import { deriveIndiaHumanGateLabels } from "@/lib/human-gates";
import { hi } from "@/lib/i18n/hi";

function statusLabel(status: string) {
  if (status === "accepted") return "स्वीकृत";
  if (status === "deferred") return "स्थगित";
  if (status === "rejected") return "अस्वीकृत";
  return "समीक्षा लंबित";
}

export function ReviewQueueStub() {
  const cases = reviewCases.slice(0, 5);

  return (
    <section className="panel stack">
      <div>
        <h2>{hi.review.title}</h2>
        <p className="muted">{hi.review.subtitle}</p>
        <p className="muted">{hi.gates.pharmacopoeia} · {hi.gates.icmr}</p>
      </div>

      {cases.length === 0 ? (
        <p>{hi.review.empty}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{hi.review.columns.patient}</th>
              <th>{hi.review.columns.summary}</th>
              <th>{hi.review.columns.status}</th>
              <th>{hi.review.columns.safety}</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((reviewCase) => {
              const flags = deriveSafetyFlags(reviewCase);
              const finalization = deriveFinalizationState(reviewCase);
              const gates = deriveIndiaHumanGateLabels(reviewCase);

              return (
                <tr key={reviewCase.id}>
                  <td>
                    <Link href={`/review#${reviewCase.id}`}>{reviewCase.patientLabel}</Link>
                  </td>
                  <td>{reviewCase.summary}</td>
                  <td>
                    {statusLabel(reviewCase.status)} · {finalization}
                  </td>
                  <td>
                    {flags.length} झंडे · {gates.required} आवश्यक गेट
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
