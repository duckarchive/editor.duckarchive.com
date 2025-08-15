import { Layer, LeafletMouseEvent } from "leaflet";
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { GeoJSON, GeoJSONProps, useMap } from "react-leaflet";
import { Card, CardBody } from "@heroui/card";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point as turfPoint } from "@turf/helpers";

import { useMapData } from "./useMapData";

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

const CountriesLayer = memo(
  forwardRef<L.GeoJSON, GeoJSONProps>(({ data, onEachFeature }, ref) =>
    data ? (
      <GeoJSON
        ref={ref}
        data={data}
        style={countryDefaultStyle}
        onEachFeature={onEachFeature}
      />
    ) : null,
  ),
);

CountriesLayer.displayName = "CountriesLayer";

const StatesLayer = memo(({ data, onEachFeature }: GeoJSONProps) =>
  data ? (
    <GeoJSON
      data={data}
      style={stateDefaultStyle}
      onEachFeature={onEachFeature}
    />
  ) : null,
);

StatesLayer.displayName = "StatesLayer";

interface HistoricalLayersProps {
  year: number;
}

const HistoricalLayers: React.FC<HistoricalLayersProps> = ({ year }) => {
  const [hoveredCountryFeature, setHoveredCountryFeature] = useState<any>(null);
  const [hoveredStateFeature, setHoveredStateFeature] = useState<any>(null);
  const { countries, states } = useMapData(year);
  const countriesRef = useRef<L.GeoJSON>(null);
  const map = useMap();

  useEffect(() => {
    if (!map || !countriesRef.current) return;

    const handleMouseMove = (e: LeafletMouseEvent) => {
      const point = turfPoint([e.latlng.lng, e.latlng.lat]);

      countriesRef.current?.eachLayer((l: any) => {
        const feature: GeoJSON.Feature = l.feature;

        if (!feature || !feature.geometry) return;
        try {
          if (feature.geometry.type.endsWith("Polygon")) {
            if (booleanPointInPolygon(point, feature as any)) {
              setHoveredCountryFeature(feature);
              l.setStyle(countryHighlightStyle(feature));
            } else {
              l.setStyle(countryDefaultStyle(feature));
            }
          }
        } catch {
          console.error("Invalid geometry for feature:", feature.id);
        }
      });
    };

    map.on("mousemove", handleMouseMove);

    return () => {
      map.off("mousemove", handleMouseMove);
    };
  }, [map]);

  const onEachStateFeature = useCallback(
    (feature: GeoJSON.Feature, layer: Layer) => {
      layer.on({
        mouseover: (e) => {
          setHoveredStateFeature(feature);
          e.target.setStyle(stateHighlightStyle);
        },
        mouseout: (e) => {
          setHoveredStateFeature(null);
          e.target.setStyle(stateDefaultStyle);
        },
      });
    },
    [],
  );

  return (
    <>
      {countries && <CountriesLayer ref={countriesRef} data={countries} />}

      {states && (
        <StatesLayer data={states} onEachFeature={onEachStateFeature} />
      )}

      {/* Fixed tooltip at bottom left corner */}
      {(hoveredCountryFeature || hoveredStateFeature) && (
        <Card className="max-w-sm absolute z-[1000] bottom-[20] left-[20] pointer-events-none">
          <CardBody>
            <div className="flex flex-col gap-1">
              {hoveredStateFeature?.properties?.Name_RU && (
                <h4 className="font-semibold text-large">
                  {hoveredStateFeature.properties.Name_RU} уезд
                </h4>
              )}
              {hoveredStateFeature?.properties?.prov_RU && (
                <p className="text-small text-default-500">
                  {hoveredStateFeature.properties.prov_RU}
                </p>
              )}
              <p className="text-small text-default-500">
                {hoveredCountryFeature?.properties?.name}
              </p>
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
};

export default HistoricalLayers;
