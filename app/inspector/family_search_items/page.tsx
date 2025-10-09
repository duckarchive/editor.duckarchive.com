import InspectorView from "@/components/inspector-view";
import { Prisma } from "@/generated/prisma/inspector-client";
import { inspectorPrisma } from "@/lib/db";
import prisma2agGrid from "@/lib/prisma-to-aggrid";
import { NextPage } from "next";

const InspectorFamilySearchItemsPage: NextPage = async () => {
  const prefix = `inspector/family_search_items`;
  const cols = prisma2agGrid(Prisma.dmmf);
  const archives = await inspectorPrisma.archive.findMany();
  const authors = await inspectorPrisma.author.findMany();

  return <InspectorView prefix={prefix} columns={cols['family_search_items']} archives={archives} authors={authors} />;
};

export default InspectorFamilySearchItemsPage;
