import { NextPage } from "next";

import { duckkeyPrisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/duckkey-client";
import prisma2agGrid from "@/lib/prisma-to-aggrid";
import AdminView from "@/components/admin-view";

interface DuckKeyTablePageProps {
  params: Promise<{ instance: keyof typeof duckkeyPrisma }>;
}

const DuckKeyTablePage: NextPage<DuckKeyTablePageProps> = async ({
  params,
}) => {
  const { instance } = await params;
  const cols = prisma2agGrid(Prisma.dmmf);
  const prefix = `key/${instance.toString()}`;

  return <AdminView prefix={prefix} columns={cols[instance.toString()]} />;
};

export default DuckKeyTablePage;
