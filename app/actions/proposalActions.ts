'use server';

import dbConnect from '@/lib/mongodb';
import Proposal from '@/models/Proposal';
import { getAuthUser, requireWriteAuth } from '@/lib/auth';
import { sendProposalNotification } from '@/lib/emailService';
import { createNotification } from '@/lib/notificationService';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

/**
 * Get all proposals (ERP Internal - Authenticated)
 */
export async function getProposals() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: 'Unauthorized: Authentication required.', data: [] };
    }

    await dbConnect();
    const proposals = await Proposal.find({}).sort({ createdAt: -1 }).lean();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(proposals)),
    };
  } catch (error: any) {
    console.error('Error fetching proposals:', error);
    return { success: false, error: error.message || 'Failed to fetch proposals', data: [] };
  }
}

/**
 * Get single proposal by ID (ERP Internal - Authenticated)
 */
export async function getProposal(id: string) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: 'Unauthorized: Authentication required.' };
    }

    await dbConnect();
    const proposal = await Proposal.findById(id).lean();
    if (!proposal) return { success: false, error: 'Proposal not found' };

    return {
      success: true,
      data: JSON.parse(JSON.stringify(proposal)),
    };
  } catch (error: any) {
    console.error('Error fetching proposal:', error);
    return { success: false, error: error.message || 'Failed to fetch proposal' };
  }
}

/**
 * Internal helper to generate a URL-friendly slug from proposal title
 */
function generateProposalSlug(title: string, proposalNumber?: string) {
  const clean = (title || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return clean.slice(0, 70) || (proposalNumber ? proposalNumber.toLowerCase() : 'proposal');
}

/**
 * Get public proposal for client viewing (Public - No login required)
 * Accepts slug, proposalNumber, or MongoDB ObjectId
 */
export async function getPublicProposal(idOrSlugOrNumber: string) {
  try {
    await dbConnect();

    const cleanId = decodeURIComponent(idOrSlugOrNumber).trim();

    let query: any;
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      query = {
        $or: [
          { _id: cleanId },
          { slug: cleanId.toLowerCase() },
          { proposalNumber: cleanId },
          { proposalNumber: cleanId.toUpperCase() },
        ],
      };
    } else {
      query = {
        $or: [
          { slug: cleanId.toLowerCase() },
          { proposalNumber: cleanId },
          { proposalNumber: cleanId.toUpperCase() },
        ],
      };
    }

    const proposal = await Proposal.findOne(query).lean();
    if (!proposal) {
      return { success: false, error: 'Proposal not found or link has expired.' };
    }

    // Update view statistics non-blockingly without triggering full document validation
    Proposal.findByIdAndUpdate(proposal._id, {
      $inc: { viewCount: 1 },
      $set: {
        lastViewedAt: new Date(),
        ...(proposal.status === 'Sent' ? { status: 'Viewed' } : {}),
      },
    }).exec().catch((e) => console.error('Failed to increment viewCount:', e));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(proposal)),
    };
  } catch (error: any) {
    console.error('Error fetching public proposal:', error);
    return { success: false, error: error.message || 'Failed to load proposal' };
  }
}

/**
 * Create a new proposal (ERP Internal - Authenticated)
 */
export async function createProposal(data: any) {
  try {
    const user = await requireWriteAuth();
    await dbConnect();

    // Auto generate proposal number if not provided
    if (!data.proposalNumber) {
      const year = new Date().getFullYear();
      const count = await Proposal.countDocuments();
      data.proposalNumber = `PROP-${year}-${String(count + 1).padStart(3, '0')}`;
    }

    // Default valid until 14 days from issue date if not specified
    if (!data.validUntil) {
      const issue = data.issueDate ? new Date(data.issueDate) : new Date();
      data.validUntil = new Date(issue.getTime() + 14 * 24 * 60 * 60 * 1000);
    }

    // Clean empty items & milestones
    if (Array.isArray(data.items)) {
      data.items = data.items.filter((itm: any) => itm.title && itm.title.trim() !== '');
    }
    if (Array.isArray(data.milestones)) {
      data.milestones = data.milestones.filter((m: any) => m.title && m.title.trim() !== '');
    }

    // Generate friendly URL slug
    if (!data.slug && data.title) {
      data.slug = generateProposalSlug(data.title, data.proposalNumber);
    }

    const newProposal = await Proposal.create(data);

    revalidatePath('/proposals');
    revalidatePath('/proposal');

    return {
      success: true,
      data: JSON.parse(JSON.stringify(newProposal)),
      message: 'Proposal created successfully',
    };
  } catch (error: any) {
    console.error('Error creating proposal:', error);
    return { success: false, error: error.message || 'Failed to create proposal' };
  }
}

/**
 * Update an existing proposal (ERP Internal - Authenticated)
 */
export async function updateProposal(id: string, data: any) {
  try {
    await requireWriteAuth();
    await dbConnect();

    // Clean empty items & milestones
    if (Array.isArray(data.items)) {
      data.items = data.items.filter((itm: any) => itm.title && itm.title.trim() !== '');
    }
    if (Array.isArray(data.milestones)) {
      data.milestones = data.milestones.filter((m: any) => m.title && m.title.trim() !== '');
    }

    // Update slug if title changed or not set
    if (data.title && !data.slug) {
      data.slug = generateProposalSlug(data.title, data.proposalNumber);
    }

    const updated = await Proposal.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!updated) return { success: false, error: 'Proposal not found' };

    const identifier = updated.slug || updated.proposalNumber || id;
    revalidatePath('/proposals');
    revalidatePath(`/proposal/${id}`);
    revalidatePath(`/proposal/${identifier}`);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(updated)),
      message: 'Proposal updated successfully',
    };
  } catch (error: any) {
    console.error('Error updating proposal:', error);
    return { success: false, error: error.message || 'Failed to update proposal' };
  }
}

/**
 * Delete a proposal (ERP Internal - Authenticated)
 */
export async function deleteProposal(id: string) {
  try {
    await requireWriteAuth();
    await dbConnect();

    const deleted = await Proposal.findByIdAndDelete(id);
    if (!deleted) return { success: false, error: 'Proposal not found' };

    revalidatePath('/proposals');

    return {
      success: true,
      message: 'Proposal deleted successfully',
    };
  } catch (error: any) {
    console.error('Error deleting proposal:', error);
    return { success: false, error: error.message || 'Failed to delete proposal' };
  }
}

/**
 * Send proposal email to client (ERP Internal - Authenticated)
 */
export async function sendProposalEmailAction(id: string, originUrl?: string) {
  try {
    await requireWriteAuth();
    await dbConnect();

    const proposal = await Proposal.findById(id);
    if (!proposal) return { success: false, error: 'Proposal not found' };
    if (!proposal.clientEmail) return { success: false, error: 'Client email is required to send proposal' };

    const baseUrl = originUrl || process.env.NEXTAUTH_URL || 'https://injaazh.com';
    const identifier = proposal.slug || proposal.proposalNumber || proposal._id;
    const viewUrl = `${baseUrl}/proposal/${identifier}`;

    const formattedAmount = `${proposal.currency || '$'}${Number(proposal.total || 0).toLocaleString()}`;

    const emailResult = await sendProposalNotification({
      to: proposal.clientEmail,
      clientName: proposal.clientName,
      proposalTitle: proposal.title,
      amount: formattedAmount,
      viewUrl,
    });

    if (emailResult.success) {
      if (proposal.status === 'Draft') {
        proposal.status = 'Sent';
        await proposal.save();
      }
      revalidatePath('/proposals');
      return { success: true, message: `Proposal emailed successfully to ${proposal.clientEmail}` };
    } else {
      return { success: false, error: emailResult.error || 'Failed to send proposal email' };
    }
  } catch (error: any) {
    console.error('Error sending proposal email:', error);
    return { success: false, error: error.message || 'Failed to send proposal email' };
  }
}

/**
 * Client accepts proposal (Public - Called from /proposal/[id])
 */
export async function acceptProposalAction(
  id: string,
  signatureData: { signedName: string; signedEmail?: string; ipAddress?: string }
) {
  try {
    await dbConnect();
    const proposal = await Proposal.findById(id);
    if (!proposal) return { success: false, error: 'Proposal not found' };

    if (proposal.status === 'Accepted') {
      return { success: false, error: 'This proposal has already been accepted.' };
    }

    proposal.status = 'Accepted';
    proposal.clientSignature = {
      signedName: signatureData.signedName,
      signedEmail: signatureData.signedEmail || proposal.clientEmail,
      signedAt: new Date(),
      ipAddress: signatureData.ipAddress,
    };

    await proposal.save();

    // Trigger internal notification for team
    await createNotification(
      'proposal',
      `🎉 Proposal Accepted: "${proposal.title}" accepted by ${signatureData.signedName} (${proposal.currency || '$'}${Number(proposal.total || 0).toLocaleString()})`,
      `/proposal/${proposal._id}`
    );

    revalidatePath(`/proposal/${id}`);
    if (proposal.slug) revalidatePath(`/proposal/${proposal.slug}`);
    if (proposal.proposalNumber) revalidatePath(`/proposal/${proposal.proposalNumber}`);
    revalidatePath('/proposals');

    return {
      success: true,
      message: 'Proposal accepted successfully! Thank you for partnering with us.',
      data: JSON.parse(JSON.stringify(proposal)),
    };
  } catch (error: any) {
    console.error('Error accepting proposal:', error);
    return { success: false, error: error.message || 'Failed to accept proposal' };
  }
}

/**
 * Client declines proposal (Public - Called from /proposal/[id])
 */
export async function declineProposalAction(id: string, reason?: string) {
  try {
    await dbConnect();
    const proposal = await Proposal.findById(id);
    if (!proposal) return { success: false, error: 'Proposal not found' };

    proposal.status = 'Declined';
    proposal.declineReason = reason || 'Client declined or requested modifications.';
    await proposal.save();

    // Trigger internal notification for team
    await createNotification(
      'proposal',
      `⚠️ Proposal Declined: "${proposal.title}" by ${proposal.clientName}. Reason: ${reason || 'Not specified'}`,
      `/proposal/${proposal._id}`
    );

    revalidatePath(`/proposal/${id}`);
    if (proposal.slug) revalidatePath(`/proposal/${proposal.slug}`);
    if (proposal.proposalNumber) revalidatePath(`/proposal/${proposal.proposalNumber}`);
    revalidatePath('/proposals');

    return {
      success: true,
      message: 'Thank you for your feedback. Our team will review and get in touch with you.',
      data: JSON.parse(JSON.stringify(proposal)),
    };
  } catch (error: any) {
    console.error('Error declining proposal:', error);
    return { success: false, error: error.message || 'Failed to update proposal' };
  }
}

