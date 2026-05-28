/**
 * Analytics Utility Functions for Money Management
 * 
 * This module provides core calculation and formatting utilities for
 * transaction analytics, including aggregation, grouping, and formatting.
 */

/**
 * Interface for transaction totals
 */
export interface TransactionTotals {
  income: number;
  expense: number;
  profit: number;
  profitMargin: number | 'N/A';
}

/**
 * Interface for grouped transactions by period
 */
export interface PeriodGroup {
  period: string;
  income: number;
  expense: number;
  profit: number;
  transactionCount: number;
}

/**
 * Interface for grouped transactions by platform
 */
export interface PlatformGroup {
  platform: string;
  income: number;
  expense: number;
  profit: number;
  profitMargin: number | 'N/A';
  transactionCount: number;
}

/**
 * Interface for grouped transactions by category
 */
export interface CategoryGroup {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

/**
 * Calculate totals from transactions
 * Requirements: 2.1, 2.6, 8.3, 15.1, 15.2, 15.3
 * 
 * @param transactions - Array of transaction objects
 * @returns Object containing income, expense, profit, and profit margin
 */
export function calculateTotals(transactions: any[]): TransactionTotals {
  const income = transactions
    .filter((t) => t.type === 'Income' && !t.deleted)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expense = transactions
    .filter((t) => t.type === 'Expense' && !t.deleted)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const profit = income - expense;
  const profitMargin = income > 0 ? (profit / income) * 100 : 'N/A';
  
  return {
    income,
    expense,
    profit,
    profitMargin,
  };
}

/**
 * Calculate profit margin with zero-income handling
 * Requirements: 2.6, 8.3, 15.2, 15.3
 * 
 * @param profit - Profit amount
 * @param income - Income amount
 * @returns Profit margin as percentage or 'N/A' if income is zero
 */
export function calculateProfitMargin(profit: number, income: number): number | 'N/A' {
  if (income === 0) {
    return 'N/A';
  }
  return (profit / income) * 100;
}

/**
 * Group transactions by time period (monthly or yearly)
 * Requirements: 2.1, 2.6, 8.3, 15.1, 15.2, 15.3
 * 
 * @param transactions - Array of transaction objects
 * @param period - 'monthly' or 'yearly'
 * @returns Array of period groups with aggregated data
 */
export function groupTransactionsByPeriod(
  transactions: any[],
  period: 'monthly' | 'yearly'
): PeriodGroup[] {
  const periodMap = new Map<string, { income: number; expense: number; count: number }>();
  
  // Filter out deleted transactions
  const activeTransactions = transactions.filter((t) => !t.deleted);
  
  activeTransactions.forEach((t) => {
    const date = new Date(t.date);
    const periodKey = period === 'monthly'
      ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : date.getFullYear().toString();
    
    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, { income: 0, expense: 0, count: 0 });
    }
    
    const data = periodMap.get(periodKey)!;
    data.count++;
    
    if (t.type === 'Income') {
      data.income += t.amount;
    } else if (t.type === 'Expense') {
      data.expense += t.amount;
    }
  });
  
  return Array.from(periodMap.entries()).map(([period, data]) => ({
    period,
    income: data.income,
    expense: data.expense,
    profit: data.income - data.expense,
    transactionCount: data.count,
  }));
}

/**
 * Group transactions by platform
 * Requirements: 2.1, 2.6, 8.3, 15.1, 15.2, 15.3
 * 
 * @param transactions - Array of transaction objects
 * @returns Array of platform groups with aggregated data
 */
export function groupTransactionsByPlatform(transactions: any[]): PlatformGroup[] {
  const platformMap = new Map<string, { income: number; expense: number; count: number }>();
  
  // Filter out deleted transactions
  const activeTransactions = transactions.filter((t) => !t.deleted);
  
  activeTransactions.forEach((t) => {
    if (!platformMap.has(t.platform)) {
      platformMap.set(t.platform, { income: 0, expense: 0, count: 0 });
    }
    
    const data = platformMap.get(t.platform)!;
    data.count++;
    
    if (t.type === 'Income') {
      data.income += t.amount;
    } else if (t.type === 'Expense') {
      data.expense += t.amount;
    }
  });
  
  return Array.from(platformMap.entries()).map(([platform, data]) => {
    const profit = data.income - data.expense;
    const profitMargin = calculateProfitMargin(profit, data.income);
    
    return {
      platform,
      income: data.income,
      expense: data.expense,
      profit,
      profitMargin,
      transactionCount: data.count,
    };
  });
}

/**
 * Group transactions by category (for expenses)
 * Requirements: 2.1, 2.6, 8.3, 15.1, 15.2, 15.3
 * 
 * @param transactions - Array of transaction objects
 * @returns Array of category groups with aggregated data
 */
export function groupTransactionsByCategory(transactions: any[]): CategoryGroup[] {
  const categoryMap = new Map<string, { amount: number; count: number }>();
  
  // Filter out deleted transactions and only include expenses
  const expenseTransactions = transactions.filter((t) => t.type === 'Expense' && !t.deleted);
  
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  expenseTransactions.forEach((t) => {
    if (!categoryMap.has(t.category)) {
      categoryMap.set(t.category, { amount: 0, count: 0 });
    }
    
    const data = categoryMap.get(t.category)!;
    data.amount += t.amount;
    data.count++;
  });
  
  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    amount: data.amount,
    percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
    transactionCount: data.count,
  }));
}
