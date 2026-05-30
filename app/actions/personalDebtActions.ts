'use server';

import connectToDatabase from '@/lib/mongodb';
import { PersonalDebt } from '@/models/PersonalDebt';
import { revalidatePath } from 'next/cache';

/**
 * Get all personal debts
 */
export async function getPersonalDebts() {
  try {
    await connectToDatabase();
    
    const debts = await PersonalDebt.find().sort({ date: -1, createdAt: -1 }).lean();
    
    return {
      success: true,
      data: JSON.parse(JSON.stringify(debts))
    };
  } catch (error: any) {
    console.error('Error fetching personal debts:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch personal debts'
    };
  }
}

/**
 * Create a new personal debt
 */
export async function createPersonalDebt(data: {
  personName: string;
  amount: number;
  type: 'borrowed' | 'lent';
  date: string | Date;
  status?: 'pending' | 'settled';
  description?: string;
}) {
  try {
    await connectToDatabase();
    
    const newDebt = new PersonalDebt({
      ...data,
      date: new Date(data.date),
      status: data.status || 'pending',
      originalAmount: data.amount, // Set original amount
      paidAmount: 0, // Initially no payment made
      paymentHistory: [], // Empty payment history
    });
    
    await newDebt.save();
    revalidatePath('/daily-expenses');
    
    return {
      success: true,
      data: JSON.parse(JSON.stringify(newDebt))
    };
  } catch (error: any) {
    console.error('Error creating personal debt:', error);
    return {
      success: false,
      error: error.message || 'Failed to create personal debt'
    };
  }
}

/**
 * Update a personal debt
 */
export async function updatePersonalDebt(id: string, data: any) {
  try {
    await connectToDatabase();
    
    if (data.date) {
      data.date = new Date(data.date);
    }
    
    const updatedDebt = await PersonalDebt.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).lean();
    
    if (!updatedDebt) {
      return { success: false, error: 'Personal debt not found' };
    }
    
    revalidatePath('/daily-expenses');
    
    return {
      success: true,
      data: JSON.parse(JSON.stringify(updatedDebt))
    };
  } catch (error: any) {
    console.error('Error updating personal debt:', error);
    return {
      success: false,
      error: error.message || 'Failed to update personal debt'
    };
  }
}

/**
 * Delete a personal debt
 */
export async function deletePersonalDebt(id: string) {
  try {
    await connectToDatabase();
    
    const deletedDebt = await PersonalDebt.findByIdAndDelete(id);
    
    if (!deletedDebt) {
      return { success: false, error: 'Personal debt not found' };
    }
    
    revalidatePath('/daily-expenses');
    
    return {
      success: true,
      message: 'Personal debt deleted successfully'
    };
  } catch (error: any) {
    console.error('Error deleting personal debt:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete personal debt'
    };
  }
}

/**
 * Settle a personal debt
 */
export async function settlePersonalDebt(id: string) {
  try {
    await connectToDatabase();
    
    const updatedDebt = await PersonalDebt.findByIdAndUpdate(
      id,
      { $set: { status: 'settled' } },
      { new: true }
    ).lean();
    
    if (!updatedDebt) {
      return { success: false, error: 'Personal debt not found' };
    }
    
    revalidatePath('/daily-expenses');
    
    return {
      success: true,
      data: JSON.parse(JSON.stringify(updatedDebt))
    };
  } catch (error: any) {
    console.error('Error settling personal debt:', error);
    return {
      success: false,
      error: error.message || 'Failed to settle personal debt'
    };
  }
}

/**
 * Make a partial payment on a debt
 */
export async function makePartialPayment(
  id: string,
  paymentAmount: number,
  paymentNote?: string
) {
  try {
    await connectToDatabase();
    
    const debt = await PersonalDebt.findById(id);
    
    if (!debt) {
      return { success: false, error: 'Personal debt not found' };
    }
    
    if (debt.status === 'settled') {
      return { success: false, error: 'This debt is already settled' };
    }
    
    if (paymentAmount <= 0) {
      return { success: false, error: 'Payment amount must be greater than 0' };
    }
    
    if (paymentAmount > debt.amount) {
      return { 
        success: false, 
        error: `Payment amount (৳${paymentAmount}) cannot exceed remaining amount (৳${debt.amount})` 
      };
    }
    
    // Update debt amounts
    const newPaidAmount = (debt.paidAmount || 0) + paymentAmount;
    const newRemainingAmount = debt.amount - paymentAmount;
    
    // Add to payment history
    const paymentRecord = {
      amount: paymentAmount,
      date: new Date(),
      note: paymentNote || '',
    };
    
    // Determine if debt should be settled
    const newStatus = newRemainingAmount === 0 ? 'settled' : 'pending';
    
    const updatedDebt = await PersonalDebt.findByIdAndUpdate(
      id,
      {
        $set: {
          amount: newRemainingAmount,
          paidAmount: newPaidAmount,
          status: newStatus,
        },
        $push: {
          paymentHistory: paymentRecord,
        },
      },
      { new: true, runValidators: true }
    ).lean();
    
    revalidatePath('/daily-expenses');
    
    return {
      success: true,
      data: JSON.parse(JSON.stringify(updatedDebt)),
      message: newStatus === 'settled' 
        ? 'Payment recorded and debt fully settled!' 
        : `Payment of ৳${paymentAmount} recorded successfully. Remaining: ৳${newRemainingAmount}`,
    };
  } catch (error: any) {
    console.error('Error making partial payment:', error);
    return {
      success: false,
      error: error.message || 'Failed to record payment'
    };
  }
}
