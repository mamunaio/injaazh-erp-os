import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  companyName: string;
  companyTagline: string;
  companyEmail: string;
  companyWebsite: string;
  companyAddress: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  issueDate: Date;
  dueDate: Date;
  items: IInvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema: Schema = new Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  rate: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true, default: 0 }
});

const InvoiceSchema: Schema = new Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  companyName: { type: String, default: 'Injaazh Global' },
  companyTagline: { type: String, default: 'Empowering Digital Transformation' },
  companyEmail: { type: String, default: 'hello@injaazh.com' },
  companyWebsite: { type: String, default: 'www.injaazh.com' },
  companyAddress: { type: String, default: '123 Tech Valley, San Francisco, CA 94105' },
  clientName: { type: String, required: true },
  clientEmail: { type: String, default: '' },
  clientAddress: { type: String, default: '' },
  issueDate: { type: Date, required: true, default: Date.now },
  dueDate: { type: Date, required: true },
  items: [InvoiceItemSchema],
  subtotal: { type: Number, required: true, default: 0 },
  taxRate: { type: Number, required: true, default: 0 },
  taxAmount: { type: Number, required: true, default: 0 },
  discountAmount: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true, default: 0 },
  status: { 
    type: String, 
    required: true, 
    enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Draft'
  },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

export const Invoice = mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
