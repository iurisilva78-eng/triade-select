import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          background: "#F6F2EC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="124" height="124" viewBox="0 0 100 100" fill="none">
          <polygon
            points="50,8 90,78 10,78"
            stroke="#C9973A"
            strokeWidth="6"
            fill="none"
            strokeLinejoin="round"
          />
          <polygon
            points="50,92 10,22 90,22"
            stroke="#C9973A"
            strokeWidth="5"
            fill="none"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
