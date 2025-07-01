import { NextPage } from "next";
import { DuckTable } from "@duckarchive/framework";

import { duckkeyPrisma } from "@/lib/db";

const DuckKeyTablePage: NextPage = async () => {
  const items = await duckkeyPrisma["person"].findMany({ take: 100 });

  console.log("Items:", items);

  return (
    <div>
      <DuckTable<any>
        columns={[{ field: "firstName", headerName: "First Name" }]}
        rows={items}
        // setActiveFilterId={() => {}} not works in page directly
      />
    </div>
  );
};

export default DuckKeyTablePage;
