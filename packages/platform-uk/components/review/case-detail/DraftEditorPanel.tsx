import React from "react";
import { Section } from "@/lib/types";

export function DraftEditorPanel({
  sections,
  isAccepted,
  recordFieldEdit,
  updateDraftField,
  setFocusSnapshot
}: {
  sections: Section[];
  isAccepted: boolean;
  recordFieldEdit: (sectionId: string, sectionTitle: string, fieldLabel: string, value: string) => void;
  updateDraftField: (sectionId: string, fieldKey: string, value: string) => void;
  setFocusSnapshot: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  return (
    <div className="stack">
      <h3>FHIR-Shaped Draft</h3>
      {sections.map((section) => (
        <div className="row" key={section.id}>
          <div style={{ width: "100%" }} className="stack">
            <strong>{section.title}</strong>
            {section.fields.map((field) => (
              <label className="stack" key={`${section.id}-${field.key}`} style={{ gap: 8 }}>
                <span className="meta">{field.label}</span>
                <textarea
                  aria-label={`${section.title} ${field.label}`}
                  disabled={isAccepted}
                  onBlur={(event) => recordFieldEdit(section.id, section.title, field.label, event.target.value)}
                  onChange={(event) => updateDraftField(section.id, field.key, event.target.value)}
                  onFocus={(event) =>
                    setFocusSnapshot((current) => ({
                      ...current,
                      [`${section.title}:${field.label}`]: event.target.value
                    }))
                  }
                  style={{
                    width: "100%",
                    minHeight: 84,
                    borderRadius: 14,
                    border: "1px solid var(--line)",
                    padding: 12,
                    font: "inherit",
                    color: "var(--ink)",
                    background: "#fff"
                  }}
                  value={field.value}
                />
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
