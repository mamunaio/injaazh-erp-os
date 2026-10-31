'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Plus, Trash2, Download, Save, 
  FileText, Calendar, User, Mail, MapPin, Loader2, 
  Check, Sparkles, Building2, Globe, Clock, ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import toast from 'react-hot-toast';
import { createProposal, updateProposal } from '@/app/actions/proposalActions';
import { INJAAZH_LOGO_BASE64, INJAAZH_EMBLEM_BASE64 } from '@/lib/brandLogo';
import CustomSelect, { CustomSelectOption } from '@/components/ui/CustomSelect';

const CURRENCY_OPTIONS: CustomSelectOption[] = [
  { value: '$', label: 'USD ($)' },
  { value: '৳', label: 'BDT (৳)' },
  { value: '€', label: 'EUR (€)' },
  { value: '£', label: 'GBP (£)' },
  { value: 'AED', label: 'AED' },
  { value: 'SAR', label: 'SAR' },
];

const BRANDING = {
  name: 'Injaazh Global',
  tagline: 'Empowering Digital Transformation',
  email: 'hello@injaazh.com',
  website: 'www.injaazh.com',
  address: '123 Tech Valley, San Francisco, CA 94105',
  phone: '+1 (555) 234-5678',
  signature: 'Injaazh Global Leadership Team'
};

export default function ProposalBuilderClient({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    proposalNumber: initialData?.proposalNumber || '',
    title: initialData?.title || 'Comprehensive Web Application & ERP Modernization',
    companyName: initialData?.companyName || BRANDING.name,
    companyTagline: initialData?.companyTagline || BRANDING.tagline,
    companyEmail: initialData?.companyEmail || BRANDING.email,
    companyWebsite: initialData?.companyWebsite || BRANDING.website,
    companyAddress: initialData?.companyAddress || BRANDING.address,
    companyPhone: initialData?.companyPhone || BRANDING.phone,
    companySignature: initialData?.companySignature || BRANDING.signature,
    clientName: initialData?.clientName || '',
    clientCompany: initialData?.clientCompany || '',
    clientEmail: initialData?.clientEmail || '',
    clientAddress: initialData?.clientAddress || '',
    clientPhone: initialData?.clientPhone || '',
    currency: initialData?.currency || '$',
    issueDate: initialData?.issueDate ? new Date(initialData.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    validUntil: initialData?.validUntil ? new Date(initialData.validUntil).toISOString().split('T')[0] : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    executiveSummary: initialData?.executiveSummary || 'We are excited to submit this proposal for your digital transformation initiative. Our solution integrates scalable architecture, tailored enterprise workflows, and high-performance engineering designed to optimize your operations.',
    taxRate: initialData?.taxRate || 0,
    discountAmount: initialData?.discountAmount || 0,
    status: initialData?.status || 'Draft',
    paymentTerms: initialData?.paymentTerms || '50% advance upon project initiation, 25% upon mid-point milestone review, and 25% upon final deployment.',
    termsAndConditions: initialData?.termsAndConditions || 'This proposal remains valid for 14 days from issuance. Scope additions will be assessed and billed separately under mutually agreed change orders.'
  });

  // Items State
  const [items, setItems] = useState<any[]>(
    initialData?.items?.length ? initialData.items : [
      { id: 1, title: 'UI/UX System & Architecture Design', description: 'Design system, interactive prototypes, user flow maps, and responsive wireframes.', category: 'Design', quantity: 1, rate: 1200, total: 1200 },
      { id: 2, title: 'Core Full-Stack ERP Development', description: 'Next.js frontend, MongoDB database modeling, role-based authorization, and real-time syncing.', category: 'Engineering', quantity: 1, rate: 3500, total: 3500 },
      { id: 3, title: 'API Integration & Cloud Deployment', description: 'Third-party webhook connections, automated backups, and production cloud setup.', category: 'DevOps', quantity: 1, rate: 800, total: 800 }
    ]
  );

  // Milestones State
  const [milestones, setMilestones] = useState<any[]>(
    initialData?.milestones?.length ? initialData.milestones : [
      { id: 1, title: 'Discovery & Prototype Approval', duration: 'Week 1 - 2', description: 'Requirements alignment, UX wireframing, and architecture confirmation.' },
      { id: 2, title: 'Full Stack Build & QA Testing', duration: 'Week 3 - 5', description: 'End-to-end module development, role testing, and performance validation.' },
      { id: 3, title: 'Production Handover & Training', duration: 'Week 6', description: 'Deployment to live domain, staff training session, and handover documentation.' }
    ]
  );

  // Calculations
  const financials = useMemo(() => {
    const subtotal = items.reduce((acc, itm) => acc + (Number(itm.total) || 0), 0);
    const discount = Number(formData.discountAmount) || 0;
    const taxable = Math.max(0, subtotal - discount);
    const taxAmount = (taxable * (Number(formData.taxRate) || 0)) / 100;
    const total = taxable + taxAmount;
    return { subtotal, taxAmount, total };
  }, [items, formData.taxRate, formData.discountAmount]);

  // Handle Items
  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'rate') {
      const q = Number(updated[index].quantity) || 0;
      const r = Number(updated[index].rate) || 0;
      updated[index].total = q * r;
    }
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now(), title: '', description: '', category: '', quantity: 1, rate: 0, total: 0 }
    ]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  // Handle Milestones
  const handleMilestoneChange = (index: number, field: string, value: any) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const addMilestone = () => {
    setMilestones([
      ...milestones,
      { id: Date.now(), title: '', duration: '', description: '' }
    ]);
  };

  const removeMilestone = (idx: number) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  // Submit Proposal
  const handleSubmit = async (overrideStatus?: string) => {
    if (!formData.title.trim()) {
      toast.error('Proposal Title is required');
      return;
    }
    if (!formData.clientName.trim()) {
      toast.error('Client Name is required');
      return;
    }
    // Filter out completely empty items & milestones
    const validItems = items
      .filter((itm) => itm.title && itm.title.trim() !== '')
      .map((itm) => ({
        title: itm.title.trim(),
        description: itm.description || '',
        category: itm.category || '',
        quantity: Number(itm.quantity) || 1,
        rate: Number(itm.rate) || 0,
        total: Number(itm.total) || 0,
      }));

    if (validItems.length === 0) {
      toast.error('Please add at least one line item / deliverable with a title');
      return;
    }

    const validMilestones = milestones
      .filter((m) => m.title && m.title.trim() !== '')
      .map((m) => ({
        title: m.title.trim(),
        duration: m.duration || '',
        description: m.description || '',
      }));

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        items: validItems,
        milestones: validMilestones,
        subtotal: financials.subtotal,
        taxAmount: financials.taxAmount,
        total: financials.total,
        status: overrideStatus || formData.status,
      };

      if (initialData?._id) {
        const res = await updateProposal(initialData._id, payload);
        if (res.success) {
          toast.success('Proposal updated successfully');
          router.push('/proposals');
        } else {
          toast.error(res.error || 'Failed to update proposal');
        }
      } else {
        const res = await createProposal(payload);
        if (res.success) {
          toast.success('Proposal created successfully');
          router.push('/proposals');
        } else {
          toast.error(res.error || 'Failed to create proposal');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PDF Export
  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    setIsGeneratingPDF(true);

    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`Proposal_${formData.proposalNumber || 'New'}.pdf`);
      toast.success('Proposal PDF downloaded successfully');
    } catch (err: any) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#6324FC] transition-all placeholder:text-secondary";
  const labelClass = "block text-[11px] font-heading font-bold text-secondary uppercase tracking-wider mb-1.5";
  const currencySymbol = formData.currency || '$';

  return (
    <div className="space-y-6">
      
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3">
          <Link 
            href="/proposals"
            className="w-10 h-10 rounded-xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 flex items-center justify-center text-secondary hover:text-slate-900 dark:hover:text-white transition-all shadow-xs"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-heading font-black text-slate-900 dark:text-white tracking-tight">
              {initialData ? 'Edit Proposal' : 'Create Proposal'}
            </h1>
            <p className="text-xs text-secondary">
              Customize deliverables, pricing schedule, and project agreement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            {isGeneratingPDF ? <Loader2 size={14} className="animate-spin text-[#6324FC]" /> : <Download size={14} />}
            <span>PDF</span>
          </button>

          <button
            onClick={() => handleSubmit('Draft')}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>Save Draft</span>
          </button>

          <button
            onClick={() => handleSubmit('Sent')}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#8042FF] text-white text-xs font-bold hover:shadow-[0_4px_16px_rgba(99,36,252,0.3)] transition-all flex items-center gap-1.5 active:scale-95"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            <span>{initialData ? 'Update & Publish' : 'Create Proposal'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Configuration Controls (5 Cols) */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* 1. General Project Details */}
          <div className="bg-white dark:bg-[#0a0a0d] p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText size={16} className="text-[#6324FC]" /> Proposal Overview
            </h3>

            <div>
              <label className={labelClass}>Proposal Title *</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. Modern Full-Stack ERP Solution"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Proposal Number</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Auto-generated (PROP-XXXX-XXX)"
                  value={formData.proposalNumber}
                  onChange={(e) => setFormData({ ...formData, proposalNumber: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Currency</label>
                <CustomSelect
                  value={formData.currency}
                  onChange={(val) => setFormData({ ...formData, currency: val })}
                  options={CURRENCY_OPTIONS}
                  size="md"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Issue Date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Valid Until</label>
                <input
                  type="date"
                  className={inputClass}
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Executive Summary & Solution Pitch</label>
              <textarea
                rows={4}
                className={`${inputClass} resize-none`}
                placeholder="Briefly describe the client's problem and how Injaazh provides the solution..."
                value={formData.executiveSummary}
                onChange={(e) => setFormData({ ...formData, executiveSummary: e.target.value })}
              />
            </div>
          </div>

          {/* 2. Client Information */}
          <div className="bg-white dark:bg-[#0a0a0d] p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User size={16} className="text-[#00E5FF]" /> Client Information
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Client Contact Name *</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Alex Morgan"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Company Name</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Acme Corporation"
                  value={formData.clientCompany}
                  onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Client Email Address</label>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="alex@acme.com"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Client Phone</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="+1 (555) 000-1111"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Client Address / Location</label>
              <input
                type="text"
                className={inputClass}
                placeholder="New York, NY"
                value={formData.clientAddress}
                onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
              />
            </div>
          </div>

          {/* 3. Deliverables & Pricing Items */}
          <div className="bg-white dark:bg-[#0a0a0d] p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles size={16} className="text-[#6324FC]" /> Scope & Deliverables
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-3 relative group">
                  <div className="flex items-start justify-between gap-3">
                    <input
                      type="text"
                      className="w-full bg-transparent font-bold text-xs text-slate-900 dark:text-white focus:outline-none"
                      placeholder="Deliverable Title (e.g. Frontend Development)"
                      value={item.title}
                      onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <textarea
                    rows={2}
                    className="w-full bg-transparent text-xs text-slate-500 dark:text-slate-400 focus:outline-none resize-none border-t border-slate-200 dark:border-white/5 pt-2"
                    placeholder="Describe deliverable scope, requirements, or SLA..."
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                  />

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-white/5">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Category</span>
                      <input
                        type="text"
                        placeholder="e.g. Dev"
                        className={inputClass}
                        value={item.category || ''}
                        onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Qty / Units</span>
                      <input
                        type="number"
                        min="1"
                        className={inputClass}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Unit Rate ({currencySymbol})</span>
                      <input
                        type="number"
                        min="0"
                        className={inputClass}
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Adjustments */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
              <div>
                <label className={labelClass}>Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className={inputClass}
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className={labelClass}>Discount Amount ({currencySymbol})</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* 4. Timeline Milestones */}
          <div className="bg-white dark:bg-[#0a0a0d] p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock size={16} className="text-emerald-500" /> Timeline & Milestones
              </h3>
              <button
                type="button"
                onClick={addMilestone}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Add Milestone
              </button>
            </div>

            <div className="space-y-3">
              {milestones.map((milestone, mIdx) => (
                <div key={mIdx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      className="font-bold text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none flex-1"
                      placeholder={`Phase ${mIdx + 1} Title (e.g. Design Wireframes)`}
                      value={milestone.title}
                      onChange={(e) => handleMilestoneChange(mIdx, 'title', e.target.value)}
                    />
                    <input
                      type="text"
                      className="text-[11px] bg-slate-200/50 dark:bg-white/10 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 focus:outline-none w-24 text-right"
                      placeholder="e.g. 2 Weeks"
                      value={milestone.duration}
                      onChange={(e) => handleMilestoneChange(mIdx, 'duration', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeMilestone(mIdx)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <input
                    type="text"
                    className="w-full text-xs bg-transparent text-slate-500 dark:text-slate-400 focus:outline-none"
                    placeholder="Short description of deliverables for this phase..."
                    value={milestone.description}
                    onChange={(e) => handleMilestoneChange(mIdx, 'description', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 5. Terms & Payment */}
          <div className="bg-white dark:bg-[#0a0a0d] p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-amber-500" /> Payment Terms & SLA
            </h3>

            <div>
              <label className={labelClass}>Payment Terms</label>
              <textarea
                rows={2}
                className={`${inputClass} resize-none`}
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>Terms & Conditions</label>
              <textarea
                rows={2}
                className={`${inputClass} resize-none`}
                value={formData.termsAndConditions}
                onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
              />
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Live Client Preview (7 Cols) */}
        <div className="xl:col-span-7 sticky top-24">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Client Preview
            </span>
            <span className="text-[11px] text-slate-400">Updates dynamically as you type</span>
          </div>

          <div className="overflow-x-auto pb-4">
            <div 
              ref={previewRef}
              className="min-w-[620px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden p-8 sm:p-10 text-slate-900"
            >
              {/* Brand Top Bar */}
              <div className="h-2 bg-gradient-to-r from-[#6324FC] via-[#00E5FF] to-[#6324FC] -mx-10 -mt-10 mb-8" />

              {/* Header */}
              <div className="flex justify-between items-start pb-6 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <img 
                      src={INJAAZH_EMBLEM_BASE64} 
                      alt="Injaazh Emblem" 
                      className="w-9 h-9 rounded-lg object-contain shadow-xs shrink-0"
                    />
                    <div>
                      <img 
                        src={INJAAZH_LOGO_BASE64} 
                        alt={formData.companyName || 'Injaazh Global'} 
                        className="h-6 w-auto object-contain"
                      />
                      <p className="text-[9px] font-bold text-[#6324FC] uppercase tracking-wider mt-0.5">
                        {formData.companyTagline}
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                    <p>{formData.companyAddress}</p>
                    <p>{formData.companyEmail} • {formData.companyWebsite}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-0.5 bg-[#6324FC]/10 text-[#6324FC] text-[10px] font-bold rounded-full uppercase tracking-wider">
                    PROPOSAL
                  </span>
                  <div className="font-mono font-bold text-sm text-slate-800 mt-1">
                    {formData.proposalNumber || 'PROP-2026-XXX'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 space-y-0.5">
                    <p><span className="font-semibold">Issued:</span> {format(new Date(formData.issueDate), 'MMM dd, yyyy')}</p>
                    <p><span className="font-semibold">Valid Until:</span> {format(new Date(formData.validUntil), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
              </div>

              {/* Title & Client Target */}
              <div className="py-6 border-b border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Proposal Subject
                </div>
                <h3 className="text-xl font-heading font-black text-[#0F172A] mb-4">
                  {formData.title || 'Untitled Proposal'}
                </h3>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Prepared Exclusively For
                  </div>
                  <div className="font-bold text-sm text-[#0F172A]">
                    {formData.clientName || 'Client Name'}
                  </div>
                  {formData.clientCompany && (
                    <div className="text-xs text-slate-600 font-semibold">{formData.clientCompany}</div>
                  )}
                  {formData.clientEmail && (
                    <div className="text-xs text-slate-500">{formData.clientEmail}</div>
                  )}
                </div>
              </div>

              {/* Executive Summary */}
              {formData.executiveSummary && (
                <div className="py-5 border-b border-slate-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6324FC] mb-1.5">
                    Executive Summary
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {formData.executiveSummary}
                  </p>
                </div>
              )}

              {/* Line Items Table */}
              <div className="py-6 border-b border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#6324FC] mb-3">
                  Scope of Work & Deliverables
                </div>

                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-2 w-[55%]">Deliverable</th>
                      <th className="pb-2 text-center w-[15%]">Qty</th>
                      <th className="pb-2 text-right w-[15%]">Rate</th>
                      <th className="pb-2 text-right w-[15%]">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((itm, i) => (
                      <tr key={i}>
                        <td className="py-2.5 pr-2">
                          <span className="font-bold text-[#0F172A] block">{itm.title || 'Deliverable'}</span>
                          {itm.description && (
                            <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">{itm.description}</span>
                          )}
                        </td>
                        <td className="py-2.5 text-center text-slate-600">{itm.quantity}</td>
                        <td className="py-2.5 text-right font-mono text-slate-600">
                          {currencySymbol}{Number(itm.rate || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-[#0F172A]">
                          {currencySymbol}{Number(itm.total || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Subtotals & Grand Total */}
                <div className="flex justify-end mt-4">
                  <div className="w-56 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-mono font-bold text-slate-900">
                        {currencySymbol}{financials.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {formData.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount</span>
                        <span className="font-mono font-bold">
                          -{currencySymbol}{Number(formData.discountAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {formData.taxRate > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Tax ({formData.taxRate}%)</span>
                        <span className="font-mono font-bold text-slate-900">
                          {currencySymbol}{financials.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-300 flex justify-between font-black text-sm text-[#0F172A]">
                      <span>Total Investment</span>
                      <span className="font-mono text-[#6324FC]">
                        {currencySymbol}{financials.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Milestones Preview */}
              {milestones.length > 0 && (
                <div className="py-5 border-b border-slate-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6324FC] mb-2.5">
                    Project Milestones
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    {milestones.map((m, mIdx) => (
                      <div key={mIdx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>P{mIdx + 1}</span>
                          <span className="text-[#6324FC]">{m.duration}</span>
                        </div>
                        <div className="font-semibold text-slate-900 mt-1 truncate">{m.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Prepared & Authorized By
                  </div>
                  <div className="py-2 border-b border-slate-300">
                    <span className="font-serif italic text-lg text-slate-900 block">
                      {formData.companySignature || 'Injaazh Global'}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500">
                    <p className="font-semibold text-slate-700">{formData.companyName || 'Injaazh Global'}</p>
                    <p className="text-[9px]">Date: {format(new Date(formData.issueDate), 'MMM dd, yyyy')}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Client Acceptance
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                        Awaiting Signature
                      </span>
                    </div>
                    <div className="py-2 border-b border-dashed border-slate-300">
                      <span className="text-[10px] text-slate-400 italic block">
                        Authorized Client Signature & Date
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500">
                    <p className="font-semibold text-slate-700">{formData.clientName || 'Client Representative'}</p>
                    {formData.clientCompany && <p className="text-[9px]">{formData.clientCompany}</p>}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

