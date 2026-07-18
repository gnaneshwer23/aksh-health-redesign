import { ImageResponse } from "next/og";

export const alt = "Aksh Health — Clinical AI with human review";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #003D7A 0%, #006B4F 100%)",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              border: "2px solid rgba(255,255,255,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            A
          </div>
          <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: "0.02em" }}>
            Aksh Health
          </div>
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
          Clinical AI with human review
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            opacity: 0.9,
            maxWidth: 820,
            lineHeight: 1.35,
          }}
        >
          FHIR R4 staging, clinician approval gates, and multi-framework compliance design pathways.
        </div>
      </div>
    ),
    { ...size }
  );
}
