import React from "react";
import { Play, Pause } from "lucide-react";

interface TimeReplaySliderProps {
  replayMinutesAgo: number;
  maxMinutesAgo?: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onSeek: (minutesAgo: number) => void;
  onTogglePlay: () => void;
  onChangeSpeed: (speed: number) => void;
  onResetToLive: () => void;
  onAdvanceSimTick?: () => void;
  onResetSim?: () => void;
}

export const TimeReplaySlider: React.FC<TimeReplaySliderProps> = ({
  replayMinutesAgo,
  maxMinutesAgo = 360, // 6 hours
  isPlaying,
  playbackSpeed,
  onSeek,
  onTogglePlay,
  onChangeSpeed,
  onResetToLive,
  onAdvanceSimTick,
  onResetSim,
}) => {
  const isLive = replayMinutesAgo === 0;

  const formatTimeLabel = (mins: number) => {
    if (mins === 0) return "LIVE (T = 0)";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `T - ${h}h ${m > 0 ? `${m}m` : ""}`;
    return `T - ${m}m`;
  };

  return (
    <div
      className="glass-panel"
      style={{
        height: "44px",
        borderTop: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: "14px",
        userSelect: "none",
        zIndex: 100,
        position: "relative",
      }}
    >
      {/* Play / Pause / Jump Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <button
          onClick={onTogglePlay}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "26px",
            height: "26px",
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--blue-border)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
          title={isPlaying ? "Pause Timeline" : "Play Timeline"}
        >
          {isPlaying ? <Pause size={12} color="var(--blue-bright)" /> : <Play size={12} />}
        </button>

        {/* Speed Selector */}
        <div style={{ display: "flex", gap: "2px" }}>
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              onClick={() => onChangeSpeed(spd)}
              className="mono"
              style={{
                padding: "3px 6px",
                fontSize: "10px",
                fontWeight: 600,
                backgroundColor: playbackSpeed === spd ? "var(--blue-subtle)" : "var(--bg-input)",
                color: playbackSpeed === spd ? "var(--blue-light)" : "var(--text-secondary)",
                border: `1px solid ${playbackSpeed === spd ? "var(--blue-border)" : "var(--border-subtle)"}`,
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Slider */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
        <span className="mono" style={{ fontSize: "10px", color: "var(--text-muted)" }}>
          T-6h
        </span>

        <input
          type="range"
          min={0}
          max={maxMinutesAgo}
          step={5}
          value={maxMinutesAgo - replayMinutesAgo}
          onChange={(e) => onSeek(maxMinutesAgo - Number(e.target.value))}
          style={{
            flex: 1,
            accentColor: isLive ? "var(--blue-bright)" : "var(--color-warning)",
            cursor: "pointer",
          }}
        />

        <span
          className="mono"
          style={{
            fontSize: "10px",
            color: isLive ? "var(--blue-light)" : "var(--text-muted)",
            fontWeight: isLive ? 700 : 500,
          }}
        >
          LIVE
        </span>
      </div>

      {/* Replay Status & Action Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }} className="mono">
        {onAdvanceSimTick && (
          <button
            onClick={onAdvanceSimTick}
            style={{
              padding: "3px 7px",
              backgroundColor: "var(--color-warning-bg)",
              border: "1px solid var(--color-warning-border)",
              color: "var(--color-warning)",
              borderRadius: "var(--radius-sm)",
              fontSize: "10px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Advance discrete disaster simulation by 15 minutes"
          >
            +15M SIM TICK
          </button>
        )}

        {onResetSim && (
          <button
            onClick={onResetSim}
            style={{
              padding: "3px 7px",
              backgroundColor: "var(--color-critical-bg)",
              border: "1px solid var(--color-critical-border)",
              color: "var(--color-critical)",
              borderRadius: "var(--radius-sm)",
              fontSize: "10px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Reset simulation to T = 0"
          >
            RESET SIM
          </button>
        )}

        <div
          style={{
            padding: "3px 7px",
            backgroundColor: "var(--bg-input)",
            border: `1px solid ${isLive ? "var(--blue-border)" : "var(--color-warning-border)"}`,
            color: isLive ? "var(--blue-light)" : "var(--color-warning)",
            borderRadius: "var(--radius-sm)",
            fontSize: "10px",
            fontWeight: 700,
          }}
        >
          {formatTimeLabel(replayMinutesAgo)}
        </div>

        {!isLive && (
          <button
            onClick={onResetToLive}
            style={{
              padding: "3px 7px",
              backgroundColor: "var(--blue-bright)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              borderRadius: "var(--radius-sm)",
              fontSize: "10px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            JUMP TO LIVE
          </button>
        )}
      </div>
    </div>
  );
};
