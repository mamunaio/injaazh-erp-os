'use server';

import dbConnect from '@/lib/mongodb';
import { ProjectRequirement } from '@/models/ProjectRequirement';
import { getAuthUser, requireWriteAuth } from '@/lib/auth';
import { createNotification } from '@/lib/notificationService';
import { sendEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

/**
 * Internal helper to generate a URL-friendly slug from title
 */
function generateRequirementSlug(title: string, docNumber?: string) {
  const clean = (title || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return clean.slice(0, 70) || (docNumber ? docNumber.toLowerCase() : 'requirement');
}

/**
 * Internal helper to sanitize and clean module features & prerequisites
 */
function sanitizeRequirementData(data: any) {
  const cleanModules = Array.isArray(data.modules)
    ? data.modules
        .filter((m: any) => m && m.name && m.name.trim() !== '')
        .map((m: any) => ({
          name: m.name.trim(),
          description: m.description || '',
          features: Array.isArray(m.features)
            ? m.features
                .filter((f: any) => f && f.title && f.title.trim() !== '')
                .map((f: any) => ({
                  title: f.title.trim(),
                  description: f.description || '',
                  priority: ['Must Have', 'Should Have', 'Nice to Have'].includes(f.priority)
                    ? f.priority
                    : 'Must Have',
                  status: ['Included', 'Future Scope', 'Optional Add-on'].includes(f.status)
                    ? f.status
                    : 'Included',
                }))
            : [],
        }))
    : [];

  const cleanPrerequisites = Array.isArray(data.clientPrerequisites)
    ? data.clientPrerequisites
        .filter((p: any) => p && p.title && p.title.trim() !== '')
        .map((p: any) => ({
          title: p.title.trim(),
          provided: !!p.provided,
          notes: p.notes || '',
        }))
    : [];

  const cleanTechStack = Array.isArray(data.techStack)
    ? data.techStack.filter((t: any) => typeof t === 'string' && t.trim() !== '').map((t: string) => t.trim())
    : [];

  const cleanOutOfScope = Array.isArray(data.outOfScope)
    ? data.outOfScope.filter((o: any) => typeof o === 'string' && o.trim() !== '').map((o: string) => o.trim())
    : [];

  return {
    ...data,
    modules: cleanModules,
    clientPrerequisites: cleanPrerequisites,
    techStack: cleanTechStack,
    outOfScope: cleanOutOfScope,
  };
}

/**
 * Get all requirements documents (ERP Internal - Authenticated)
 */
export async function getRequirements() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: 'Unauthorized: Authentication required.', data: [] };
    }

    await dbConnect();
    const docs = await ProjectRequirement.find({}).sort({ createdAt: -1 }).lean();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(docs)),
    };
  } catch (error: any) {
    console.error('Error fetching requirements:', error);
    return { success: false, error: error.message || 'Failed to fetch requirements', data: [] };
  }
}

/**
 * Get single requirement by ID, slug, or docNumber (ERP Internal - Authenticated)
 */
export async function getRequirement(idOrSlugOrNumber: string) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: 'Unauthorized: Authentication required.' };
    }

    await dbConnect();
    const cleanId = decodeURIComponent(idOrSlugOrNumber).trim();

    let query: any;
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      query = {
        $or: [
          { _id: cleanId },
          { slug: cleanId.toLowerCase() },
          { docNumber: cleanId },
          { docNumber: cleanId.toUpperCase() },
        ],
      };
    } else {
      query = {
        $or: [
          { slug: cleanId.toLowerCase() },
          { docNumber: cleanId },
          { docNumber: cleanId.toUpperCase() },
        ],
      };
    }

    const doc = await ProjectRequirement.findOne(query).lean();
    if (!doc) return { success: false, error: 'Requirement document not found' };

    return {
      success: true,
      data: JSON.parse(JSON.stringify(doc)),
    };
  } catch (error: any) {
    console.error('Error fetching requirement:', error);
    return { success: false, error: error.message || 'Failed to fetch requirement' };
  }
}

/**
 * Get public requirement for client viewing (Public - No login required)
 * Accepts slug, docNumber, or MongoDB ObjectId
 */
export async function getPublicRequirement(idOrSlugOrNumber: string) {
  try {
    await dbConnect();

    const cleanId = decodeURIComponent(idOrSlugOrNumber).trim();

    let query: any;
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      query = {
        $or: [
          { _id: cleanId },
          { slug: cleanId.toLowerCase() },
          { docNumber: cleanId },
          { docNumber: cleanId.toUpperCase() },
        ],
      };
    } else {
      query = {
        $or: [
          { slug: cleanId.toLowerCase() },
          { docNumber: cleanId },
          { docNumber: cleanId.toUpperCase() },
        ],
      };
    }

    const doc = await ProjectRequirement.findOne(query).lean();
    if (!doc) {
      return { success: false, error: 'Project requirements not found or link has expired.' };
    }

    // Update view statistics non-blockingly without triggering schema validation
    ProjectRequirement.findByIdAndUpdate(doc._id, {
      $inc: { viewCount: 1 },
      $set: {
        lastViewedAt: new Date(),
        ...(doc.status === 'Sent' ? { status: 'In Review' } : {}),
      },
    }).exec().catch((e) => console.error('Failed to increment viewCount on requirement:', e));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(doc)),
    };
  } catch (error: any) {
    console.error('Error fetching public requirement:', error);
    return { success: false, error: error.message || 'Failed to load project requirements' };
  }
}

/**
 * Create a new requirement document (ERP Internal - Authenticated)
 */
export async function createRequirement(rawData: any) {
  try {
    await requireWriteAuth();
    await dbConnect();

    const data = sanitizeRequirementData(rawData);

    // Auto-generate document number if not provided
    if (!data.docNumber) {
      const count = await ProjectRequirement.countDocuments();
      const year = new Date().getFullYear();
      data.docNumber = `REQ-${year}-${String(count + 1).padStart(3, '0')}`;
    }

    // Auto-generate URL slug from title
    data.slug = generateRequirementSlug(data.title, data.docNumber);

    // Verify slug uniqueness
    const existing = await ProjectRequirement.findOne({ slug: data.slug });
    if (existing) {
      data.slug = `${data.slug}-${Date.now().toString().slice(-4)}`;
    }

    const newDoc = await ProjectRequirement.create(data);

    revalidatePath('/requirements');
    revalidatePath(`/requirements/${newDoc.slug}`);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(newDoc)),
      message: 'Project requirement document created successfully',
    };
  } catch (error: any) {
    console.error('Error creating requirement document:', error);
    return { success: false, error: error.message || 'Failed to create requirement document' };
  }
}

/**
 * Update a requirement document (ERP Internal - Authenticated)
 */
export async function updateRequirement(id: string, rawData: any) {
  try {
    await requireWriteAuth();
    await dbConnect();

    const data = sanitizeRequirementData(rawData);

    if (data.title && !data.slug) {
      data.slug = generateRequirementSlug(data.title, data.docNumber);
    }

    const updated = await ProjectRequirement.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!updated) return { success: false, error: 'Requirement document not found' };

    const identifier = updated.slug || updated.docNumber || id;
    revalidatePath('/requirements');
    revalidatePath(`/requirements/${id}`);
    revalidatePath(`/requirements/${identifier}`);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(updated)),
      message: 'Project requirement document updated successfully',
    };
  } catch (error: any) {
    console.error('Error updating requirement document:', error);
    return { success: false, error: error.message || 'Failed to update requirement document' };
  }
}

/**
 * Delete a requirement document (ERP Internal - Authenticated)
 */
export async function deleteRequirement(id: string) {
  try {
    await requireWriteAuth();
    await dbConnect();

    const deleted = await ProjectRequirement.findByIdAndDelete(id);
    if (!deleted) return { success: false, error: 'Requirement document not found' };

    revalidatePath('/requirements');

    return {
      success: true,
      message: 'Requirement document deleted successfully',
    };
  } catch (error: any) {
    console.error('Error deleting requirement document:', error);
    return { success: false, error: error.message || 'Failed to delete requirement document' };
  }
}

/**
 * Client approves & locks project scope (Public - Called from /requirements/[slug])
 */
export async function clientApproveRequirementAction(
  id: string,
  approvalData: { approvedBy: string; feedbackNotes?: string; ipAddress?: string }
) {
  try {
    await dbConnect();
    const doc = await ProjectRequirement.findById(id);
    if (!doc) return { success: false, error: 'Requirement document not found' };

    if (doc.status === 'Approved') {
      return { success: false, error: 'This project scope has already been approved.' };
    }

    doc.status = 'Approved';
    doc.clientSignoff = {
      approved: true,
      approvedBy: approvalData.approvedBy,
      approvedAt: new Date(),
      feedbackNotes: approvalData.feedbackNotes || '',
      ipAddress: approvalData.ipAddress,
    };

    await doc.save();

    // Trigger internal notification for team
    await createNotification(
      'proposal',
      `🎯 Project Scope Approved: "${doc.title}" confirmed by ${approvalData.approvedBy} (${doc.docNumber})`,
      `/requirements`
    );

    revalidatePath(`/requirements/${id}`);
    if (doc.slug) revalidatePath(`/requirements/${doc.slug}`);
    if (doc.docNumber) revalidatePath(`/requirements/${doc.docNumber}`);
    revalidatePath('/requirements');

    return {
      success: true,
      message: 'Project scope approved successfully! Development schedule has been locked.',
      data: JSON.parse(JSON.stringify(doc)),
    };
  } catch (error: any) {
    console.error('Error approving scope:', error);
    return { success: false, error: error.message || 'Failed to approve project scope' };
  }
}

/**
 * Client requests changes or feedback on scope (Public - Called from /requirements/[slug])
 */
export async function clientRequestChangesAction(
  id: string,
  feedbackData: { requestedBy: string; feedbackNotes: string }
) {
  try {
    await dbConnect();
    const doc = await ProjectRequirement.findById(id);
    if (!doc) return { success: false, error: 'Requirement document not found' };

    doc.status = 'Changes Requested';
    doc.clientSignoff = {
      approved: false,
      approvedBy: feedbackData.requestedBy,
      approvedAt: new Date(),
      feedbackNotes: feedbackData.feedbackNotes,
    };

    await doc.save();

    // Trigger internal notification for team
    await createNotification(
      'proposal',
      `📝 Scope Changes Requested: "${doc.title}" by ${feedbackData.requestedBy}. Notes: "${feedbackData.feedbackNotes.slice(0, 80)}..."`,
      `/requirements`
    );

    revalidatePath(`/requirements/${id}`);
    if (doc.slug) revalidatePath(`/requirements/${doc.slug}`);
    if (doc.docNumber) revalidatePath(`/requirements/${doc.docNumber}`);
    revalidatePath('/requirements');

    return {
      success: true,
      message: 'Feedback submitted successfully! Our engineering team will review and contact you.',
      data: JSON.parse(JSON.stringify(doc)),
    };
  } catch (error: any) {
    console.error('Error submitting scope feedback:', error);
    return { success: false, error: error.message || 'Failed to submit feedback' };
  }
}

/**
 * Send requirement document link directly to client via email
 */
export async function sendRequirementEmailAction(id: string, originUrl?: string) {
  try {
    await requireWriteAuth();
    await dbConnect();

    const doc = await ProjectRequirement.findById(id);
    if (!doc) return { success: false, error: 'Requirement document not found' };
    if (!doc.clientEmail) return { success: false, error: 'Client email is required to send requirements' };

    const baseUrl = originUrl || process.env.NEXTAUTH_URL || 'https://injaazh.com';
    const identifier = doc.slug || doc.docNumber || doc._id;
    const viewUrl = `${baseUrl}/requirements/${identifier}`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #6324FC; margin: 0 0 6px 0; font-size: 22px;">Injaazh Global</h2>
          <p style="color: #64748b; margin: 0; font-size: 13px;">Project Scope & Technical Specification Document</p>
        </div>
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 10px 0; color: #334155; font-size: 15px;">Hello <strong>${doc.clientName}</strong>,</p>
          <p style="margin: 0 0 14px 0; color: #475569; font-size: 14px; line-height: 1.6;">
            We have prepared and published the official <strong>Project Requirements & Scope Specification</strong> for <strong>"${doc.title}"</strong> (${doc.docNumber}).
          </p>
          <p style="margin: 0; color: #475569; font-size: 13px;">
            Please review the functional modules, feature matrix, and client prerequisites to lock the development scope.
          </p>
        </div>
        <div style="text-align: center; margin-bottom: 28px;">
          <a href="${viewUrl}" style="display: inline-block; background: #6324FC; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 10px; font-weight: bold; font-size: 14px;">
            Review Project Scope Online &rarr;
          </a>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin: 0;">
          Document Reference: ${doc.docNumber} • Version: ${doc.version || 'v1.0'}
        </p>
      </div>
    `;

    const emailRes = await sendEmail({
      to: doc.clientEmail,
      subject: `Project Scope & Requirements Specification: ${doc.title} (${doc.docNumber})`,
      html: htmlContent,
      text: `Hello ${doc.clientName},\n\nPlease review your project requirements for "${doc.title}":\n${viewUrl}\n\nInjaazh Global`,
    });

    if (emailRes.success) {
      if (doc.status === 'Draft') {
        doc.status = 'Sent';
        await doc.save();
      }
      revalidatePath('/requirements');
      return { success: true, message: `Requirements emailed successfully to ${doc.clientEmail}` };
    } else {
      return { success: false, error: emailRes.error || 'Failed to dispatch email' };
    }
  } catch (error: any) {
    console.error('Error sending requirement email:', error);
    return { success: false, error: error.message || 'Failed to send requirement email' };
  }
}

