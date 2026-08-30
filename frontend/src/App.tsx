import React from "react";
import { SenseConsole } from "./components/SenseConsole";
import { useDashboardState } from "./hooks/useDashboardState";

const DebugView: React.FC = () => {
  const { state, loading, error } = useDashboardState();
  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error loading dashboard: {error.message}</div>;
  return (
    <div style={{ padding: 20, background: '#111', color: '#0f0', maxHeight: '30vh', overflowY: 'auto' }}>
      <h3>Debug View</h3>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <>
      <SenseConsole />
      <DebugView />
    </>
  );
};

export default App;

