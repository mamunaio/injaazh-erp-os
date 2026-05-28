'use client';

import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { groupTransactionsByPeriod, groupTransactionsByPlatform, groupTransactionsByCategory } from '@/lib/analyticsUtils';
import { formatCurrency, formatCurrencyAbbreviated, formatPercentage } from '@/lib/formattingUtils';

interface MoneyAnalyticsProps {
  transactions: any[];
  viewPeriod: 'monthly' | 'yearly';
}

const PLATFORM_COLORS = {
  'Freelancer': '#3b82f6',
  'Direct': '#a855f7',
  'Upwork': '#10b981',
  'Fiverr': '#14b8a6',
};

const EXPENSE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e'];

export default function MoneyAnalytics({ transactions, viewPeriod }: MoneyAnalyticsProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  
  // Filter transactions by selected platform if any
  const filteredTransactions = useMemo(() => {
    if (!selectedPlatform) return transactions;
    return transactions.filter((t) => t.platform === selectedPlatform);
  }, [transactions, selectedPlatform]);
  
  // Prepare monthly trend data with profit line
  // Requirements: 1.1, 1.4, 1.5, 1.6, 4.1, 4.5
  const monthlyTrendData = useMemo(() => {
    const periodGroups = groupTransactionsByPeriod(filteredTransactions, viewPeriod);
    
    return periodGroups
      .sort((a, b) => {
        // Sort by date
        const dateA = new Date(a.period);
        const dateB = new Date(b.period);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-12); // Last 12 periods
  }, [filteredTransactions, viewPeriod]);

  // Calculate average profit for selected time range
  // Requirements: 4.6
  const averageProfit = useMemo(() => {
    if (monthlyTrendData.length === 0) return 0;
    const totalProfit = monthlyTrendData.reduce((sum, d) => sum + d.profit, 0);
    return totalProfit / monthlyTrendData.length;
  }, [monthlyTrendData]);

  // Find highest and lowest profit periods
  // Requirements: 4.7, 4.8
  const profitExtremes = useMemo(() => {
    if (monthlyTrendData.length === 0) return { highest: null, lowest: null };
    
    const highest = monthlyTrendData.reduce((max, d) => d.profit > max.profit ? d : max, monthlyTrendData[0]);
    const lowest = monthlyTrendData.reduce((min, d) => d.profit < min.profit ? d : min, monthlyTrendData[0]);
    
    return { highest, lowest };
  }, [monthlyTrendData]);

  // Prepare platform comparison data with profit margin
  // Requirements: 2.5, 2.6, 2.7, 2.8, 9.4, 9.5, 9.6, 9.7
  const platformComparisonData = useMemo(() => {
    const platformGroups = groupTransactionsByPlatform(filteredTransactions);
    
    // Sort platforms by total income descending
    return platformGroups.sort((a, b) => b.income - a.income);
  }, [filteredTransactions]);

  // Prepare expense breakdown data with small category grouping
  // Requirements: 3.2, 3.3, 3.5, 3.6
  const expenseBreakdownData = useMemo(() => {
    const categoryGroups = groupTransactionsByCategory(filteredTransactions);
    
    // Group categories < 3% into "Other"
    const threshold = 3;
    const mainCategories = categoryGroups.filter((c) => c.percentage >= threshold);
    const smallCategories = categoryGroups.filter((c) => c.percentage < threshold);
    
    const result = [...mainCategories];
    
    if (smallCategories.length > 0) {
      const otherAmount = smallCategories.reduce((sum, c) => sum + c.amount, 0);
      const otherPercentage = smallCategories.reduce((sum, c) => sum + c.percentage, 0);
      const otherCount = smallCategories.reduce((sum, c) => sum + c.transactionCount, 0);
      
      result.push({
        category: 'Other',
        amount: otherAmount,
        percentage: otherPercentage,
        transactionCount: otherCount,
      });
    }
    
    return result.sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  // Prepare income distribution data
  const incomeBreakdownData = useMemo(() => {
    const platformGroups = groupTransactionsByPlatform(
      filteredTransactions.filter((t) => t.type === 'Income')
    );
    
    return platformGroups.map((p) => ({
      name: p.platform,
      value: p.income,
    }));
  }, [filteredTransactions]);

  const formatTooltipCurrency = (value: any) => {
    if (typeof value !== 'number') return value;
    return formatCurrency(value);
  };

  // Custom dot renderer for profit line with conditional coloring
  // Requirements: 4.3, 4.4
  const renderProfitDot = (props: any) => {
    const { cx, cy, payload } = props;
    const isHighest = profitExtremes.highest && payload.period === profitExtremes.highest.period;
    const isLowest = profitExtremes.lowest && payload.period === profitExtremes.lowest.period;
    
    let fill = '#a855f7'; // Default purple
    let r = 4;
    
    if (payload.profit < 0) {
      fill = '#ef4444'; // Red for negative
    } else if (payload.profit === 0) {
      fill = '#ef4444'; // Red for zero
    } else {
      fill = '#10b981'; // Green for positive
    }
    
    if (isHighest || isLowest) {
      r = 6; // Larger dot for extremes
    }
    
    return <circle cx={cx} cy={cy} r={r} fill={fill} stroke="#fff" strokeWidth={2} />;
  };

  // Handle platform click for filtering
  // Requirements: 14.4, 14.5, 14.6
  const handlePlatformClick = (data: any) => {
    if (data && data.platform) {
      setSelectedPlatform(data.platform);
    }
  };

  // Clear platform filter
  const clearPlatformFilter = () => {
    setSelectedPlatform(null);
  };

  // Empty state check
  const hasData = filteredTransactions.length > 0;

  return (
    <div className="space-y-8">
      {/* Platform Filter Badge */}
      {selectedPlatform && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-400">Filtered by:</span>
          <button
            onClick={clearPlatformFilter}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all"
          >
            {selectedPlatform}
            <span className="text-lg">&times;</span>
          </button>
        </div>
      )}

      {/* Income vs Expense Trend with Profit Line */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-purple-200/40 dark:border-purple-500/20 rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Income vs Expense Trend
          </h3>
          {hasData && (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Avg Profit: <span className="font-bold text-purple-600 dark:text-purple-400">{formatCurrency(averageProfit)}</span>
            </div>
          )}
        </div>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
            <p className="text-lg font-semibold mb-2">No transaction data available</p>
            <p className="text-sm">Add transactions to see income and expense trends</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="period" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                tickFormatter={formatCurrencyAbbreviated}
              />
              <Tooltip 
                formatter={formatTooltipCurrency}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              {/* Zero baseline for profit */}
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Income"
                dot={{ fill: '#10b981', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="#ef4444" 
                strokeWidth={3}
                name="Expense"
                dot={{ fill: '#ef4444', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#a855f7" 
                strokeWidth={3}
                name="Profit"
                dot={renderProfitDot}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Platform Comparison */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-purple-200/40 dark:border-purple-500/20 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">
            Platform Comparison
          </h3>
          {!hasData ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
              <p className="text-lg font-semibold mb-2">No platform data available</p>
              <p className="text-sm">Add transactions to compare platforms</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformComparisonData} onClick={handlePlatformClick}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="platform" 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                  tickFormatter={formatCurrencyAbbreviated}
                />
                <Tooltip 
                  formatter={formatTooltipCurrency}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" radius={[8, 8, 0, 0]} cursor="pointer" />
                <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[8, 8, 0, 0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Income Distribution */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-purple-200/40 dark:border-purple-500/20 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">
            Income Distribution
          </h3>
          {!hasData || incomeBreakdownData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
              <p className="text-lg font-semibold mb-2">No income data available</p>
              <p className="text-sm">Add income transactions to see distribution</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={incomeBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {incomeBreakdownData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={PLATFORM_COLORS[entry.name as keyof typeof PLATFORM_COLORS] || '#8884d8'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={formatTooltipCurrency}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Expense Breakdown */}
      {expenseBreakdownData.length > 0 && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-purple-200/40 dark:border-purple-500/20 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">
            Expense Breakdown by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expenseBreakdownData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                type="number" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                tickFormatter={formatCurrencyAbbreviated}
              />
              <YAxis 
                type="category" 
                dataKey="category" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                width={120}
              />
              <Tooltip 
                formatter={(value: any, name: any, props: any) => {
                  if (name === 'amount') {
                    return [formatCurrency(value as number), `Amount (${formatPercentage(props.payload.percentage)})`];
                  }
                  return [value, name];
                }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="amount" name="amount" radius={[0, 8, 8, 0]}>
                {expenseBreakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
