import type { SearchControlOptions } from "leaflet-geosearch/dist/SearchControl";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { OpenStreetMapProvider, GeoSearchControl } from "leaflet-geosearch";

const MapLocationSearch = () => {
  const provider = new OpenStreetMapProvider({
    params: {
      "accept-language": "ua",
      countrycodes: "ua,pl,by,ru,ro,md,tr",
      limit: 5,
      email: "admin@duckarchive.com",
    },
  });

  const config: SearchControlOptions = {
    provider,
    style: "bar",
    showMarker: false,
  };
  // @ts-ignore
  const searchControl = new GeoSearchControl(config);

  const map = useMap();

  useEffect(() => {
    map.addControl(searchControl);

    return () => {
      map.removeControl(searchControl);
    };
  }, []);

  return null;
};

export default MapLocationSearch;
