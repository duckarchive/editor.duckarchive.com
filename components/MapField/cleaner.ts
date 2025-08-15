import bboxPolygon from "@turf/bbox-polygon";
import booleanWithin from "@turf/boolean-within";
import { featureCollection } from "@turf/helpers";

const UKRAINE_BBOX = [22.1372, 44.3865, 40.2276, 52.3791]; // [minLon, minLat, maxLon, maxLat]

// Expand bbox by 20%
function expandBbox(bbox: number[], percent: number): number[] {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const lonDelta = ((maxLon - minLon) * percent) / 2;
  const latDelta = ((maxLat - minLat) * percent) / 2;

  return [
    minLon - lonDelta,
    minLat - latDelta,
    maxLon + lonDelta,
    maxLat + latDelta,
  ];
}

const expandedBbox = expandBbox(UKRAINE_BBOX, 0.2);
const ukrainePoly = bboxPolygon(expandedBbox);

export const response2geojson = (
  data: GeoJSON.FeatureCollection | null,
): GeoJSON.FeatureCollection => {
  if (!data) return { type: "FeatureCollection", features: [] };

  const inside: GeoJSON.Feature[] = [];
  const outside: GeoJSON.Feature[] = [];

  for (const feature of data.features) {
    try {
      if (booleanWithin(feature as any, ukrainePoly as any)) {
        inside.push(feature);
      } else {
        outside.push(feature);
      }
    } catch {
      outside.push(feature);
    }
  }

  if (outside.length) {
    // Print each geometry as a single line for easy copy
    console.log(outside.map((f) => f.properties?.id).join("\n"));
  }

  return featureCollection(inside);
};
