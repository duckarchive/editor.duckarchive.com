import ImportFamilySearch from "@/app/inspector/import-family-search/import-family-search";
import { NextPage } from "next";

const DuckInspectorFSImportPage: NextPage = async () => {
  return (
    <>
      <ImportFamilySearch prefix="inspector/import-family-search" />
    </>
  );
};

export default DuckInspectorFSImportPage;
