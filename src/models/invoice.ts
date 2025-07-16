import { Estimate } from './estimate';

export interface Invoice extends Estimate {
  invoiceNumber: string;
  dueDate: string;
  paid: boolean;
} 