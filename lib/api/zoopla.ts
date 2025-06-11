import { ApiResponse } from "@/lib/types";

interface ZooplaData {
  zooplaIndex: number;
  localArea: {
    onsAreaChange: number;
    recentSales: Array<{
      address: string;
      price: number;
      date: string;
      distance: string;
    }>;
    postcodeAverage: {
      detached: number;
      semiDetached: number;
      terraced: number;
      flat: number;
    };
    priceHistory: Array<{
      date: string;
      price: number;
    }>;
  };
}

export async function fetchZoopla(
  query: string,
): Promise<ApiResponse<ZooplaData>> {
  // Mock delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mockData: ZooplaData = {
    zooplaIndex: 345000,
    localArea: {
      onsAreaChange: 13.0,
      recentSales: [
        {
          address: "15 Valley Close, Bristol",
          price: 335000,
          date: "2024-01-15",
          distance: "0.1 miles",
        },
        {
          address: "22 Hill Road, Bristol",
          price: 380000,
          date: "2024-02-03",
          distance: "0.2 miles",
        },
        {
          address: "8 Garden Lane, Bristol",
          price: 295000,
          date: "2024-01-28",
          distance: "0.3 miles",
        },
      ],
      postcodeAverage: {
        detached: 533095,
        semiDetached: 246926,
        terraced: 232302,
        flat: 238654,
      },
      priceHistory: [
        { date: "2020-01", price: 280000 },
        { date: "2020-07", price: 285000 },
        { date: "2021-01", price: 295000 },
        { date: "2021-07", price: 310000 },
        { date: "2022-01", price: 325000 },
        { date: "2022-07", price: 340000 },
        { date: "2023-01", price: 350000 },
        { date: "2023-07", price: 355000 },
        { date: "2024-01", price: 360000 },
      ],
    },
  };

  return {
    success: true,
    data: mockData,
  };
}
