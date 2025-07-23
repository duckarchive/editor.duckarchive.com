import { NextPage } from "next";

import { catalogPrisma } from "@/lib/db";
import SelectTable from "@/components/select-table";

const DuckCatalogPage: NextPage = async () => {
  const dbTables = await catalogPrisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' and table_name != '_prisma_migrations'
    ORDER BY table_name;
  `;

  return (
    <SelectTable
      description="Оберіть таблицю для перегляду та управління даними"
      items={dbTables}
      prefix="/catalog"
      title="Список сутностей проєкту catalog.duckarchive.com"
    />
  );
};

export default DuckCatalogPage;
