import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface PlaybookEntry {
  id: string;
  hotelId: string;
  title: string;
  type: string;
  content?: string;
  isCustom?: boolean;
  [key: string]: unknown;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Filters {
  type?: string;
  page?: number;
  limit?: number;
}

export function usePlaybook(hotelId: string, filters: Filters = {}) {
  const [data, setData] = useState<PlaybookEntry[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ hotelId });
      if (filters.type) params.set("type", filters.type);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));

      const res = await fetch(`/api/quality/playbook?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const json = await res.json();
      setData(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch playbook";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [hotelId, filters.type, filters.page, filters.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createEntry = useCallback(
    async (body: Partial<PlaybookEntry>) => {
      try {
        const res = await fetch("/api/quality/playbook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, hotelId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
        }
        toast({ title: "Success", description: "Playbook entry created" });
        await fetchData();
        return await res.json();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to create entry";
        toast({ title: "Error", description: msg, variant: "destructive" });
        throw e;
      }
    },
    [hotelId, fetchData]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/quality/playbook/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
        }
        toast({ title: "Success", description: "Playbook entry deleted" });
        await fetchData();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to delete entry";
        toast({ title: "Error", description: msg, variant: "destructive" });
        throw e;
      }
    },
    [fetchData]
  );

  return { data, meta, loading, error, createEntry, deleteEntry, refresh: fetchData };
}
