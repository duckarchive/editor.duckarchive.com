import React, { useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";

import LocationMarker from "./LocationMarker";
import MapLocationSearch from "./MapLocationSearch";

import HistoricalLayers from "@/components/MapField/HistoricalLayers";

interface MapProps {
  position: [number, number];
  onPositionChange: (pos: [number, number]) => void;
}

const Map: React.FC<MapProps> = ({ position, onPositionChange }) => {
  const [year, setYear] = useState(1897);

  const handleYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newYear = parseInt(event.target.value);

    setYear(newYear);
  };

  return (
    <div>
      <MapContainer
        scrollWheelZoom
        worldCopyJump
        center={[49.8397, 24.0297]}
        style={{ height: "500px", width: "100%" }}
        zoom={6}
      >
        <MapLocationSearch />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png"
        />
        <HistoricalLayers year={year} />
        <LocationMarker value={position} onChange={onPositionChange} />
      </MapContainer>

      {/* Date filtering controls extracted from HistoricalMap */}
      <div className="flex items-center gap-2 mt-2">
        <label htmlFor="date-slider">Year: </label>
        <input
          id="date-slider"
          max={2025}
          min={1600}
          type="range"
          value={year}
          onChange={handleYearChange}
        />
        <span>{year}</span>
      </div>
    </div>
  );
};

export default Map;
