"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import dynamic from "next/dynamic";
import { useMapEvents } from "react-leaflet";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
);

interface MapInputProps {
  lat?: number;
  lng?: number;
  onLatChange: (lat: number) => void;
  onLngChange: (lng: number) => void;
  label?: string;
  isRequired?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
}

interface LocationMarkerProps {
  position?: [number, number];
  setPosition: (position: [number, number]) => void;
}

const LocationMarker: React.FC<LocationMarkerProps> = ({
  position,
  setPosition,
}) => {
  const map = useMapEvents({
    click(e: any) {
      const { lat, lng } = e.latlng;

      setPosition([lat, lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position ? <Marker position={position} /> : null;
};

const MapInput: React.FC<MapInputProps> = ({
  lat = 49.8397,
  lng = 24.0297,
  onLatChange,
  onLngChange,
  label = "Координати на карті",
  isRequired = false,
  isInvalid = false,
  errorMessage,
}) => {
  const [position, setPosition] = useState<[number, number]>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (lat && lng) {
      setPosition([lat, lng]);
    }
  }, [lat, lng]);

  const handlePositionChange = (newPosition: [number, number]) => {
    setPosition(newPosition);
    onLatChange(newPosition[0]);
    onLngChange(newPosition[1]);
  };

  const handleLatInputChange = (value: string) => {
    const numValue = parseFloat(value);

    if (!isNaN(numValue)) {
      const newPosition: [number, number] = [numValue, lng];

      setPosition(newPosition);
      onLatChange(numValue);
    }
  };

  const handleLngInputChange = (value: string) => {
    const numValue = parseFloat(value);

    if (!isNaN(numValue)) {
      const newPosition: [number, number] = [lat, numValue];

      setPosition(newPosition);
      onLngChange(numValue);
    }
  };

  if (!mounted) {
    return (
      <div className="w-full">
        <div className="flex gap-2 mb-2">
          <Input
            isInvalid={isInvalid}
            isRequired={isRequired}
            label="Широта"
            step="any"
            type="number"
            value={lat ? lat.toString() : ""}
          />
          <Input
            isInvalid={isInvalid}
            isRequired={isRequired}
            label="Довгота"
            step="any"
            type="number"
            value={lng ? lng.toString() : ""}
          />
        </div>
        <Card>
          <CardBody>
            <div className="h-64 flex items-center justify-center bg-gray-100 rounded">
              <p className="text-gray-500">Завантаження карти...</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-2">
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="flex gap-2 mb-2">
        <Input
          isInvalid={isInvalid}
          isRequired={isRequired}
          label="Широта"
          placeholder="49.8397"
          step="any"
          type="number"
          value={position?.[0]?.toString() || ""}
          onValueChange={handleLatInputChange}
        />
        <Input
          isInvalid={isInvalid}
          isRequired={isRequired}
          label="Довгота"
          placeholder="24.0297"
          step="any"
          type="number"
          value={position?.[1]?.toString() || ""}
          onValueChange={handleLngInputChange}
        />
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="h-64 w-full">
            <MapContainer
              center={[49.8397, 24.0297]}
              scrollWheelZoom={false}
              style={{ height: "100%", width: "100%" }}
              zoom={13}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker
                position={position}
                setPosition={handlePositionChange}
              />
            </MapContainer>
          </div>
        </CardBody>
      </Card>

      {isInvalid && errorMessage && (
        <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
      )}

      <p className="text-gray-500 text-xs mt-1">
        Клацніть на карті, щоб вибрати координати
      </p>
    </div>
  );
};

export default MapInput;
