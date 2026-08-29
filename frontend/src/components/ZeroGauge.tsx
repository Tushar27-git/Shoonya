import React from "react";

interface ZeroGaugeProps {
  score: number;
  isDisputed?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const ZeroGauge: React.FC<ZeroGaugeProps> = ({
  score,
  isDisputed = false,
  size = "md",
  showLabel = true,
}) => {
  const clampedScore = Math.max(0, Math.min(1, score));
  const pct = Math.round(clampedScore * 100);

  // Determine active tier color
  let activeColor = "var(--dark-zone-grey)";
  let tierLabel = "LOW";

  if (isDisputed) {
    activeColor = "var(--dispute-amber)";
    tierLabel = "DISPUTED";
  } else if (clampedScore >= 0.75) {
    activeColor = "var(--signal-cyan)";
    tierLabel = "VERIFIED";
  } else if (clampedScore >= 0.4) {
    activeColor = "var(--dispute-amber)";
    tierLabel = "MODERATE";
  }

  const heightMap = {
    sm: "4px",
    md: "6px",
    lg: "10px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "100%" }}>
      {showLabel && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px" }} className="mono">
          <span style={{ color: "var(--ink-dim)", letterSpacing: "0.5px" }}>
            ZERO GAUGE // {tierLabel}
          </span>
          <span style={{ color: activeColor, fontWeight: 600 }}>
            {(clampedScore).toFixed(2)}
          </span>
        </div>
      )}
      
      <div
        style={{
          width: "100%",
          height: heightMap[size],
          backgroundColor: "var(--void)",
          border: "1px solid var(--grid-line)",
          borderRadius: "1px",
          overflow: "hidden",
          position: "relative",
          display: "flex",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            backgroundColor: activeColor,
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: clampedScore >= 0.75 ? "0 0 6px rgba(79, 216, 196, 0.4)" : "none",
          }}
        />
        {/* Disputed hatched overlay */}
        {isDisputed && (
          <div
            className="hatched-amber"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </div>
  );
};
