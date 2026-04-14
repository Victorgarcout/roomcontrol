import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface SafetyItem {
  id: string;
  hotelId: string;
  name: string;
  status: string;
  [key: string]: unknown;
}

interface SafetyCommission {
  id: string;
  hotelId: string;
  date: string;
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

export function useSafety(hotelId: string, filters: Filters = {}) {
  const [items, setItems] = useState<SafetyItem[]>([]);
  const [itemsMeta, setItemsMeta] = useState<PaginationMeta | null>(null);
  const [commissions, setCommissions] = useState<SafetyCommission[]>([]);
  const [commissionsMeta, setCommissionsMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!hotelId) return;
    try {
      const params = new URLSearchParams({ hotelId });
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));

      const res = await fetch(`/api/quality/safety/items?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const json = await res.json();
      setItems(json.data ?? []);
      setItemsMeta(json.meta ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch safety items";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }, [hotelId, filters.page, filters.limit]);

  const fetchCommissions = useCallback(async () => {
    if (!hotelId) return;
    try {
      const params = new URLSearchParams({ hotelId });
      const res = await fetch(`/api/quality/safety/commissions?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const json = await res.json();
      setCommissions(json.data ?? []);
      setCommissionsMeta(json.meta ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch commissions";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }, [hotelId]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchItems(), fetchCommissions()]);
    setLoading(false);
  }, [fetchItems, fetchCommissions]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createItem = useCallback(
    async (body: Partial<SafetyItem>) => {
      try {
        const res = await fetch("/api/quality/safety/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, hotelId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
        }
        toast({ title: "Success", description: "Safety item created" });
        await fetchItems();
        return await res.json();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to create safety item";
        toast({ title: "Error", description: msg, variant: "destructive" });
        throw e;
      }
    },
    [hotelId, fetchItems]
  );

  const updateItem = useCallback(
    async (id: string, body: Partial<SafetyItem>) => {
      try {
        const res = await fetch(`/api/quality/safety/items/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
        }
        toast({ title: "Success", description: "Safety item updated" });
        await fetchItems();
        return await res.json();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to update safety item";
        toast({ title: "Error", description: msg, variant: "destructive" });
        throw e;
      }
    },
    [fetchItems]
  );

  const createCommission = useCallback(
    async (body: Partial<SafetyCommission>) => {
      try {
        const res = await fetch("/api/quality/safety/commissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, hotelId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
        }
        toast({ title: "Success", description: "Commission created" });
        await fetchCommissions();
        return await res.json();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to create commission";
        toast({ title: "Error", description: msg, variant: "destructive" });
        throw e;
      }
    },
    [hotelId, fetchCommissions]
  );

  const updateCommission = useCallback(
    async (id: string, body: Partial<SafetyCommission>) => {
      try {
        const res = await fetch(`/api/quality/safety/commissions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
        }
        toast({ title: "Success", description: "Commission updated" });
        await fetchCommissions();
        return await res.json();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to update commission";
        toast({ title: "Error", description: msg, variant: "destructive" });
        throw e;
      }
    },
    [fetchCommissions]
  );

  return {
    items,
    itemsMeta,
    commissions,
    commissionsMeta,
    loading,
    error,
    createItem,
    updateItem,
    createCommission,
    updateCommission,
    refresh: fetchAll,
    refreshItems: fetchItems,
    refreshCommissions: fetchCommissions,
  };
}
