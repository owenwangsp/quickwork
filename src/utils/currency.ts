export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const parseCurrency = (value: string): number => {
  // Remove currency symbols and parse to number
  const cleanValue = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleanValue) || 0;
}; 