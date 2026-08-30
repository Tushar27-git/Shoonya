import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Sliders, Map as MapIcon, Shield, Server, Bell, Monitor, Database, Save, CheckCircle } from "lucide-react";

export const Settings: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("system");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    system: {
      theme: "dark",
      language: "en",
      autoRefresh: true,
      refreshRate: "2",
    },
    map: {
      defaultStyle: "satellite-dark",
      showTraffic: true,
      clusterMarkers: true,
      defaultZoom: "12",
    },
    simulation: {
      engineSpeed: "1x",
      injectAnomalies: true,
      autoResolve: false,
    },
    security: {
      mfaEnabled: true,
      sessionTimeout: "30",
      dataEncryption: "AES-256",
    }
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 800);
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const categories = [
    { id: "system", label: "System Preferences", icon: <Monitor size={18} /> },
    { id: "map", label: "Map Configuration", icon: <MapIcon size={18} /> },
    { id: "simulation", label: "Simulation Engine", icon: <Server size={18} /> },
    { id: "security", label: "Access & Security", icon: <Shield size={18} /> },
  ];

  return (
    <div style={{ display: "flex", height: "100%", color: "var(--ink)" }}>
      {/* Settings Sidebar */}
      <div style={{ 
        width: "250px", 
        borderRight: "1px solid var(--grid-line)", 
        backgroundColor: "var(--panel)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0"
      }}>
        <div style={{ padding: "0 24px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
          <SettingsIcon size={24} color="var(--signal-cyan)" />
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "white" }}>Settings</h2>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "0 12px" }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                backgroundColor: activeCategory === cat.id ? "rgba(79, 216, 196, 0.1)" : "transparent",
                color: activeCategory === cat.id ? "var(--signal-cyan)" : "var(--ink-dim)",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: activeCategory === cat.id ? "bold" : "normal",
                textAlign: "left",
                transition: "all 0.2s"
              }}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Content */}
      <div style={{ flex: 1, padding: "32px", overflowY: "auto", backgroundColor: "var(--void)" }}>
        <div style={{ maxWidth: "800px" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "white", marginBottom: "8px" }}>
                {categories.find(c => c.id === activeCategory)?.label}
              </h1>
              <p style={{ color: "var(--ink-dim)" }}>Configure operational parameters and system behavior.</p>
            </div>
            <button 
              onClick={handleSave}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 24px",
                backgroundColor: "var(--signal-cyan)",
                color: "var(--void)",
                border: "none",
                borderRadius: "4px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {isSaving ? <Sliders size={18} className="spin" /> : (showSuccess ? <CheckCircle size={18} /> : <Save size={18} />)}
              {isSaving ? "SAVING..." : (showSuccess ? "SAVED!" : "SAVE CHANGES")}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* System Preferences */}
            {activeCategory === "system" && (
              <>
                <div style={{ backgroundColor: "var(--panel-elevated)", padding: "24px", borderRadius: "8px", border: "1px solid var(--grid-line)" }}>
                  <h3 style={{ fontSize: "16px", color: "white", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Monitor size={18} color="var(--signal-cyan)" /> Interface Configuration
                  </h3>
                  
                  <div style={{ display: "grid", gap: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: "bold", color: "white", marginBottom: "4px" }}>UI Theme</div>
                        <div style={{ fontSize: "12px", color: "var(--ink-dim)" }}>Select the visual mode for the dashboard</div>
                      </div>
                      <select 
                        value={settings.system.theme}
                        onChange={(e) => updateSetting("system", "theme", e.target.value)}
                        style={{ padding: "8px 12px", backgroundColor: "var(--void)", color: "white", border: "1px solid var(--grid-line)", borderRadius: "4px" }}
                      >
                        <option value="dark">Tactical Dark (Default)</option>
                        <option value="light">Command Light</option>
                        <option value="system">System Default</option>
                      </select>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: "bold", color: "white", marginBottom: "4px" }}>System Language</div>
                        <div style={{ fontSize: "12px", color: "var(--ink-dim)" }}>Primary language for interface and logs</div>
                      </div>
                      <select 
                        value={settings.system.language}
                        onChange={(e) => updateSetting("system", "language", e.target.value)}
                        style={{ padding: "8px 12px", backgroundColor: "var(--void)", color: "white", border: "1px solid var(--grid-line)", borderRadius: "4px" }}
                      >
                        <option value="en">English (US)</option>
                        <option value="hi">Hindi</option>
                        <option value="hinglish">Hinglish</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: "var(--panel-elevated)", padding: "24px", borderRadius: "8px", border: "1px solid var(--grid-line)" }}>
                  <h3 style={{ fontSize: "16px", color: "white", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Database size={18} color="var(--signal-cyan)" /> Data Synchronization
                  </h3>
                  
                  <div style={{ display: "grid", gap: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: "bold", color: "white", marginBottom: "4px" }}>Auto-Refresh Dashboard</div>
                        <div style={{ fontSize: "12px", color: "var(--ink-dim)" }}>Automatically poll for new telemetry data</div>
                      </div>
                      <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px" }}>
                        <input 
                          type="checkbox" 
                          checked={settings.system.autoRefresh}
                          onChange={(e) => updateSetting("system", "autoRefresh", e.target.checked)}
                          style={{ opacity: 0, width: 0, height: 0 }} 
                        />
                        <span style={{ 
                          position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, 
                          backgroundColor: settings.system.autoRefresh ? "var(--signal-cyan)" : "var(--grid-line)", 
                          borderRadius: "24px", transition: "0.4s" 
                        }}>
                          <span style={{ 
                            position: "absolute", height: "18px", width: "18px", left: settings.system.autoRefresh ? "22px" : "3px", bottom: "3px", 
                            backgroundColor: "white", borderRadius: "50%", transition: "0.4s" 
                          }} />
                        </span>
                      </label>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: settings.system.autoRefresh ? 1 : 0.5 }}>
                      <div>
                        <div style={{ fontWeight: "bold", color: "white", marginBottom: "4px" }}>Polling Rate (Seconds)</div>
                        <div style={{ fontSize: "12px", color: "var(--ink-dim)" }}>Frequency of telemetry updates</div>
                      </div>
                      <select 
                        disabled={!settings.system.autoRefresh}
                        value={settings.system.refreshRate}
                        onChange={(e) => updateSetting("system", "refreshRate", e.target.value)}
                        style={{ padding: "8px 12px", backgroundColor: "var(--void)", color: "white", border: "1px solid var(--grid-line)", borderRadius: "4px" }}
                      >
                        <option value="1">1 Second (High Load)</option>
                        <option value="2">2 Seconds (Default)</option>
                        <option value="5">5 Seconds</option>
                        <option value="10">10 Seconds</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Simulation Engine */}
            {activeCategory === "simulation" && (
              <div style={{ backgroundColor: "var(--panel-elevated)", padding: "24px", borderRadius: "8px", border: "1px solid var(--grid-line)" }}>
                <h3 style={{ fontSize: "16px", color: "white", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Server size={18} color="var(--signal-cyan)" /> Synthetic Scenario Parameters
                </h3>
                
                <div style={{ display: "grid", gap: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "bold", color: "white", marginBottom: "4px" }}>Time Dilation Multiplier</div>
                      <div style={{ fontSize: "12px", color: "var(--ink-dim)" }}>Speed at which simulated events unfold</div>
                    </div>
                    <select 
                      value={settings.simulation.engineSpeed}
                      onChange={(e) => updateSetting("simulation", "engineSpeed", e.target.value)}
                      style={{ padding: "8px 12px", backgroundColor: "var(--void)", color: "white", border: "1px solid var(--grid-line)", borderRadius: "4px" }}
                    >
                      <option value="0.5x">0.5x (Slow)</option>
                      <option value="1x">1.0x (Real-time)</option>
                      <option value="2x">2.0x (Accelerated)</option>
                      <option value="5x">5.0x (Stress Test)</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "bold", color: "white", marginBottom: "4px" }}>Inject Synthetic Anomalies</div>
                      <div style={{ fontSize: "12px", color: "var(--ink-dim)" }}>Introduce random disputes and dark zones</div>
                    </div>
                    <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px" }}>
                      <input 
                        type="checkbox" 
                        checked={settings.simulation.injectAnomalies}
                        onChange={(e) => updateSetting("simulation", "injectAnomalies", e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }} 
                      />
                      <span style={{ 
                        position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: settings.simulation.injectAnomalies ? "var(--signal-cyan)" : "var(--grid-line)", 
                        borderRadius: "24px", transition: "0.4s" 
                      }}>
                        <span style={{ 
                          position: "absolute", height: "18px", width: "18px", left: settings.simulation.injectAnomalies ? "22px" : "3px", bottom: "3px", 
                          backgroundColor: "white", borderRadius: "50%", transition: "0.4s" 
                        }} />
                      </span>
                    </label>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "bold", color: "white", marginBottom: "4px" }}>Auto-Resolve Disputes (AI)</div>
                      <div style={{ fontSize: "12px", color: "var(--ink-dim)" }}>Allow AI to resolve contradictions without human approval</div>
                    </div>
                    <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px" }}>
                      <input 
                        type="checkbox" 
                        checked={settings.simulation.autoResolve}
                        onChange={(e) => updateSetting("simulation", "autoResolve", e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }} 
                      />
                      <span style={{ 
                        position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: settings.simulation.autoResolve ? "var(--dispute-amber)" : "var(--grid-line)", 
                        borderRadius: "24px", transition: "0.4s" 
                      }}>
                        <span style={{ 
                          position: "absolute", height: "18px", width: "18px", left: settings.simulation.autoResolve ? "22px" : "3px", bottom: "3px", 
                          backgroundColor: "white", borderRadius: "50%", transition: "0.4s" 
                        }} />
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Map Configuration */}
            {activeCategory === "map" && (
              <div style={{ backgroundColor: "var(--panel-elevated)", padding: "24px", borderRadius: "8px", border: "1px solid var(--grid-line)" }}>
                <h3 style={{ fontSize: "16px", color: "white", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <MapIcon size={18} color="var(--signal-cyan)" /> Map & Geospatial
                </h3>
                
                <div style={{ display: "grid", gap: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "bold", color: "white", marginBottom: "4px" }}>Base Map Style</div>
                      <div style={{ fontSize: "12px", color: "var(--ink-dim)" }}>Default visual layer for tactical map</div>
                    </div>
                    <select 
                      value={settings.map.defaultStyle}
                      onChange={(e) => updateSetting("map", "defaultStyle", e.target.value)}
                      style={{ padding: "8px 12px", backgroundColor: "var(--void)", color: "white", border: "1px solid var(--grid-line)", borderRadius: "4px" }}
                    >
                      <option value="satellite-dark">Satellite Dark (Tactical)</option>
                      <option value="streets">Streets Vector</option>
                      <option value="topographic">Topographic</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "bold", color: "white", marginBottom: "4px" }}>Cluster Incidents</div>
                      <div style={{ fontSize: "12px", color: "var(--ink-dim)" }}>Group nearby incidents when zoomed out</div>
                    </div>
                    <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px" }}>
                      <input 
                        type="checkbox" 
                        checked={settings.map.clusterMarkers}
                        onChange={(e) => updateSetting("map", "clusterMarkers", e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }} 
                      />
                      <span style={{ 
                        position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: settings.map.clusterMarkers ? "var(--signal-cyan)" : "var(--grid-line)", 
                        borderRadius: "24px", transition: "0.4s" 
                      }}>
                        <span style={{ 
                          position: "absolute", height: "18px", width: "18px", left: settings.map.clusterMarkers ? "22px" : "3px", bottom: "3px", 
                          backgroundColor: "white", borderRadius: "50%", transition: "0.4s" 
                        }} />
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Access & Security */}
            {activeCategory === "security" && (
              <div style={{ backgroundColor: "var(--panel-elevated)", padding: "24px", borderRadius: "8px", border: "1px solid var(--grid-line)" }}>
                <h3 style={{ fontSize: "16px", color: "white", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Shield size={18} color="var(--signal-cyan)" /> Security Policies
                </h3>
                
                <div style={{ display: "grid", gap: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "bold", color: "white", marginBottom: "4px" }}>Require MFA</div>
                      <div style={{ fontSize: "12px", color: "var(--ink-dim)" }}>Multi-factor authentication for operator login</div>
                    </div>
                    <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px" }}>
                      <input 
                        type="checkbox" 
                        checked={settings.security.mfaEnabled}
                        onChange={(e) => updateSetting("security", "mfaEnabled", e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }} 
                      />
                      <span style={{ 
                        position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: settings.security.mfaEnabled ? "var(--signal-cyan)" : "var(--grid-line)", 
                        borderRadius: "24px", transition: "0.4s" 
                      }}>
                        <span style={{ 
                          position: "absolute", height: "18px", width: "18px", left: settings.security.mfaEnabled ? "22px" : "3px", bottom: "3px", 
                          backgroundColor: "white", borderRadius: "50%", transition: "0.4s" 
                        }} />
                      </span>
                    </label>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "bold", color: "white", marginBottom: "4px" }}>Session Timeout (Minutes)</div>
                      <div style={{ fontSize: "12px", color: "var(--ink-dim)" }}>Auto-lock terminal after inactivity</div>
                    </div>
                    <select 
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSetting("security", "sessionTimeout", e.target.value)}
                      style={{ padding: "8px 12px", backgroundColor: "var(--void)", color: "white", border: "1px solid var(--grid-line)", borderRadius: "4px" }}
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes (Default)</option>
                      <option value="60">60 Minutes</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};
