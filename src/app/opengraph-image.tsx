import { ImageResponse } from "next/og";

// Link preview card for LinkedIn, X and chat apps.
export const alt = "Orbit: say the outcome, get the finished work";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: "#0c0d0f",
          backgroundImage: "radial-gradient(circle at 15% 10%, rgba(242,181,68,0.18), transparent 60%)",
          color: "#ece9e2",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 600 }}>
          <div style={{ width: 28, height: 28, borderRadius: 999, background: "#f2b544" }} />
          Orbit
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 80, fontWeight: 600, letterSpacing: -3, lineHeight: 1.05 }}>Say the outcome.</div>
          <div style={{ fontSize: 80, fontWeight: 600, letterSpacing: -3, lineHeight: 1.05, color: "#8d8b85" }}>
            Get the finished work.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#8d8b85" }}>
          <span>AI agents that plan, research the web and deliver</span>
          <span style={{ color: "#f2b544" }}>orbit-ai-agents.vercel.app</span>
        </div>
      </div>
    ),
    size,
  );
}
