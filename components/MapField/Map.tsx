import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";

import LocationMarker from "./LocationMarker";
import MapLocationSearch from "./MapLocationSearch";
import HistoricalLayers from "./HistoricalLayers";

interface MapProps {
  position: [number, number];
  onPositionChange: (pos: [number, number]) => void;
}

const Map: React.FC<MapProps> = ({ position, onPositionChange }) => {
  return (
    <MapContainer
      scrollWheelZoom
      center={[49.8397, 24.0297]}
      style={{ height: "100%", width: "100%" }}
      zoom={13}
    >
      <MapLocationSearch />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <HistoricalLayers />
      <LocationMarker value={position} onChange={onPositionChange} />
    </MapContainer>
  );
};

export default Map;
