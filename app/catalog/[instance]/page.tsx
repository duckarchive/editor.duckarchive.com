import { NextPage } from "next";

import { catalogPrisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/catalog-client";
import prisma2agGrid from "@/lib/prisma-to-aggrid";
import AdminView from "@/components/admin-view";

interface DuckCatalogTablePageProps {
  params: Promise<{ instance: keyof typeof catalogPrisma }>;
}

const DuckCatalogTablePage: NextPage<DuckCatalogTablePageProps> = async ({
  params,
}) => {
  const { instance } = await params;
  const cols = prisma2agGrid(Prisma.dmmf);
  const prefix = `catalog/${instance.toString()}`;

  return <AdminView prefix={prefix} columns={cols[instance.toString()]} />;
};

export default DuckCatalogTablePage;
