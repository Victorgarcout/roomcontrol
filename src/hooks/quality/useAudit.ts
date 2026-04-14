import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface AuditItem {
  category: string;
  question: string;
  score: number;
  notes?: string;
  [key: string]: unknown;
}

interface Audit {
  id: string;
  hotelId: string;
  date: string;
  score?: number;
  items?: AuditItem[];
  [key: string]: unknown;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Filters {
  page?: number;
  limit?: number;
}

export function useAudit(hotelId: string, filters: Filters = {}) {
  const [data, setData] = useState<Audit[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ hotelId });
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));

      const res = await fetch(`/api/quality/audit?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const json = await res.json();
      setData(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch audits";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [hotelId, filters.page, filters.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getAudit = useCallback(async (id: string): Promise<Audit | null> => {
    try {
      const res = await fetch(`/api/quality/audit/${id}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const json = await res.json();
      return json.data ?? json;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch audit";
      toast({ title: "Error", description: msg, variant: "destructive" });
      throw e;
    }
  }, []);

  const createAudit = useCallback(
    async (body: { date: string; items: AuditItem[]; [key: string]: unknown }) => {
      try {
        const res = await fetch("/api/quality/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, hotelId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
        }
        toast({ title: "Success", description: "Audit created" });
        await fetchData();
        return await res.json();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to create audit";
        toast({ title: "Error", description: msg, variant: "destructive" });
        throw e;
      }
    },
    [hotelId, fetchData]
  );

  return { data, meta, loading, error, getAudit, createAudit, refresh: fetchData };
}
