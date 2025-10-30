import ImportFamilySearch from "@/app/inspector/import-family-search/import-family-search";
import { NextPage } from "next";

const DuckInspectorFSImportPage: NextPage = async () => {
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">
        Імпорт Family Search
      </h1>
      <ImportFamilySearch prefix="inspector/import-family-search" />
    </>
  );
};

export default DuckInspectorFSImportPage;
