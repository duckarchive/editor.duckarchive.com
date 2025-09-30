"use client";

import { ColDef, FilterModel } from "ag-grid-community";
import { useState, useCallback } from "react";

import { useAdmin } from "@/hooks/useAdmin";
import InspectorTable from "@/components/inspector-table";
import InspectorPanel from "@/components/inspector-panel";
import { diff } from "@/lib/algorithm";
import { Archive, Author } from "@/generated/prisma/inspector-client";

interface InspectorViewProps {
  archives: Archive[];
  authors: Author[];
  prefix: string;
  columns: ColDef[];
}

const InspectorView: React.FC<InspectorViewProps> = ({ prefix, columns, archives, authors }) => {
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

  // const [selectedItems, setSelectedItems] = useState<BaseInstance[]>([]);
  const [activeItem, setActiveItem] = useState<BaseInstance>();

  const handleFilterChange = useCallback((newFilters: FilterModel) => {
    setFilters(newFilters);
  }, []);

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
      <InspectorPanel
        archives={archives}
        authors={authors}
        activeItem={activeItem}
        onClose={handleResetActiveItem}
        onSave={handleSaveActiveItem}
      />
      <InspectorTable
        columns={columns}
        isLoading={isLoading}
        rows={data || []}
        onFilterChanged={handleFilterChange}
        onRowClick={setActiveItem}
      />
    </div>
  );
};

export default InspectorView;
