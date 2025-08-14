import dynamic from "next/dynamic";

const MapField = dynamic(
  () => import("./map-input").then((mod) => mod.default),
  { ssr: false },
);

export default MapField;
