import { PropertyData } from "@/lib/types";

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

/**
 * Fetch property data from our structured output API endpoint
 */
async function fetchPropertyFromAPI(url: string): Promise<PropertyData> {
  const response = await fetch('/api/chat/structured_output', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: url
        }
      ]
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const propertyData = await response.json();
  return propertyData;
}

export async function getAggregatedPropertyData(
  query: string,
): Promise<PropertyData> {
  // Check cache first (24h expiry)
  const cacheKey = hashQuery(query);
  
  // Only use cache in browser environment
  let cache: Record<string, any> = {};
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem("propCache");
    cache = cached ? JSON.parse(cached) : {};

    if (
      cache[cacheKey] &&
      Date.now() - cache[cacheKey].timestamp < 24 * 60 * 60 * 1000
    ) {
      return cache[cacheKey].data;
    }
  }

  // Validate that the query is a Rightmove URL
  if (!query.includes('rightmove.co.uk')) {
    throw new Error('Please provide a valid Rightmove property URL');
  }

  try {
    // Fetch property data from our API
    const propertyData = await fetchPropertyFromAPI(query);

    // Cache the result (only in browser)
    if (typeof window !== 'undefined') {
      cache[cacheKey] = {
        data: propertyData,
        timestamp: Date.now(),
      };
      localStorage.setItem("propCache", JSON.stringify(cache));
    }

    return propertyData;
  } catch (error) {
    console.error('Error fetching property data:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch property data from the provided URL'
    );
  }
}
