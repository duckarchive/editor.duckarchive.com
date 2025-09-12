"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Input } from "@heroui/input";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Button } from "@heroui/button";
import { IoMap } from "react-icons/io5";
import { useDisclosure } from "@heroui/modal";

import "leaflet/dist/leaflet.css";
import "../node_modules/@duckarchive/map/dist/style.css";

const GeoDuckMap = dynamic(
  () => import("@duckarchive/map").then((mod) => mod.default),
  {
    ssr: false,
  },
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

// LocationMarker and MapLocationSearch are now imported from their own files.

const MapInput: React.FC<MapInputProps> = ({
  lat = 49.8397,
  lng = 24.0297,
  onLatChange,
  onLngChange,
  label = "Координати",
  isRequired = false,
  isInvalid = false,
  errorMessage,
}) => {
  const [position, setPosition] = useState<[number, number]>([lat, lng]);
  const { isOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    if (lat && lng) {
      setPosition([lat, lng]);
    }
  }, [lat, lng]);

  const handlePositionChange = (newPosition: [number, number]) => {
    console.log("handlePositionChange");
    setPosition(newPosition);
    onLatChange(newPosition[0]);
    onLngChange(newPosition[1]);
  };

  const handleLatInputChange = (value: string) => {
    console.log("handleLatInputChange");
    const intValue = parseFloat(value);

    if (!isNaN(intValue)) {
      const newPosition: [number, number] = [intValue, lng];

      setPosition(newPosition);
      onLatChange(intValue);
    }
  };

  const handleLngInputChange = (value: string) => {
    console.log("handleLngInputChange");
    const intValue = parseFloat(value);

    if (!isNaN(intValue)) {
      const newPosition: [number, number] = [lat, intValue];

      setPosition(newPosition);
      onLngChange(intValue);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-2">
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="flex gap-2">
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
        <Button
          aria-label="Open map to select location"
          className="h-auto"
          variant={isOpen ? "flat" : "bordered"}
          onPress={onOpenChange}
        >
          <IoMap size={20} />
        </Button>
      </div>

      <Accordion
        isCompact
        className="p-0"
        selectedKeys={isOpen ? ["map-help"] : []}
        variant="light"
      >
        <AccordionItem
          key="map-help"
          aria-label="Open map to select location"
          classNames={{
            content: "h-[500px] w-full",
            title: "text-sm opacity-50",
            trigger: "p-0",
          }}
          indicator={" "}
          title={null}
        >
          <GeoDuckMap
            position={position}
            scrollWheelZoom={false}
            onPositionChange={handlePositionChange}
          />
        </AccordionItem>
      </Accordion>

      {isInvalid && errorMessage && (
        <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

export default MapInput;
