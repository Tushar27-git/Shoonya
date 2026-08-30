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
  // pct removed

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

  const radiusMap = { sm: 12, md: 20, lg: 32 };
  const strokeMap = { sm: 3, md: 4, lg: 5 };
  
  const r = radiusMap[size];
  const strokeWidth = strokeMap[size];
  const cx = r + strokeWidth;
  const cy = r + strokeWidth;
  const svgSize = (r + strokeWidth) * 2;
  
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (clampedScore * circumference);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }} data-testid="zero-gauge">
      <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} style={{ transform: "rotate(-90deg)" }}>
        {/* Background Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--grid-line)"
          strokeWidth={strokeWidth}
        />
        
        {/* Fill Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="butt"
          style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
          data-testid="gauge-fill"
        />
        
        {/* Hatched pattern representation using a secondary SVG overlay for disputed state */}
        {isDisputed && (
           <circle
             cx={cx}
             cy={cy}
             r={r}
             fill="none"
             stroke="var(--void)"
             strokeWidth={strokeWidth}
             strokeDasharray="2 4"
             style={{ opacity: 0.5 }}
           />
        )}
      </svg>
      
      {showLabel && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: "10px" }} className="mono">
          <span style={{ color: activeColor, fontWeight: 600, fontSize: size === 'lg' ? '14px' : '11px' }} data-testid="gauge-score">
            {(clampedScore).toFixed(2)}
          </span>
          <span style={{ color: "var(--ink-dim)", letterSpacing: "0.5px" }}>
            {tierLabel}
          </span>
        </div>
      )}
    </div>
  );
};
