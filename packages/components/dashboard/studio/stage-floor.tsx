type StageFloorTone = "core" | "experimental";

interface StageFloorProps {
  tone?: StageFloorTone;
  glowColor?: string;
  lightColor?: string;
}

export function StageFloor({
  tone = "core",
  glowColor,
  lightColor,
}: StageFloorProps) {
  const palette = tone === "experimental"
    ? {
        glow: "rgba(168, 85, 247, 0.25)",
        glowFalloff: "rgba(139, 92, 246, 0.08)",
        light: "#d4c4ff",
        lightRing: "rgb(157 112 255 / 85%)",
        lightHalo: "rgb(156 109 255 / 80%)",
      }
    : {
        glow: "rgba(255, 255, 255, 0.16)",
        glowFalloff: "rgba(255, 255, 255, 0.045)",
        light: "#f5f3ff",
        lightRing: "rgb(255 255 255 / 55%)",
        lightHalo: "rgb(255 255 255 / 62%)",
      };

  return (
    <div aria-hidden="true" className="studio-stage-floor">
      <div
        className="studio-stage-floor__glow"
        style={{
          background: `radial-gradient(ellipse 48% 30% at 50% 68%, ${glowColor ?? palette.glow} 0%, ${palette.glowFalloff} 48%, transparent 100%)`,
        }}
      />
      <div className="studio-stage-floor__grid" />
      <div
        className="studio-stage-floor__lights"
        style={{
          backgroundImage: `radial-gradient(circle, ${lightColor ?? palette.light} 0 1px, ${palette.lightRing} 1.4px, transparent 4px)`,
          filter: `drop-shadow(0 0 5px ${palette.lightHalo})`,
        }}
      />
    </div>
  );
}
