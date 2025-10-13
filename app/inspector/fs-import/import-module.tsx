"use client";

import { FSItemsFreshResponse } from "@/app/api/inspector/fs-items/fresh/route";
import { autoParseFSItem } from "@/app/inspector/fs-import/parse";
import { useGet } from "@/hooks/useApi";
import { DuckTable, parseCode, parseMeta } from "@duckarchive/framework";
import { Link } from "@heroui/link";
import { ColDef } from "ag-grid-community";

type TableItem = FSItemsFreshResponse[number];

const renderParseResultCell = ({ data }: { data: TableItem }) => {
  const parsed = autoParseFSItem(data);
  return (
    <>
      {parsed.map((item) => (
        <p key={`${data.dgs}-${item}`}>{item}</p>
      ))}
    </>
  );
};

const ImportModule: React.FC = () => {
  const { data } = useGet<FSItemsFreshResponse>(
    "/api/inspector/fs-items/fresh"
  );

  return (
    <div>
      <DuckTable<TableItem>
        columns={[
          {
            field: "dgs",
            headerName: "DGS",
            width: 120,
            cellRenderer: ({ value }: { value: string }) => (
              <Link
                isExternal
                href={`https://www.familysearch.org/en/records/images/search-results?imageGroupNumbers=${value}`}
                className="text-sm underline"
              >
                {value}
              </Link>
            ),
          },
          {
            field: "project_id",
            headerName: "Project ID",
            width: 140,
            cellRenderer: ({ value }: { value: string }) => (
              <Link
                isExternal
                href={`https://www.familysearch.org/en/records/images/search-results?projectId=${value}`}
                className="text-sm underline"
              >
                {value}
              </Link>
            ),
          },
          {
            field: "volume",
            flex: 1,
          },
          // {
          //   field: "volumes",
          // },
          // {
          //   field: "archival_reference",
          // },
          {
            colId: "parsed",
            headerName: "Розпізнано",
            cellRenderer: renderParseResultCell,
            pinned: "right",
            width: 200,
            resizable: false,
          },
        ]}
        rows={data || []}
        setActiveFilterId={() => {}}
        defaultColDef={{
          wrapText: true,
          autoHeight: true,
        }}
      />
    </div>
  );
};

export default ImportModule;
