import { NextPage } from "next";
import { Prisma } from "@/generated/prisma/inspector-client";
import { inspectorPrisma } from "@/lib/db";
import prisma2agGrid from "@/lib/prisma-to-aggrid";
import AuthorsView from "./authors-view";

const InspectorAuthorsPage: NextPage = async () => {
  const cols = prisma2agGrid(Prisma.dmmf);
  const archives = await inspectorPrisma.archive.findMany();
  const authors = await inspectorPrisma.author.findMany();

  return (
    <AuthorsView
      columns={cols["authors"] || []}
      archives={archives}
      authors={authors}
    />
  );
};

export default InspectorAuthorsPage;
