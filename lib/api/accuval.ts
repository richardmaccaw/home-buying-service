import { ApiResponse } from "@/lib/types";

interface AccuvalData {
  acadataIndex: number;
  listingDelta: {
    rightmove: number;
    acadata: number;
    listingDate: string;
  };
  costs: {
    sdlt: number;
    conveyancing: number;
    survey: number;
  };
  mortgage: {
    monthlyPayments: Array<{
      deposit: number;
      ltv: number;
      monthlyPayment: number;
      rate: number;
    }>;
  };
}

export async function fetchAccuval(
  query: string,
): Promise<ApiResponse<AccuvalData>> {
  // Mock delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mockData: AccuvalData = {
    acadataIndex: 348800,
    listingDelta: {
      rightmove: -3.4,
      acadata: -1.8,
      listingDate: "2024-09-15",
    },
    costs: {
      sdlt: 1740,
      conveyancing: 1500,
      survey: 800,
    },
    mortgage: {
      monthlyPayments: [
        {
          deposit: 18000,
          ltv: 95,
          monthlyPayment: 1902,
          rate: 5.34,
        },
        {
          deposit: 36000,
          ltv: 90,
          monthlyPayment: 1698,
          rate: 4.89,
        },
        {
          deposit: 72000,
          ltv: 80,
          monthlyPayment: 1452,
          rate: 4.59,
        },
      ],
    },
  };

  return {
    success: true,
    data: mockData,
  };
}
