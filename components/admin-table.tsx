"use client";

import { DuckTable } from "@duckarchive/framework";
import { ColDef, SelectionChangedEvent } from "ag-grid-community";
import { memo } from "react";

interface AdminTableProps {
  columns: ColDef[];
  rows: any[];
  onSelectionChanged: (items: BaseInstance[]) => void;
}

const AdminTable: React.FC<AdminTableProps> = memo(
  ({ rows, columns, onSelectionChanged }) => {
    const handleSelectionChange = ({
      selectedNodes,
    }: SelectionChangedEvent<BaseInstance, any>) => {
      if (selectedNodes) {
        onSelectionChanged(selectedNodes.map((node) => node.data));
      } else {
        onSelectionChanged([]);
      }
    };

    return (
      <DuckTable<any>
        appTheme="dark"
        columns={columns}
        rowSelection={{ mode: "multiRow", selectAll: "filtered" }}
        rows={rows}
        setActiveFilterId={() => {}}
        suppressHorizontalScroll={false}
        onSelectionChanged={handleSelectionChange}
      />
    );
  }
);

AdminTable.displayName = "AdminTable";

export default AdminTable;
