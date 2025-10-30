import ImportModule from "@/app/_/inspector/fs-import/import-module";
import InspectorView from "@/components/inspector-view";
import { Prisma } from "@/generated/prisma/inspector-client";
import { inspectorPrisma } from "@/lib/db";
import prisma2agGrid from "@/lib/prisma-to-aggrid";
import { NextPage } from "next";

const InspectorFamilySearchImportPage: NextPage = async () => {
  const prefix = `inspector/family_search_items`;
  const cols = prisma2agGrid(Prisma.dmmf);
  const archives = await inspectorPrisma.archive.findMany();
  const authors = await inspectorPrisma.author.findMany();

  return <ImportModule />;
};

export default InspectorFamilySearchImportPage;
