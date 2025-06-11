# Property Data Schema

This document describes the comprehensive data schema for property information in the home buying service application.

## Overview

The property data schema is built using [Zod](https://zod.dev/) for runtime validation and TypeScript type inference. It provides a robust structure for property data with comprehensive validation rules.

## Schema Location

The schema is defined in `lib/schemas/property.ts` and provides:

- Zod validation schemas
- TypeScript type definitions
- Helper functions for validation
- Sample data for testing

## Core Data Structure

### PropertyData (Main Schema)

```typescript
interface PropertyData {
  // Basic property information
  address: string;
  price: number;
  pricePerSqM: number;
  bedrooms: number;
  bathrooms: number;
  tenure: PropertyTenureType;
  propertyType?: PropertyTypeType;

  // Market metrics
  marketTime: number;
  valueForMoney: number; // 0-10 score
  condition: PropertyConditionType;

  // External valuations
  indices: PriceIndices;

  // Historical data
  history: PropertyHistory;

  // Market comparison data
  listingDelta: ListingDelta;

  // Local area insights
  localArea: LocalArea;

  // Financial information
  costs: PropertyCosts;
  mortgage: MortgageData;

  // Metadata (optional)
  lastUpdated?: string;
  dataSource?: string;
  confidence?: number; // 0-1 confidence score
}
```

## Enums

### PropertyCondition

- `"structural-project"` - Requires significant structural work
- `"renovation"` - Needs modernisation or renovation
- `"ready-to-move"` - Move-in ready condition

### PropertyTenure

- `"freehold"` - Full ownership
- `"leasehold"` - Leased property
- `"shared-ownership"` - Partial ownership scheme
- `"commonhold"` - Shared ownership of common areas

### PropertyType

- `"detached"` - Standalone house
- `"semi-detached"` - Attached to one other house
- `"terraced"` - Row house
- `"flat"` - Apartment
- `"maisonette"` - Multi-level apartment
- `"bungalow"` - Single-story house
- `"cottage"` - Small rural house
- `"townhouse"` - Multi-story urban house

## Nested Schemas

### PriceIndices

External valuation data from different sources:

```typescript
{
  zoopla: number; // Zoopla automated valuation
  ons: number; // ONS Land Registry prices
  acadata: number; // Acadata mix-adjusted prices
}
```

### PropertyHistory

Historical price and sale information:

```typescript
{
  lastSalePrice: number;
  lastSaleDate: string; // ISO datetime
  growthSinceLastSale: number; // percentage
  priceReductions: PriceReduction[];
}
```

### LocalArea

Local market context and comparables:

```typescript
{
  onsAreaChange: number; // percentage change
  recentSales: RecentSale[];
  postcodeAverage: PostcodeAverage;
  priceHistory: PriceHistoryEntry[];
}
```

### PropertyCosts

Associated purchase costs:

```typescript
{
  sdlt: number; // Stamp Duty Land Tax
  conveyancing: number; // Legal fees
  survey: number; // Survey costs
}
```

### MortgageData

Financing options:

```typescript
{
  monthlyPayments: MortgagePayment[];
}
```

## Usage Examples

### Validating Property Data

```typescript
import {
  validatePropertyData,
  PropertyDataSchema,
} from "@/lib/schemas/property";

// Validate unknown data
try {
  const validData = validatePropertyData(unknownData);
  console.log("Valid property data:", validData);
} catch (error) {
  console.error("Validation failed:", error.message);
}

// Type-safe validation
const result = PropertyDataSchema.safeParse(data);
if (result.success) {
  // data is now typed as PropertyData
  console.log(result.data.address);
} else {
  console.error("Validation errors:", result.error.flatten());
}
```

### Type Guards

```typescript
import { isValidPropertyData } from "@/lib/schemas/property";

if (isValidPropertyData(data)) {
  // TypeScript now knows data is PropertyData
  console.log(data.price);
}
```

### Using Sample Data

```typescript
import { samplePropertyData } from "@/lib/schemas/property";

// Use for testing or development
const testData = samplePropertyData;
```

## Validation Rules

### Required Fields

All fields in the main schema are required except:

- `propertyType` (optional)
- `lastUpdated` (optional)
- `dataSource` (optional)
- `confidence` (optional)

### Numeric Constraints

- `price`, `pricePerSqM`: Must be positive
- `bedrooms`: Must be non-negative integer
- `bathrooms`: Must be non-negative
- `marketTime`: Must be non-negative integer
- `valueForMoney`: Must be between 0 and 10
- `confidence`: Must be between 0 and 1
- `ltv`: Must be between 0 and 100

### String Constraints

- `address`: Must not be empty
- Date fields: Must be valid ISO datetime strings

### Array Constraints

- `priceHistory`: Must have at least one entry
- `monthlyPayments`: Must have at least one option

## Integration with Existing Code

The schema is designed to be compatible with the existing `PropertyData` interface in `lib/types.ts`. To migrate:

1. Import the new schema types
2. Replace the old interface usage
3. Add validation at data boundaries
4. Use type guards for runtime checks

## Benefits

1. **Runtime Validation**: Catch invalid data at runtime
2. **Type Safety**: Compile-time type checking
3. **Documentation**: Self-documenting schema with validation messages
4. **Consistency**: Ensure data consistency across the application
5. **Error Handling**: Detailed validation error messages
6. **Testing**: Standardized sample data for testing

## Migration Path

1. Install/verify Zod dependency ✅
2. Create schema file ✅
3. Update API aggregation layer to use validation
4. Update components to handle validation errors
5. Add validation to data ingestion points
6. Replace hardcoded sample data with schema samples
