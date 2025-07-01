import { NextPage } from "next";
import Link from "next/link";

import { duckkeyPrisma } from "@/lib/db";

const DuckKeyPage: NextPage = async () => {
  const dbTables = await duckkeyPrisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' and table_name != '_prisma_migrations'
    ORDER BY table_name;
  `;

  return (
    <div>
      <ul>
        {dbTables.map(({ table_name }) => (
          <li key={table_name}>
            <Link href={`/key/${table_name}`}>{table_name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DuckKeyPage;
