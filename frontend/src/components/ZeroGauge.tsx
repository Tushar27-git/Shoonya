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

  // Determine active tier color and label
  let activeColor = "var(--text-muted)";
  let tierLabel = "LOW";

  if (isDisputed) {
    activeColor = "var(--color-warning)";
    tierLabel = "DISPUTED";
  } else if (clampedScore >= 0.75) {
    activeColor = "var(--blue-bright)";
    tierLabel = "VERIFIED";
  } else if (clampedScore >= 0.4) {
    activeColor = "var(--color-warning)";
    tierLabel = "MODERATE";
  }

  const heightMap = {
    sm: "3px",
    md: "5px",
    lg: "8px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "100%" }}>
      {showLabel && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "9px",
          }}
          className="mono"
        >
          <span style={{ color: "var(--text-muted)", letterSpacing: "0.5px" }}>
            ZERO GAUGE // {tierLabel}
          </span>
          <span style={{ color: activeColor, fontWeight: 700 }}>
            {clampedScore.toFixed(2)}
          </span>
        </div>
      )}

      <div
        style={{
          width: "100%",
          height: heightMap[size],
          backgroundColor: "var(--bg-input)",
          border: "1px solid var(--border-subtle)",
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
            transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: clampedScore >= 0.75 && !isDisputed ? "0 0 6px rgba(59, 130, 246, 0.4)" : "none",
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
