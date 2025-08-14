import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
// @ts-ignore
import { filterByDate } from "@openhistoricalmap/maplibre-gl-dates";
import "maplibre-gl/dist/maplibre-gl.css";

const OHM_STYLE = "https://www.openhistoricalmap.org/map-styles/main/main.json";

const HistoricalMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [date, setDate] = useState("1939-08-31");

  // Helper to safely apply filterByDate
  const safeFilterByDate = (date: string) => {
    const style = mapRef.current?.getStyle?.();

    if (style && Array.isArray(style.layers)) {
      filterByDate(mapRef.current, date);
    }
  };

  // Attach styledata event and always re-apply filterByDate
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: OHM_STYLE,
      center: [24.0297, 49.8397],
      zoom: 5,
    });

    const handleStyleData = () => {
      safeFilterByDate(date);
    };

    map.once("styledata", handleStyleData);

    mapRef.current = map;

    return () => {
      map.off("styledata", handleStyleData);
      map.remove();
    };
  }, []);

  // When date changes, re-apply filterByDate
  useEffect(() => {
    if (mapRef.current) {
      safeFilterByDate(date);
    }
  }, [date]);

  const handleYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newYear = event.target.value;

    setDate(`${newYear}-01-01`);
  };

  return (
    <div>
      <div ref={mapContainerRef} style={{ width: "100%", height: 500 }} />
      <div className="flex items-center gap-2 mt-2">
        <label htmlFor="date-slider">Year: </label>
        <input
          id="date-slider"
          max={2025}
          min={1600}
          type="range"
          value={parseInt(date.slice(0, 4))}
          onChange={handleYearChange}
        />
        <span>{date.slice(0, 4)}</span>
      </div>
    </div>
  );
};

export default HistoricalMap;
