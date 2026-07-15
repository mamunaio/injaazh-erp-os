'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createInvoice, updateInvoice } from '@/app/actions/invoiceActions';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Plus, Trash2, Download, Save, 
  FileText, Calendar, User, Mail, MapPin, Loader2, Check 
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

const BRANDING = {
  name: 'Injaazh Global',
  tagline: 'Empowering Digital Transformation',
  email: 'hello@injaazh.com',
  website: 'www.injaazh.com',
  address: '123 Tech Valley, San Francisco, CA 94105',
  signature: 'Injaazh Global Team'
};

export default function InvoiceBuilderClient({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const [formData, setFormData] = useState({
    invoiceNumber: initialData?.invoiceNumber || '',
    clientName: initialData?.clientName || '',
    clientEmail: initialData?.clientEmail || '',
    clientAddress: initialData?.clientAddress || '',
    issueDate: initialData?.issueDate ? new Date(initialData.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    taxRate: initialData?.taxRate || 0,
    discountAmount: initialData?.discountAmount || 0,
    status: initialData?.status || 'Draft',
    notes: initialData?.notes || 'Thank you for your business. Please process payment within 14 days.'
  });

  const [items, setItems] = useState<any[]>(
    initialData?.items?.length ? initialData.items : [{ id: 1, description: '', quantity: 1, rate: 0, total: 0 }]
  );

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: '', quantity: 1, rate: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      item.total = Number(item.quantity) * Number(item.rate);
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const financials = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + (item.total || 0), 0);
    const taxAmount = subtotal * (Number(formData.taxRate) / 100);
    const total = subtotal + taxAmount - Number(formData.discountAmount);
    return { subtotal, taxAmount, total };
  }, [items, formData.taxRate, formData.discountAmount]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formData,
      items: items.map(({ id, ...rest }) => rest), // remove temp id
      subtotal: financials.subtotal,
      taxAmount: financials.taxAmount,
      total: financials.total
    };

    try {
      let res;
      if (initialData?._id) {
        res = await updateInvoice(initialData._id, payload);
      } else {
        res = await createInvoice(payload);
      }

      if (res.success) {
        toast.success(res.message);
        router.push('/finance/invoices');
      } else {
        toast.error(res && res.error ? String(res.error) : 'Failed to save invoice');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;
    setIsGeneratingPDF(true);
    
    try {
      // Temporarily scale up for better quality
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // A4 format: 210 x 297 mm
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${formData.invoiceNumber || 'New'}.pdf`);
      toast.success('Invoice downloaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[#8B5CF6]/50 focus:ring-1 focus:ring-[#8B5CF6]/50 transition-all placeholder:text-slate-400";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] pb-24">
      {/* Header Navbar */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-md border-b border-slate-200 dark:border-[#232734]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/finance/invoices" className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{initialData ? 'Edit Invoice' : 'Create Invoice'}</h1>
              <p className="text-xs font-medium text-slate-500">Fill details or download as PDF</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={downloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm disabled:opacity-50"
            >
              {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </button>
            <button 
              onClick={handleSave}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-[#8B5CF6] hover:bg-[#7C3AED] text-white transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Invoice
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 mt-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT: Builder Form */}
          <div className="w-full lg:w-[450px] shrink-0 space-y-6">
            <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px] p-6 shadow-sm space-y-6">
              
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-[#8B5CF6]" /> Invoice Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelClass}>Invoice Number</label>
                    <input type="text" className={inputClass} placeholder="Auto-generated if left empty" value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelClass}>Issue Date</label>
                    <input type="date" className={inputClass} value={formData.issueDate} onChange={e => setFormData({...formData, issueDate: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelClass}>Due Date</label>
                    <input type="date" className={inputClass} value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Status</label>
                    <select className={inputClass} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-slate-200 dark:bg-[#232734]"></div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <User size={16} className="text-[#8B5CF6]" /> Client Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Client Name <span className="text-rose-500">*</span></label>
                    <input required type="text" className={inputClass} placeholder="Client Company or Name" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input type="email" className={inputClass} placeholder="client@example.com" value={formData.clientEmail} onChange={e => setFormData({...formData, clientEmail: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelClass}>Billing Address</label>
                    <textarea className={`${inputClass} resize-none h-20`} placeholder="123 Client St, City, Country" value={formData.clientAddress} onChange={e => setFormData({...formData, clientAddress: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-slate-200 dark:bg-[#232734]"></div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-[#8B5CF6]" /> Financials & Notes
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={labelClass}>Tax Rate (%)</label>
                    <input type="number" step="0.1" className={inputClass} value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className={labelClass}>Discount Amount</label>
                    <input type="number" className={inputClass} value={formData.discountAmount} onChange={e => setFormData({...formData, discountAmount: Number(e.target.value)})} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Footer Notes</label>
                  <textarea className={`${inputClass} resize-none h-20`} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT: Live Preview (A4 size approx) */}
          <div className="flex-1 w-full overflow-x-auto custom-scrollbar pb-8">
            <div className="min-w-[800px] bg-white border border-slate-200 rounded-sm shadow-xl p-12" ref={invoiceRef}>
              
              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                <div>
                  {/* Brand Logo / Name */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{BRANDING.name}</h2>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{BRANDING.tagline}</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 mt-4 font-medium">
                    <p>{BRANDING.address}</p>
                    <p>{BRANDING.email} • {BRANDING.website}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="text-4xl font-black text-slate-900 uppercase tracking-widest mb-2">INVOICE</h1>
                  <p className="text-sm font-bold text-slate-500 mb-1">{formData.invoiceNumber || 'INV-XXXX-XXX'}</p>
                  <p className="text-xs text-slate-600 font-medium"><span className="font-bold text-slate-900">Issue Date:</span> {format(new Date(formData.issueDate), 'MMM dd, yyyy')}</p>
                  <p className="text-xs text-slate-600 font-medium"><span className="font-bold text-slate-900">Due Date:</span> {format(new Date(formData.dueDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>

              {/* Bill To */}
              <div className="mb-10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Billed To:</p>
                <h3 className="text-lg font-bold text-slate-900">{formData.clientName || 'Client Name'}</h3>
                {formData.clientEmail && <p className="text-sm text-slate-600 mt-1">{formData.clientEmail}</p>}
                {formData.clientAddress && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{formData.clientAddress}</p>}
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-900">
                      <th className="py-3 px-2 text-xs font-bold text-slate-900 uppercase tracking-widest w-[50%]">Description</th>
                      <th className="py-3 px-2 text-xs font-bold text-slate-900 uppercase tracking-widest text-center w-[15%]">Qty</th>
                      <th className="py-3 px-2 text-xs font-bold text-slate-900 uppercase tracking-widest text-right w-[15%]">Rate</th>
                      <th className="py-3 px-2 text-xs font-bold text-slate-900 uppercase tracking-widest text-right w-[20%]">Amount</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="group">
                        <td className="py-3 px-2">
                          <input type="text" className="w-full bg-transparent border-b border-transparent focus:border-slate-300 outline-none text-sm font-medium text-slate-800 placeholder:text-slate-300" placeholder="Service description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                        </td>
                        <td className="py-3 px-2 text-center">
                          <input type="number" min="1" className="w-full bg-transparent border-b border-transparent focus:border-slate-300 outline-none text-sm font-medium text-slate-800 text-center" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                        </td>
                        <td className="py-3 px-2 text-right">
                          <input type="number" min="0" className="w-full bg-transparent border-b border-transparent focus:border-slate-300 outline-none text-sm font-medium text-slate-800 text-right" value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} />
                        </td>
                        <td className="py-3 px-2 text-right text-sm font-bold text-slate-900">
                          ${(item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="w-10 text-center">
                          <button onClick={() => removeItem(idx)} className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-600 transition-opacity p-1 rounded-md" title="Remove Item" disabled={items.length === 1}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={addItem} className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider">
                  <Plus size={14} strokeWidth={3} /> Add Line Item
                </button>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-16">
                <div className="w-72 space-y-3">
                  <div className="flex justify-between text-sm text-slate-600 font-medium">
                    <span>Subtotal:</span>
                    <span>${financials.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {formData.taxRate > 0 && (
                    <div className="flex justify-between text-sm text-slate-600 font-medium">
                      <span>Tax ({formData.taxRate}%):</span>
                      <span>${financials.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {formData.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 font-medium">
                      <span>Discount:</span>
                      <span>-${formData.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black text-slate-900 pt-3 border-t-2 border-slate-900">
                    <span>Total Due:</span>
                    <span>${financials.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="grid grid-cols-2 gap-8 items-end text-sm text-slate-600 mt-auto pt-8 border-t border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Notes</h4>
                  <p className="whitespace-pre-wrap font-medium">{formData.notes}</p>
                </div>
                <div className="text-right">
                  <div className="mb-2">
                    <span className="font-serif italic text-2xl text-slate-800 border-b border-slate-300 pb-1 inline-block min-w-[200px]">
                      {BRANDING.signature}
                    </span>
                  </div>
                  <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400 mt-2">Authorized Signature</p>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
