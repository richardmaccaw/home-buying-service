import { z } from "zod";

// Enums for validation
export const PropertyCondition = z.enum([
  "structural-project",
  "renovation",
  "ready-to-move",
]);

export const PropertyTenure = z.enum([
  "freehold",
  "leasehold",
  "shared-ownership",
  "commonhold",
]);

export const PropertyType = z.enum([
  "detached",
  "semi-detached",
  "terraced",
  "flat",
  "maisonette",
  "bungalow",
  "cottage",
  "townhouse",
]);

// Sub-schemas for nested objects
export const PriceIndicesSchema = z.object({
  zoopla: z.number().positive("Zoopla index must be positive"),
  ons: z.number().positive("ONS index must be positive"),
  acadata: z.number().positive("Acadata index must be positive"),
});

export const PriceReductionSchema = z.object({
  date: z.string().datetime("Invalid date format"),
  amount: z.number().positive("Reduction amount must be positive"),
  newPrice: z.number().positive("New price must be positive"),
});

export const PropertyHistorySchema = z.object({
  lastSalePrice: z.number().positive("Last sale price must be positive"),
  lastSaleDate: z.string().datetime("Invalid date format"),
  growthSinceLastSale: z.number({
    required_error: "Growth percentage is required",
  }),
  priceReductions: z.array(PriceReductionSchema),
});

export const ListingDeltaSchema = z.object({
  rightmove: z.number({
    required_error: "Rightmove delta percentage is required",
  }),
  acadata: z.number({ required_error: "Acadata delta percentage is required" }),
  listingDate: z.string().datetime("Invalid listing date format"),
});

export const RecentSaleSchema = z.object({
  address: z.string().min(1, "Address is required"),
  price: z.number().positive("Sale price must be positive"),
  date: z.string().datetime("Invalid date format"),
  distance: z.string().min(1, "Distance is required"),
});

export const PostcodeAverageSchema = z.object({
  detached: z.number().positive("Detached average must be positive"),
  semiDetached: z.number().positive("Semi-detached average must be positive"),
  terraced: z.number().positive("Terraced average must be positive"),
  flat: z.number().positive("Flat average must be positive"),
});

export const PriceHistoryEntrySchema = z.object({
  date: z.string().datetime("Invalid date format"),
  price: z.number().positive("Price must be positive"),
});

export const LocalAreaSchema = z.object({
  onsAreaChange: z.number({
    required_error: "ONS area change percentage is required",
  }),
  recentSales: z.array(RecentSaleSchema),
  areaAverage: z.number().positive().optional(),
  postcodeAverage: PostcodeAverageSchema,
  priceHistory: z
    .array(PriceHistoryEntrySchema)
    .min(1, "Price history must have at least one entry"),
});

export const PropertyCostsSchema = z.object({
  sdlt: z.number().nonnegative("SDLT cost cannot be negative"),
  conveyancing: z.number().positive("Conveyancing cost must be positive"),
  survey: z.number().positive("Survey cost must be positive"),
});

export const MortgagePaymentSchema = z.object({
  deposit: z.number().positive("Deposit must be positive"),
  ltv: z.number().min(0).max(100, "LTV must be between 0 and 100"),
  monthlyPayment: z.number().positive("Monthly payment must be positive"),
  rate: z.number().positive("Interest rate must be positive"),
});

export const MortgageDataSchema = z.object({
  monthlyPayments: z
    .array(MortgagePaymentSchema)
    .min(1, "Must have at least one mortgage payment option"),
});

// Main Property Data Schema
export const PropertyDataSchema = z.object({
  // Basic property information
  address: z.string().min(1, "Address is required"),
  price: z.number().positive("Property price must be positive"),
  pricePerSqM: z.number().positive("Price per square meter must be positive"),
  bedrooms: z.number().int().min(0, "Bedrooms cannot be negative"),
  bathrooms: z.number().min(0, "Bathrooms cannot be negative"),
  tenure: PropertyTenure,
  propertyType: PropertyType.optional(),

  // Market metrics
  marketTime: z.number().int().nonnegative("Market time cannot be negative"),
  valueForMoney: z
    .number()
    .min(0)
    .max(10, "Value for money score must be between 0 and 10"),
  condition: PropertyCondition,
  listingDate: z.string().optional(),
  priceReductionDate: z.string().optional(),

  // External valuations
  indices: PriceIndicesSchema,

  // Historical data
  history: PropertyHistorySchema,

  // Market comparison data
  listingDelta: ListingDeltaSchema,

  // Local area insights
  localArea: LocalAreaSchema,

  // Financial information
  costs: PropertyCostsSchema,
  mortgage: MortgageDataSchema,

  // Images
  images: z.array(z.string().url("Invalid image URL")).optional(),

  // Metadata
  lastUpdated: z
    .string()
    .datetime("Invalid last updated date format")
    .optional(),
  dataSource: z.string().optional(),
  confidence: z
    .number()
    .min(0)
    .max(1, "Confidence score must be between 0 and 1")
    .optional(),
});

// Export types inferred from schemas
export type PropertyConditionType = z.infer<typeof PropertyCondition>;
export type PropertyTenureType = z.infer<typeof PropertyTenure>;
export type PropertyTypeType = z.infer<typeof PropertyType>;
export type PriceIndices = z.infer<typeof PriceIndicesSchema>;
export type PriceReduction = z.infer<typeof PriceReductionSchema>;
export type PropertyHistory = z.infer<typeof PropertyHistorySchema>;
export type ListingDelta = z.infer<typeof ListingDeltaSchema>;
export type RecentSale = z.infer<typeof RecentSaleSchema>;
export type PostcodeAverage = z.infer<typeof PostcodeAverageSchema>;
export type PriceHistoryEntry = z.infer<typeof PriceHistoryEntrySchema>;
export type LocalArea = z.infer<typeof LocalAreaSchema>;
export type PropertyCosts = z.infer<typeof PropertyCostsSchema>;
export type MortgagePayment = z.infer<typeof MortgagePaymentSchema>;
export type MortgageData = z.infer<typeof MortgageDataSchema>;
export type PropertyData = z.infer<typeof PropertyDataSchema>;

// Validation helper functions
export const validatePropertyData = (data: unknown): PropertyData => {
  return PropertyDataSchema.parse(data);
};

export const isValidPropertyData = (data: unknown): data is PropertyData => {
  try {
    PropertyDataSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};

// Sample data for testing and development
export const samplePropertyData: PropertyData = {
  address: "123 Example Street, London, SW1A 1AA",
  price: 650000,
  pricePerSqM: 8500,
  bedrooms: 2,
  bathrooms: 1,
  tenure: "leasehold",
  propertyType: "flat",
  marketTime: 45,
  valueForMoney: 7.2,
  condition: "ready-to-move",

  indices: {
    zoopla: 645000,
    ons: 638000,
    acadata: 655000,
  },

  history: {
    lastSalePrice: 520000,
    lastSaleDate: "2019-03-15T10:00:00Z",
    growthSinceLastSale: 25.0,
    priceReductions: [
      {
        date: "2024-01-15T10:00:00Z",
        amount: 25000,
        newPrice: 650000,
      },
    ],
  },

  listingDelta: {
    rightmove: 1.2,
    acadata: -0.8,
    listingDate: "2023-11-01T10:00:00Z",
  },

  localArea: {
    onsAreaChange: 12.5,
    recentSales: [
      {
        address: "125 Example Street",
        price: 620000,
        date: "2024-01-10T10:00:00Z",
        distance: "2 doors down",
      },
      {
        address: "121 Example Street",
        price: 595000,
        date: "2023-12-05T10:00:00Z",
        distance: "4 doors down",
      },
    ],
    areaAverage: 7500,
    postcodeAverage: {
      detached: 1200000,
      semiDetached: 850000,
      terraced: 720000,
      flat: 580000,
    },
    priceHistory: [
      {
        date: "2020-01-01T00:00:00Z",
        price: 550000,
      },
      {
        date: "2021-01-01T00:00:00Z",
        price: 580000,
      },
      {
        date: "2022-01-01T00:00:00Z",
        price: 610000,
      },
      {
        date: "2023-01-01T00:00:00Z",
        price: 635000,
      },
    ],
  },

  costs: {
    sdlt: 17500,
    conveyancing: 1500,
    survey: 600,
  },

  mortgage: {
    monthlyPayments: [
      {
        deposit: 65000,
        ltv: 90,
        monthlyPayment: 2850,
        rate: 5.25,
      },
      {
        deposit: 130000,
        ltv: 80,
        monthlyPayment: 2540,
        rate: 4.95,
      },
      {
        deposit: 195000,
        ltv: 70,
        monthlyPayment: 2230,
        rate: 4.65,
      },
    ],
  },

  images: [
    "https://media.rightmove.co.uk/property/123456789/example1.jpg",
    "https://media.rightmove.co.uk/property/123456789/example2.jpg"
  ],

  lastUpdated: "2024-01-20T15:30:00Z",
  dataSource: "aggregated",
  confidence: 0.85,
};
