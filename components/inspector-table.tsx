"use client";

import { DuckTable } from "@duckarchive/framework";
import { memo } from "react";
import { CellValueChangedEvent, ColDef, FilterChangedEvent, FilterModel, FilterModifiedEvent, RowClickedEvent } from "ag-grid-community";

interface InspectorTableProps {
  isLoading?: boolean;
  columns: ColDef[];
  rows: any[];
  onCellValueChanged?: (newData: BaseInstance) => void;
  onRowClick?: (rowData?: BaseInstance) => void;
  onSelectionChanged: (items: BaseInstance[]) => void;
  onFilterChanged: (filters: FilterModel) => void;
}

const InspectorTable: React.FC<InspectorTableProps> = memo(
  ({ rows, columns, onFilterChanged, onRowClick, onSelectionChanged, onCellValueChanged, isLoading }) => {
    const handleSelectionChange = ({
      api,
    }: any) => {
      const selectedNodes = api.getSelectedNodes();
      if (selectedNodes) {
        onSelectionChanged(selectedNodes.map((node: any) => node.data));
      } else {
        onSelectionChanged([]);
      }
    };

    const handleFilterChange = (event: FilterChangedEvent) => {
      const filterModel = event.api.getFilterModel();

      onFilterChanged(filterModel);
    };

    const handleClick = (event: RowClickedEvent<BaseInstance, any>) => {
      onRowClick?.(event.data);
    };

    const handleCellValueChange = (event: CellValueChangedEvent<BaseInstance>) => {
      onCellValueChanged?.(event.data);
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
        rowSelection={{ mode: "multiRow", selectAll: "filtered" }}
        rows={rows}
        setActiveFilterId={() => {}}
        selectionColumnDef={{
          cellClass: "bg-gray-100",
          headerClass: "bg-gray-100",
        }}
        suppressHorizontalScroll={false}
        onCellValueChanged={handleCellValueChange}
        onFilterChanged={handleFilterChange}
        onRowClicked={handleClick}
        onSelectionChanged={handleSelectionChange}
      />
    );
  },
);

InspectorTable.displayName = "InspectorTable";

export default InspectorTable;
