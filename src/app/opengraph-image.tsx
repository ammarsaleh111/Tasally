import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Tasally — Free daily puzzle & brain games online";
export const size = {
  width: 1200,
  height: 630,
};
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
          padding: "64px",
          background:
            "radial-gradient(circle at top right, #1e293b 0%, #0f172a 45%, #020617 100%)",
          color: "#f8fafc",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "10px 18px",
            borderRadius: "999px",
            border: "1px solid rgba(148,163,184,0.45)",
            color: "#cbd5e1",
            fontSize: 28,
            marginBottom: 26,
          }}
        >
          Your Daily Brain Challenge
        </div>
        <div style={{ fontSize: 86, fontWeight: 800, lineHeight: 1.02 }}>Tasally</div>
        <div
          style={{
            marginTop: 18,
            maxWidth: 980,
            color: "#cbd5e1",
            fontSize: 36,
            lineHeight: 1.28,
          }}
        >
          9 free daily puzzle games — Wordle, Connections, Mini Crossword, Numbers, Trivia, Strands, Waffle, Combinations, and Spelling Bee.
        </div>
      </div>
    ),
    size
  );
}

