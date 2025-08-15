import useSWR from "swr";
import { useMemo } from "react";

import { overpass2geojson } from "./helpers";

interface MapData {
  countries: GeoJSON.FeatureCollection | null;
  states: GeoJSON.FeatureCollection | null;
}

const RI_DISTRICTS_1897 =
  "https://raw.githubusercontent.com/bnotezz/ua-settlements/main/assets/maps/old_maps/ri/ri_districts_1897.geojson";

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useMapData = (year: number): MapData => {
  // Fetch OHM countries data
  const date = `${year}-01-01`;
  const bbox = "44,22,52,40"; // Ukraine bbox
  const ohmUrl = `/api/ohm/borders?date=${encodeURIComponent(date)}&bbox=${encodeURIComponent(bbox)}`;

  const { data: ohmData } = useSWR<OverpassResponse>(ohmUrl, fetcher);

  // Fetch historical states data (only for 1897)
  const statesUrl = year === 1897 ? RI_DISTRICTS_1897 : null;
  const { data: statesData } = useSWR<GeoJSON.FeatureCollection>(
    statesUrl,
    fetcher,
  );

  const countries = useMemo(
    () => (ohmData ? overpass2geojson(ohmData) : null),
    [ohmData],
  );

  const states = useMemo(() => {
    if (!statesData) return null;

    return {
      ...statesData,
      features: statesData.features.map((feature) => ({
        ...feature,
        id: `${feature.properties?.Gub_ID}_${feature.properties?.Distr_ID}`,
      })),
    };
  }, [statesData]);

  return { countries, states };
};
