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

  const defaultStyle = {
    color: "gold",
    weight: 1,
    fillOpacity: 0,
    fillColor: "gold",
    interactive: true,
  };
  const highlightStyle = {
    ...defaultStyle,
    fillOpacity: 0.8,
  };

  // Import L from leaflet
  const L = require("leaflet");

  const onEachFeature = (feature: any, layer: any) => {
    // Try to get a name property, fallback to showing all properties
    const name = `${feature.properties?.Name_RU} уезд, ${feature.properties?.prov_RU}`;

    layer.bindTooltip(name, { sticky: false });

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
        e.target.setStyle(highlightStyle);
        // e.target.openTooltip(name, { sticky: true });
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          e.target.bringToFront();
        }
      },
      mouseout: function (e: any) {
        e.target.setStyle(defaultStyle);
      },
      mousedown: function (e: any) {
        // Prevent the default drag selection
        e.originalEvent.preventDefault();
      },
    });
  };

  return (
    <GeoJSON
      data={geojson}
      pane="shadowPane"
      style={defaultStyle}
      onEachFeature={onEachFeature}
    />
  );
};

export default HistoricalLayers;
