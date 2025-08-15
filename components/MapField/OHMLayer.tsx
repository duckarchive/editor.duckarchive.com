// inside your client map component
import { GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";

import { overpass2geojson } from "@/components/MapField/helpers";

interface OHMLayerProps {
  date: string;
  bbox: string; // bbox in the format "minLng,minLat,maxLng,maxLat"
}

const OHMLayer: React.FC<OHMLayerProps> = ({ date, bbox }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(
      `/api/ohm/borders?date=${encodeURIComponent(date)}&bbox=${encodeURIComponent(bbox)}`,
    )
      .then((r) => r.json())
      .then(setData)
      .catch((_error) => {
        // Handle error silently for now, could be improved with proper error state
        setData(null);
      });
  }, [date, bbox]);

  if (!data) return null;

  const fc = overpass2geojson(data);

  // Color palette for different areas
  const colorPalette = [
    "red", // Red
    "orange", // Orange
    "yellow", // Yellow
    "green", // Green
    "blue", // Blue
    "darkblue", // Dark Blue
    "purple", // Purple
  ];

  // Function to get color for a feature
  const getFeatureColor = (feature: any) => {
    // Use feature ID to determine color consistently
    const colorIndex = (feature.id || 0) % colorPalette.length;

    return colorPalette[colorIndex];
  };

  const defaultStyle = (feature: any) => ({
    color: getFeatureColor(feature),
    weight: 2,
    fillColor: "transparent",
    opacity: 0.4,
    interactive: true,
  });

  const highlightStyle = (feature: any) => ({
    ...defaultStyle(feature),
    opacity: 0.8,
  });

  // Import L from leaflet
  const L = require("leaflet");

  const onEachFeature = (feature: any, layer: any) => {
    // Try to get a name property, fallback to showing all properties
    const name =
      feature.properties?.name ||
      feature.properties?.NAME ||
      feature.properties?.Name ||
      Object.values(feature.properties || {}).join(", ") ||
      "No name";

    layer.bindTooltip(name, { sticky: true });

    // Disable text selection and improve drag behavior
    layer.getElement = function () {
      const element = L.Path.prototype.getElement.call(this);

      if (element) {
        element.style.userSelect = "none";
        element.style.webkitUserSelect = "none";
        element.style.mozUserSelect = "none";
        element.style.msUserSelect = "none";
        element.style.pointerEvents = "auto";
      }

      return element;
    };

    layer.on({
      mouseover: function (e: any) {
        e.target.setStyle(highlightStyle(feature));
        e.target.openTooltip();
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          e.target.bringToFront();
        }
      },
      mouseout: function (e: any) {
        e.target.setStyle(defaultStyle(feature));
        e.target.closeTooltip();
      },
      mousedown: function (e: any) {
        // Prevent the default drag selection
        e.originalEvent.preventDefault();
      },
    });
  };

  return (
    <GeoJSON
      data={fc as any}
      pane="overlayPane"
      style={defaultStyle}
      onEachFeature={onEachFeature}
    />
  );
};

export default OHMLayer;
