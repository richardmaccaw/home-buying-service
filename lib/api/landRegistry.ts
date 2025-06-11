import { ApiResponse } from "@/lib/types";

interface LandRegistryData {
  onsIndex: number;
  history: {
    lastSalePrice: number;
    lastSaleDate: string;
    growthSinceLastSale: number;
    priceReductions: Array<{
      date: string;
      amount: number;
      newPrice: number;
    }>;
  };
}

export async function fetchLandRegistry(
  query: string,
): Promise<ApiResponse<LandRegistryData>> {
  // Mock delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mockData: LandRegistryData = {
    onsIndex: 349800,
    history: {
      lastSalePrice: 210000,
      lastSaleDate: "2019-07-15",
      growthSinceLastSale: 71.4,
      priceReductions: [
        {
          date: "2024-11-15",
          amount: 10000,
          newPrice: 360000,
        },
        {
          date: "2024-10-01",
          amount: 15000,
          newPrice: 370000,
        },
      ],
    },
  };

  return {
    success: true,
    data: mockData,
  };
}
