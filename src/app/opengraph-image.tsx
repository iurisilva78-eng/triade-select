import { ImageResponse } from "next/og";

export const alt = "Triade Select — Uniformes para Barbearias";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#F6F2EC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 0,
          position: "relative",
        }}
      >
        {/* Subtle grain texture via radial gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(201,151,58,0.10) 0%, transparent 60%)",
          }}
        />

        {/* Gold top line */}
        <div
          style={{
            width: 64,
            height: 2,
            background: "#C9973A",
            marginBottom: 32,
            opacity: 0.8,
          }}
        />

        {/* Logo mark — two interlocked triangles */}
        <svg
          width="110"
          height="110"
          viewBox="0 0 100 100"
          fill="none"
          style={{ marginBottom: 24 }}
        >
          <polygon
            points="50,8 90,78 10,78"
            stroke="#C9973A"
            strokeWidth="5"
            fill="none"
            strokeLinejoin="round"
          />
          <polygon
            points="50,92 10,22 90,22"
            stroke="#C9973A"
            strokeWidth="4"
            fill="none"
            strokeLinejoin="round"
          />
        </svg>

        {/* Brand name */}
        <div
          style={{
            color: "#1A1714",
            fontSize: 56,
            fontWeight: 400,
            letterSpacing: "0.12em",
            fontFamily: "serif",
            marginBottom: 12,
          }}
        >
          TRIADE SELECT
        </div>

        {/* Tagline */}
        <div
          style={{
            color: "#C9973A",
            fontSize: 18,
            letterSpacing: "0.22em",
            fontFamily: "sans-serif",
            fontWeight: 400,
            textTransform: "uppercase",
            marginBottom: 32,
          }}
        >
          Uniformes para Barbearias
        </div>

        {/* Gold bottom line */}
        <div
          style={{
            width: 64,
            height: 1,
            background: "#C9973A",
            opacity: 0.4,
          }}
        />

        {/* URL watermark */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            color: "rgba(26,23,20,0.3)",
            fontSize: 14,
            letterSpacing: "0.1em",
            fontFamily: "sans-serif",
          }}
        >
          triadeselect.com.br
        </div>
      </div>
    ),
    { ...size }
  );
}
