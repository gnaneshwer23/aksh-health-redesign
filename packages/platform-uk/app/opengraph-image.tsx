import { ImageResponse } from "next/og";

export const alt = "Aksh Health — Diabetes reviews, better coordinated";
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
          background: "linear-gradient(145deg, #0C1513 0%, #0B4A42 48%, #00A88E 120%)",
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
              borderRadius: 16,
              background: "#00A88E",
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
        <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.1, maxWidth: 940 }}>
          Diabetes reviews, better coordinated.
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 26,
            opacity: 0.9,
            maxWidth: 820,
            lineHeight: 1.35,
          }}
        >
          Fill cancelled appointments and see whose glucose needs attention first. Your staff decide every step.
        </div>
      </div>
    ),
    { ...size }
  );
}
