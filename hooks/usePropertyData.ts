"use client";

import { useState, useEffect } from "react";
import { PropertyData } from "@/lib/types";
import { getAggregatedPropertyData } from "@/lib/api/aggregate";

interface UsePropertyDataReturn {
  data: PropertyData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePropertyData(query: string | null): UsePropertyDataReturn {
  const [data, setData] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!query) return;

    setLoading(true);
    setError(null);

    try {
      const propertyData = await getAggregatedPropertyData(query);
      setData(propertyData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch property data",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [query]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
