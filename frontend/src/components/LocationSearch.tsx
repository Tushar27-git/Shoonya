import React, { useState } from "react";
import { Navigation, MapPin, ArrowRightLeft, Loader } from "lucide-react";

interface LocationSearchProps {
  onLocationFound?: (latLng: [number, number], locationName: string) => void;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({ onLocationFound }) => {
  const [fromLocation, setFromLocation] = useState("Connaught Place, New Delhi");
  const [toLocation, setToLocation] = useState("India Gate, New Delhi");
  const [isLoading, setIsLoading] = useState(false);

  const geocodeAndFly = async (query: string) => {
    if (!query || !onLocationFound) return;
    try {
      setIsLoading(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        onLocationFound([parseFloat(data[0].lat), parseFloat(data[0].lon)], query);
      }
    } catch (e) {
      console.error("Geocoding error", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          // Reverse geocode to get a readable name
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          if (data && data.display_name) {
            const name = data.display_name.split(",").slice(0, 3).join(",");
            setFromLocation(name);
            if (onLocationFound) onLocationFound([lat, lng], name);
          } else {
            setFromLocation("Current Location");
            if (onLocationFound) onLocationFound([lat, lng], "Current Location");
          }
        } catch (e) {
          setFromLocation("Current Location");
          if (onLocationFound) onLocationFound([lat, lng], "Current Location");
        }
        setIsLoading(false);
      },
      () => {
        alert("Unable to retrieve your location");
        setIsLoading(false);
      }
    );
  };

  return (
    <div style={{
      position: "absolute",
      top: "16px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      gap: "8px",
      backgroundColor: "transparent",
    }}>
      {/* From Input */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor: "var(--panel-elevated)",
        padding: "8px 16px",
        borderRadius: "20px",
        border: "1px solid var(--grid-line-bright)",
        boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
      }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--signal-cyan)" }} />
        <input 
          type="text" 
          value={fromLocation}
          onChange={(e) => setFromLocation(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") geocodeAndFly(fromLocation);
          }}
          placeholder="Start Point"
          style={{
            background: "none", border: "none", color: "var(--ink)", outline: "none",
            fontSize: "14px", width: "200px"
          }}
        />
        <MapPin size={16} color="var(--signal-cyan)" />
      </div>

      {/* Swap Button */}
      <button style={{
        backgroundColor: "var(--panel-elevated)", border: "1px solid var(--grid-line-bright)",
        borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--ink-dim)", cursor: "pointer"
      }}>
        <ArrowRightLeft size={16} />
      </button>

      {/* To Input */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor: "var(--panel-elevated)",
        padding: "8px 16px",
        borderRadius: "20px",
        border: "1px solid var(--grid-line-bright)",
        boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
      }}>
        <MapPin size={16} color="var(--critical-ember)" />
        <input 
          type="text" 
          value={toLocation}
          onChange={(e) => setToLocation(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") geocodeAndFly(toLocation);
          }}
          placeholder="Destination"
          style={{
            background: "none", border: "none", color: "var(--ink)", outline: "none",
            fontSize: "14px", width: "200px"
          }}
        />
      </div>

      {/* Use Current Location Button */}
      <button 
        onClick={handleUseCurrentLocation}
        disabled={isLoading}
        style={{
        display: "flex", alignItems: "center", gap: "8px",
        backgroundColor: "var(--panel-elevated)", border: "1px solid var(--signal-cyan)",
        color: "var(--signal-cyan)", padding: "8px 16px", borderRadius: "20px",
        cursor: isLoading ? "not-allowed" : "pointer", fontWeight: "bold", boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
      }}>
        {isLoading ? <Loader size={16} className="lucide-spin" /> : <Navigation size={16} />}
        Use Current Location
      </button>
    </div>
  );
};
