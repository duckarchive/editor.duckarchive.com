import { NextPage } from "next";

import { inspectorPrisma } from "@/lib/db";
import SelectTable from "@/components/select-table";

const DuckInspectorPage: NextPage = async () => {
  const dbTables = await inspectorPrisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' and table_name != '_prisma_migrations'
    ORDER BY table_name;
  `;

  return (
    <SelectTable
      description="Оберіть таблицю для перегляду та управління даними"
      items={dbTables}
      prefix="/inspector"
      title="Проєкт inspector.duckarchive.com"
    />
  );
};

export default DuckInspectorPage;
