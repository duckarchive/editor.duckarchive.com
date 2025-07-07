"use client";

import useSWR, { mutate } from "swr";
import { useState } from "react";

import { fetcher } from "@/lib/fetcher";

interface UseAdminOptions {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
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

  const apiUrl = `/api/${prefix}`;
  const { data, error, isLoading } = useSWR<T[]>(apiUrl, fetcher, {
    revalidateOnFocus: options.revalidateOnFocus ?? false,
    revalidateOnReconnect: options.revalidateOnReconnect ?? true,
  });

  const create = async (item: Omit<T, "id">): Promise<T> => {
    setIsCreating(true);
    try {
      const response = await fetch(apiUrl, {
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

      // Optimistically update the cache
      mutate(
        apiUrl,
        (current: T[] | undefined) =>
          current ? [...current, newItem] : [newItem],
        false,
      );

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
      const response = await fetch(`${apiUrl}/${id}`, {
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

      // Optimistically update the cache
      mutate(
        apiUrl,
        (current: T[] | undefined) =>
          current
            ? current.map((currentItem) =>
                currentItem.id === id
                  ? { ...currentItem, ...updatedItem }
                  : currentItem,
              )
            : [updatedItem],
        false,
      );

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
      const response = await fetch(`${apiUrl}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      // Optimistically update the cache
      mutate(
        apiUrl,
        (current: T[] | undefined) =>
          current ? current.filter((item) => item.id !== id) : [],
        false,
      );
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
