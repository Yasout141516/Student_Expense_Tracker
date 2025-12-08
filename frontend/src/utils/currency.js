// Currency symbols
export const currencySymbols = {
  BDT: '৳',
  HKD: 'HK$',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
};

// Format amount with currency
export const formatCurrency = (amount, currency = 'BDT') => {
  const symbol = currencySymbols[currency] || currency;
  
  // Format number with commas
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${symbol}${formatted}`;
};

// Get currency symbol
export const getCurrencySymbol = (currency = 'BDT') => {
  return currencySymbols[currency] || currency;
};