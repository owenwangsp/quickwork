import AsyncStorage from '@react-native-async-storage/async-storage';
import { Estimate, Invoice, Client, Settings } from '../models';

// Storage keys
const STORAGE_KEYS = {
  ESTIMATES: 'estimates',
  INVOICES: 'invoices', 
  CLIENTS: 'clients',
  SETTINGS: 'settings',
  COUNTERS: 'counters',
} as const;

// Counters for auto-generating numbers
interface Counters {
  estimateCounter: number;
  invoiceCounter: number;
}

class StorageService {
  // Generic storage methods
  private async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw error;
    }
  }

  private async getItem<T>(key: string): Promise<T | null> {
    try {
      const item = await AsyncStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return null;
    }
  }

  // Estimate methods
  async getEstimates(): Promise<Estimate[]> {
    const estimates = await this.getItem<Estimate[]>(STORAGE_KEYS.ESTIMATES);
    return estimates || [];
  }

  async saveEstimate(estimate: Estimate): Promise<void> {
    const estimates = await this.getEstimates();
    const index = estimates.findIndex(e => e.id === estimate.id);
    
    if (index >= 0) {
      estimates[index] = estimate;
    } else {
      estimates.push(estimate);
    }
    
    await this.setItem(STORAGE_KEYS.ESTIMATES, estimates);
  }

  async deleteEstimate(id: string): Promise<void> {
    const estimates = await this.getEstimates();
    const filtered = estimates.filter(e => e.id !== id);
    await this.setItem(STORAGE_KEYS.ESTIMATES, filtered);
  }

  // Invoice methods
  async getInvoices(): Promise<Invoice[]> {
    const invoices = await this.getItem<Invoice[]>(STORAGE_KEYS.INVOICES);
    return invoices || [];
  }

  async saveInvoice(invoice: Invoice): Promise<void> {
    const invoices = await this.getInvoices();
    const index = invoices.findIndex(i => i.id === invoice.id);
    
    if (index >= 0) {
      invoices[index] = invoice;
    } else {
      invoices.push(invoice);
    }
    
    await this.setItem(STORAGE_KEYS.INVOICES, invoices);
  }

  async deleteInvoice(id: string): Promise<void> {
    const invoices = await this.getInvoices();
    const filtered = invoices.filter(i => i.id !== id);
    await this.setItem(STORAGE_KEYS.INVOICES, filtered);
  }

  // Client methods
  async getClients(): Promise<Client[]> {
    const clients = await this.getItem<Client[]>(STORAGE_KEYS.CLIENTS);
    return clients || [];
  }

  async saveClient(client: Client): Promise<void> {
    const clients = await this.getClients();
    const index = clients.findIndex(c => c.id === client.id);
    
    if (index >= 0) {
      clients[index] = client;
    } else {
      clients.push(client);
    }
    
    await this.setItem(STORAGE_KEYS.CLIENTS, clients);
  }

  async deleteClient(id: string): Promise<void> {
    const clients = await this.getClients();
    const filtered = clients.filter(c => c.id !== id);
    await this.setItem(STORAGE_KEYS.CLIENTS, filtered);
  }

  // Settings methods
  async getSettings(): Promise<Settings> {
    const settings = await this.getItem<Settings>(STORAGE_KEYS.SETTINGS);
    return settings || {
      companyName: '',
      defaultTaxRate: 0.08,
      defaultCurrency: 'USD',
      enableItemTaxable: true,
    };
  }

  async saveSettings(settings: Settings): Promise<void> {
    await this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  // Counter methods for auto-generating numbers
  async getCounters(): Promise<Counters> {
    const counters = await this.getItem<Counters>(STORAGE_KEYS.COUNTERS);
    return counters || { estimateCounter: 1, invoiceCounter: 1 };
  }

  async incrementEstimateCounter(): Promise<number> {
    const counters = await this.getCounters();
    counters.estimateCounter += 1;
    await this.setItem(STORAGE_KEYS.COUNTERS, counters);
    return counters.estimateCounter;
  }

  async incrementInvoiceCounter(): Promise<number> {
    const counters = await this.getCounters();
    counters.invoiceCounter += 1;
    await this.setItem(STORAGE_KEYS.COUNTERS, counters);
    return counters.invoiceCounter;
  }

  // Utility methods
  async generateEstimateNumber(): Promise<string> {
    const counter = await this.incrementEstimateCounter();
    return `EST-${counter.toString().padStart(4, '0')}`;
  }

  async generateInvoiceNumber(): Promise<string> {
    const counter = await this.incrementInvoiceCounter();
    return `INV-${counter.toString().padStart(4, '0')}`;
  }

  // Clear all data (for testing/reset)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService(); 