"use client";

import { DuckTable } from "@duckarchive/framework";
import { ColDef } from "ag-grid-community";

import { useAdmin } from "@/hooks/useAdmin";

interface AdminTableProps {
  prefix: string;
  columns: ColDef[];
}

const AdminTable: React.FC<AdminTableProps> = ({ prefix, columns }) => {
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
  } = useAdmin<any>(prefix);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data?.length) {
    return <div>No data available</div>;
  }

  return (
    <DuckTable<any>
      columns={columns}
      rows={data}
      setActiveFilterId={() => {}} // not works in page directly
    />
  );
};

export default AdminTable;
