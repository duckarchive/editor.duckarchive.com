import { NextPage } from "next";
import { Link } from "@heroui/link";

const PREFIX = "/inspector";
const routes = [
  {
    path: "import-family-search",
    label: "Імпорт Family Search",
  },
];

const DuckInspectorPage: NextPage = async () => {
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">
        Оберіть тип даних для перегляду та управління
      </h1>
      <ul>
        {routes.map((route) => (
          <li key={route.path}>
            <Link href={`${PREFIX}/${route.path}`}>{route.label}</Link>
          </li>
        ))}
      </ul>
    </>
  );
};

export default DuckInspectorPage;
