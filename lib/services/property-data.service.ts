import { 
  PropertyDataSchema, 
  type PropertyData,
  type PropertyTenureType,
  type PropertyTypeType,
  type PropertyConditionType
} from '@/lib/schemas/property';

export class PropertyDataService {
  /**
   * Convert extracted data to full PropertyData schema with calculated/default values
   */
  buildPropertyData(extractedData: any): PropertyData {
    const now = new Date().toISOString();
    
    // Calculate price per sqm if we have both values
    const pricePerSqM = extractedData.square_meters && extractedData.price 
      ? Math.round(extractedData.price / extractedData.square_meters)
      : 10000; // Default estimate

    // Default values for fields we can't extract from scraping
    const propertyData: PropertyData = {
      address: extractedData.address || "Address not found",
      price: extractedData.price || 0,
      pricePerSqM: pricePerSqM,
      bedrooms: extractedData.bedrooms || 0,
      bathrooms: extractedData.bathrooms || 0,
      tenure: extractedData.tenure || "freehold",
      propertyType: extractedData.property_type || undefined,
      
      // Market metrics - estimated/default values
      marketTime: this.calculateMarketTime(extractedData.listing_date),
      valueForMoney: 7.0, // Default score
      condition: extractedData.condition || "ready-to-move",
      listingDate: extractedData.listing_date || undefined,
      priceReductionDate: extractedData.price_reduction_date || undefined,
      
      // External valuations - use scraped price as base
      indices: {
        zoopla: extractedData.price || 0,
        ons: Math.round((extractedData.price || 0) * 0.98),
        acadata: Math.round((extractedData.price || 0) * 1.02),
      },
      
      // Historical data - placeholder
      history: {
        lastSalePrice: Math.round((extractedData.price || 0) * 0.8),
        lastSaleDate: "2020-01-01T10:00:00Z",
        growthSinceLastSale: 25.0,
        priceReductions: [],
      },
      
      // Market comparison data - placeholder
      listingDelta: {
        rightmove: 0,
        acadata: 0,
        listingDate: now,
      },
      
      // Local area insights - placeholder
      localArea: {
        onsAreaChange: 10.0,
        recentSales: [],
        areaAverage: 3000,
        postcodeAverage: {
          detached: Math.round((extractedData.price || 0) * 1.5),
          semiDetached: Math.round((extractedData.price || 0) * 1.2),
          terraced: extractedData.price || 0,
          flat: Math.round((extractedData.price || 0) * 0.8),
        },
        priceHistory: [
          {
            date: "2023-01-01T00:00:00Z",
            price: Math.round((extractedData.price || 0) * 0.9),
          },
        ],
      },
      
      // Financial information - calculated estimates
      costs: {
        sdlt: this.calculateSDLT(extractedData.price || 0),
        conveyancing: 1500,
        survey: 600,
      },
      
      // Mortgage data - calculated based on price
      mortgage: {
        monthlyPayments: this.calculateMortgagePayments(extractedData.price || 0),
      },
      
      // Images
      images: extractedData.images || [],

      // Metadata
      lastUpdated: now,
      dataSource: "rightmove-scraping",
      confidence: 0.7, // Lower confidence since many fields are estimated
    };

    return propertyData;
  }

  /**
   * Calculate SDLT based on property price
   */
  private calculateSDLT(price: number): number {
    if (price <= 250000) return 0;
    if (price <= 925000) return (price - 250000) * 0.05;
    if (price <= 1500000) return 33750 + (price - 925000) * 0.1;
    return 91250 + (price - 1500000) * 0.12;
  }

  /**
   * Calculate mortgage payment options
   */
  private calculateMortgagePayments(price: number): Array<{
    deposit: number;
    ltv: number;
    monthlyPayment: number;
    rate: number;
  }> {
    const monthlyRate90 = 0.0525 / 12; // 5.25% annual
    const monthlyRate80 = 0.0495 / 12; // 4.95% annual
    const monthlyRate70 = 0.0465 / 12; // 4.65% annual
    const termMonths = 25 * 12; // 25 years

    return [
      {
        deposit: Math.round(price * 0.1),
        ltv: 90,
        monthlyPayment: Math.round(this.calculateMonthlyPayment(price * 0.9, monthlyRate90, termMonths)),
        rate: 5.25,
      },
      {
        deposit: Math.round(price * 0.2),
        ltv: 80,
        monthlyPayment: Math.round(this.calculateMonthlyPayment(price * 0.8, monthlyRate80, termMonths)),
        rate: 4.95,
      },
      {
        deposit: Math.round(price * 0.3),
        ltv: 70,
        monthlyPayment: Math.round(this.calculateMonthlyPayment(price * 0.7, monthlyRate70, termMonths)),
        rate: 4.65,
      },
    ];
  }

  /**
   * Calculate monthly mortgage payment
   */
  private calculateMonthlyPayment(principal: number, monthlyRate: number, termMonths: number): number {
    if (monthlyRate === 0) return principal / termMonths;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
           (Math.pow(1 + monthlyRate, termMonths) - 1);
  }

  /**
   * Calculate market time from listing date
   */
  private calculateMarketTime(listingDate?: string): number {
    if (!listingDate) return 30; // Default 30 days

    try {
      // Parse DD/MM/YYYY format
      const [day, month, year] = listingDate.split('/').map(num => parseInt(num));
      const listingDateObj = new Date(year, month - 1, day); // month is 0-indexed
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - listingDateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays > 0 ? diffDays : 30; // Ensure positive number
    } catch (error) {
      console.error('Error calculating market time:', error);
      return 30; // Default fallback
    }
  }

  /**
   * Validate property data against schema
   */
  validatePropertyData(data: PropertyData): PropertyData {
    return PropertyDataSchema.parse(data);
  }
} 