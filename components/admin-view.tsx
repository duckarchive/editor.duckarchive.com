"use client";

import { ColDef } from "ag-grid-community";
import { useState } from "react";

import { useAdmin } from "@/hooks/useAdmin";
import AdminTable from "@/components/admin-table";
import AdminPanel from "@/components/admin-panel";

interface AdminViewProps {
  prefix: string;
  columns: ColDef[];
}

const AdminView: React.FC<AdminViewProps> = ({ prefix, columns }) => {
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
  } = useAdmin<BaseInstance>(prefix);
  const [selectedItems, setSelectedItems] = useState<BaseInstance[]>([]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data?.length) {
    return <div>No data available</div>;
  }

  console.log("Selected items:", selectedItems);

  return (
    <div className="h-full flex flex-col">
      <AdminPanel items={selectedItems} />
      <AdminTable
        columns={columns}
        rows={data}
        onSelectionChanged={setSelectedItems}
      />
    </div>
  );
};

export default AdminView;
