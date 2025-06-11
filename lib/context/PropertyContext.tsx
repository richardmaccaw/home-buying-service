"use client";

import React, { createContext, useContext } from "react";
import { PropertyData } from "@/lib/types";

interface PropertyContextType {
  data: PropertyData | null;
  loading: boolean;
  error: string | null;
}

const PropertyContext = createContext<PropertyContextType | undefined>(
  undefined,
);

export function PropertyProvider({
  children,
  data,
  loading,
  error,
}: {
  children: React.ReactNode;
  data: PropertyData | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <PropertyContext.Provider value={{ data, loading, error }}>
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty(): PropertyContextType {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error("useProperty must be used within a PropertyProvider");
  }
  return context;
}
