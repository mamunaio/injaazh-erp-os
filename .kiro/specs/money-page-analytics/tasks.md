# Implementation Plan: Money Page Analytics

## Overview

This implementation plan extends the existing Money Management system with advanced analytics capabilities including interactive data visualization, flexible date filtering, and comprehensive export functionality. The implementation builds upon the existing MoneyClient and MoneyAnalytics components, enhancing them with new features while maintaining consistency with the current UI patterns and architecture.

## Tasks

- [ ] 1. Set up analytics infrastructure and utility functions
  - [ ] 1.1 Create core calculation utility functions
    - Implement `calculateTotals()` function for aggregating income, expense, and profit
    - Implement `calculateProfitMargin()` function with zero-income handling
    - Implement `groupTransactionsByPeriod()` function for monthly/yearly aggregation
    - Implement `groupTransactionsByPlatform()` function for platform-wise aggregation
    - Implement `groupTransactionsByCategory()` function for expense category analysis
    - Add TypeScript interfaces for all calculation return types
    - _Requirements: 2.1, 2.6, 8.3, 15.1, 15.2, 15.3_
  
  - [ ]* 1.2 Write property test for transaction aggregation accuracy
    - **Property 1: Transaction Aggregation Accuracy**
    - **Validates: Requirements 2.1, 3.1, 15.1**
    - Test that sum of grouped transactions equals sum of individual transactions
    - Use fast-check with minimum 100 iterations
    - Test grouping by platform, category, and time period
  
  - [ ]* 1.3 Write property test for profit calculation correctness
    - **Property 3: Profit Calculation Correctness**
    - **Validates: Requirements 2.6, 8.3, 15.2, 15.3**
    - Test that profit = income - expense for all input pairs
    - Test that profit margin = (profit / income) × 100 when income > 0
    - Test that profit margin returns "N/A" when income = 0
    - Use fast-check with minimum 100 iterations

- [ ] 2. Implement date range filtering logic
  - [ ] 2.1 Enhance date filtering in MoneyClient component
    - Update `dateFilteredTransactions` useMemo to handle all preset ranges (This Month, Last 3 Months, This Year)
    - Implement custom date range validation (end date >= start date)
    - Add error handling for invalid date ranges with user feedback
    - Ensure date filtering is inclusive of both start and end dates
    - Add timezone-aware date handling using user's local timezone
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 15.5, 15.9_
  
  - [ ]* 2.2 Write property test for date range filtering inclusivity
    - **Property 4: Date Range Filtering Inclusivity**
    - **Validates: Requirements 5.2, 5.3, 5.4, 15.5**
    - Test that filtered results include all and only transactions within date boundaries
    - Test inclusivity of both start and end dates
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 2.3 Write property test for date validation correctness
    - **Property 5: Date Validation Correctness**
    - **Validates: Requirements 5.6**
    - Test that validation returns true only when end date >= start date
    - Test with valid and invalid calendar dates
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 2.4 Write unit tests for date filtering edge cases
    - Test filtering with empty transaction array
    - Test filtering with transactions on boundary dates
    - Test filtering with future end dates
    - Test custom range with missing start or end date
    - _Requirements: 5.2, 5.3, 5.4, 5.10_

- [ ] 3. Implement currency and number formatting utilities
  - [ ] 3.1 Create formatting utility functions
    - Implement `formatCurrency()` with thousand separators and 2 decimal places
    - Implement `formatPercentage()` with 1 decimal place and "%" symbol
    - Implement `formatDate()` for ISO 8601 format (YYYY-MM-DD)
    - Add handling for negative amounts with minus sign prefix
    - Add handling for zero values
    - _Requirements: 2.4, 3.8, 6.3, 6.4, 8.6, 8.11_
  
  - [ ]* 3.2 Write property test for currency formatting consistency
    - **Property 2: Currency Formatting Consistency**
    - **Validates: Requirements 2.4, 3.8, 6.4, 8.6, 8.11**
    - Test that all amounts include currency symbol and 2 decimal places
    - Test thousand separators for values >= 1000
    - Test minus sign prefix for negative values
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 3.3 Write property test for percentage calculation accuracy
    - **Property 7: Percentage Calculation Accuracy**
    - **Validates: Requirements 3.2, 15.8**
    - Test that percentage = (category_amount / total) × 100
    - Test rounding to 1 decimal place using round-half-up
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 3.4 Write property test for ISO 8601 date formatting
    - **Property 10: ISO 8601 Date Formatting**
    - **Validates: Requirements 6.3**
    - Test that formatted dates match YYYY-MM-DD pattern
    - Test with various valid date inputs
    - Use fast-check with minimum 100 iterations

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Enhance MoneyAnalytics component with new chart features
  - [ ] 5.1 Update monthly trend chart with profit line
    - Add profit data series to existing LineChart
    - Use purple color (#a855f7) for profit line
    - Ensure profit line displays alongside income and expense
    - Update tooltip to show all three values
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 4.1, 4.5_
  
  - [ ] 5.2 Implement profit trend visualization features
    - Add conditional coloring for profit data points (green for positive, red for negative/zero)
    - Add horizontal zero baseline line to chart
    - Calculate and display average profit for selected time range
    - Add visual indicators for highest and lowest profit periods
    - _Requirements: 4.3, 4.4, 4.6, 4.7, 4.8_
  
  - [ ] 5.3 Add platform comparison enhancements
    - Update platform comparison chart to sort platforms by total income descending
    - Add profit margin calculation and display for each platform
    - Handle zero-income platforms with "N/A" margin display
    - Ensure all platforms display even with zero transactions
    - _Requirements: 2.5, 2.6, 2.7, 2.8, 9.4, 9.5, 9.6, 9.7_
  
  - [ ] 5.4 Implement expense category grouping logic
    - Add logic to group categories representing < 3% of total into "Other" category
    - Calculate percentage for each category rounded to 1 decimal place
    - Update pie chart to display category names and percentages
    - Ensure distinct colors for each category
    - _Requirements: 3.2, 3.3, 3.5, 3.6_
  
  - [ ]* 5.5 Write property test for small category grouping
    - **Property 8: Small Category Grouping**
    - **Validates: Requirements 3.6**
    - Test that categories < 3% are grouped into "Other"
    - Test that "Other" amount equals sum of grouped categories
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 5.6 Write unit tests for chart data transformations
    - Test monthly trend data generation with empty transactions
    - Test platform comparison with zero-income platforms
    - Test expense breakdown with no expense transactions
    - Test income distribution with single platform
    - _Requirements: 1.10, 2.7, 3.7, 4.9_

- [ ] 6. Implement responsive chart rendering
  - [ ] 6.1 Add responsive chart sizing logic
    - Implement viewport-based chart height calculation (16:9 aspect ratio for mobile)
    - Implement dynamic font size scaling (10px to 16px based on viewport width)
    - Add chart re-rendering on viewport width changes (within 300ms)
    - Implement vertical stacking for mobile viewports (< 768px)
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ] 6.2 Implement touch-friendly chart interactions
    - Add tap-to-show tooltip functionality for touch devices
    - Add tap-outside-to-dismiss tooltip behavior
    - Ensure all chart labels remain visible and non-overlapping (320px to 3840px)
    - _Requirements: 11.5, 11.6_
  
  - [ ]* 6.3 Write unit tests for responsive behavior
    - Test chart height calculation for various viewport widths
    - Test font size scaling formula
    - Test label visibility at minimum and maximum viewport widths
    - _Requirements: 11.1, 11.2, 11.5_

- [ ] 7. Implement monthly summary table
  - [ ] 7.1 Create monthly summary table component
    - Build table structure with columns: Month, Transactions, Income, Expense, Profit, Margin
    - Implement month formatting as "MMM YYYY"
    - Calculate profit margin as (profit / income) × 100 with 1 decimal place
    - Display "N/A" for margin when income is zero
    - Sort months in descending chronological order
    - Apply visual distinction for negative profit values
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7, 8.8, 8.11_
  
  - [ ]* 7.2 Write property test for month filtering accuracy
    - **Property 13: Month Filtering Accuracy**
    - **Validates: Requirements 8.9**
    - Test that monthly summary includes one row per unique month with transactions
    - Test that months without transactions are excluded
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 7.3 Write property test for descending sort preservation
    - **Property 6: Descending Sort Preservation**
    - **Validates: Requirements 2.5, 8.5**
    - Test that sorted output maintains descending order by sort key
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 7.4 Write unit tests for monthly summary edge cases
    - Test with no transactions in date range
    - Test with single transaction
    - Test with transactions spanning multiple years
    - Test profit margin calculation with zero income
    - _Requirements: 8.4, 8.10_

- [ ] 8. Implement platform-wise breakdown table
  - [ ] 8.1 Create platform breakdown table component
    - Build table structure with columns: Platform, Transactions, Income, Expense, Profit, Margin
    - Display all four platforms (Freelancer, Direct, Upwork, Fiverr) even with zero transactions
    - Calculate profit margin with 2 decimal places followed by "%" symbol
    - Display "N/A" for margin when income is zero
    - Sort platforms by net profit in descending order
    - Apply platform-specific color indicators consistent with existing UI
    - Format currency values with 2 decimal places and thousands separators
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_
  
  - [ ]* 8.2 Write unit tests for platform breakdown
    - Test with all platforms having zero transactions
    - Test sorting by net profit
    - Test profit margin calculation with zero income
    - Test currency formatting with large values
    - _Requirements: 9.4, 9.6, 9.7, 9.9_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement CSV export functionality
  - [ ] 10.1 Create CSV export utility in lib/exportUtils.ts
    - Implement `exportToCSV()` function with columns: date, platform, category, type, amount, description
    - Format dates in ISO 8601 format (YYYY-MM-DD)
    - Format amounts as decimal with 2 decimal places
    - Generate filename using pattern "transactions-YYYY-MM-DD.csv"
    - Implement RFC 4180 CSV escaping for special characters (commas, quotes, newlines)
    - Handle empty/null fields as empty strings
    - Handle empty transaction arrays (header-only CSV)
    - Trigger browser download on completion
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8, 6.11, 6.12_
  
  - [ ]* 10.2 Write property test for CSV data completeness
    - **Property 9: CSV Data Completeness**
    - **Validates: Requirements 6.1**
    - Test that CSV contains exactly one row per transaction (excluding header)
    - Test that each row contains all transaction fields in correct order
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 10.3 Write property test for CSV filename pattern compliance
    - **Property 11: CSV Filename Pattern Compliance**
    - **Validates: Requirements 6.5**
    - Test that filename matches "transactions-YYYY-MM-DD.csv" pattern
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 10.4 Write property test for RFC 4180 CSV escaping
    - **Property 12: RFC 4180 CSV Escaping**
    - **Validates: Requirements 6.12**
    - Test that special characters are properly escaped
    - Test that fields with commas, quotes, newlines are enclosed in double quotes
    - Test that double quotes within fields are escaped as two consecutive quotes
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 10.5 Write unit tests for CSV export edge cases
    - Test export with empty transaction array
    - Test export with null/empty fields
    - Test export with special characters in description
    - Test filename generation with various dates
    - _Requirements: 6.8, 6.11_

- [ ] 11. Implement PDF export functionality
  - [ ] 11.1 Create PDF export utility in lib/exportUtils.ts
    - Implement `exportToPDF()` function using browser print API
    - Include sections: header with date range, total income/expense/profit, platform breakdown, transaction list
    - Format currency values with dollar sign and 2 decimal places
    - Include company/user name and report generation date in header
    - Apply 12pt font for body text and 16pt for section headings
    - Generate filename using pattern "financial-report-YYYY-MM-DD.pdf"
    - Trigger browser download on completion
    - Handle empty transaction arrays (zero values in summary)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.10, 7.11_
  
  - [ ]* 11.2 Write unit tests for PDF export
    - Test PDF generation with empty transactions
    - Test PDF generation with complete data
    - Test filename generation
    - Test date range formatting in header
    - _Requirements: 7.10, 7.11_

- [ ] 12. Implement error handling and loading states
  - [ ] 12.1 Add error handling for date validation
    - Display error message when end date < start date
    - Prevent filtering when validation fails
    - Add user-friendly error messages
    - _Requirements: 5.6, 5.7_
  
  - [ ] 12.2 Add error handling for export operations
    - Add try-catch blocks for CSV export with error messages and retry option
    - Add try-catch blocks for PDF export with error messages and retry option
    - Display warning for large datasets (> 10,000 transactions)
    - Add success notifications for successful exports
    - _Requirements: 6.9, 6.10, 7.9_
  
  - [ ] 12.3 Implement loading states for analytics
    - Add loading indicators for each chart component
    - Display skeleton loaders with same dimensions as final charts
    - Show "processing data" message for operations > 1 second
    - Add retry functionality with maximum 3 attempts
    - Remove loading indicators within 100ms when data available
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_
  
  - [ ]* 12.4 Write unit tests for error handling
    - Test date validation error display
    - Test CSV export error handling
    - Test PDF export error handling
    - Test retry functionality
    - _Requirements: 5.7, 6.10, 7.9, 12.4, 12.5_

- [ ] 13. Implement empty state handling
  - [ ] 13.1 Add empty state components for charts
    - Create empty state for Income/Expense Trend chart
    - Create empty state for Platform Comparison chart
    - Create empty state for Expense Category chart
    - Create empty state for Profit Trend chart
    - Include explanatory messages for each chart type
    - Add chart-type-specific illustrations/icons
    - Add "Add Transaction" call-to-action button
    - Wire button to open Add Transaction modal
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_
  
  - [ ] 13.2 Add empty state for monthly summary table
    - Display "No data for selected period" message
    - Show immediately without loading indicators
    - _Requirements: 8.10, 13.6_
  
  - [ ]* 13.3 Write unit tests for empty states
    - Test empty state display with zero transactions
    - Test partial empty states (some charts with data, others without)
    - Test "Add Transaction" button functionality
    - _Requirements: 13.1, 13.6, 13.7_

- [ ] 14. Implement chart interactivity features
  - [ ] 14.1 Enhance tooltip behavior
    - Implement 200ms hover delay before showing tooltip
    - Position tooltips with minimum 8px offset from chart boundaries
    - Hide tooltips within 100ms when cursor moves away
    - Include platform name, date, amount, and transaction type in tooltips
    - _Requirements: 14.1, 14.2, 14.3_
  
  - [ ] 14.2 Implement platform filter on chart click
    - Add click handler to platform bars in comparison chart
    - Filter all dashboard charts to show only selected platform within 500ms
    - Display dismissible badge with selected platform name
    - Add badge click handler to remove filter and restore all data within 500ms
    - Add error handling for filter operation failures
    - _Requirements: 14.4, 14.5, 14.6, 14.8_
  
  - [ ] 14.3 Add chart transition animations
    - Implement 300ms fade effect for chart data changes
    - Ensure smooth transitions when filters change
    - _Requirements: 14.7_
  
  - [ ]* 14.4 Write unit tests for chart interactivity
    - Test tooltip display timing
    - Test tooltip positioning
    - Test platform filter application
    - Test filter badge display and removal
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [ ] 15. Implement data accuracy validations
  - [ ] 15.1 Add deleted transaction exclusion logic
    - Filter out deleted transactions from all calculations
    - Ensure totals, averages, and counts exclude deleted items
    - _Requirements: 15.6_
  
  - [ ] 15.2 Add negative amount handling
    - Process negative amounts according to transaction type field
    - Do not invert sign of negative amounts
    - _Requirements: 15.7_
  
  - [ ]* 15.3 Write property test for deleted transaction exclusion
    - **Property 14: Deleted Transaction Exclusion**
    - **Validates: Requirements 15.6**
    - Test that all metrics exclude deleted transactions
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 15.4 Write property test for negative amount handling
    - **Property 15: Negative Amount Handling**
    - **Validates: Requirements 15.7**
    - Test that negative amounts are processed by type field without sign inversion
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 15.5 Write property test for timezone-aware grouping
    - **Property 16: Timezone-Aware Grouping**
    - **Validates: Requirements 15.9**
    - Test that transactions are grouped by local timezone
    - Test that transactions are assigned to correct period based on local time
    - Use fast-check with minimum 100 iterations

- [ ] 16. Final integration and testing
  - [ ] 16.1 Integrate all components in MoneyClient
    - Ensure all new features work together seamlessly
    - Verify date filter persists across view mode switches
    - Verify period toggle maintains selection when date range changes
    - Test all export operations with filtered data
    - _Requirements: 5.9, 10.5_
  
  - [ ] 16.2 Verify performance requirements
    - Test date range filter updates complete within 500ms
    - Test period toggle updates complete within 3 seconds
    - Test CSV export completes within 2 seconds for up to 10,000 transactions
    - Test PDF export completes within 5 seconds for up to 1,000 transactions
    - Test chart re-rendering completes within 300ms on viewport changes
    - _Requirements: 5.8, 6.7, 7.8, 10.4, 11.3_
  
  - [ ]* 16.3 Write integration tests for complete workflows
    - Test complete analytics workflow: filter → view charts → export
    - Test view mode switching with various filter combinations
    - Test period toggle with different date ranges
    - Test export operations with empty and full datasets
    - _Requirements: 1.1, 5.9, 6.1, 7.1, 10.1_

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- Checkpoints ensure incremental validation throughout implementation
- All property tests MUST use fast-check library with minimum 100 iterations
- All property tests MUST include a comment referencing the design property number
- The implementation builds upon existing MoneyClient and MoneyAnalytics components
- TypeScript is used throughout for type safety
- Recharts library (already installed) is used for all chart visualizations
- Export utilities are created in lib/exportUtils.ts
- All currency formatting uses USD with 2 decimal places and thousand separators
- All date formatting uses ISO 8601 format (YYYY-MM-DD)
- Responsive design supports viewport widths from 320px to 3840px
- Dark mode support is maintained throughout all new components
- Accessibility (WCAG 2.1 AA) is considered in all interactive elements

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.1", "3.2", "3.3", "3.4"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.3", "5.4"] },
    { "id": 4, "tasks": ["5.5", "5.6", "6.1", "6.2", "7.1"] },
    { "id": 5, "tasks": ["6.3", "7.2", "7.3", "7.4", "8.1"] },
    { "id": 6, "tasks": ["8.2", "10.1"] },
    { "id": 7, "tasks": ["10.2", "10.3", "10.4", "10.5", "11.1"] },
    { "id": 8, "tasks": ["11.2", "12.1", "12.2", "12.3"] },
    { "id": 9, "tasks": ["12.4", "13.1", "13.2"] },
    { "id": 10, "tasks": ["13.3", "14.1", "14.2", "14.3"] },
    { "id": 11, "tasks": ["14.4", "15.1", "15.2"] },
    { "id": 12, "tasks": ["15.3", "15.4", "15.5"] },
    { "id": 13, "tasks": ["16.1", "16.2"] },
    { "id": 14, "tasks": ["16.3"] }
  ]
}
```
