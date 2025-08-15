import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";

import LocationMarker from "./LocationMarker";
import MapLocationSearch from "./MapLocationSearch";

import OHMLayer from "@/components/MapField/OHMLayer";
import HistoricalLayers from "@/components/MapField/HistoricalLayers";

interface MapProps {
  position: [number, number];
  onPositionChange: (pos: [number, number]) => void;
}

const Map: React.FC<MapProps> = ({ position, onPositionChange }) => {
  return (
    <MapContainer
      scrollWheelZoom
      worldCopyJump
      center={[49.8397, 24.0297]}
      style={{ height: "100%", width: "100%" }}
      zoom={6}
    >
      <MapLocationSearch />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png"
        // url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png"
        // url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <OHMLayer bbox="43,13,55,41" date="1900-01-01" />
      <HistoricalLayers />
      <LocationMarker value={position} onChange={onPositionChange} />
    </MapContainer>
  );
};

export default Map;
