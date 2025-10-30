"use client";

import { FilterModel } from "ag-grid-community";
import { useState, useCallback } from "react";

import { useAdmin } from "@/hooks/useAdmin";
import InspectorTable from "@/components/inspector-table";
import { diff } from "@/lib/algorithm";
import { autoParseFSItem } from "@/app/inspector/import-family-search/parse";
import { Link } from "@heroui/link";
import { GetImportFamilySearchResponse } from "@/app/api/inspector/import-family-search/route";

type TableItem = GetImportFamilySearchResponse[number];

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

interface InspectorViewProps {
  prefix: string;
  onSelectionChanged?: (items: BaseInstance[]) => void;
}

const ImportFamilySearch: React.FC<InspectorViewProps> = ({ prefix, onSelectionChanged }) => {
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
  } = useAdmin<BaseInstance>(prefix, { filters });

  const [selectedItems, setSelectedItems] = useState<BaseInstance[]>([]);
  const [activeItem, setActiveItem] = useState<BaseInstance>();

  const handleFilterChange = useCallback((newFilters: FilterModel) => {
    setFilters(newFilters);
  }, []);

  const handleSelectionChange = useCallback((items: BaseInstance[]) => {
    if (onSelectionChanged) {
      onSelectionChanged(items);
    }
    setSelectedItems(items);
  }, [onSelectionChanged]);

  const handleResetActiveItem = () => {
    setActiveItem(undefined);
  };

  const handleSaveActiveItem = async (values: BaseInstance) => {
    const itemsToUpdate = await similar(values.id, diff(values, activeItem || {}));
    const res = confirm(`Підтвердіть оновлення ${itemsToUpdate.length} елементів`);
    if (res) {
      await update(itemsToUpdate.map(item => item.id), diff(values, activeItem || {}));
    } else {
      await update([values.id], values);
    }
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <InspectorTable
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
            field: "date",
            filter: true,
            flex: 1,
          },
          {
            colId: "parsed",
            headerName: "Розпізнано",
            cellRenderer: renderParseResultCell,
            valueGetter: (params) => autoParseFSItem(params.data).join(", "),
            pinned: "right",
            width: 200,
            resizable: false,
          },
        ]}
        isLoading={isLoading}
        rows={data || []}
        onFilterChanged={handleFilterChange}
        onRowClick={setActiveItem}
        onSelectionChanged={handleSelectionChange}
      />
    </div>
  );
};

export default ImportFamilySearch;
