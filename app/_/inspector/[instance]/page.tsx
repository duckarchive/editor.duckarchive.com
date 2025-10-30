import { NextPage } from "next";

import { inspectorPrisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/inspector-client";
import prisma2agGrid from "@/lib/prisma-to-aggrid";
import InspectorView from "@/components/inspector-view";

interface DuckInspectorTablePageProps {
  params: Promise<{ instance: keyof typeof inspectorPrisma }>;
}

const DuckInspectorTablePage: NextPage<DuckInspectorTablePageProps> = async ({
  params,
}) => {
  const { instance } = await params;
  const cols = prisma2agGrid(Prisma.dmmf);
  const prefix = `inspector/${instance.toString()}`;

  return <InspectorView columns={cols[instance.toString()]} prefix={prefix} />;
};

export default DuckInspectorTablePage;
