/**
 * Formatting Utility Functions for Money Management
 * 
 * This module provides consistent formatting for currency, percentages,
 * and dates across the application.
 */

/**
 * Format currency with thousand separators and 2 decimal places
 * Requirements: 2.4, 3.8, 6.3, 6.4, 8.6, 8.11
 * 
 * @param amount - Amount to format
 * @returns Formatted currency string with $ symbol
 */
export function formatCurrency(amount: number): string {
  // Handle negative amounts with minus sign prefix
  const sign = amount < 0 ? '-' : '';
  const absAmount = Math.abs(amount);
  
  return sign + new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);
}

/**
 * Format percentage with 1 decimal place and "%" symbol
 * Requirements: 2.4, 3.8, 6.3, 6.4, 8.6, 8.11
 * 
 * @param value - Percentage value (e.g., 25.5 for 25.5%)
 * @returns Formatted percentage string with % symbol
 */
export function formatPercentage(value: number | 'N/A'): string {
  if (value === 'N/A') {
    return 'N/A';
  }
  
  // Round to 1 decimal place using round-half-up
  const rounded = Math.round(value * 10) / 10;
  
  return `${rounded.toFixed(1)}%`;
}

/**
 * Format date in ISO 8601 format (YYYY-MM-DD)
 * Requirements: 2.4, 3.8, 6.3, 6.4, 8.6, 8.11
 * 
 * @param date - Date object or date string
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display (e.g., "Jan 15, 2024")
 * 
 * @param date - Date object or date string
 * @returns Formatted date string for display
 */
export function formatDateDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format month and year (e.g., "Jan 2024")
 * Requirements: 8.1, 8.2
 * 
 * @param date - Date object or date string
 * @returns Formatted month and year string
 */
export function formatMonthYear(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format currency for chart display (abbreviated)
 * 
 * @param value - Amount to format
 * @returns Abbreviated currency string (e.g., "$1.5k")
 */
export function formatCurrencyAbbreviated(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
}
