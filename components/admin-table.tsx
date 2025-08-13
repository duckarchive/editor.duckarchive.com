"use client";

import { DuckTable } from "@duckarchive/framework";
import {
  ColDef,
  SelectionChangedEvent,
  FilterChangedEvent,
} from "ag-grid-community";
import { memo } from "react";

interface AdminTableProps {
  isLoading?: boolean;
  columns: ColDef[];
  rows: any[];
  onSelectionChanged: (items: BaseInstance[]) => void;
  onFilterChanged: (filters: Record<string, any>) => void;
}

const AdminTable: React.FC<AdminTableProps> = memo(
  ({ rows, columns, onSelectionChanged, onFilterChanged, isLoading }) => {
    const handleSelectionChange = ({
      selectedNodes,
    }: SelectionChangedEvent<BaseInstance, any>) => {
      if (selectedNodes) {
        onSelectionChanged(selectedNodes.map((node) => node.data));
      } else {
        onSelectionChanged([]);
      }
    };

    const handleFilterChange = (event: FilterChangedEvent) => {
      const filterModel = event.api.getFilterModel();

      onFilterChanged(filterModel);
    };

    return (
      <DuckTable<any>
        appTheme="dark"
        columns={columns}
        isLoading={isLoading}
        rowSelection={{ mode: "multiRow", selectAll: "filtered" }}
        rows={rows}
        setActiveFilterId={() => {}}
        suppressHorizontalScroll={false}
        onFilterChanged={handleFilterChange}
        onSelectionChanged={handleSelectionChange}
      />
    );
  }
);

AdminTable.displayName = "AdminTable";

export default AdminTable;
