import { NextPage } from "next";
import Link from "next/link";

const instances = [
  {
    name: "Архіви",
    path: "/catalog/archives",
  },
  {
    name: "Справи",
    path: "/catalog/items",
  },
];

const CatalogPage: NextPage = () => {
  return (
    <div>
      <ul>
        {instances.map(({ name, path }) => (
          <li key={name}>
            <Link href={path}>{name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CatalogPage;
