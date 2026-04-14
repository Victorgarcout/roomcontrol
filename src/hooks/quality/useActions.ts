import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface Action {
  id: string;
  hotelId: string;
  text: string;
  status: string;
  category: string;
  dueDate?: string | null;
  owner?: string;
  score?: number | null;
  budget?: number | null;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Filters {
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export function useActions(hotelId: string, filters: Filters = {}) {
  const [data, setData] = useState<Action[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ hotelId });
      if (filters.status) params.set("status", filters.status);
      if (filters.category) params.set("category", filters.category);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));

      const res = await fetch(`/api/quality/actions?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const json = await res.json();
      setData(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch actions";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [hotelId, filters.status, filters.category, filters.page, filters.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createAction = useCallback(
    async (body: Partial<Action>) => {
      try {
        const res = await fetch("/api/quality/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, hotelId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
        }
        toast({ title: "Success", description: "Action created" });
        await fetchData();
        return await res.json();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to create action";
        toast({ title: "Error", description: msg, variant: "destructive" });
        throw e;
      }
    },
    [hotelId, fetchData]
  );

  const updateAction = useCallback(
    async (id: string, body: Partial<Action>) => {
      try {
        const res = await fetch(`/api/quality/actions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
        }
        toast({ title: "Success", description: "Action updated" });
        await fetchData();
        return await res.json();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to update action";
        toast({ title: "Error", description: msg, variant: "destructive" });
        throw e;
      }
    },
    [fetchData]
  );

  const deleteAction = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/quality/actions/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
        }
        toast({ title: "Success", description: "Action deleted" });
        await fetchData();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to delete action";
        toast({ title: "Error", description: msg, variant: "destructive" });
        throw e;
      }
    },
    [fetchData]
  );

  return {
    data,
    meta,
    loading,
    error,
    createAction,
    updateAction,
    deleteAction,
    refresh: fetchData,
  };
}
