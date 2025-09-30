"use client";

import useSWR, { mutate, SWRConfiguration } from "swr";
import { useState } from "react";

import { fetcher } from "@/lib/api";
import { buildQueryString } from "@/lib/api";
import { useGet } from "@/hooks/useApi";
import { FilterModel } from "ag-grid-community";

interface UseAdminOptions extends SWRConfiguration {
  filters?: FilterModel;
}

type ID = string | number;

interface AdminHookReturn<T> {
  data: T[] | undefined;
  error: any;
  isLoading: boolean;
  create: (item: Omit<T, "id">) => Promise<T>;
  update: (id: ID[], item: Partial<T>) => Promise<T>;
  delete: (id: ID[]) => Promise<void>;
  similar: (id: ID, body: Partial<T>) => Promise<T[]>;
  refresh: () => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export const useAdmin = <T extends { id: string | number }>(
  prefix: string,
  { filters, ...options }: UseAdminOptions = {},
): AdminHookReturn<T> => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryString = buildQueryString(filters || {});
  const apiUrl = `/api/${prefix}${queryString}`;

  const { data, error, isLoading } = useGet<T[]>(apiUrl, options);

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

  const update = async (ids: ID[], item: Partial<T>): Promise<T> => {
    setIsUpdating(true);
    try {
      let response: Response;
      if (ids.length === 1) {
        response = await fetch(`/api/${prefix}/${ids[0]}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(item),
        });
      } else {
        response = await fetch(`/api/${prefix}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids, item }),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to update items");
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

  const deleteItem = async (ids: ID[]): Promise<void> => {
    setIsDeleting(true);
    try {
      let response: Response;
      if (ids.length === 1) {
        response = await fetch(`/api/${prefix}/${ids[0]}`, {
          method: "DELETE",
        });
      } else {
        response = await fetch(`/api/${prefix}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids }),
        });
      }
      if (!response.ok) {
        throw new Error("Failed to delete items");
      }

      // Invalidate cache to refetch with filters
      mutate(apiUrl);
    } catch (error) {
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  const similar = async (id: string | number, body: Partial<T>): Promise<T[]> => {
    try {
      const response = await fetch(`/api/${prefix}/${id}/similar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch similar items");
      }

      const similarItems = await response.json();
      return similarItems;
    } catch (error) {
      throw error;
    }
  }

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
    similar,
    isCreating,
    isUpdating,
    isDeleting,
  };
};
