import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(180deg, rgba(11, 12, 14, 1), rgba(7, 8, 10, 1))",
          color: "#f7f8f8",
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: "-0.08em",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 3,
            borderRadius: 9,
            border: "1px solid rgba(129, 143, 255, 0.35)",
            background:
              "linear-gradient(135deg, rgba(94, 106, 210, 0.4), rgba(94, 106, 210, 0.08))",
          }}
        />
        <span style={{ position: "relative", zIndex: 1 }}>PF</span>
      </div>
    ),
    {
      ...size,
    },
  );
}
