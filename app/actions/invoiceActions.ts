'use server';

import dbConnect from '@/lib/mongodb';
import { Invoice } from '@/models/Invoice';

export async function getInvoices() {
  try {
    await dbConnect();
    const invoices = await Invoice.find({}).sort({ createdAt: -1 }).lean();
    
    // Serialize object IDs
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(invoices))
    };
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return { success: false, error: error.message || 'Failed to fetch invoices' };
  }
}

export async function getInvoice(id: string) {
  try {
    await dbConnect();
    const invoice = await Invoice.findById(id).lean();
    if (!invoice) return { success: false, error: 'Invoice not found' };
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(invoice))
    };
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return { success: false, error: error.message || 'Failed to fetch invoice' };
  }
}

export async function createInvoice(data: any) {
  try {
    await dbConnect();

    // Auto generate invoice number if not provided
    if (!data.invoiceNumber) {
      const count = await Invoice.countDocuments();
      const year = new Date().getFullYear();
      data.invoiceNumber = `INV-${year}-${String(count + 1).padStart(3, '0')}`;
    }

    const newInvoice = await Invoice.create(data);
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(newInvoice)),
      message: 'Invoice created successfully'
    };
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return { success: false, error: error.message || 'Failed to create invoice' };
  }
}

export async function updateInvoice(id: string, data: any) {
  try {
    await dbConnect();
    const updated = await Invoice.findByIdAndUpdate(id, data, { new: true }).lean();
    
    if (!updated) return { success: false, error: 'Invoice not found' };

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(updated)),
      message: 'Invoice updated successfully'
    };
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return { success: false, error: error.message || 'Failed to update invoice' };
  }
}

export async function deleteInvoice(id: string) {
  try {
    await dbConnect();
    const deleted = await Invoice.findByIdAndDelete(id);
    
    if (!deleted) return { success: false, error: 'Invoice not found' };

    return { 
      success: true, 
      message: 'Invoice deleted successfully'
    };
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    return { success: false, error: error.message || 'Failed to delete invoice' };
  }
}
