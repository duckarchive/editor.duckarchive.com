"use client";

import { DuckTable } from "@duckarchive/framework";
import { memo } from "react";
import { ColDef, FilterChangedEvent, RowClickedEvent } from "ag-grid-community";

interface InspectorTableProps {
  isLoading?: boolean;
  columns: ColDef[];
  rows: any[];
  onRowClick: (rowData?: BaseInstance) => void;
  // onSelectionChanged: (items: BaseInstance[]) => void;
  onFilterChanged: (filters: Record<string, any>) => void;
}

const InspectorTable: React.FC<InspectorTableProps> = memo(
  ({ rows, columns, onFilterChanged, onRowClick, isLoading }) => {
    // const handleSelectionChange = ({
    //   selectedNodes,
    // }: SelectionChangedEvent<BaseInstance, any>) => {
    //   if (selectedNodes) {
    //     onSelectionChanged(selectedNodes.map((node) => node.data));
    //   } else {
    //     onSelectionChanged([]);
    //   }
    // };

    const handleFilterChange = (event: FilterChangedEvent) => {
      const filterModel = event.api.getFilterModel();

      onFilterChanged(filterModel);
    };

    const handleClick = (event: RowClickedEvent<BaseInstance, any>) => {
      onRowClick(event.data);
    };

    // move created_at, updated_at to the end
    const sortedColumns = [
      ...columns.filter((col) => col.field !== "created_at" && col.field !== "updated_at"),
      columns.find((col) => col.field === "created_at"),
      columns.find((col) => col.field === "updated_at"),
    ].filter(Boolean) as ColDef[];

    return (
      <DuckTable<BaseInstance>
        appTheme="light"
        columns={sortedColumns}
        isLoading={isLoading}
        // rowSelection={{ mode: "multiRow", selectAll: "filtered" }}
        rows={rows}
        setActiveFilterId={() => {}}
        suppressHorizontalScroll={false}
        onFilterChanged={handleFilterChange}
        onRowClicked={handleClick}
        // onSelectionChanged={handleSelectionChange}
      />
    );
  },
);

InspectorTable.displayName = "InspectorTable";

export default InspectorTable;
