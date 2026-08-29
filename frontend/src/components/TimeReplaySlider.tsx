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

  // Format relative time label
  const formatTimeLabel = (mins: number) => {
    if (mins === 0) return "LIVE (T = 0)";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `T - ${h}h ${m > 0 ? `${m}m` : ""}`;
    return `T - ${m}m`;
  };

  return (
    <div
      style={{
        height: "48px",
        backgroundColor: "var(--panel)",
        borderTop: "1px solid var(--grid-line)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: "16px",
        userSelect: "none",
        zIndex: 100,
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
            width: "28px",
            height: "28px",
            backgroundColor: "var(--void)",
            border: "1px solid var(--grid-line)",
            color: "var(--ink)",
            borderRadius: "2px",
            cursor: "pointer",
          }}
          title={isPlaying ? "Pause Timeline" : "Play Timeline"}
        >
          {isPlaying ? <Pause size={14} color="var(--signal-cyan)" /> : <Play size={14} />}
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
                backgroundColor: playbackSpeed === spd ? "var(--grid-line-bright)" : "var(--void)",
                color: playbackSpeed === spd ? "var(--signal-cyan)" : "var(--ink-dim)",
                border: "1px solid var(--grid-line)",
                borderRadius: "2px",
                cursor: "pointer",
              }}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Slider */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
        <span className="mono" style={{ fontSize: "10px", color: "var(--ink-dim)" }}>
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
            accentColor: isLive ? "var(--signal-cyan)" : "var(--dispute-amber)",
            cursor: "pointer",
          }}
        />

        <span className="mono" style={{ fontSize: "10px", color: "var(--signal-cyan)" }}>
          LIVE
        </span>
      </div>

      {/* Current Replay Indicator & Action Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }} className="mono">
        {onAdvanceSimTick && (
          <button
            onClick={onAdvanceSimTick}
            style={{
              padding: "4px 8px",
              backgroundColor: "rgba(232, 163, 61, 0.15)",
              border: "1px solid var(--dispute-amber)",
              color: "var(--dispute-amber)",
              borderRadius: "2px",
              fontSize: "10px",
              fontWeight: 700,
              cursor: "pointer",
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
              padding: "4px 8px",
              backgroundColor: "rgba(214, 85, 60, 0.15)",
              border: "1px solid var(--critical-ember)",
              color: "var(--critical-ember)",
              borderRadius: "2px",
              fontSize: "10px",
              fontWeight: 700,
              cursor: "pointer",
            }}
            title="Reset simulation to T = 0"
          >
            RESET SIM
          </button>
        )}

        <div
          style={{
            padding: "3px 8px",
            backgroundColor: "var(--void)",
            border: `1px solid ${isLive ? "var(--signal-cyan)" : "var(--dispute-amber)"}`,
            color: isLive ? "var(--signal-cyan)" : "var(--dispute-amber)",
            borderRadius: "2px",
            fontSize: "11px",
            fontWeight: 700,
          }}
        >
          {formatTimeLabel(replayMinutesAgo)}
        </div>

        {!isLive && (
          <button
            onClick={onResetToLive}
            style={{
              padding: "4px 8px",
              backgroundColor: "rgba(79, 216, 196, 0.15)",
              border: "1px solid var(--signal-cyan)",
              color: "var(--signal-cyan)",
              borderRadius: "2px",
              fontSize: "10px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            JUMP TO LIVE
          </button>
        )}
      </div>
    </div>
  );
};

