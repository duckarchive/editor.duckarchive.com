"use client";

import { DuckTable } from "@duckarchive/framework";
import { memo } from "react";
import {
  ColDef,
  SelectionChangedEvent,
  FilterChangedEvent,
  RowClickedEvent,
} from "ag-grid-community";

interface AdminTableProps {
  isLoading?: boolean;
  columns: ColDef[];
  rows: any[];
  onRowClick: (rowData?: BaseInstance) => void;
  onSelectionChanged: (items: BaseInstance[]) => void;
  onFilterChanged: (filters: Record<string, any>) => void;
}

const AdminTable: React.FC<AdminTableProps> = memo(
  ({
    rows,
    columns,
    onSelectionChanged,
    onFilterChanged,
    onRowClick,
    isLoading,
  }) => {
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

    const handleClick = (event: RowClickedEvent<BaseInstance, any>) => {
      onRowClick(event.data);
    };

    return (
      <DuckTable<BaseInstance>
        appTheme="dark"
        columns={columns}
        isLoading={isLoading}
        rowSelection={{ mode: "multiRow", selectAll: "filtered" }}
        rows={rows}
        setActiveFilterId={() => {}}
        suppressHorizontalScroll={false}
        onFilterChanged={handleFilterChange}
        onRowClicked={handleClick}
        onSelectionChanged={handleSelectionChange}
      />
    );
  },
);

AdminTable.displayName = "AdminTable";

export default AdminTable;
