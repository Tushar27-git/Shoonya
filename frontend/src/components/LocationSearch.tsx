import React, { useState, useEffect, useRef } from "react";
import { Navigation, MapPin, Loader, Search } from "lucide-react";

interface LocationSearchProps {
  onLocationFound?: (latLng: [number, number], locationName: string) => void;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({ onLocationFound }) => {
  const [locationQuery, setLocationQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced suggestion fetcher
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!locationQuery || locationQuery.length < 3) {
        setSuggestions([]);
        return;
      }
      
      const cleanQuery = locationQuery.replace(/\s*-\s*\d+$/, "").trim();
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&limit=5`;

      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data)) {
            setSuggestions(data);
          }
        }
      } catch (e) {
        // Silent fail for autocomplete
      }
    };

    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [locationQuery]);

  const geocodeAndFly = async (query: string) => {
    if (!query || !onLocationFound) return;
    try {
      setIsLoading(true);
      
      // Clean query (e.g. remove " - 35" pincode suffixes which break free geocoders)
      const cleanQuery = query.replace(/\s*-\s*\d+$/, "").trim();

      // OSM Nominatim
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&limit=1`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      
      if (data && data.length > 0) {
        // OSM response format
        onLocationFound([parseFloat(data[0].lat), parseFloat(data[0].lon)], query);
      } else {
        alert(`Location "${query}" not found. Try a broader search (e.g. city name).`);
      }
    } catch (e) {
      console.error("Geocoding error", e);
      if (query.toLowerCase().includes("delhi")) {
        onLocationFound([28.6139, 77.2090], "New Delhi (Fallback)");
      } else if (query.toLowerCase().includes("mumbai")) {
        onLocationFound([19.0760, 72.8777], "Mumbai (Fallback)");
      } else {
        alert("Error reaching geocoding service. It may be rate-limited.");
      }
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
            setLocationQuery(name);
            if (onLocationFound) onLocationFound([lat, lng], name);
          } else {
            setLocationQuery("Current Location");
            if (onLocationFound) onLocationFound([lat, lng], "Current Location");
          }
        } catch (e) {
          setLocationQuery("Current Location");
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
      display: "flex",
      alignItems: "center",
      gap: "8px",
      backgroundColor: "transparent",
      position: "relative"
    }} ref={searchContainerRef}>
      {/* Search Input */}
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
        <MapPin size={16} color="var(--signal-cyan)" />
        <input 
          type="text" 
          value={locationQuery}
          onChange={(e) => {
            setLocationQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setShowSuggestions(false);
              geocodeAndFly(locationQuery);
            }
          }}
          placeholder="Search location..."
          style={{
            background: "none", border: "none", color: "var(--ink)", outline: "none",
            fontSize: "14px", width: "250px"
          }}
        />
        <Search 
          size={16} 
          color="var(--ink-dim)" 
          style={{ cursor: "pointer" }} 
          onClick={() => geocodeAndFly(locationQuery)} 
        />
      </div>

      {/* Autocomplete Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          marginTop: "8px",
          width: "290px",
          backgroundColor: "var(--panel-elevated)",
          border: "1px solid var(--grid-line-bright)",
          borderRadius: "8px",
          boxShadow: "0 8px 16px rgba(0,0,0,0.5)",
          overflow: "hidden",
          zIndex: 1000
        }}>
          {suggestions.map((s, idx) => {
            const placeName = s.display_name;
            return (
              <div 
                key={idx}
                onClick={() => {
                  setLocationQuery(placeName);
                  setShowSuggestions(false);
                  onLocationFound?.([parseFloat(s.lat), parseFloat(s.lon)], placeName);
                }}
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "var(--ink)",
                  borderBottom: idx === suggestions.length - 1 ? "none" : "1px solid var(--grid-line)",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--highlight)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                {placeName}
              </div>
            );
          })}
        </div>
      )}

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
