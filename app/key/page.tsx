import { NextPage } from "next";

import { duckkeyPrisma } from "@/lib/db";
import SelectTable from "@/components/select-table";

const DuckKeyPage: NextPage = async () => {
  const dbTables = await duckkeyPrisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' and table_name != '_prisma_migrations'
    ORDER BY table_name;
  `;

  return (
    <SelectTable
      description="Оберіть таблицю для перегляду та управління даними"
      items={dbTables}
      title="Список сутностей проєкту index.duckarchive.com"
    />
  );
};

export default DuckKeyPage;
