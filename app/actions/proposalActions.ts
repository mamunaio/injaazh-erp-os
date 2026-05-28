'use server';

import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/mongodb';
import { Proposal } from '@/models/Proposal';

export async function getProposals() {
  try {
    await connectToDatabase();
    const proposals = await Proposal.find({})
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    
    return { success: true, data: JSON.parse(JSON.stringify(proposals)) };
  } catch (error: any) {
    console.error('Error fetching proposals:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function getProposalStats() {
  try {
    await connectToDatabase();
    
    const allProposals = await Proposal.find({}).lean().exec();
    
    // Calculate stats
    const activeCount = allProposals.filter(
      (p) => p.status !== 'Rejected' && p.status !== 'Accepted'
    ).length;
    
    // Won this month (Accepted proposals in current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const wonThisMonth = allProposals
      .filter(
        (p) =>
          p.status === 'Accepted' &&
          p.updatedAt &&
          new Date(p.updatedAt) >= startOfMonth
      )
      .reduce((sum, p) => sum + (p.value || 0), 0);
    
    const draftsCount = allProposals.filter((p) => p.status === 'Draft').length;
    
    // New stats
    const acceptedCount = allProposals.filter((p) => p.status === 'Accepted').length;
    const rejectedCount = allProposals.filter((p) => p.status === 'Rejected').length;
    
    // Total value of all accepted proposals
    const totalValue = allProposals
      .filter((p) => p.status === 'Accepted')
      .reduce((sum, p) => sum + (p.value || 0), 0);
    
    // Conversion rate (Accepted / (Accepted + Rejected))
    const totalDecided = acceptedCount + rejectedCount;
    const conversionRate = totalDecided > 0 ? (acceptedCount / totalDecided) * 100 : 0;
    
    return {
      success: true,
      data: {
        activeCount,
        wonThisMonth,
        draftsCount,
        acceptedCount,
        rejectedCount,
        totalValue,
        conversionRate,
      },
    };
  } catch (error: any) {
    console.error('Error fetching proposal stats:', error);
    return {
      success: false,
      error: error.message,
      data: { 
        activeCount: 0, 
        wonThisMonth: 0, 
        draftsCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        totalValue: 0,
        conversionRate: 0,
      },
    };
  }
}

export async function getProposalById(id: string) {
  try {
    await connectToDatabase();
    
    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return { success: false, error: 'Invalid proposal ID', data: null };
    }
    
    const proposal = await Proposal.findById(id).lean().exec();
    
    if (!proposal) {
      return { success: false, error: 'Proposal not found', data: null };
    }
    
    return { success: true, data: JSON.parse(JSON.stringify(proposal)) };
  } catch (error: any) {
    console.error('Error fetching proposal:', error);
    return { success: false, error: error.message, data: null };
  }
}

export async function createProposal(data?: {
  title?: string;
  clientName?: string;
  value?: number;
  status?: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected';
  content?: string;
}) {
  try {
    await connectToDatabase();
    
    // Create blank proposal with defaults
    const proposalData: any = {
      title: data?.title || 'Untitled Proposal',
      clientName: data?.clientName || 'Client Name',
      value: data?.value || 0,
      status: data?.status || 'Draft',
      content: data?.content || '',
      introduction: '',
      phases: [],
      investment: [],
    };
    
    // Set dateSent if status is Sent
    if (proposalData.status === 'Sent') {
      proposalData.dateSent = new Date();
    }
    
    const newProposal = await Proposal.create(proposalData);
    
    revalidatePath('/proposals');
    
    return { success: true, data: JSON.parse(JSON.stringify(newProposal)) };
  } catch (error: any) {
    console.error('Error creating proposal:', error);
    return { success: false, error: error.message };
  }
}

export async function updateProposal(
  id: string,
  data: {
    title?: string;
    clientName?: string;
    value?: number;
    status?: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected';
    content?: string;
    introduction?: string;
    phases?: any[];
    investment?: any[];
  }
) {
  try {
    await connectToDatabase();
    
    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return { success: false, error: 'Invalid proposal ID' };
    }
    
    const updateData: any = { ...data };
    
    // Set dateSent if status is being changed to Sent
    if (data.status === 'Sent') {
      const existingProposal = await Proposal.findById(id).lean().exec();
      if (existingProposal && existingProposal.status !== 'Sent') {
        updateData.dateSent = new Date();
      }
    }
    
    // Calculate total value from investment items if provided
    if (data.investment && data.investment.length > 0) {
      updateData.value = data.investment.reduce((sum: number, item: any) => sum + (item.cost || 0), 0);
    }
    
    const updatedProposal = await Proposal.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
      .lean()
      .exec();
    
    if (!updatedProposal) {
      return { success: false, error: 'Proposal not found' };
    }
    
    revalidatePath('/proposals');
    revalidatePath(`/proposals/${id}`);
    revalidatePath(`/p/${id}`);
    
    return { success: true, data: JSON.parse(JSON.stringify(updatedProposal)) };
  } catch (error: any) {
    console.error('Error updating proposal:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteProposal(id: string) {
  try {
    await connectToDatabase();
    
    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return { success: false, error: 'Invalid proposal ID' };
    }
    
    const deletedProposal = await Proposal.findByIdAndDelete(id).lean().exec();
    
    if (!deletedProposal) {
      return { success: false, error: 'Proposal not found' };
    }
    
    revalidatePath('/proposals');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting proposal:', error);
    return { success: false, error: error.message };
  }
}

// Seed function for initial data
export async function seedProposals() {
  try {
    await connectToDatabase();
    
    const existingCount = await Proposal.countDocuments();
    
    if (existingCount > 0) {
      return { success: true, message: 'Proposals already exist' };
    }
    
    const seedData = [
      {
        title: 'Next.js & Laravel Architecture for E-commerce',
        clientName: 'Acme Corp',
        value: 4500,
        status: 'Sent',
        content: '<h2>Project Overview</h2><p>Complete e-commerce solution with Next.js frontend and Laravel backend.</p>',
        introduction: 'We are excited to present this comprehensive e-commerce solution tailored for your business needs.',
        phases: [
          {
            id: '1',
            title: 'Discovery & Planning',
            description: 'Initial consultation and project roadmap',
            deliverables: ['Requirements document', 'Technical architecture', 'Timeline'],
          },
        ],
        investment: [
          { id: '1', description: 'Frontend Development', cost: 2500 },
          { id: '2', description: 'Backend Development', cost: 2000 },
        ],
        dateSent: new Date('2026-05-25'),
      },
      {
        title: 'Technical SEO & GEO Strategy Audit',
        clientName: 'Globex Inc',
        value: 1200,
        status: 'Viewed',
        content: '<h2>SEO Strategy</h2><p>Comprehensive technical SEO audit and optimization plan.</p>',
        introduction: 'Our technical SEO audit will identify and resolve critical issues affecting your search rankings.',
        phases: [],
        investment: [{ id: '1', description: 'SEO Audit & Strategy', cost: 1200 }],
        dateSent: new Date('2026-05-26'),
      },
      {
        title: 'AEO Optimization & Brand Authority',
        clientName: 'Initech',
        value: 2800,
        status: 'Accepted',
        content: '<h2>AEO Services</h2><p>Answer Engine Optimization to boost brand visibility.</p>',
        introduction: 'Enhance your brand authority with our Answer Engine Optimization services.',
        phases: [],
        investment: [{ id: '1', description: 'AEO Implementation', cost: 2800 }],
        dateSent: new Date('2026-05-20'),
        dateAccepted: new Date('2026-05-22'),
      },
      {
        title: 'Immersive UI/UX Redesign',
        clientName: 'Soylent Corp',
        value: 3000,
        status: 'Draft',
        content: '<h2>Design Proposal</h2><p>Modern, immersive user experience design for your platform.</p>',
        introduction: '',
        phases: [],
        investment: [],
      },
      {
        title: 'Custom ERP System Development',
        clientName: 'Wayne Enterprises',
        value: 15000,
        status: 'Sent',
        content: '<h2>ERP Solution</h2><p>Tailored enterprise resource planning system.</p>',
        introduction: 'A comprehensive ERP solution designed specifically for your enterprise needs.',
        phases: [],
        investment: [
          { id: '1', description: 'System Architecture', cost: 5000 },
          { id: '2', description: 'Development', cost: 8000 },
          { id: '3', description: 'Training & Support', cost: 2000 },
        ],
        dateSent: new Date('2026-05-27'),
      },
    ];
    
    await Proposal.insertMany(seedData);
    
    // Note: revalidatePath removed as this function should not be called during render
    // If you need to seed data, use a separate API route or script
    
    return { success: true, message: 'Seed data inserted successfully' };
  } catch (error: any) {
    console.error('Error seeding proposals:', error);
    return { success: false, error: error.message };
  }
}

export async function acceptProposal(id: string) {
  try {
    await connectToDatabase();
    
    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return { success: false, error: 'Invalid proposal ID' };
    }
    
    const proposal = await Proposal.findById(id).lean().exec();
    
    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }
    
    if (proposal.status === 'Draft') {
      return { success: false, error: 'Cannot accept a draft proposal' };
    }
    
    const updatedProposal = await Proposal.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'Accepted',
          dateAccepted: new Date(),
        },
      },
      { new: true }
    )
      .lean()
      .exec();
    
    revalidatePath('/proposals');
    revalidatePath(`/proposals/${id}`);
    revalidatePath(`/p/${id}`);
    
    return { success: true, data: JSON.parse(JSON.stringify(updatedProposal)) };
  } catch (error: any) {
    console.error('Error accepting proposal:', error);
    return { success: false, error: error.message };
  }
}
