import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface Ritual {
  id: string;
  hotelId: string;
  name: string;
  completed: boolean;
  weekStart: string;
  [key: string]: unknown;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Filters {
  weekStart?: string;
  page?: number;
  limit?: number;
}

export function useRituals(hotelId: string, filters: Filters = {}) {
  const [data, setData] = useState<Ritual[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ hotelId });
      if (filters.weekStart) params.set("weekStart", filters.weekStart);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));

      const res = await fetch(`/api/quality/rituals?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const json = await res.json();
      setData(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch rituals";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [hotelId, filters.weekStart, filters.page, filters.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleRitual = useCallback(
    async (body: { ritualKey: string; weekStart: string; completed: boolean }) => {
      try {
        const res = await fetch("/api/quality/rituals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, hotelId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
        }
        toast({ title: "Success", description: "Ritual updated" });
        await fetchData();
        return await res.json();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to toggle ritual";
        toast({ title: "Error", description: msg, variant: "destructive" });
        throw e;
      }
    },
    [hotelId, fetchData]
  );

  return { data, meta, loading, error, toggleRitual, refresh: fetchData };
}
