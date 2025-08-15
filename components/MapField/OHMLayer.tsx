// inside your client map component
import { GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";

// Helper function to order ways into proper polygon rings
const orderWaysIntoRings = (
  ways: any[],
  nodesById: Map<any, any>,
): number[][][] => {
  if (ways.length === 0) return [];

  // Convert ways to coordinate arrays
  const wayCoords = ways
    .map((way: any) => {
      const coords = way.nodes
        .map((nodeId: number) => nodesById.get(nodeId))
        .filter(
          (node: any) =>
            node && node.lat !== undefined && node.lon !== undefined,
        )
        .map((node: any) => [node.lon, node.lat]);

      return coords;
    })
    .filter((coords: number[][]) => coords.length >= 2);

  if (wayCoords.length === 0) return [];

  // For a single way, just ensure it's closed
  if (wayCoords.length === 1) {
    const coords = wayCoords[0];

    if (coords.length < 3) return [];

    // Close the ring if needed
    if (
      coords[0][0] !== coords[coords.length - 1][0] ||
      coords[0][1] !== coords[coords.length - 1][1]
    ) {
      coords.push([coords[0][0], coords[0][1]]);
    }

    return [coords];
  }

  // For multiple ways, try to connect them
  const orderedWays: number[][][] = [];
  const usedWays = new Set<number>();

  let currentRing: number[][] = [...wayCoords[0]];

  usedWays.add(0);

  while (usedWays.size < wayCoords.length) {
    const lastPoint = currentRing[currentRing.length - 1];

    let foundConnection = false;

    // Look for a way that connects to the end of current ring
    for (let i = 0; i < wayCoords.length; i++) {
      if (usedWays.has(i)) continue;

      const way = wayCoords[i];
      const wayStart = way[0];
      const wayEnd = way[way.length - 1];

      // Check if this way connects to the end of our current ring
      if (lastPoint[0] === wayStart[0] && lastPoint[1] === wayStart[1]) {
        // Connect normally (skip first point to avoid duplicate)
        currentRing = currentRing.concat(way.slice(1));
        usedWays.add(i);
        foundConnection = true;
        break;
      } else if (lastPoint[0] === wayEnd[0] && lastPoint[1] === wayEnd[1]) {
        // Connect in reverse (skip last point to avoid duplicate)
        currentRing = currentRing.concat(way.slice(0, -1).reverse());
        usedWays.add(i);
        foundConnection = true;
        break;
      }
    }

    // If no connection found, start a new ring or break
    if (!foundConnection) {
      // Check if current ring is closed
      const ringStart = currentRing[0];
      const ringEnd = currentRing[currentRing.length - 1];

      if (ringStart[0] !== ringEnd[0] || ringStart[1] !== ringEnd[1]) {
        currentRing.push([ringStart[0], ringStart[1]]);
      }

      if (currentRing.length >= 4) {
        orderedWays.push(currentRing);
      }

      // Start a new ring with next unused way
      const nextUnused = wayCoords.findIndex(
        (_, index) => !usedWays.has(index),
      );

      if (nextUnused !== -1) {
        currentRing = [...wayCoords[nextUnused]];
        usedWays.add(nextUnused);
      } else {
        break;
      }
    }
  }

  // Add the final ring
  if (currentRing.length >= 3) {
    const ringStart = currentRing[0];
    const ringEnd = currentRing[currentRing.length - 1];

    if (ringStart[0] !== ringEnd[0] || ringStart[1] !== ringEnd[1]) {
      currentRing.push([ringStart[0], ringStart[1]]);
    }

    if (currentRing.length >= 4) {
      orderedWays.push(currentRing);
    }
  }

  return orderedWays;
};

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

  // Overpass JSON → GeoJSON FeatureCollection helper
  const features = (data.elements || [])
    .filter((e: any) => e.type === "relation")
    .map((relation: any) => {
      try {
        // Create a lookup for ways by their ID
        const waysById = new Map();
        const nodesById = new Map();

        // Index all ways and nodes
        (data.elements || []).forEach((element: any) => {
          if (element.type === "way") {
            waysById.set(element.id, element);
          } else if (element.type === "node") {
            nodesById.set(element.id, element);
          }
        });

        // Get outer members (ways that form the boundary)
        const outerMembers = (relation.members || [])
          .filter((m: any) => m.type === "way" && m.role !== "inner")
          .map((m: any) => waysById.get(m.ref))
          .filter((way: any) => way && way.nodes);

        if (outerMembers.length === 0) return null;

        // For simple cases with one way, just use its coordinates
        if (outerMembers.length === 1) {
          const way = outerMembers[0];
          const coords = way.nodes
            .map((nodeId: number) => nodesById.get(nodeId))
            .filter(
              (node: any) =>
                node && node.lat !== undefined && node.lon !== undefined,
            )
            .map((node: any) => [node.lon, node.lat]);

          if (coords.length < 3) return null;

          // Ensure the polygon is closed
          if (
            coords[0][0] !== coords[coords.length - 1][0] ||
            coords[0][1] !== coords[coords.length - 1][1]
          ) {
            coords.push([coords[0][0], coords[0][1]]);
          }

          return {
            type: "Feature",
            id: relation.id,
            properties: relation.tags || {},
            geometry: {
              type: "Polygon",
              coordinates: [coords],
            },
          };
        }

        // For multiple ways, we need to connect them properly by ordering them
        // to form a continuous boundary
        const orderedCoords = orderWaysIntoRings(outerMembers, nodesById);

        if (orderedCoords.length === 0) return null;

        return {
          type: "Feature",
          id: relation.id,
          properties: relation.tags || {},
          geometry: {
            type: "Polygon",
            coordinates: orderedCoords,
          },
        };
      } catch {
        // If there's any error processing this relation, skip it
        return null;
      }
    })
    .filter((feature: any) => feature !== null);

  const fc = { type: "FeatureCollection", features };

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
