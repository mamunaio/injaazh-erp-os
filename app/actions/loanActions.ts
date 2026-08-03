'use server';

import { getCurrentUser } from './authActions';
import connectToDatabase from '@/lib/mongodb';
import { PersonalLoan } from '@/models/PersonalLoan';

export async function getPersonalLoans() {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    
    await connectToDatabase();
    
    const loans = await PersonalLoan.find({ userId: authRes.data._id })
      .sort({ date: -1, createdAt: -1 })
      .lean();
      
    return { success: true, data: JSON.parse(JSON.stringify(loans)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createPersonalLoan(data: {
  type: 'Borrowed' | 'Lent';
  personName: string;
  amount: number;
  date: string;
  expectedReturnDate?: string;
  status: 'Pending' | 'Settled';
  description?: string;
}) {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    
    await connectToDatabase();
    
    const newLoan = await PersonalLoan.create({
      userId: authRes.data._id,
      ...data,
      date: new Date(data.date),
      expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : undefined,
    });
    
    return { success: true, data: JSON.parse(JSON.stringify(newLoan)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePersonalLoan(id: string, data: {
  type: 'Borrowed' | 'Lent';
  personName: string;
  amount: number;
  date: string;
  expectedReturnDate?: string;
  status: 'Pending' | 'Settled';
  description?: string;
}) {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    
    await connectToDatabase();
    
    const updated = await PersonalLoan.findOneAndUpdate(
      { _id: id, userId: authRes.data._id },
      {
        ...data,
        date: new Date(data.date),
        expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null,
      },
      { new: true }
    ).lean();
    
    if (!updated) return { success: false, error: 'Loan not found or unauthorized' };
    
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePersonalLoan(id: string) {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    
    await connectToDatabase();
    
    const deleted = await PersonalLoan.findOneAndDelete({ _id: id, userId: authRes.data._id });
    if (!deleted) return { success: false, error: 'Loan not found or unauthorized' };
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleLoanStatus(id: string, currentStatus: string) {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    
    await connectToDatabase();
    
    const newStatus = currentStatus === 'Pending' ? 'Settled' : 'Pending';
    
    const updated = await PersonalLoan.findOneAndUpdate(
      { _id: id, userId: authRes.data._id },
      { status: newStatus },
      { new: true }
    ).lean();
    
    if (!updated) return { success: false, error: 'Loan not found or unauthorized' };
    
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
