import AdminView from "@/components/admin-view";
import { Prisma } from "@/generated/prisma/inspector-client";
import { inspectorPrisma } from "@/lib/db";
import prisma2agGrid from "@/lib/prisma-to-aggrid";
import { NextPage } from "next";

interface InspectorCasesPageProps {
  params: Promise<{ instance: keyof typeof inspectorPrisma }>;
}

const InspectorCasesPage: NextPage<InspectorCasesPageProps> = async () => {
  const prefix = `inspector/cases`;
  const cols = prisma2agGrid(Prisma.dmmf);
  const authors = await inspectorPrisma.author.findMany();
  const archives = await inspectorPrisma.archive.findMany();

  return <AdminView prefix={prefix} columns={cols['cases']} authors={authors} archives={archives} />;
};

export default InspectorCasesPage;
