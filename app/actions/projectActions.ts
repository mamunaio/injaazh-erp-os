'use server';

import mongoose from 'mongoose';
import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/mongodb';
import { Project } from '@/models/Project';
import { getAuthUser, requireWriteAuth, requireAdminOrOwnerAuth } from '@/lib/auth';

const ALLOWED_PROJECT_STATUSES = [
  'Planning',
  'In Progress',
  'In Review',
  'Completed',
  'On Hold',
  'Cancelled',
] as const;

const ALLOWED_PROJECT_PRIORITIES = [
  'Low',
  'Medium',
  'High',
  'Urgent',
] as const;

const ALLOWED_PROJECT_PLATFORMS = [
  'Upwork',
  'Freelancer',
  'Fiverr',
  'Direct',
  'Other',
] as const;

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  clientName?: string;
  status?: typeof ALLOWED_PROJECT_STATUSES[number];
  priority?: typeof ALLOWED_PROJECT_PRIORITIES[number];
  progress?: number;
  budget?: number | null;
  platform?: typeof ALLOWED_PROJECT_PLATFORMS[number] | null;
  techStack?: string[] | string;
  assignees?: string[] | string;
  tags?: string[];
  startDate?: string | Date | null;
  deadline?: string | Date | null;
  hourlyRate?: number;
}

export async function getProjectsBoard() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: 'Unauthorized: Authentication required.', data: [] };
    }

    await connectToDatabase();

    const projects = await Project.find({})
      .sort({ createdAt: -1 })
      .lean();

    // Convert MongoDB documents to plain objects with string IDs
    const serializedProjects = projects.map((project: any) => {
      // Create a clean object with only the fields we need
      return {
        _id: project._id?.toString() || '',
        title: project.title || '',
        description: project.description || '',
        status: ['Planning', 'In Progress', 'In Review', 'Completed', 'On Hold', 'Cancelled'].includes(project.status) ? project.status : 'Planning',
        techStack: Array.isArray(project.techStack) ? project.techStack : [],
        assignees: Array.isArray(project.assignees) ? project.assignees : [],
        progress: typeof project.progress === 'number' ? project.progress : 0,
        startDate: project.startDate ? new Date(project.startDate).toISOString() : null,
        deadline: project.deadline ? new Date(project.deadline).toISOString() : null,
        priority: project.priority || 'Medium',
        tags: Array.isArray(project.tags) ? project.tags : [],
        budget: typeof project.budget === 'number' ? project.budget : undefined,
        platformFee: typeof project.platformFee === 'number' ? project.platformFee : undefined,
        platform: project.platform || undefined,
        clientName: project.clientName || '',
        attachments: typeof project.attachments === 'number' ? project.attachments : 0,
        comments: typeof project.comments === 'number' ? project.comments : 0,
        leadId: project.leadId?.toString() || undefined,
        proposalId: project.proposalId?.toString() || undefined,
        marketplaceProjectId: project.marketplaceProjectId?.toString() || undefined,
        createdAt: project.createdAt ? new Date(project.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: project.updatedAt ? new Date(project.updatedAt).toISOString() : new Date().toISOString(),
      };
    });

    return {
      success: true,
      data: serializedProjects
    };
  } catch (error: any) {
    console.error('❌ Error fetching projects:', error);
    return { success: false, error: error.message, data: [] };
  }
}

import { createTransaction } from './transactionActions';

import { Transaction } from '@/models/Transaction';

async function handleProjectCompletionSync(project: any) {
  if (!project || !project.budget || project.budget <= 0) return;

  const calculatedFee = project.platformFee || 0;
  const netIncome = project.budget - calculatedFee;
  if (netIncome <= 0) return;

  // 1. Conservative fallback for legacy unlinked transactions (projectId: null)
  // Strict attribution check: Only bind if exactly ONE project has this title AND exactly ONE unlinked legacy record matches
  if (project.title && typeof project.title === 'string' && project.title.trim()) {
    const trimmedTitle = project.title.trim();
    const escapedTitle = trimmedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Check if multiple projects in the system share this title (prevents misattribution)
    const sameTitleProjects = await Project.find({
      title: new RegExp(`^${escapedTitle}$`, 'i')
    }).limit(2);

    if (sameTitleProjects.length > 1) {
      console.warn(`[AUDIT] Ambiguous legacy revenue attribution: multiple projects (${sameTitleProjects.length}) share title "${trimmedTitle}". Legacy revenue record left unlinked to prevent misattribution.`);
    } else {
      const legacyMatches = await Transaction.find({
        category: 'Project Revenue',
        type: 'Income',
        description: new RegExp(escapedTitle, 'i'),
        projectId: null
      }).limit(2);

      if (legacyMatches.length === 1) {
        await Transaction.findByIdAndUpdate(legacyMatches[0]._id, {
          $set: {
            projectId: project._id,
            projectModel: 'Project'
          }
        });
      } else if (legacyMatches.length > 1) {
        console.warn(`[AUDIT] Multiple unlinked legacy revenue records found for project "${trimmedTitle}". Leaving records untouched for manual reconciliation.`);
      }
    }
  }

  // 2. Atomic findOneAndUpdate with upsert and duplicate-key conflict handling
  try {
    await Transaction.findOneAndUpdate(
      {
        projectId: project._id,
        category: 'Project Revenue',
        type: 'Income'
      },
      {
        $set: {
          amount: netIncome,
          platform: project.platform || 'Direct',
          description: `Revenue from completed project: ${project.title}`,
          projectModel: 'Project',
          category: 'Project Revenue',
          type: 'Income'
        },
        $setOnInsert: {
          date: new Date()
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );
  } catch (upsertErr: any) {
    const isDuplicateKey = upsertErr?.code === 11000 ||
                           upsertErr?.code === 11001 ||
                           String(upsertErr?.message || '').includes('E11000') ||
                           upsertErr?.name === 'MongoServerError';

    if (isDuplicateKey) {
      console.warn(`[AUDIT] Duplicate key conflict detected during revenue upsert for project ${project._id}. Attempting safe reconciliation re-read.`);
      const reconciled = await Transaction.findOneAndUpdate(
        {
          projectId: project._id,
          category: 'Project Revenue',
          type: 'Income'
        },
        {
          $set: {
            amount: netIncome,
            platform: project.platform || 'Direct',
            description: `Revenue from completed project: ${project.title}`,
            projectModel: 'Project'
          }
        },
        { new: true }
      );

      if (!reconciled) {
        console.error(`[AUDIT] Revenue reconciliation failed for project ${project._id} after duplicate key conflict.`);
        throw new Error(`Revenue reconciliation failed after duplicate key conflict for project ${project._id}`);
      }
    } else {
      console.error(`[AUDIT] Unexpected error during revenue synchronization for project ${project._id}:`, upsertErr);
      throw upsertErr;
    }
  }

  // 3. Non-destructive duplicate audit check
  const duplicateCount = await Transaction.countDocuments({
    projectId: project._id,
    category: 'Project Revenue',
    type: 'Income'
  });
  if (duplicateCount > 1) {
    console.warn(`[AUDIT] Multiple revenue records (${duplicateCount}) detected for project ${project._id}. Manual reconciliation required; existing records left unchanged.`);
  }
}

import { createNotification } from '@/lib/notificationService';
import MarketplaceProject from '@/models/MarketplaceProject';

export async function createProject(data: any) {
  try {
    const authUser = await requireWriteAuth();
    await connectToDatabase();

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { success: false, error: 'Invalid project creation payload' };
    }

    const ALLOWED_CREATE_KEYS = new Set([
      'title',
      'description',
      'clientName',
      'status',
      'priority',
      'progress',
      'budget',
      'platform',
      'techStack',
      'assignees',
      'tags',
      'startDate',
      'deadline',
      'hourlyRate',
    ]);

    for (const key of Object.keys(data)) {
      if (!ALLOWED_CREATE_KEYS.has(key)) {
        return { success: false, error: `Disallowed or unknown field: "${key}"` };
      }
    }

    if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
      return { success: false, error: 'Project title is required' };
    }

    const title = data.title.trim();
    if (title.length > 200) {
      return { success: false, error: 'Project title cannot exceed 200 characters' };
    }

    const validated: Record<string, any> = { title };

    if (data.description !== undefined && data.description !== null) {
      if (typeof data.description !== 'string') {
        return { success: false, error: 'Description must be a string' };
      }
      validated.description = data.description.trim().slice(0, 5000);
    }

    if (data.clientName !== undefined && data.clientName !== null) {
      if (typeof data.clientName !== 'string') {
        return { success: false, error: 'Client name must be a string' };
      }
      validated.clientName = data.clientName.trim().slice(0, 200);
    }

    if (data.status !== undefined && data.status !== null) {
      if (!ALLOWED_PROJECT_STATUSES.includes(data.status)) {
        return { success: false, error: 'Invalid project status value' };
      }
      validated.status = data.status;
    } else {
      validated.status = 'Planning';
    }

    if (data.priority !== undefined && data.priority !== null) {
      if (!ALLOWED_PROJECT_PRIORITIES.includes(data.priority)) {
        return { success: false, error: 'Invalid project priority value' };
      }
      validated.priority = data.priority;
    } else {
      validated.priority = 'Medium';
    }

    if (data.progress !== undefined && data.progress !== null) {
      if (typeof data.progress !== 'number' || !Number.isFinite(data.progress) || data.progress < 0 || data.progress > 100) {
        return { success: false, error: 'Progress must be a number between 0 and 100' };
      }
      validated.progress = Math.round(data.progress);
    } else {
      validated.progress = 0;
    }

    if (data.budget !== undefined && data.budget !== null && data.budget !== '') {
      const b = typeof data.budget === 'number' ? data.budget : Number(data.budget);
      if (!Number.isFinite(b) || b < 0 || b > 100000000) {
        return { success: false, error: 'Budget must be a non-negative number up to 100,000,000' };
      }
      validated.budget = Math.round(b * 100) / 100;
    }

    if (data.platform !== undefined && data.platform !== null && data.platform !== '') {
      if (!ALLOWED_PROJECT_PLATFORMS.includes(data.platform)) {
        return { success: false, error: 'Invalid project platform value' };
      }
      validated.platform = data.platform;
    }

    if (data.techStack !== undefined && data.techStack !== null) {
      const list = Array.isArray(data.techStack)
        ? data.techStack
        : typeof data.techStack === 'string'
        ? data.techStack.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
      validated.techStack = list.slice(0, 50).map((s: any) => String(s).trim().slice(0, 50));
    }

    if (data.assignees !== undefined && data.assignees !== null) {
      const list = Array.isArray(data.assignees)
        ? data.assignees
        : typeof data.assignees === 'string'
        ? data.assignees.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
      validated.assignees = list.slice(0, 50).map((s: any) => String(s).trim().slice(0, 100));
    }

    if (data.tags !== undefined && data.tags !== null) {
      const list = Array.isArray(data.tags)
        ? data.tags
        : typeof data.tags === 'string'
        ? data.tags.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
      validated.tags = list.slice(0, 50).map((s: any) => String(s).trim().slice(0, 50));
    }

    if (data.startDate) {
      const d = new Date(data.startDate);
      if (!isNaN(d.getTime())) validated.startDate = d;
    }

    if (data.deadline) {
      const d = new Date(data.deadline);
      if (!isNaN(d.getTime())) validated.deadline = d;
    }

    // Role check for hourlyRate on creation
    if (data.hourlyRate !== undefined && data.hourlyRate !== null) {
      if (authUser.role !== 'admin' && authUser.role !== 'owner') {
        return { success: false, error: 'Unauthorized: Setting hourlyRate requires admin or owner role' };
      }
      if (typeof data.hourlyRate !== 'number' || !Number.isFinite(data.hourlyRate) || data.hourlyRate < 0 || data.hourlyRate > 10000) {
        return { success: false, error: 'Hourly rate must be a valid number between 0 and 10,000' };
      }
      validated.hourlyRate = Math.round(data.hourlyRate * 100) / 100;
    } else {
      validated.hourlyRate = 25;
    }

    // Auto-calculate platform fee strictly on server
    if (validated.platform && validated.budget) {
      if (validated.platform === 'Freelancer') {
        validated.platformFee = Math.max(5, validated.budget * 0.10);
      } else if (validated.platform === 'Upwork') {
        validated.platformFee = validated.budget * 0.10;
      } else if (validated.platform === 'Fiverr') {
        validated.platformFee = validated.budget * 0.20;
      } else {
        validated.platformFee = 0;
      }
    } else {
      validated.platformFee = 0;
    }

    const newProject = new Project(validated);
    await newProject.save();

    await createNotification('system', `Project "${newProject.title}" was created.`, '/projects');

    // Automatically log platform fee as a Finance Transaction if > 0
    if (newProject.platformFee && newProject.platformFee > 0) {
      await createTransaction({
        platform: newProject.platform || 'Direct',
        type: 'Expense',
        amount: newProject.platformFee,
        category: 'Platform Fee',
        description: `Platform Fee for Project: ${newProject.title}`,
        projectId: newProject._id,
        projectModel: 'Project',
        date: new Date().toISOString()
      });
    }

    if (newProject.status === 'Completed') {
      await handleProjectCompletionSync(newProject);
    }

    // Auto-sync to MarketplaceProject if it belongs to a marketplace platform
    if (newProject.platform && ['Freelancer', 'Direct', 'Upwork', 'Fiverr'].includes(newProject.platform)) {
      try {
        const mp = await MarketplaceProject.create({
          title: newProject.title,
          platform: newProject.platform,
          status: ['Completed', 'In Progress', 'In Review'].includes(newProject.status) ? newProject.status : 'Planning',
          budget: `$${newProject.budget || 0}`,
          scope: newProject.description || '',
          tasks: [{ id: 1, title: newProject.title, completed: newProject.status === 'Completed' }],
          milestones: [{
            id: 1,
            description: newProject.status === 'Completed' ? 'Project Delivery & Milestone Release' : 'In-Flight Milestone Deliverable',
            date: (newProject.deadline || new Date()).toISOString().split('T')[0],
            status: newProject.status === 'Completed' ? 'Paid' : 'Pending',
            amount: newProject.budget || 0
          }],
          startDate: newProject.startDate || new Date(),
          deadline: newProject.deadline,
          clientId: newProject.clientId || null,
          clientDetails: {
            clientName: newProject.clientName || 'Direct Client',
          },
          progress: newProject.progress || (newProject.status === 'Completed' ? 100 : 0)
        });
        newProject.marketplaceProjectId = mp._id;
        await newProject.save();
        revalidatePath('/marketplace');
        revalidatePath(`/marketplace/${newProject.platform.toLowerCase()}`);
      } catch (mpErr) {
        console.error('Failed to auto-sync to MarketplaceProject:', mpErr);
      }
    }

    revalidatePath('/projects');
    return { success: true, data: JSON.parse(JSON.stringify(newProject)) };
  } catch (error: any) {
    console.error('Error creating project:', error);
    return { success: false, error: error.message };
  }
}

export async function updateProjectStatus(projectId: string, newStatus: string) {
  try {
    await requireWriteAuth();
    await connectToDatabase();

    if (!projectId || typeof projectId !== 'string' || !mongoose.Types.ObjectId.isValid(projectId)) {
      return { success: false, error: 'Invalid project ID format' };
    }

    if (!newStatus || !ALLOWED_PROJECT_STATUSES.includes(newStatus as any)) {
      return { success: false, error: 'Invalid project status value' };
    }

    const oldProject = await Project.findById(projectId).lean();
    if (!oldProject) {
      return { success: false, error: 'Project not found' };
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { status: newStatus },
      { new: true }
    ).lean();

    if (!updatedProject) {
      return { success: false, error: 'Failed to update project status' };
    }

    if (newStatus === 'Completed') {
      await handleProjectCompletionSync(updatedProject);
    }

    // Sync status with corresponding MarketplaceProject
    if (updatedProject?.marketplaceProjectId) {
      try {
        await MarketplaceProject.findByIdAndUpdate(updatedProject.marketplaceProjectId, {
          status: ['Completed', 'In Progress', 'In Review'].includes(newStatus) ? newStatus : 'Planning',
          progress: newStatus === 'Completed' ? 100 : (updatedProject.progress || 0)
        });
        revalidatePath('/marketplace');
      } catch (mpErr) {
        console.error('Failed to sync status to MarketplaceProject:', mpErr);
      }
    }

    revalidatePath('/projects');
    return { success: true, data: JSON.parse(JSON.stringify(updatedProject)) };
  } catch (error: any) {
    console.error('Error updating project status:', error);
    return { success: false, error: error?.message || 'Failed to update project status' };
  }
}

export async function updateProject(projectId: string, updateData: UpdateProjectInput | any) {
  try {
    const authUser = await requireWriteAuth();
    await connectToDatabase();

    // 1. Validate projectId
    if (!projectId || typeof projectId !== 'string' || !mongoose.Types.ObjectId.isValid(projectId)) {
      return { success: false, error: 'Invalid project ID format' };
    }

    if (!updateData || typeof updateData !== 'object' || Array.isArray(updateData)) {
      return { success: false, error: 'Invalid project update payload' };
    }

    // 2. Enforce strict server-side allowlist & reject unknown/forbidden fields
    const ALLOWED_UPDATE_KEYS = new Set([
      'title',
      'description',
      'clientName',
      'status',
      'priority',
      'progress',
      'budget',
      'platform',
      'techStack',
      'assignees',
      'tags',
      'startDate',
      'deadline',
      'hourlyRate',
    ]);

    for (const key of Object.keys(updateData)) {
      if (!ALLOWED_UPDATE_KEYS.has(key)) {
        return { success: false, error: `Disallowed or unknown field: "${key}"` };
      }
    }

    // 3. Find existing project document
    const oldProject = await Project.findById(projectId).lean();
    if (!oldProject) {
      return { success: false, error: 'Project not found' };
    }

    // 4. Validate provided fields and build clean validated update object
    const validatedUpdate: Record<string, any> = {};

    if (updateData.title !== undefined) {
      if (typeof updateData.title !== 'string' || !updateData.title.trim()) {
        return { success: false, error: 'Project title cannot be empty' };
      }
      const title = updateData.title.trim();
      if (title.length > 200) {
        return { success: false, error: 'Project title cannot exceed 200 characters' };
      }
      validatedUpdate.title = title;
    }

    if (updateData.description !== undefined) {
      if (updateData.description === null || updateData.description === '') {
        validatedUpdate.description = '';
      } else if (typeof updateData.description === 'string') {
        validatedUpdate.description = updateData.description.trim().slice(0, 5000);
      } else {
        return { success: false, error: 'Description must be a string' };
      }
    }

    if (updateData.clientName !== undefined) {
      if (updateData.clientName === null || updateData.clientName === '') {
        validatedUpdate.clientName = '';
      } else if (typeof updateData.clientName === 'string') {
        validatedUpdate.clientName = updateData.clientName.trim().slice(0, 200);
      } else {
        return { success: false, error: 'Client name must be a string' };
      }
    }

    if (updateData.status !== undefined) {
      if (!ALLOWED_PROJECT_STATUSES.includes(updateData.status)) {
        return { success: false, error: 'Invalid project status value' };
      }
      validatedUpdate.status = updateData.status;
    }

    if (updateData.priority !== undefined) {
      if (!ALLOWED_PROJECT_PRIORITIES.includes(updateData.priority)) {
        return { success: false, error: 'Invalid project priority value' };
      }
      validatedUpdate.priority = updateData.priority;
    }

    if (updateData.progress !== undefined) {
      if (typeof updateData.progress !== 'number' || !Number.isFinite(updateData.progress) || updateData.progress < 0 || updateData.progress > 100) {
        return { success: false, error: 'Progress must be a number between 0 and 100' };
      }
      validatedUpdate.progress = Math.round(updateData.progress);
    }

    if (updateData.budget !== undefined) {
      if (updateData.budget === null || updateData.budget === '') {
        validatedUpdate.budget = undefined;
      } else {
        const b = typeof updateData.budget === 'number' ? updateData.budget : Number(updateData.budget);
        if (!Number.isFinite(b) || b < 0 || b > 100000000) {
          return { success: false, error: 'Budget must be a non-negative number up to 100,000,000' };
        }
        validatedUpdate.budget = Math.round(b * 100) / 100;
      }
    }

    if (updateData.platform !== undefined) {
      if (updateData.platform === null || updateData.platform === '') {
        validatedUpdate.platform = undefined;
      } else if (ALLOWED_PROJECT_PLATFORMS.includes(updateData.platform)) {
        validatedUpdate.platform = updateData.platform;
      } else {
        return { success: false, error: 'Invalid project platform value' };
      }
    }

    if (updateData.techStack !== undefined) {
      if (updateData.techStack === null) {
        validatedUpdate.techStack = [];
      } else {
        const list = Array.isArray(updateData.techStack)
          ? updateData.techStack
          : typeof updateData.techStack === 'string'
          ? updateData.techStack.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [];
        validatedUpdate.techStack = list.slice(0, 50).map((s: any) => String(s).trim().slice(0, 50));
      }
    }

    if (updateData.assignees !== undefined) {
      if (updateData.assignees === null) {
        validatedUpdate.assignees = [];
      } else {
        const list = Array.isArray(updateData.assignees)
          ? updateData.assignees
          : typeof updateData.assignees === 'string'
          ? updateData.assignees.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [];
        validatedUpdate.assignees = list.slice(0, 50).map((s: any) => String(s).trim().slice(0, 100));
      }
    }

    if (updateData.tags !== undefined) {
      if (updateData.tags === null) {
        validatedUpdate.tags = [];
      } else {
        const list = Array.isArray(updateData.tags)
          ? updateData.tags
          : typeof updateData.tags === 'string'
          ? updateData.tags.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [];
        validatedUpdate.tags = list.slice(0, 50).map((s: any) => String(s).trim().slice(0, 50));
      }
    }

    if (updateData.startDate !== undefined) {
      if (!updateData.startDate) {
        validatedUpdate.startDate = null;
      } else {
        const d = new Date(updateData.startDate);
        if (!isNaN(d.getTime())) validatedUpdate.startDate = d;
      }
    }

    if (updateData.deadline !== undefined) {
      if (!updateData.deadline) {
        validatedUpdate.deadline = null;
      } else {
        const d = new Date(updateData.deadline);
        if (!isNaN(d.getTime())) validatedUpdate.deadline = d;
      }
    }

    // 5. Protected field check: hourlyRate requires admin or owner role
    if (updateData.hourlyRate !== undefined) {
      if (authUser.role !== 'admin' && authUser.role !== 'owner') {
        return {
          success: false,
          error: 'Unauthorized: Modifying hourlyRate requires admin or owner role',
        };
      }
      if (typeof updateData.hourlyRate !== 'number' || !Number.isFinite(updateData.hourlyRate) || updateData.hourlyRate < 0 || updateData.hourlyRate > 10000) {
        return { success: false, error: 'Hourly rate must be a valid number between 0 and 10,000' };
      }
      validatedUpdate.hourlyRate = Math.round(updateData.hourlyRate * 100) / 100;
    }

    // 6. Recalculate platform fee strictly on server if platform or budget affected
    const effectiveBudget = validatedUpdate.budget !== undefined ? validatedUpdate.budget : (oldProject ? oldProject.budget : 0);
    const effectivePlatform = validatedUpdate.platform !== undefined ? validatedUpdate.platform : (oldProject ? oldProject.platform : null);

    if (effectivePlatform && effectiveBudget) {
      if (effectivePlatform === 'Freelancer') {
        validatedUpdate.platformFee = Math.max(5, effectiveBudget * 0.10);
      } else if (effectivePlatform === 'Upwork') {
        validatedUpdate.platformFee = effectiveBudget * 0.10;
      } else if (effectivePlatform === 'Fiverr') {
        validatedUpdate.platformFee = effectiveBudget * 0.20;
      } else {
        validatedUpdate.platformFee = 0;
      }
    } else {
      validatedUpdate.platformFee = 0;
    }

    // 7. Perform DB update using strictly validated update object
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $set: validatedUpdate },
      { new: true }
    ).lean();

    if (!updatedProject) {
      return { success: false, error: 'Failed to update project' };
    }

    // Log or update platform fee as a Finance Transaction
    if (validatedUpdate.platformFee !== undefined) {
      const newTitle = validatedUpdate.title || (oldProject ? oldProject.title : '');
      const oldTitle = oldProject ? oldProject.title : '';

      const feeDesc = `Platform Fee for Project: ${newTitle}`;
      const oldFeeDesc = `Platform Fee for Project: ${oldTitle}`;

      try {
        if (validatedUpdate.platformFee > 0) {
          // 1. Primary lookup: By exact projectId
          let existingTx = await Transaction.findOne({
            projectId: oldProject._id,
            category: 'Platform Fee',
            type: 'Expense'
          });

          // 2. Conservative fallback for legacy unlinked transactions only (unambiguous match required)
          if (!existingTx) {
            const legacyCandidates = await Transaction.find({
              $or: [
                { description: oldFeeDesc, type: 'Expense', category: 'Platform Fee' },
                { description: feeDesc, type: 'Expense', category: 'Platform Fee' },
                { description: `Auto-calculated Platform Fee for Project: ${oldTitle}`, type: 'Expense', category: 'Platform Fee' },
                { description: `Auto-calculated Platform Fee for Project: ${newTitle}`, type: 'Expense', category: 'Platform Fee' }
              ],
              projectId: null
            }).limit(2);

            if (legacyCandidates.length === 1) {
              existingTx = legacyCandidates[0];
            } else if (legacyCandidates.length > 1) {
              console.warn(`[AUDIT] Multiple unlinked legacy platform-fee records found for project "${oldTitle}". Skipping legacy binding to prevent misattribution.`);
            }
          }

          if (existingTx) {
            existingTx.description = feeDesc;
            existingTx.amount = validatedUpdate.platformFee;
            existingTx.platform = validatedUpdate.platform || (oldProject ? oldProject.platform : 'Direct');
            existingTx.projectId = oldProject._id;
            existingTx.projectModel = 'Project';
            await existingTx.save();
          } else {
            const txRes = await createTransaction({
              platform: validatedUpdate.platform || (oldProject ? oldProject.platform : 'Direct'),
              type: 'Expense',
              amount: validatedUpdate.platformFee,
              category: 'Platform Fee',
              description: feeDesc,
              projectId: oldProject._id,
              projectModel: 'Project',
              date: new Date().toISOString()
            });
            if (txRes && !txRes.success) {
              throw new Error(txRes.error || 'Failed to create platform fee transaction');
            }
          }
        } else if (validatedUpdate.platformFee === 0) {
          // If fee changed to 0, remove existing transaction ONLY for THIS project ID
          await Transaction.deleteMany({
            projectId: oldProject._id,
            category: 'Platform Fee'
          });
          // Remove legacy unlinked transaction ONLY if uniquely attributable
          const legacyToDelete = await Transaction.find({
            $or: [
              { description: oldFeeDesc, type: 'Expense', category: 'Platform Fee' },
              { description: feeDesc, type: 'Expense', category: 'Platform Fee' }
            ],
            projectId: null
          }).limit(2);

          if (legacyToDelete.length === 1) {
            await Transaction.findByIdAndDelete(legacyToDelete[0]._id);
          } else if (legacyToDelete.length > 1) {
            console.warn(`[AUDIT] Multiple legacy unlinked platform-fee records found during zero-fee deletion for project "${oldTitle}". Leaving records untouched for manual reconciliation.`);
          }
        }
      } catch (txErr: any) {
        console.error(`[AUDIT] Failed to synchronize platform fee transaction for project ${projectId}:`, txErr?.message || txErr);
        // Compare-and-set compensating revert on Project document to prevent silent ledger desynchronization
        // and avoid clobbering newer concurrent updates
        let wasReverted = false;
        try {
          const revertRes = await Project.findOneAndUpdate(
            {
              _id: projectId,
              platformFee: validatedUpdate.platformFee
            },
            {
              $set: { platformFee: oldProject.platformFee || 0 }
            },
            { new: true }
          );
          if (revertRes) {
            wasReverted = true;
          } else {
            console.warn(`[AUDIT] Stale compensation detected for project ${projectId}. Current document platformFee does not match ${validatedUpdate.platformFee}; concurrent update preserved.`);
          }
        } catch (compErr) {
          console.error(`[AUDIT] Compensating project revert failed for project ${projectId}:`, compErr);
        }
        return {
          success: false,
          error: wasReverted
            ? 'Financial synchronization failed: Unable to update platform fee transaction. Platform fee was reverted.'
            : 'Financial synchronization failed: Unable to update platform fee transaction. Concurrent modification preserved.'
        };
      }
    }

    if (updatedProject && updatedProject.status === 'Completed') {
      await handleProjectCompletionSync(updatedProject);
    }

    // Sync with corresponding MarketplaceProject
    if (updatedProject?.marketplaceProjectId) {
      try {
        const mpUpdate: any = {};
        if (validatedUpdate.title) mpUpdate.title = validatedUpdate.title;
        if (validatedUpdate.status) mpUpdate.status = ['Completed', 'In Progress', 'In Review'].includes(validatedUpdate.status) ? validatedUpdate.status : 'Planning';
        if (validatedUpdate.budget !== undefined) mpUpdate.budget = `$${validatedUpdate.budget}`;
        if (validatedUpdate.platform) mpUpdate.platform = validatedUpdate.platform;
        if (validatedUpdate.progress !== undefined) mpUpdate.progress = validatedUpdate.progress;
        if (validatedUpdate.clientName) mpUpdate['clientDetails.clientName'] = validatedUpdate.clientName;
        if (Object.keys(mpUpdate).length > 0) {
          await MarketplaceProject.findByIdAndUpdate(updatedProject.marketplaceProjectId, { $set: mpUpdate });
          revalidatePath('/marketplace');
        }
      } catch (mpErr) {
        console.error('Failed to sync update to MarketplaceProject:', mpErr);
      }
    }

    await createNotification('system', `Project "${updatedProject?.title}" was updated.`, '/projects');

    revalidatePath('/projects');
    return { success: true, data: JSON.parse(JSON.stringify(updatedProject)) };
  } catch (error: any) {
    console.error('Error updating project:', error);
    return { success: false, error: error?.message || 'Failed to update project' };
  }
}

export async function deleteProject(projectId: string) {
  try {
    await requireAdminOrOwnerAuth();
    await connectToDatabase();

    if (!projectId || typeof projectId !== 'string' || !mongoose.Types.ObjectId.isValid(projectId)) {
      return { success: false, error: 'Invalid project ID format' };
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    await createNotification('system', `Project "${project.title}" was deleted.`, '/projects');

    // Primary deletion must succeed
    await Project.findByIdAndDelete(projectId);
    revalidatePath('/projects');

    let cascadeWarning: string | undefined;
    if (project.marketplaceProjectId) {
      try {
        await MarketplaceProject.findByIdAndDelete(project.marketplaceProjectId);
        revalidatePath('/marketplace');
      } catch (mpErr: any) {
        console.error(`[AUDIT] Primary project ${projectId} was deleted, but failed to delete associated MarketplaceProject ${project.marketplaceProjectId}:`, mpErr?.message || mpErr);
        cascadeWarning = 'Project was deleted, but cleanup of the associated marketplace project could not be completed.';
      }
    }

    return {
      success: true,
      warning: cascadeWarning,
      data: { id: projectId, cascadeFailed: Boolean(cascadeWarning) }
    };
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return { success: false, error: error?.message || 'Failed to delete project' };
  }
}
