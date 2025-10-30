"use client";

import { FilterModel } from "ag-grid-community";
import { useState, useCallback, useMemo } from "react";

import { useAdmin } from "@/hooks/useAdmin";
import InspectorTable from "@/components/inspector-table";
import { diff } from "@/lib/algorithm";
import { autoParseFSItem } from "@/app/inspector/import-family-search/parse";
import { Link } from "@heroui/link";
import { GetImportFamilySearchResponse } from "@/app/api/inspector/import-family-search/route";
import { Button } from "@heroui/button";
import { usePost } from "@/hooks/useApi";

type TableItem = GetImportFamilySearchResponse[number];

const renderParseResultCell = ({
  value,
  data,
}: {
  value: string;
  data: TableItem;
}) => {
  if (value) {
    return value;
  } else {
    const parsed = autoParseFSItem(data);
    return (
      <>
        {parsed.map((item) => (
          <p key={`${data.dgs}-${item}`}>{item}</p>
        ))}
      </>
    );
  }
};

interface InspectorViewProps {
  prefix: string;
  onSelectionChanged?: (items: BaseInstance[]) => void;
}

const ImportFamilySearch: React.FC<InspectorViewProps> = ({
  prefix,
  onSelectionChanged,
}) => {
  const [filters, setFilters] = useState<FilterModel>({});
  const {
    data,
    error,
    isLoading,
    create,
    update,
    similar,
    delete: deleteItem,
    refresh,
    isCreating,
    isUpdating,
    isDeleting,
  } = useAdmin<TableItem>(prefix, { filters });

  const { trigger: importItems, isMutating: isImporting } = usePost<any, any>(
    "/api/inspector/import-family-search"
  );

  const [selectedItems, setSelectedItems] = useState<TableItem[]>([]);

  const handleFilterChange = useCallback((newFilters: FilterModel) => {
    setFilters(newFilters);
  }, []);

  const handleEdit = (newData: BaseInstance) => {
    console.log("Edited item:", newData);
  };

  const handleSelectionChange = useCallback(
    (items: BaseInstance[]) => {
      if (onSelectionChanged) {
        onSelectionChanged(items);
      }
      setSelectedItems(items as TableItem[]);
    },
    [onSelectionChanged]
  );

  const handleImport = async () => {
    const items = selectedItems.map((el: any) => ({
      ...el,
      parsed_full_code: el.parsed_full_code || autoParseFSItem(el).join("-"),
    }));
    await importItems(items);
    await refresh();
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div>
        <Button
          onPress={handleImport}
          isLoading={isImporting}
          color="warning"
          isDisabled={!selectedItems.length}
        >
          Зберегти {selectedItems.length} вибраних записи(ів)
        </Button>
      </div>
      <InspectorTable
        columns={[
          {
            field: "parsed_full_code",
            headerName: "Реквізити на перевірку",
            cellRenderer: renderParseResultCell,
            valueGetter: (params) =>
              params.data.parsed_full_code ||
              autoParseFSItem(params.data).join(", "),
            type: "editableColumn",
            editable: true,
            width: 200,
            cellClass: "bg-warning-900",
            headerClass: "bg-warning-800",
          },
          {
            field: "archival_reference",
            headerName: "Archival Reference",
            filter: true,
            flex: 1,
          },
          {
            field: "volume",
            filter: true,
            flex: 1,
          },
          {
            field: "volumes",
            filter: true,
            flex: 1,
          },
          {
            field: "title",
            filter: true,
          },
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
            filter: true,
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
        ]}
        isLoading={isLoading}
        rows={data || []}
        onCellValueChanged={handleEdit}
        onFilterChanged={handleFilterChange}
        onSelectionChanged={handleSelectionChange}
      />
    </div>
  );
};

export default ImportFamilySearch;
