import { PropertyData } from "@/lib/types";
import { fetchHousemetric } from "./housemetric";
import { fetchZoopla } from "./zoopla";
import { fetchLandRegistry } from "./landRegistry";
import { fetchAccuval } from "./accuval";

function hashQuery(query: string): string {
  // Simple hash function for cache key
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    const char = query.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

export async function getAggregatedPropertyData(
  query: string,
): Promise<PropertyData> {
  // Check cache first (24h expiry)
  const cacheKey = hashQuery(query);
  const cached = localStorage.getItem("propCache");
  const cache = cached ? JSON.parse(cached) : {};

  if (
    cache[cacheKey] &&
    Date.now() - cache[cacheKey].timestamp < 24 * 60 * 60 * 1000
  ) {
    return cache[cacheKey].data;
  }

  // Fetch all data in parallel
  const [housemetricRes, zooplaRes, landRegistryRes, accuvalRes] =
    await Promise.all([
      fetchHousemetric(query),
      fetchZoopla(query),
      fetchLandRegistry(query),
      fetchAccuval(query),
    ]);

  if (
    !housemetricRes.success ||
    !zooplaRes.success ||
    !landRegistryRes.success ||
    !accuvalRes.success
  ) {
    throw new Error("Failed to fetch property data");
  }

  // Normalize into PropertyData interface
  const propertyData: PropertyData = {
    address: housemetricRes.data.address,
    price: housemetricRes.data.price,
    pricePerSqM: housemetricRes.data.pricePerSqM,
    bedrooms: housemetricRes.data.bedrooms,
    bathrooms: housemetricRes.data.bathrooms,
    tenure: housemetricRes.data.tenure,
    marketTime: housemetricRes.data.marketTime,
    valueForMoney: housemetricRes.data.valueForMoney,
    condition: housemetricRes.data.condition,

    indices: {
      zoopla: zooplaRes.data.zooplaIndex,
      ons: landRegistryRes.data.onsIndex,
      acadata: accuvalRes.data.acadataIndex,
    },

    history: landRegistryRes.data.history,

    listingDelta: accuvalRes.data.listingDelta,

    localArea: zooplaRes.data.localArea,

    costs: accuvalRes.data.costs,

    mortgage: accuvalRes.data.mortgage,
  };

  // Cache the result
  cache[cacheKey] = {
    data: propertyData,
    timestamp: Date.now(),
  };
  localStorage.setItem("propCache", JSON.stringify(cache));

  return propertyData;
}
