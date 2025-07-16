export interface Settings {
  companyName: string;
  phone?: string;
  email?: string;
  address?: string;
  logoUri?: string;
  defaultTaxRate: number;
  defaultCurrency: string;
  defaultNote?: string;
  enableItemTaxable: boolean;
} 