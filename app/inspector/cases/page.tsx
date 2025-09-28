import InspectorView from "@/components/inspector-view";
import { Prisma } from "@/generated/prisma/inspector-client";
import prisma2agGrid from "@/lib/prisma-to-aggrid";
import { NextPage } from "next";

const InspectorCasesPage: NextPage = async () => {
  const prefix = `inspector/cases`;
  const cols = prisma2agGrid(Prisma.dmmf);

  return <InspectorView prefix={prefix} columns={cols['cases']} />;
};

export default InspectorCasesPage;
