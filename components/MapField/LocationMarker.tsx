import { Marker, useMapEvents } from "react-leaflet";
import React from "react";

interface LocationMarkerProps {
  value: [number, number];
  onChange: (position: [number, number]) => void;
}

const LocationMarker: React.FC<LocationMarkerProps> = ({ value, onChange }) => {
  const map = useMapEvents({
    click(e: any) {
      if (!e.latlng) return;
      const { lat, lng } = e.latlng;

      onChange([lat, lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return value ? <Marker position={value} /> : null;
};

export default LocationMarker;
