import { Layer } from "leaflet";
import { useCallback, useState } from "react";
import { GeoJSON } from "react-leaflet";
import { Card, CardBody } from "@heroui/card";

import { useMapData } from "./useMapData";

interface HistoricalLayersProps {
  year: number;
}

const HistoricalLayers: React.FC<HistoricalLayersProps> = ({ year }) => {
  const [hoveredFeature, setHoveredFeature] = useState<any>(null);
  const { countries, states } = useMapData(year);

  // Import L from leaflet
  const L = require("leaflet");

  // Color palette for countries (OHM data)
  const colorPalette = [
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "darkblue",
    "purple",
  ];

  // Function to get color for a country feature
  const getFeatureColor = (feature: any) => {
    const colorIndex = (feature.id || 0) % colorPalette.length;

    return colorPalette[colorIndex];
  };

  // Styles for countries (OHM data)
  const countryDefaultStyle = (feature: any) => ({
    color: getFeatureColor(feature),
    weight: 2,
    fillColor: "transparent",
    opacity: 0.4,
    interactive: true,
  });

  const countryHighlightStyle = (feature: any) => ({
    ...countryDefaultStyle(feature),
    opacity: 0.8,
  });

  // Styles for states (historical data)
  const stateDefaultStyle = {
    color: "gold",
    weight: 1,
    fillOpacity: 0,
    fillColor: "gold",
    interactive: true,
  };

  const stateHighlightStyle = {
    ...stateDefaultStyle,
    fillOpacity: 0.8,
  };

  const onEachFeature = useCallback(
    (feature: GeoJSON.Feature<any, any>, layer: Layer) => {
      layer.on({
        mouseover: (e) => {
          setHoveredFeature(feature);
          e.target.setStyle(stateHighlightStyle);
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            e.target.bringToFront();
          }
        },
        mouseout: function (e) {
          setHoveredFeature(null);
          e.target.setStyle(stateDefaultStyle);
          e.target.closeTooltip();
        },
        mousedown: function (e) {
          // Prevent the default drag selection
          e.originalEvent.preventDefault();
          e.target.closeTooltip();
        },
      });
    },
    [L.Browser.ie, L.Browser.opera, L.Browser.edge],
  );

  const onEachCountryFeature = useCallback(
    (feature: GeoJSON.Feature<any, any>, layer: Layer) => {
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
          setHoveredFeature(feature);
          e.target.setStyle(countryHighlightStyle(feature));
          e.target.openTooltip();
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            e.target.bringToFront();
          }
        },
        mouseout: function (e: any) {
          setHoveredFeature(null);
          e.target.setStyle(countryDefaultStyle(feature));
          e.target.closeTooltip();
        },
        mousedown: function (e: any) {
          // Prevent the default drag selection
          e.originalEvent.preventDefault();
        },
      });
    },
    [L.Browser.ie, L.Browser.opera, L.Browser.edge],
  );

  return (
    <>
      {/* Render countries from OHM */}
      {countries && (
        <GeoJSON
          data={countries}
          pane="overlayPane"
          style={countryDefaultStyle}
          onEachFeature={onEachCountryFeature}
        />
      )}

      {/* Render states (only for 1897) */}
      {states && (
        <GeoJSON
          data={states}
          pane="shadowPane"
          style={stateDefaultStyle}
          onEachFeature={onEachFeature}
        />
      )}

      {/* Fixed tooltip at bottom left corner */}
      {hoveredFeature && (
        <Card className="max-w-sm absolute z-[1000] bottom-[20] left-[20] pointer-events-none">
          <CardBody>
            <div className="flex flex-col gap-1">
              <h4 className="font-semibold text-large">
                {hoveredFeature.properties?.Name_RU
                  ? `${hoveredFeature.properties.Name_RU} уезд`
                  : hoveredFeature.properties?.name ||
                    hoveredFeature.properties?.NAME ||
                    hoveredFeature.properties?.Name ||
                    "Unknown"}
              </h4>
              <p className="text-small text-default-500">
                {hoveredFeature.properties?.prov_RU ||
                  hoveredFeature.properties?.admin_level ||
                  "No additional info"}
              </p>
              {hoveredFeature.properties?.Distr_ID && (
                <p className="text-small text-default-400">
                  District ID: {hoveredFeature.properties.Distr_ID}
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
};

export default HistoricalLayers;
