import { ApiResponse } from "@/lib/types";

interface HousemetricData {
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  pricePerSqM: number;
  tenure: string;
  marketTime: number;
  valueForMoney: number;
  condition: "structural-project" | "renovation" | "ready-to-move";
}

export async function fetchHousemetric(
  query: string,
): Promise<ApiResponse<HousemetricData>> {
  // Mock delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock data based on query
  const mockData: HousemetricData = {
    address: query.includes("http") ? "Valley View, Bristol, BS39 5" : query,
    price: 360000,
    bedrooms: 3,
    bathrooms: 2,
    pricePerSqM: 3200,
    tenure: "Freehold",
    marketTime: 45,
    valueForMoney: 8.2,
    condition: "ready-to-move",
  };

  return {
    success: true,
    data: mockData,
  };
}
