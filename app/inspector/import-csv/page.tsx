import { NextPage } from "next";
import { inspectorPrisma } from "@/lib/db";
import ImportCsv from "./import-csv";

const ImportCsvPage: NextPage = async () => {
  const archives = await inspectorPrisma.archive.findMany();

  return <ImportCsv archives={archives} />;
};

export default ImportCsvPage;
