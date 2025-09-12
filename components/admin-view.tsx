"use client";

import { ColDef } from "ag-grid-community";
import { useState, useCallback } from "react";

import { useAdmin } from "@/hooks/useAdmin";
import AdminTable from "@/components/admin-table";
import AdminPanel from "@/components/admin-panel";
import { diff } from "@/lib/algorithm";

interface AdminViewProps {
  prefix: string;
  columns: ColDef[];
}

const AdminView: React.FC<AdminViewProps> = ({ prefix, columns }) => {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const {
    data,
    error,
    isLoading,
    create,
    update,
    delete: deleteItem,
    refresh,
    isCreating,
    isUpdating,
    isDeleting,
  } = useAdmin<BaseInstance>(prefix, { filters });

  // const [selectedItems, setSelectedItems] = useState<BaseInstance[]>([]);
  const [activeItem, setActiveItem] = useState<BaseInstance>();

  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
  }, []);

  const handleResetActiveItem = () => {
    setActiveItem(undefined);
  };

  const handleSaveActiveItem = (values: BaseInstance) => {
    update(values.id, diff(values, activeItem || {}));
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <AdminPanel
        activeItem={activeItem}
        onClose={handleResetActiveItem}
        onSave={handleSaveActiveItem}
      />
      <AdminTable
        columns={columns}
        isLoading={isLoading}
        rows={data || []}
        onFilterChanged={handleFilterChange}
        onRowClick={setActiveItem}
      />
    </div>
  );
};

export default AdminView;
