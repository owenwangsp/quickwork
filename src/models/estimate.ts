import { LineItem } from './lineItem';

export interface Estimate {
  id: string;
  clientId: string;
  estimateNumber: string;
  issueDate: string;
  validUntil: string;
  items: LineItem[];
  taxRate: number;
  notes: string;
  status: 'draft' | 'sent' | 'converted';
  total: number;
  convertedInvoiceId?: string;
} 