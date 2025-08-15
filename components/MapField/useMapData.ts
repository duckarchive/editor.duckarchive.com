import { useEffect, useState } from "react";

import { overpass2geojson } from "./helpers";

interface MapData {
  countries: any;
  states: any;
}

const HISTORICAL_GEOJSON_URL =
  "https://raw.githubusercontent.com/bnotezz/ua-settlements/main/assets/maps/old_maps/ri/ri_districts_1897.geojson";

export const useMapData = (year: number): MapData => {
  const [countries, setCountries] = useState<any>(null);
  const [states, setStates] = useState<any>(null);

  // Fetch OHM countries data
  useEffect(() => {
    const date = `${year}-01-01`;
    const bbox = "44,22,52,40"; // Default bbox for the region

    fetch(
      `/api/ohm/borders?date=${encodeURIComponent(date)}&bbox=${encodeURIComponent(bbox)}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          const fc = overpass2geojson(data);

          setCountries(fc);
        }
      })
      .catch(() => {
        setCountries(null);
      });
  }, [year]);

  // Fetch historical states data (only for 1897)
  useEffect(() => {
    if (year === 1897) {
      fetch(HISTORICAL_GEOJSON_URL)
        .then((res) => res.json())
        .then((data) => setStates(data))
        .catch(() => setStates(null));
    } else {
      setStates(null);
    }
  }, [year]);

  return { countries, states };
};
