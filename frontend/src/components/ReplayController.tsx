import React, { useState, useEffect, useRef } from 'react';

export const ReplayController: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1440 minutes
  const [scenario, setScenario] = useState<any[]>([]);
  const [currentCheckpoint, setCurrentCheckpoint] = useState<string | null>(null);
  
  // Total playback time is 40 seconds = 40000 ms. We simulate 1440 minutes.
  // So 1 ms real time = 1440/40000 = 0.036 minutes
  const PLAYBACK_DURATION_MS = 40000;
  const TOTAL_SIM_MINUTES = 1440;
  
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Fetch scenario script
    fetch('/simulation/scenario')
      .then(res => res.json())
      .then(data => setScenario(data))
      .catch(err => console.error("Failed to load scenario", err));
  }, []);

  const play = () => {
    setIsPlaying(true);
    startTimeRef.current = performance.now();
    animate(startTimeRef.current);
  };

  const pause = () => {
    setIsPlaying(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  const animate = (timestamp: number) => {
    if (!startTimeRef.current) return;
    const elapsedMs = timestamp - startTimeRef.current;
    
    if (elapsedMs >= PLAYBACK_DURATION_MS) {
      setProgress(TOTAL_SIM_MINUTES);
      setIsPlaying(false);
      return;
    }
    
    const currentSimMinutes = (elapsedMs / PLAYBACK_DURATION_MS) * TOTAL_SIM_MINUTES;
    setProgress(currentSimMinutes);
    
    // Process events that fall within this window
    // In a full implementation, we'd fire these to the backend ingestion queue
    const currentEvents = scenario.filter(ev => ev.time_offset_minutes <= currentSimMinutes);
    const lastEventWithCheckpoint = currentEvents.filter(ev => ev.checkpoint).pop();
    if (lastEventWithCheckpoint) {
      setCurrentCheckpoint(lastEventWithCheckpoint.checkpoint);
    }
    
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  return (
    <div style={{ padding: '12px', background: 'var(--panel)', borderTop: '1px solid var(--grid-line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h3 className="mono" style={{ color: 'var(--signal-cyan)' }}>REPLAY CONTROLLER</h3>
        <span className="mono">T+{(progress / 60).toFixed(1)} hrs</span>
      </div>
      
      <div style={{ height: '4px', background: 'var(--void)', width: '100%', position: 'relative' }}>
        <div style={{ width: `${(progress / TOTAL_SIM_MINUTES) * 100}%`, height: '100%', background: 'var(--signal-cyan)' }} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
        <button onClick={isPlaying ? pause : play} style={{ background: 'var(--grid-line)', color: 'white', border: 'none', padding: '4px 12px', cursor: 'pointer' }}>
          {isPlaying ? 'PAUSE' : 'PLAY 40s REPLAY'}
        </button>
        
        {currentCheckpoint && (
          <div className="mono" style={{ color: 'var(--dispute-amber)', fontSize: '11px' }}>
            CHECKPOINT: {currentCheckpoint}
          </div>
        )}
      </div>
    </div>
  );
};
