export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: 'hours' | 'days';
  unitPrice: number;
  taxable: boolean;
} 