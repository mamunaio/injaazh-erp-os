'use server';

import { revalidatePath } from 'next/cache';

/**
 * Safe revalidatePath helper
 * Prevents throwing errors when running in environments where Next.js revalidation is not available
 * (such as integration test scripts run via Node.js/tsx)
 */
function safeRevalidatePath(path: string, type?: 'layout' | 'page') {
  try {
    revalidatePath(path, type);
  } catch (error) {
    // Silent catch - allows actions to run outside Next.js request/static context
  }
import connectToDatabase from '@/lib/mongodb';
import MarketplaceProject from '@/models/MarketplaceProject';
import { Project } from '@/models/Project';
import { Transaction } from '@/models/Transaction';
import { getAuthUser } from '@/lib/auth';
import type { IMarketplaceProject } from '@/models/MarketplaceProject';

/**
 * Parse budget amount from string to number
 * Removes currency symbols ($), commas, and whitespace
 * Returns 0 for empty, undefined, or unparseable values
 * Rounds result to 2 decimal places
 * 
 * @param budget - Budget string to parse (e.g., "$1,500", "1500.50", undefined)
 * @returns Parsed numeric value rounded to 2 decimals, or 0 if unparseable
 * 
 * @example
 * parseBudgetAmount("$1,500") // returns 1500
 * parseBudgetAmount("1500.50") // returns 1500.50
 * parseBudgetAmount("$1,234.56") // returns 1234.56
 * parseBudgetAmount("") // returns 0
 * parseBudgetAmount(undefined) // returns 0
 * parseBudgetAmount("invalid") // returns 0
 */
function parseBudgetAmount(budget: string | undefined): number {
  if (!budget) return 0;
  
  // Remove currency symbols ($), commas, and whitespace
  const cleaned = budget.replace(/[$,\s]/g, '');
  
  // Parse to float
  const parsed = parseFloat(cleaned);
  
  // Return 0 if NaN, otherwise round to 2 decimals
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

/**
 * Create an automatic income transaction for a completed marketplace project
 * This function is called when a project status changes to "Completed"
 * Errors are logged but not thrown to avoid blocking the status update
 * 
 * @param project - The marketplace project to create a transaction for
 * @returns Promise<void> - Does not throw errors, logs them instead
 * 
 * @example
 * await createAutoTransaction(completedProject);
 * // Creates transaction with:
 * // - platform: project.platform
 * // - type: "Income"
 * // - amount: parsed from project.budget
 * // - date: current date
 * // - category: "Project Income"
 * // - description: "Project: {project.title}"
 * // - projectId: project._id
 */
async function createAutoTransaction(project: IMarketplaceProject): Promise<void> {
  try {
    const amount = parseBudgetAmount(project.budget);
    
    // Check if an auto-transaction already exists for this project (without milestoneId)
    const existingTransaction = await Transaction.findOne({
      projectId: project._id,
      category: 'Project Income',
      milestoneId: { $exists: false }
    });
    
    if (existingTransaction) {
      console.log(`ℹ️ Auto-transaction already exists for project ${project._id}, skipping duplicate creation.`);
      return;
    }
    
    const transaction = new Transaction({
      platform: project.platform,
      type: 'Income',
      amount: amount,
      date: new Date(),
      category: 'Project Income',
      description: `Project: ${project.title}`,
      projectId: project._id,
    });
    
    await transaction.save();
    console.log(`✅ Auto-created transaction for project ${project._id}`);
  } catch (error) {
    // Error Handling Strategy: Non-blocking failure
    // Transaction creation errors are logged but not thrown to prevent blocking
    // the project status update. This ensures users can mark projects as completed
    // even if the automatic transaction creation fails due to database issues,
    // validation errors, or network problems. Admins can manually create
    // transactions later if needed.
    console.error(`❌ Failed to auto-create transaction for project ${project._id}:`, error);
  }
}

export async function getMarketplaceProjects(platform?: string) {
  try {
    await connectToDatabase();
    
    // Fetch and sort by deadline ascending (soonest first)
    const query = platform ? { platform: platform.charAt(0).toUpperCase() + platform.slice(1) } : {};
    
    const projects = await MarketplaceProject.find(query)
      .sort({ deadline: 1, createdAt: -1 })
      .lean()
      .exec();
      
    const authUser = await getAuthUser();
    let parsed = JSON.parse(JSON.stringify(projects));
    
    if (authUser && authUser.role === 'admin') {
      parsed = parsed.map((p: any) => {
        if (p.platform === 'Direct') {
          return {
            ...p,
            title: 'Confidential Direct Project',
            clientDetails: p.clientDetails ? { ...p.clientDetails, clientName: 'Confidential Client' } : p.clientDetails,
            notes: 'Confidential',
            url: ''
          };
        }
        return p;
      });
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to fetch marketplace projects:', error);
    throw new Error('Failed to fetch marketplace projects');
  }
}

export async function createMarketplaceProject(data: any) {
  try {
    await connectToDatabase();
    
    const newProject = await MarketplaceProject.create(data);
    
    safeRevalidatePath('/marketplace');
    safeRevalidatePath(`/marketplace/${data.platform?.toLowerCase()}`);
    
    return { success: true, data: JSON.parse(JSON.stringify(newProject)) };
  } catch (error: any) {
    console.error('Failed to create marketplace project:', error);
    return { success: false, error: error.message || 'Failed to create project' };
  }
}

export async function getMarketplaceProjectById(id: string) {
  try {
    await connectToDatabase();
    const project = await MarketplaceProject.findById(id).lean().exec();
    if (!project) return null;
    return JSON.parse(JSON.stringify(project));
  } catch (error) {
    console.error('Failed to fetch marketplace project details:', error);
    throw new Error('Failed to fetch marketplace project details');
  }
}

export async function updateMarketplaceProject(id: string, data: any) {
  try {
    await connectToDatabase();
    
    // Fetch existing project to get current status before update
    const existingProject = await MarketplaceProject.findById(id).lean().exec();
    if (!existingProject) {
      return { success: false, error: 'Project not found' };
    }
    
    const oldStatus = existingProject.status;
    
    // Update the project
    const updatedProject = await MarketplaceProject.findByIdAndUpdate(id, data, { new: true }).lean().exec();
    if (!updatedProject) {
       return { success: false, error: 'Project not found' };
    }
    
    // Detect if status changed to "Completed"
    const newStatus = updatedProject.status;
    if (oldStatus !== 'Completed' && newStatus === 'Completed') {
      // Error Handling Strategy: Defensive wrapper with detailed logging
      // Even though createAutoTransaction has internal error handling, we wrap it
      // in an additional try-catch to ensure any unexpected errors are caught and
      // logged with full context (projectId, title, budget). This double-layer
      // protection guarantees the status update always succeeds.
      try {
        await createAutoTransaction(updatedProject as IMarketplaceProject);
      } catch (error) {
        console.error(`❌ Failed to auto-create transaction for project ${id}:`, {
          projectId: id,
          projectTitle: updatedProject.title,
          budget: updatedProject.budget,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Detect and handle newly paid milestones
    if (data.milestones && Array.isArray(data.milestones)) {
      const existingMilestones = existingProject.milestones || [];
      for (const newMilestone of data.milestones) {
        if (newMilestone.status === 'Paid') {
          // Check if this milestone was already Paid in existing project
          const oldMilestone = existingMilestones.find((m: any) => String(m.id) === String(newMilestone.id));
          const wasAlreadyPaid = oldMilestone && oldMilestone.status === 'Paid';
          
          if (!wasAlreadyPaid) {
            // Check if there is already a transaction for this milestone to be safe
            const existingMilestoneTx = await Transaction.findOne({
              projectId: id,
              milestoneId: String(newMilestone.id),
              category: 'Project Income'
            });
            
            if (!existingMilestoneTx) {
              try {
                const amount = Number(newMilestone.amount) || 0;
                if (amount > 0) {
                  const transaction = new Transaction({
                    platform: existingProject.platform,
                    type: 'Income',
                    amount: amount,
                    date: new Date(),
                    category: 'Project Income',
                    description: `Milestone: ${newMilestone.description} (Project: ${existingProject.title})`,
                    projectId: existingProject._id,
                    milestoneId: String(newMilestone.id),
                  } as any);
                  
                  await transaction.save();
                  console.log(`✅ Auto-created transaction for milestone ${newMilestone.id} of project ${id}`);
                }
              } catch (txError) {
                console.error(`❌ Failed to auto-create transaction for milestone ${newMilestone.id} of project ${id}:`, txError);
              }
            }
          }
        }
      }
    }
    
    safeRevalidatePath('/marketplace');
    safeRevalidatePath(`/marketplace/${updatedProject.platform.toLowerCase()}`);
    safeRevalidatePath(`/marketplace/${updatedProject.platform.toLowerCase()}/${id}`);
    
    return { success: true, data: JSON.parse(JSON.stringify(updatedProject)) };
  } catch (error: any) {
    console.error('Failed to update marketplace project:', error);
    return { success: false, error: error.message || 'Failed to update project' };
  }
}

export async function deleteMarketplaceProject(id: string) {
  try {
    await connectToDatabase();
    
    const project = await MarketplaceProject.findById(id).lean().exec();
    if (!project) return { success: false, error: 'Project not found' };

    await MarketplaceProject.findByIdAndDelete(id);
    
    safeRevalidatePath(`/marketplace/${project.platform.toLowerCase()}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete marketplace project:', error);
    return { success: false, error: error.message || 'Failed to delete project' };
  }
}

/**
 * Get project count analytics grouped by platform
 * Aggregates all marketplace projects and returns counts for each platform
 * Returns zero counts for platforms with no projects
 * 
 * @returns Promise with success status and platform counts
 * 
 * @example
 * const result = await getProjectAnalytics();
 * // Returns: { success: true, data: { Freelancer: 5, Direct: 3, Upwork: 2, Fiverr: 0 } }
 * 
 * // On error: { success: false, error: "error message", data: { Freelancer: 0, Direct: 0, Upwork: 0, Fiverr: 0 } }
 */
export async function getProjectAnalytics(): Promise<{
  success: boolean;
  data: {
    Freelancer: number;
    Direct: number;
    Upwork: number;
    Fiverr: number;
  };
  error?: string;
}> {
  try {
    await connectToDatabase();
    
    // Aggregate projects by platform
    const analytics = await MarketplaceProject.aggregate([
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Transform to object with all platforms (default 0)
    const result = {
      Freelancer: 0,
      Direct: 0,
      Upwork: 0,
      Fiverr: 0
    };
    
    analytics.forEach((item: { _id: string; count: number }) => {
      if (item._id in result) {
        result[item._id as keyof typeof result] = item.count;
      }
    });
    
    return { success: true, data: result };
  } catch (error: any) {
    // Error Handling Strategy: Graceful degradation with default values
    // If the analytics query fails (database connection issues, timeout, etc.),
    // we return zero counts for all platforms along with an error message.
    // This allows the UI to display the analytics section with zeros rather than
    // breaking the entire page. Users can retry or continue using other features.
    console.error('❌ Failed to fetch project analytics:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch project analytics',
      data: { Freelancer: 0, Direct: 0, Upwork: 0, Fiverr: 0 }
    };
  }
}

/**
 * Create a transaction manually linked to a marketplace project
 * Validates that the project exists before creating the transaction
 * Revalidates money page and project detail paths after creation
 * 
 * @param projectId - The ID of the marketplace project to link to
 * @param transactionData - The transaction data to create
 * @returns Promise with success status and created transaction data or error message
 * 
 * @example
 * const result = await createTransactionFromProject(
 *   "507f1f77bcf86cd799439011",
 *   {
 *     platform: "Upwork",
 *     type: "Income",
 *     amount: 1500,
 *     date: new Date(),
 *     category: "Project Income",
 *     description: "Payment for project"
 *   }
 * );
 * 
 * if (result.success) {
 *   console.log("Transaction created:", result.data);
 * } else {
 *   console.error("Error:", result.error);
 * }
 */
export async function createTransactionFromProject(
  projectId: string,
  transactionData: {
    platform: string;
    type: 'Income' | 'Expense';
    amount: number;
    date: Date;
    category: string;
    description: string;
  }
) {
  try {
    await connectToDatabase();
    
    // Error Handling Strategy: Validation before creation
    // We validate that the project exists before attempting to create the transaction.
    // This prevents orphaned transactions and provides clear error messages to users.
    // If validation fails, we return a structured error response rather than throwing,
    // allowing the UI to display user-friendly error messages.
    const project = await MarketplaceProject.findById(projectId).lean().exec();
    if (!project) {
      return { success: false, error: 'Project not found' };
    }
    
    // Create Transaction with projectId field set
    const transaction = new Transaction({
      ...transactionData,
      projectId: projectId,
    });
    
    await transaction.save();
    
    // Revalidate /money path and project detail paths
    safeRevalidatePath('/money');
    safeRevalidatePath(`/marketplace/${project.platform.toLowerCase()}/${projectId}`);
    
    // Return success response with serialized data
    return { success: true, data: JSON.parse(JSON.stringify(transaction)) };
  } catch (error: any) {
    // Error Handling Strategy: Comprehensive error logging with context
    // Log all transaction creation failures with full context (projectId, transaction data,
    // error message) to aid debugging. Return structured error response to UI.
    console.error(`❌ Manual transaction creation failed for project ${projectId}:`, {
      projectId,
      transactionData,
      error: error.message,
    });
    return { success: false, error: error.message || 'Failed to create transaction' };
  }
}
