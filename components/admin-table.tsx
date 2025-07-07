"use client";

import { DuckTable } from "@duckarchive/framework";

import { useAdmin } from "@/hooks/useAdmin";

interface AdminTableProps {
  prefix: string;
}

const AdminTable: React.FC<AdminTableProps> = ({ prefix }) => {
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
      columns={[{ field: "birth_date", headerName: "birth_date" }]}
      rows={data}
      setActiveFilterId={() => {}} // not works in page directly
    />
  );
};

export default AdminTable;
