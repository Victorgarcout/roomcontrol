import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface MaintenanceTicket {
  id: string;
  hotelId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  [key: string]: unknown;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Filters {
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

export function useMaintenanceTickets(hotelId: string, filters: Filters = {}) {
  const [data, setData] = useState<MaintenanceTicket[]>([]);
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
      if (filters.priority) params.set("priority", filters.priority);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));

      const res = await fetch(`/api/quality/maintenance/tickets?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const json = await res.json();
      setData(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch tickets";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [hotelId, filters.status, filters.priority, filters.page, filters.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createTicket = useCallback(
    async (body: Partial<MaintenanceTicket>) => {
      try {
        const res = await fetch("/api/quality/maintenance/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, hotelId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
        }
        toast({ title: "Success", description: "Ticket created" });
        await fetchData();
        return await res.json();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to create ticket";
        toast({ title: "Error", description: msg, variant: "destructive" });
        throw e;
      }
    },
    [hotelId, fetchData]
  );

  const updateTicket = useCallback(
    async (id: string, body: Partial<MaintenanceTicket>) => {
      try {
        const res = await fetch(`/api/quality/maintenance/tickets/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
        }
        toast({ title: "Success", description: "Ticket updated" });
        await fetchData();
        return await res.json();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to update ticket";
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
    createTicket,
    updateTicket,
    refresh: fetchData,
  };
}
