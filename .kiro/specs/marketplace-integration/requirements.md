# Requirements Document

## Introduction

The Marketplace Integration feature connects the existing Marketplace Projects system with the Money Management system to provide automated income tracking and enhanced visibility into project-related financial transactions. This integration enables automatic transaction creation when projects are completed, manual transaction linking from project details, transaction-to-project relationship display, and platform-based project analytics on the Money page.

## Glossary

- **Marketplace_Project_System**: The existing system that manages marketplace projects with fields including title, platform, budget, status, and description
- **Money_Management_System**: The existing system that tracks financial transactions with fields including date, platform, type, category, amount, and description
- **Transaction**: A financial record in the Money Management System representing income or expense
- **Project_Details_Page**: The UI page displaying detailed information about a specific marketplace project
- **Money_Page**: The UI page displaying financial transactions and analytics
- **Platform**: The marketplace source (Freelancer, Direct, Upwork, Fiverr)
- **Project_Status**: The current state of a marketplace project (Planning, In Progress, In Review, Completed)
- **Income_Transaction**: A transaction record with type set to "Income"
- **Transaction_Link**: A reference relationship between a Transaction and a Marketplace Project via projectId field
- **Project_Count_Analytics**: Aggregated statistics showing the number of projects per platform
- **Auto_Transaction_Creator**: The component responsible for automatically creating transactions when project status changes
- **Manual_Transaction_Linker**: The UI component that allows users to manually create a transaction linked to a project
- **Transaction_Display_Component**: The UI component that shows transaction information including linked project details
- **Platform_Analytics_Component**: The UI component that displays project counts grouped by platform

## Requirements

### Requirement 1: Automatic Income Transaction Creation

**User Story:** As a project manager, I want income transactions to be automatically created when I mark a project as completed, so that I don't have to manually enter the same information twice.

#### Acceptance Criteria

1. WHEN a Marketplace Project status changes from any status to "Completed", THE Auto_Transaction_Creator SHALL create an Income Transaction in the Money Management System
2. WHEN creating the automatic Income Transaction, THE Auto_Transaction_Creator SHALL set the transaction platform to match the Marketplace Project platform
3. WHEN creating the automatic Income Transaction, THE Auto_Transaction_Creator SHALL set the transaction amount to the Marketplace Project budget value
4. WHEN creating the automatic Income Transaction, THE Auto_Transaction_Creator SHALL set the transaction date to the current date
5. WHEN creating the automatic Income Transaction, THE Auto_Transaction_Creator SHALL set the transaction category to "Project Income"
6. WHEN creating the automatic Income Transaction, THE Auto_Transaction_Creator SHALL set the transaction description to include the Marketplace Project title
7. WHEN creating the automatic Income Transaction, THE Auto_Transaction_Creator SHALL set the projectId field to reference the Marketplace Project
8. WHEN a Marketplace Project has no budget value, THE Auto_Transaction_Creator SHALL set the transaction amount to zero
9. WHEN the automatic transaction creation fails, THE Auto_Transaction_Creator SHALL log the error and continue without blocking the status update

### Requirement 2: Manual Transaction Creation from Project Details

**User Story:** As a project manager, I want to manually add a transaction from the project details page, so that I can create linked transactions for partial payments or expenses related to the project.

#### Acceptance Criteria

1. WHEN viewing the Project Details Page, THE Manual_Transaction_Linker SHALL display an action button to add a transaction
2. WHEN the user clicks the add transaction button, THE Manual_Transaction_Linker SHALL open a transaction creation form
3. WHEN the transaction creation form opens, THE Manual_Transaction_Linker SHALL pre-populate the platform field with the Marketplace Project platform
4. WHEN the transaction creation form opens, THE Manual_Transaction_Linker SHALL pre-populate the amount field with the Marketplace Project budget value
5. WHEN the transaction creation form opens, THE Manual_Transaction_Linker SHALL pre-populate the description field with the Marketplace Project title
6. WHEN the user submits the transaction creation form, THE Manual_Transaction_Linker SHALL create a Transaction with the projectId field set to the current Marketplace Project
7. WHEN the user submits the transaction creation form, THE Manual_Transaction_Linker SHALL allow the user to modify all pre-populated fields before submission
8. WHEN the transaction is successfully created, THE Manual_Transaction_Linker SHALL display a success confirmation message
9. WHEN the transaction creation fails, THE Manual_Transaction_Linker SHALL display an error message with details

### Requirement 3: Project Information Display in Transaction List

**User Story:** As a financial analyst, I want to see which project each transaction is linked to in the transaction list, so that I can quickly understand the source of income without navigating to separate pages.

#### Acceptance Criteria

1. WHEN displaying a Transaction in the transaction list, THE Transaction_Display_Component SHALL check if the projectId field is populated
2. WHEN a Transaction has a projectId value, THE Transaction_Display_Component SHALL fetch the linked Marketplace Project details
3. WHEN displaying a linked Transaction, THE Transaction_Display_Component SHALL show the Marketplace Project title
4. WHEN displaying a linked Transaction, THE Transaction_Display_Component SHALL provide a clickable link to navigate to the Project Details Page
5. WHEN a Transaction has no projectId value, THE Transaction_Display_Component SHALL display the transaction without project information
6. WHEN the linked Marketplace Project cannot be found, THE Transaction_Display_Component SHALL display a message indicating the project no longer exists
7. WHEN fetching the linked project details fails, THE Transaction_Display_Component SHALL display the transaction without project information and log the error

### Requirement 4: Platform-Based Project Count Analytics

**User Story:** As a business owner, I want to see how many projects I have on each platform on the Money page, so that I can understand which platforms are most active for my business.

#### Acceptance Criteria

1. WHEN the Money Page loads, THE Platform_Analytics_Component SHALL query all Marketplace Projects grouped by platform
2. WHEN displaying platform analytics, THE Platform_Analytics_Component SHALL show the count of projects for Freelancer platform
3. WHEN displaying platform analytics, THE Platform_Analytics_Component SHALL show the count of projects for Direct platform
4. WHEN displaying platform analytics, THE Platform_Analytics_Component SHALL show the count of projects for Upwork platform
5. WHEN displaying platform analytics, THE Platform_Analytics_Component SHALL show the count of projects for Fiverr platform
6. WHEN a platform has zero projects, THE Platform_Analytics_Component SHALL display a count of zero for that platform
7. WHEN the platform analytics query fails, THE Platform_Analytics_Component SHALL display an error message and show zero counts
8. WHEN displaying platform analytics, THE Platform_Analytics_Component SHALL update the counts when new projects are added or removed

### Requirement 5: Transaction-Project Link Validation

**User Story:** As a system administrator, I want the system to validate transaction-project links, so that data integrity is maintained across the integration.

#### Acceptance Criteria

1. WHEN creating a Transaction with a projectId value, THE Money_Management_System SHALL verify the referenced Marketplace Project exists
2. WHEN a Transaction references a non-existent Marketplace Project, THE Money_Management_System SHALL reject the transaction creation with a validation error
3. WHEN updating a Transaction projectId field, THE Money_Management_System SHALL verify the new Marketplace Project reference exists
4. WHEN a Transaction projectId is set to null or undefined, THE Money_Management_System SHALL allow the transaction to exist without a project link
5. WHEN querying Transactions with project links, THE Money_Management_System SHALL use the existing projectId index for efficient retrieval

### Requirement 6: Budget Parsing and Amount Handling

**User Story:** As a developer, I want the system to correctly parse budget values from marketplace projects, so that transaction amounts are accurate regardless of budget format.

#### Acceptance Criteria

1. WHEN a Marketplace Project budget contains numeric characters, THE Auto_Transaction_Creator SHALL extract the numeric value for the transaction amount
2. WHEN a Marketplace Project budget contains currency symbols, THE Auto_Transaction_Creator SHALL remove currency symbols before parsing the amount
3. WHEN a Marketplace Project budget contains comma separators, THE Auto_Transaction_Creator SHALL remove comma separators before parsing the amount
4. WHEN a Marketplace Project budget cannot be parsed to a valid number, THE Auto_Transaction_Creator SHALL set the transaction amount to zero
5. WHEN a Marketplace Project budget is an empty string, THE Auto_Transaction_Creator SHALL set the transaction amount to zero
6. WHEN a Marketplace Project budget is undefined, THE Auto_Transaction_Creator SHALL set the transaction amount to zero
7. WHEN parsing the budget value, THE Auto_Transaction_Creator SHALL round the resulting amount to two decimal places

### Requirement 7: Integration Error Handling and Logging

**User Story:** As a system administrator, I want comprehensive error logging for integration operations, so that I can troubleshoot issues and ensure data consistency.

#### Acceptance Criteria

1. WHEN the Auto_Transaction_Creator fails to create a transaction, THE Auto_Transaction_Creator SHALL log the error with the project ID and error details
2. WHEN the Manual_Transaction_Linker fails to create a transaction, THE Manual_Transaction_Linker SHALL log the error with the project ID and user input
3. WHEN the Transaction_Display_Component fails to fetch project details, THE Transaction_Display_Component SHALL log the error with the transaction ID and projectId
4. WHEN the Platform_Analytics_Component fails to query project counts, THE Platform_Analytics_Component SHALL log the error with the query parameters
5. WHEN a validation error occurs during transaction creation, THE Money_Management_System SHALL log the validation failure with the invalid data
6. WHEN a database operation fails during integration, THE Money_Management_System SHALL log the database error with the operation context
7. WHEN an error is logged, THE Money_Management_System SHALL include a timestamp and error severity level
