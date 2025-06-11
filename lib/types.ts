// Re-export PropertyData from schema to maintain compatibility
export type { PropertyData } from '@/lib/schemas/property';

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  error?: string;
}

export interface SearchParams {
  query?: string;
}
