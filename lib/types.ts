export interface PropertyData {
  address: string;
  price: number;
  pricePerSqM: number;
  bedrooms: number;
  bathrooms: number;
  tenure: string;
  marketTime: number; // days
  valueForMoney: number; // 0-10 score
  condition: "structural-project" | "renovation" | "ready-to-move";

  // Price indices
  indices: {
    zoopla: number;
    ons: number;
    acadata: number;
  };

  // History
  history: {
    lastSalePrice: number;
    lastSaleDate: string;
    growthSinceLastSale: number; // percentage
    priceReductions: Array<{
      date: string;
      amount: number;
      newPrice: number;
    }>;
  };

  // Since listing deltas
  listingDelta: {
    rightmove: number; // percentage change
    acadata: number; // percentage change
    listingDate: string;
  };

  // Local area data
  localArea: {
    onsAreaChange: number; // percentage
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

  // Financial data
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

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  error?: string;
}

export interface SearchParams {
  query?: string;
}
