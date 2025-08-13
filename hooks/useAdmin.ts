"use client";

import useSWR, { mutate } from "swr";
import { useState } from "react";

import { fetcher } from "@/lib/fetcher";
import { buildQueryString } from "@/lib/api-helpers";

interface UseAdminOptions {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  filters?: Record<string, any>;
}

interface AdminHookReturn<T> {
  data: T[] | undefined;
  error: any;
  isLoading: boolean;
  create: (item: Omit<T, "id">) => Promise<T>;
  update: (id: string | number, item: Partial<T>) => Promise<T>;
  delete: (id: string | number) => Promise<void>;
  refresh: () => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export const useAdmin = <T extends { id: string | number }>(
  prefix: string,
  options: UseAdminOptions = {},
): AdminHookReturn<T> => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryString = buildQueryString(options.filters || {});
  const apiUrl = `/api/${prefix}${queryString}`;

  const { data, error, isLoading } = useSWR<T[]>(apiUrl, fetcher, {
    revalidateOnFocus: options.revalidateOnFocus ?? false,
    revalidateOnReconnect: options.revalidateOnReconnect ?? true,
  });

  const create = async (item: Omit<T, "id">): Promise<T> => {
    setIsCreating(true);
    try {
      const response = await fetch(`/api/${prefix}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error("Failed to create item");
      }

      const newItem = await response.json();

      // Invalidate cache to refetch with filters
      mutate(apiUrl);

      return newItem;
    } catch (error) {
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const update = async (id: string | number, item: Partial<T>): Promise<T> => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/${prefix}/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error("Failed to update item");
      }

      const updatedItem = await response.json();

      // Invalidate cache to refetch with filters
      mutate(apiUrl);

      return updatedItem;
    } catch (error) {
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteItem = async (id: string | number): Promise<void> => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/${prefix}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      // Invalidate cache to refetch with filters
      mutate(apiUrl);
    } catch (error) {
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  const refresh = async (): Promise<void> => {
    await mutate(apiUrl);
  };

  return {
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
  };
};
