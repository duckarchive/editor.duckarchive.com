import { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";

// Raw GitHub link for direct fetch (must use raw.githubusercontent.com)
const GEOJSON_URL =
  "https://raw.githubusercontent.com/bnotezz/ua-settlements/main/assets/maps/old_maps/ri/ri_districts_1897.geojson";

const HistoricalLayers: React.FC = () => {
  const [geojson, setGeojson] = useState<any>(null);

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((res) => res.json())
      .then((data) => setGeojson(data))
      .catch((err) => console.error("Failed to load historical GeoJSON", err));
  }, []);

  if (!geojson) return null;

  const defaultStyle = { color: "#191caf", weight: 2, fillOpacity: 0.1 };
  const highlightStyle = {
    color: "#191caf",
    weight: 2,
    fillOpacity: 0.8,
    fillColor: "#5658d3",
  };

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

    layer.on({
      mouseover: function (e: any) {
        e.target.setStyle(highlightStyle);
        e.target.openTooltip();
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          e.target.bringToFront();
        }
      },
      mouseout: function (e: any) {
        e.target.setStyle(defaultStyle);
        e.target.closeTooltip();
      },
    });
  };

  return (
    <GeoJSON
      data={geojson}
      style={defaultStyle}
      onEachFeature={onEachFeature}
    />
  );
};

export default HistoricalLayers;
