import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface QualityHubData {
  hotel: Record<string, unknown>;
  performance: Record<string, unknown>;
  actions: Record<string, unknown>;
  tickets: Record<string, unknown>;
  safety: Record<string, unknown>;
  maintenance: Record<string, unknown>;
  audit: Record<string, unknown>;
  rituals: Record<string, unknown>;
}

export function useQualityHub(hotelId: string) {
  const [data, setData] = useState<QualityHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quality/hub?hotelId=${hotelId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const json = await res.json();
      setData(json.data ?? json);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch hub data";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
