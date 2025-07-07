import { NextPage } from "next";

import { duckkeyPrisma } from "@/lib/db";
import AdminTable from "@/components/admin-table";

interface DuckKeyTablePageProps {
  params: Promise<{ instance: keyof typeof duckkeyPrisma }>;
}

const DuckKeyTablePage: NextPage<DuckKeyTablePageProps> = async ({
  params,
}) => {
  const { instance } = await params;
  const prefix = `key/${instance.toString()}`;

  return <AdminTable prefix={prefix} />;
};

export default DuckKeyTablePage;
