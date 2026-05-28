// Export utilities for Money Management

import { formatDate, formatCurrency } from './formattingUtils';

/**
 * Export transactions to CSV with RFC 4180 compliance
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8, 6.11, 6.12
 * 
 * @param transactions - Array of transaction objects
 * @param filename - Optional filename (defaults to transactions-YYYY-MM-DD.csv)
 */
export function exportToCSV(transactions: any[], filename?: string) {
  try {
    // Generate filename if not provided
    const finalFilename = filename || `transactions-${formatDate(new Date())}.csv`;
    
    // Prepare CSV headers
    const headers = ['date', 'platform', 'category', 'type', 'amount', 'description'];
    
    // Prepare CSV rows with RFC 4180 escaping
    const rows = transactions.map((t) => [
      formatDate(t.date), // ISO 8601 format (YYYY-MM-DD)
      escapeCSVField(t.platform || ''),
      escapeCSVField(t.category || ''),
      escapeCSVField(t.type || ''),
      t.amount.toFixed(2), // 2 decimal places
      escapeCSVField(t.description || ''), // Handle empty/null fields
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('CSV export error:', error);
    return { success: false, error: 'Failed to export CSV' };
  }
}

/**
 * Escape CSV field according to RFC 4180
 * Requirements: 6.12
 * 
 * - Fields containing commas, quotes, or newlines are enclosed in double quotes
 * - Double quotes within fields are escaped as two consecutive quotes
 * 
 * @param field - Field value to escape
 * @returns Escaped field value
 */
function escapeCSVField(field: string): string {
  if (field === null || field === undefined) {
    return '';
  }
  
  const stringField = String(field);
  
  // Check if field contains special characters
  const needsQuoting = /[",\n\r]/.test(stringField);
  
  if (needsQuoting) {
    // Escape double quotes by doubling them
    const escaped = stringField.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  return stringField;
}

/**
 * Export financial report to PDF using browser print API
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.10, 7.11
 * 
 * @param transactions - Array of transaction objects
 * @param platformSummary - Platform-wise summary data
 * @param totals - Overall totals (income, expense, profit)
 * @param filename - Optional filename (defaults to financial-report-YYYY-MM-DD.pdf)
 */
export function exportToPDF(
  transactions: any[],
  platformSummary: any,
  totals: { income: number; expense: number; profit: number },
  filename?: string
) {
  try {
    // Generate filename if not provided
    const finalFilename = filename || `financial-report-${formatDate(new Date())}.pdf`;
    
    // Get current date range for header
    const today = new Date();
    const dateRangeText = `Report generated on ${today.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`;
    
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Financial Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #333;
            font-size: 12pt;
          }
          h1 {
            color: #6366f1;
            border-bottom: 3px solid #6366f1;
            padding-bottom: 10px;
            font-size: 24pt;
          }
          h2 {
            color: #8b5cf6;
            margin-top: 30px;
            font-size: 16pt;
          }
          h3 {
            font-size: 14pt;
            margin: 10px 0;
          }
          .header-info {
            margin: 20px 0;
            font-size: 12pt;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 30px 0;
          }
          .summary-card {
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
          }
          .summary-card h3 {
            margin: 0 0 10px 0;
            font-size: 12pt;
            color: #64748b;
          }
          .summary-card .amount {
            font-size: 20pt;
            font-weight: bold;
          }
          .income { color: #10b981; }
          .expense { color: #ef4444; }
          .profit { color: #8b5cf6; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            background: #f1f5f9;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #cbd5e1;
            font-size: 12pt;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12pt;
          }
          .platform-section {
            margin: 30px 0;
            padding: 20px;
            background: #f8fafc;
            border-radius: 12px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            color: #64748b;
            font-size: 10pt;
          }
          @media print {
            body {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <h1>💰 Financial Report</h1>
        <div class="header-info">
          <p><strong>Company:</strong> Injaazh Global</p>
          <p><strong>Report Date:</strong> ${dateRangeText}</p>
        </div>
        
        <h2>Overall Summary</h2>
        <div class="summary">
          <div class="summary-card">
            <h3>Total Income</h3>
            <div class="amount income">${formatCurrency(totals.income)}</div>
          </div>
          <div class="summary-card">
            <h3>Total Expense</h3>
            <div class="amount expense">${formatCurrency(totals.expense)}</div>
          </div>
          <div class="summary-card">
            <h3>Net Profit</h3>
            <div class="amount profit">${formatCurrency(totals.profit)}</div>
          </div>
        </div>
        
        <h2>Platform Breakdown</h2>
        ${Object.entries(platformSummary)
          .map(([platform, data]: [string, any]) => `
            <div class="platform-section">
              <h3>${platform}</h3>
              <table>
                <tr>
                  <td><strong>Income:</strong></td>
                  <td class="income">${formatCurrency(data.income)}</td>
                </tr>
                <tr>
                  <td><strong>Expense:</strong></td>
                  <td class="expense">${formatCurrency(data.expense)}</td>
                </tr>
                <tr>
                  <td><strong>Profit:</strong></td>
                  <td class="profit">${formatCurrency(data.profit)}</td>
                </tr>
              </table>
            </div>
          `)
          .join('')}
        
        <h2>Transaction List</h2>
        ${transactions.length === 0 ? '<p>No transactions in selected period</p>' : `
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Platform</th>
              <th>Type</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${transactions
              .slice(0, 1000) // Limit to 1000 transactions
              .map((t) => `
                <tr>
                  <td>${formatDate(t.date)}</td>
                  <td>${t.platform}</td>
                  <td>${t.type}</td>
                  <td>${t.category}</td>
                  <td class="${t.type === 'Income' ? 'income' : 'expense'}">
                    ${formatCurrency(t.amount)}
                  </td>
                  <td>${t.description || '-'}</td>
                </tr>
              `)
              .join('')}
          </tbody>
        </table>
        `}
        
        <div class="footer">
          <p><strong>Injaazh Global - Money Management System</strong></p>
          <p>This report contains ${transactions.length} total transaction${transactions.length !== 1 ? 's' : ''}</p>
        </div>
      </body>
      </html>
    `;
    
    // Open print dialog with the HTML content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.document.title = finalFilename;
      printWindow.focus();
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
      return { success: true };
    } else {
      throw new Error('Failed to open print window');
    }
  } catch (error) {
    console.error('PDF export error:', error);
    return { success: false, error: 'Failed to export PDF' };
  }
}
