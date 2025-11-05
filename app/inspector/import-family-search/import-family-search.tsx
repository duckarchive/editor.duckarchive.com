"use client";

import { FilterModel } from "ag-grid-community";
import { useState, useCallback } from "react";

import { useAdmin } from "@/hooks/useAdmin";
import InspectorTable from "@/components/inspector-table";
import { autoParseFSItem } from "@/app/inspector/import-family-search/parsers";
import { Link } from "@heroui/link";
import { GetImportFamilySearchResponse } from "@/app/api/inspector/import-family-search/route";
import { Button } from "@heroui/button";
import { usePost } from "@/hooks/useApi";
import FindAndReplace from "@/components/find-and-replace";

type TableItem = GetImportFamilySearchResponse[number];
interface FindAndReplaceData {
  find: string;
  replace: string;
}

const getCellClass = ({ value }: { value: string }) => {
  let classNames = "text-wrap";
  if (value.includes(", ")) {
    // multiline
    classNames += " leading-[1.3]";
  }
  if (value.includes("--")) {
    // invalid
    classNames += " bg-danger-900";
  } else {
    // default
    classNames += " bg-gray-100";
  }

  return classNames;
};

const getFullCode = (
  value: string,
  data: TableItem,
  findAndReplace?: FindAndReplaceData
) => {
  const raw = value || autoParseFSItem(data).join(", ");
  return findAndReplace
    ? raw.replace(new RegExp(findAndReplace.find, "g"), findAndReplace.replace)
    : raw;
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
  const [findAndReplace, setFindAndReplace] = useState<FindAndReplaceData>();
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
      parsed_full_code: getFullCode(el.parsed_full_code, el, findAndReplace),
    }));
    await importItems(items);
    await refresh();
  };

  const handleReplace = (find: string, replace: string) => {
    setFindAndReplace({ find, replace });
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between">
        <div>
          <FindAndReplace onReplace={handleReplace} />
        </div>
        <div>
          <Button
            onPress={handleImport}
            isLoading={isImporting}
            color="success"
            variant={selectedItems.length ? "solid" : "bordered"}
            isDisabled={!selectedItems.length}
          >
            Зберегти {selectedItems.length} вибраних записи(ів)
          </Button>
        </div>
      </div>
      <InspectorTable
        columns={[
          {
            field: "parsed_full_code",
            headerName: "Реквізити",
            valueGetter: (params) =>
              getFullCode(
                params.data.parsed_full_code,
                params.data,
                findAndReplace
              ),
            type: "editableColumn",
            editable: true,
            width: 200,
            cellClass: getCellClass,
            headerClass: "bg-gray-100",
            autoHeight: true,
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
        onFilterChanged={handleFilterChange}
        onSelectionChanged={handleSelectionChange}
      />
    </div>
  );
};

export default ImportFamilySearch;
