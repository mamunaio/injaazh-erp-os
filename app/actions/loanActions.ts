'use server';

import { getCurrentUser } from './authActions';
import connectToDatabase from '@/lib/mongodb';
import { PersonalLoan } from '@/models/PersonalLoan';
import { requireWriteAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { createNotification } from './notificationActions';

export async function getPersonalLoans() {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    
    await connectToDatabase();
    
    const isViewer = authRes.data.role === 'viewer';
    const filter = isViewer ? {} : { userId: authRes.data._id };

    const loans = await PersonalLoan.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    // Normalize backward compatibility for existing records
    const normalized = loans.map((l: any) => {
      const payments = Array.isArray(l.payments) ? l.payments : [];
      const sumPayments = payments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
      let paidAmount = typeof l.paidAmount === 'number' ? l.paidAmount : sumPayments;
      
      // If legacy status was 'Settled' but paidAmount was 0 and no payments logged, assume full amount was paid
      if (l.status === 'Settled' && paidAmount === 0 && l.amount > 0) {
        paidAmount = l.amount;
      }

      let status = l.status || 'Pending';
      if (paidAmount >= l.amount && l.amount > 0) {
        status = 'Settled';
      } else if (paidAmount > 0) {
        status = 'Partial';
      } else {
        status = 'Pending';
      }

      return {
        ...l,
        paidAmount,
        payments,
        status,
        remainingAmount: Math.max(0, l.amount - paidAmount),
      };
    });
      
    return { success: true, data: JSON.parse(JSON.stringify(normalized)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createPersonalLoan(data: {
  type: 'Borrowed' | 'Lent';
  personName: string;
  phone?: string;
  amount: number;
  paidAmount?: number;
  date: string;
  expectedReturnDate?: string;
  status?: 'Pending' | 'Partial' | 'Settled';
  description?: string;
}) {
  try {
    await requireWriteAuth();
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    
    await connectToDatabase();

    const initialPaid = data.paidAmount ? Math.max(0, data.paidAmount) : 0;
    let computedStatus: 'Pending' | 'Partial' | 'Settled' = 'Pending';
    if (initialPaid >= data.amount && data.amount > 0) {
      computedStatus = 'Settled';
    } else if (initialPaid > 0) {
      computedStatus = 'Partial';
    } else if (data.status) {
      computedStatus = data.status;
    }
    
    const newLoan = await PersonalLoan.create({
      userId: authRes.data._id,
      ...data,
      paidAmount: initialPaid,
      status: computedStatus,
      payments: initialPaid > 0 ? [{
        amount: initialPaid,
        date: new Date(data.date),
        paymentMethod: 'Cash',
        note: 'Initial partial payment recorded upon creation',
      }] : [],
      date: new Date(data.date),
      expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : undefined,
    });

    await createNotification(
      'system',
      `New ${data.type === 'Lent' ? 'Receivable (Lent)' : 'Payable (Borrowed)'} record of ৳${data.amount.toLocaleString()} with ${data.personName} created.`,
      '/daily-expenses'
    );
    
    revalidatePath('/daily-expenses');
    return { success: true, data: JSON.parse(JSON.stringify(newLoan)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePersonalLoan(id: string, data: {
  type: 'Borrowed' | 'Lent';
  personName: string;
  phone?: string;
  amount: number;
  paidAmount?: number;
  date: string;
  expectedReturnDate?: string;
  status?: 'Pending' | 'Partial' | 'Settled';
  description?: string;
}) {
  try {
    await requireWriteAuth();
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    
    await connectToDatabase();

    const existing = await PersonalLoan.findOne({ _id: id, userId: authRes.data._id });
    if (!existing) return { success: false, error: 'Loan not found or unauthorized' };

    const currentPaid = typeof data.paidAmount === 'number' ? data.paidAmount : (existing.paidAmount || 0);
    let computedStatus: 'Pending' | 'Partial' | 'Settled' = 'Pending';
    if (currentPaid >= data.amount && data.amount > 0) {
      computedStatus = 'Settled';
    } else if (currentPaid > 0) {
      computedStatus = 'Partial';
    } else if (data.status) {
      computedStatus = data.status;
    }
    
    const updated = await PersonalLoan.findOneAndUpdate(
      { _id: id, userId: authRes.data._id },
      {
        ...data,
        paidAmount: currentPaid,
        status: computedStatus,
        date: new Date(data.date),
        expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null,
      },
      { new: true }
    ).lean();
    
    revalidatePath('/daily-expenses');
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function recordLoanRepayment(
  loanId: string, 
  paymentData: { 
    amount: number; 
    date?: string; 
    paymentMethod?: string; 
    note?: string; 
  }
) {
  try {
    await requireWriteAuth();
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    
    await connectToDatabase();

    const loan = await PersonalLoan.findOne({ _id: loanId, userId: authRes.data._id });
    if (!loan) return { success: false, error: 'Record not found' };

    const paymentAmount = Math.max(0, Number(paymentData.amount) || 0);
    if (paymentAmount <= 0) return { success: false, error: 'Invalid repayment amount' };

    const newPayment = {
      amount: paymentAmount,
      date: paymentData.date ? new Date(paymentData.date) : new Date(),
      paymentMethod: paymentData.paymentMethod || 'Cash',
      note: paymentData.note || '',
    };

    loan.payments = loan.payments || [];
    loan.payments.push(newPayment as any);

    const totalPaid = loan.payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    loan.paidAmount = totalPaid;

    if (totalPaid >= loan.amount) {
      loan.status = 'Settled';
    } else if (totalPaid > 0) {
      loan.status = 'Partial';
    } else {
      loan.status = 'Pending';
    }

    await loan.save();

    await createNotification(
      'system',
      `Partial installment payment of ৳${paymentAmount.toLocaleString()} recorded for ${loan.personName}. Remaining: ৳${Math.max(0, loan.amount - totalPaid).toLocaleString()}.`,
      '/daily-expenses'
    );

    revalidatePath('/daily-expenses');
    return { success: true, data: JSON.parse(JSON.stringify(loan)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteLoanRepayment(loanId: string, paymentId: string) {
  try {
    await requireWriteAuth();
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    
    await connectToDatabase();

    const loan = await PersonalLoan.findOne({ _id: loanId, userId: authRes.data._id });
    if (!loan) return { success: false, error: 'Record not found' };

    loan.payments = (loan.payments || []).filter((p: any) => p._id.toString() !== paymentId);
    const totalPaid = loan.payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    loan.paidAmount = totalPaid;

    if (totalPaid >= loan.amount) {
      loan.status = 'Settled';
    } else if (totalPaid > 0) {
      loan.status = 'Partial';
    } else {
      loan.status = 'Pending';
    }

    await loan.save();
    revalidatePath('/daily-expenses');
    return { success: true, data: JSON.parse(JSON.stringify(loan)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePersonalLoan(id: string) {
  try {
    await requireWriteAuth();
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    
    await connectToDatabase();
    
    const deleted = await PersonalLoan.findOneAndDelete({ _id: id, userId: authRes.data._id });
    if (!deleted) return { success: false, error: 'Loan not found or unauthorized' };
    
    revalidatePath('/daily-expenses');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleLoanStatus(id: string, currentStatus: string) {
  try {
    await requireWriteAuth();
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    
    await connectToDatabase();

    const loan = await PersonalLoan.findOne({ _id: id, userId: authRes.data._id });
    if (!loan) return { success: false, error: 'Record not found' };
    
    const willBeSettled = currentStatus !== 'Settled';
    
    if (willBeSettled) {
      // Mark as fully settled
      loan.status = 'Settled';
      const remaining = Math.max(0, loan.amount - (loan.paidAmount || 0));
      if (remaining > 0) {
        loan.payments = loan.payments || [];
        loan.payments.push({
          amount: remaining,
          date: new Date(),
          paymentMethod: 'Cash',
          note: 'Full settlement payment',
        } as any);
        loan.paidAmount = loan.amount;
      }
    } else {
      // Revert to pending
      loan.status = 'Pending';
      loan.paidAmount = 0;
      loan.payments = [];
    }

    await loan.save();
    revalidatePath('/daily-expenses');
    return { success: true, data: JSON.parse(JSON.stringify(loan)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

