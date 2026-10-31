'use client';

import React, { useState, useRef } from 'react';
import { 
  FileCode2, CheckCircle2, XCircle, Clock, Calendar, 
  Building2, User, Mail, Globe, MapPin, Phone, 
  ArrowRight, ShieldCheck, Printer, Copy, Check, 
  Sparkles, AlertCircle, Loader2, Send, Download, 
  Layers, ShieldAlert, Cpu, MessageSquare, CheckSquare, 
  Square, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { clientApproveRequirementAction, clientRequestChangesAction } from '@/app/actions/requirementActions';
import { INJAAZH_LOGO_BASE64, INJAAZH_EMBLEM_BASE64 } from '@/lib/brandLogo';

export default function RequirementClientView({ requirement: initialRequirement }: { requirement: any }) {
  const [requirement, setRequirement] = useState(initialRequirement);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal States
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [signerName, setSignerName] = useState(requirement.clientName || '');
  const [signerNotes, setSignerNotes] = useState('');
  const [feedbackAuthor, setFeedbackAuthor] = useState(requirement.clientName || '');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={13} className="text-emerald-500" /> Scope Approved &amp; Signed
          </span>
        );
      case 'Changes Requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <AlertCircle size={13} className="text-rose-500" /> Changes Requested
          </span>
        );
      case 'Sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/30">
            <Clock size={13} /> Active Specification
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <Clock size={13} /> In Review
          </span>
        );
    }
  };

  // Canonical shareable link copy
  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const identifier = requirement.slug || requirement.docNumber || requirement._id;
      const canonicalUrl = `${window.location.origin}/requirements/${identifier}`;
      navigator.clipboard.writeText(canonicalUrl);
      setCopiedLink(true);
      toast.success('Requirements specification link copied to clipboard');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // PDF Export (Strictly 2 Pages A4 matching Proposal architecture)
  const handleDownloadPDF = async () => {
    if (!page1Ref.current || !page2Ref.current) return;
    setIsGeneratingPDF(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 80));

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Render Page 1 (Architecture, Tech Stack & Core Modules)
      const canvas1 = await html2canvas(page1Ref.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData1 = canvas1.toDataURL('image/png');
      const h1 = (canvas1.height * pdfWidth) / canvas1.width;
      pdf.addImage(imgData1, 'PNG', 0, 0, pdfWidth, Math.min(h1, pdfHeight), undefined, 'FAST');

      // Render Page 2 (Extended Modules, Prerequisites, Scope Boundaries & Sign-off)
      const canvas2 = await html2canvas(page2Ref.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      pdf.addPage();
      const imgData2 = canvas2.toDataURL('image/png');
      const h2 = (canvas2.height * pdfWidth) / canvas2.width;
      pdf.addImage(imgData2, 'PNG', 0, 0, pdfWidth, Math.min(h2, pdfHeight), undefined, 'FAST');

      pdf.save(`Requirement_${requirement.docNumber || 'PRD'}.pdf`);
      toast.success('Requirements Specification PDF downloaded (2 Pages)');
    } catch (err: any) {
      console.error('PDF error:', err);
      toast.error('Failed to generate PDF. You can also use the Print button.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Client Confirm Approval Action
  const handleConfirmApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) {
      toast.error('Please enter your full name as signature');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await clientApproveRequirementAction(requirement._id, {
        approvedBy: signerName.trim(),
        feedbackNotes: signerNotes.trim(),
      });

      if (res.success && res.data) {
        setRequirement(res.data);
        setShowApproveModal(false);
        toast.success(res.message || 'Requirements Scope Approved Successfully!');

        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6324FC', '#00E5FF', '#10B981', '#F59E0B']
        });
      } else {
        toast.error(res.error || 'Failed to approve scope');
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Client Request Changes / Feedback Action
  const handleConfirmFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackNotes.trim()) {
      toast.error('Please describe the changes or queries you have');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await clientRequestChangesAction(requirement._id, {
        requestedBy: feedbackAuthor.trim() || requirement.clientName || 'Client',
        feedbackNotes: feedbackNotes.trim(),
      });

      if (res.success && res.data) {
        setRequirement(res.data);
        setShowFeedbackModal(false);
        toast.success('Your feedback has been sent to our engineering team.');
      } else {
        toast.error(res.error || 'Failed to submit feedback');
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isApproved = requirement.status === 'Approved';
  const isChangesRequested = requirement.status === 'Changes Requested';

  const modules = Array.isArray(requirement.modules) ? requirement.modules : [];
  const prerequisites = Array.isArray(requirement.clientPrerequisites) ? requirement.clientPrerequisites : [];
  const outOfScopeItems = Array.isArray(requirement.outOfScope) ? requirement.outOfScope : [];
  const techStack = Array.isArray(requirement.techStack) ? requirement.techStack : [];

  // Partition modules sequentially across Page 1 and Page 2 so NO MODULE IS EVER HIDDEN
  const splitIndex = Math.max(1, Math.min(2, Math.ceil(modules.length / 2)));
  const page1Modules = modules.slice(0, splitIndex);
  const page2Modules = modules.slice(splitIndex);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#07080B] text-slate-900 dark:text-slate-100 selection:bg-[#6324FC]/20 print:bg-white print:text-slate-900">
      
      {/* Strict Print Specific CSS Rules isolating the A4 specification pages */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm 8mm;
          }

          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html, body {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }

          /* Hide Web Navigation, Glows, Modals and Floating UI */
          nav,
          header,
          footer,
          aside,
          .print\\:hidden,
          [data-html2canvas-ignore="true"],
          .fixed,
          .sticky {
            display: none !important;
            visibility: hidden !important;
          }

          main {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Enforce exact 2 pages print format */
          .requirement-page-1 {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
          }

          .requirement-page-2 {
            page-break-before: always !important;
            break-before: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
          }

          table, tfoot, tr, td, th {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}} />

      {/* Sticky Action Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-[#0A0B10]/90 backdrop-blur-xl border-b border-black/5 dark:border-white/5 transition-all print:hidden">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          
          {/* Brand & Document ID */}
          <div className="flex items-center gap-3">
            <img 
              src={INJAAZH_EMBLEM_BASE64} 
              alt="Injaazh Emblem" 
              className="w-10 h-10 rounded-xl object-contain shadow-xs border border-black/5 dark:border-white/10"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                  {requirement.companyName || 'Injaazh Global'}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs font-mono font-medium text-slate-500">
                  {requirement.docNumber}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300">
                  {requirement.version || 'v1.0'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {getStatusBadge(requirement.status)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Share / Copy Link */}
            <button
              onClick={handleCopyLink}
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1.5"
              title="Copy shareable link"
            >
              {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
            </button>

            {/* Print Document */}
            <button
              onClick={() => window.print()}
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1.5"
              title="Print Specification (2-Page A4)"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Download PDF (2-Page A4) */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="p-2 sm:px-3.5 sm:py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isGeneratingPDF ? <Loader2 size={14} className="animate-spin text-[#6324FC]" /> : <Download size={14} />}
              <span className="hidden sm:inline">{isGeneratingPDF ? 'Generating...' : 'Download PDF'}</span>
            </button>

            {/* Change Request / Feedback Button */}
            {!isApproved && (
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <MessageSquare size={14} />
                <span className="hidden sm:inline">Feedback</span>
              </button>
            )}

            {/* Approve Scope Button */}
            {!isApproved && (
              <button
                onClick={() => setShowApproveModal(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#6324FC] to-[#8042FF] hover:from-[#5719ef] hover:to-[#712fee] rounded-xl shadow-[0_4px_16px_rgba(99,36,252,0.3)] hover:shadow-[0_6px_20px_rgba(99,36,252,0.4)] transition-all flex items-center gap-1.5 active:scale-[0.98]"
              >
                <CheckCircle2 size={14} />
                <span>Approve Scope</span>
              </button>
            )}

            {isApproved && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold">
                <ShieldCheck size={14} />
                <span>Scope Certified</span>
              </div>
            )}

          </div>

        </div>
      </nav>

      {/* Main Requirements Container */}
      <main className="max-w-[1020px] mx-auto px-4 sm:px-6 py-10 sm:py-14 print:p-0 print:m-0 print:max-w-none">
        
        {/* ================= PAGE 1: Architecture, Tech Stack & Core Modules ================= */}
        <div 
          ref={page1Ref}
          id="requirement-page-1"
          className="requirement-page-1 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden text-slate-900 mb-8 print:mb-0 print:border-none print:shadow-none print:rounded-none"
          style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
        >
          {/* Top Brand Accent */}
          <div className="h-2 bg-gradient-to-r from-[#6324FC] via-[#00E5FF] to-[#6324FC]" />

          <div className="p-6 sm:p-8 lg:p-10 print:p-5 print:py-3.5 flex flex-col justify-between">
            <div>
              {/* Header: Company & Requirement Doc Info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3.5 print:pb-2.5 border-b border-slate-100">
                
                {/* Left: Brand Details */}
                <div className="max-w-md">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <img 
                      src={INJAAZH_EMBLEM_BASE64} 
                      alt="Injaazh Emblem" 
                      className="w-9 h-9 rounded-xl object-contain shadow-xs shrink-0"
                    />
                    <div>
                      <img 
                        src={INJAAZH_LOGO_BASE64} 
                        alt={requirement.companyName || 'Injaazh Global'} 
                        className="h-5.5 w-auto object-contain"
                      />
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#6324FC] mt-0.5">
                        {requirement.companyTagline || 'Empowering Digital Transformation'}
                      </p>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 space-y-0.5 font-medium mt-1.5">
                    <p className="flex items-center gap-1.5"><MapPin size={10} className="text-slate-400 shrink-0" /> 123 Tech Valley, San Francisco, CA 94105</p>
                    <p className="flex items-center gap-1.5"><Mail size={10} className="text-slate-400 shrink-0" /> {requirement.companyEmail || 'hello@injaazh.com'}</p>
                    <p className="flex items-center gap-1.5"><Globe size={10} className="text-slate-400 shrink-0" /> {requirement.companyWebsite || 'www.injaazh.com'}</p>
                  </div>
                </div>

                {/* Right: Document Meta */}
                <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-slate-100 sm:border-0">
                  <div className="inline-block px-2.5 py-0.5 bg-[#6324FC]/10 border border-[#6324FC]/20 rounded-full text-[9px] font-bold text-[#6324FC] uppercase tracking-widest mb-1">
                    PROJECT SPECIFICATION // PRD
                  </div>
                  <h2 className="text-lg font-mono font-bold text-slate-900">
                    {requirement.docNumber}
                  </h2>
                  
                  <div className="mt-1.5 space-y-0.5 text-[11px]">
                    <p className="text-slate-500">
                      <span className="font-semibold text-slate-700">Version: </span>
                      <span className="font-mono font-bold text-[#6324FC]">{requirement.version || 'v1.0'}</span>
                    </p>
                    <p className="text-slate-500">
                      <span className="font-semibold text-slate-700">Date Issued: </span>
                      {format(new Date(requirement.createdAt || new Date()), 'MMMM dd, yyyy')}
                    </p>
                    <p className="text-slate-500">
                      <span className="font-semibold text-slate-700">Estimated Delivery: </span>
                      <span className="font-semibold text-slate-800">{requirement.timelineEstimate || 'Sprint Roadmap'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Target Client & Project Scope Title */}
              <div className="py-3.5 print:py-2.5 border-b border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div className="md:col-span-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Project Scope &amp; Target Domain</span>
                    <h3 className="text-lg sm:text-xl font-heading font-black text-slate-900 mt-0.5 leading-snug">
                      {requirement.title}
                    </h3>
                    {requirement.targetAudience && (
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">Target Audience:</span> {requirement.targetAudience}
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 p-3 print:p-2 rounded-xl">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Prepared Exclusively For</span>
                    <div className="mt-1 space-y-0.5">
                      <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <User size={12} className="text-[#6324FC] shrink-0" /> {requirement.clientName}
                      </h4>
                      {requirement.clientCompany && (
                        <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                          <Building2 size={11} className="text-slate-400 shrink-0" /> {requirement.clientCompany}
                        </p>
                      )}
                      {requirement.clientEmail && (
                        <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          <Mail size={11} className="text-slate-400 shrink-0" /> {requirement.clientEmail}
                        </p>
                      )}
                      {requirement.clientPhone && (
                        <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          <Phone size={11} className="text-slate-400 shrink-0" /> {requirement.clientPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Executive Summary Section */}
              {requirement.executiveSummary && (
                <div className="py-3 print:py-2 border-b border-slate-100">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6324FC] mb-1 flex items-center gap-1.5">
                    <Sparkles size={11} /> Executive Summary &amp; Architectural Vision
                  </h4>
                  <div className="text-[11px] leading-relaxed text-slate-600 whitespace-pre-line font-normal">
                    {requirement.executiveSummary}
                  </div>
                </div>
              )}

              {/* Technology Stack Badges */}
              {techStack.length > 0 && (
                <div className="py-2.5 print:py-1.5 border-b border-slate-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Cpu size={12} className="text-[#6324FC]" />
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6324FC]">
                      Technology Stack &amp; Infrastructure Framework
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {techStack.map((tech: string, tIdx: number) => (
                      <span 
                        key={tIdx} 
                        className="px-2 py-0.5 rounded-md text-[9.5px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200/70"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Core Functional Modules (Page 1 Partition) */}
              <div className="py-3.5 print:py-2">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6324FC] flex items-center gap-1.5">
                      <Layers size={11} /> Functional Scope &amp; Deliverable Matrix (Part 1)
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Core architectural modules, user workflows, and prioritization</p>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">
                    Showing Modules 1 - {page1Modules.length} of {modules.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {page1Modules.map((module: any, mIdx: number) => (
                    <div key={mIdx} className="rounded-xl border border-slate-200/80 overflow-hidden bg-slate-50/40">
                      
                      {/* Module Header Bar */}
                      <div className="bg-slate-100/70 px-3 py-1.5 border-b border-slate-200/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#6324FC] text-white flex items-center justify-center text-[10px] font-mono font-bold">
                            {mIdx + 1}
                          </span>
                          <span className="font-bold text-xs text-slate-900">{module.name}</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 font-semibold">
                          {module.features?.length || 0} Features
                        </span>
                      </div>

                      {module.description && (
                        <p className="px-3 pt-1.5 text-[10px] text-slate-500 leading-relaxed italic">
                          {module.description}
                        </p>
                      )}

                      {/* Feature Items Table */}
                      <div className="p-2 sm:p-2.5">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/60">
                              <th className="pb-1 px-1.5 w-[55%]">Feature Description</th>
                              <th className="pb-1 px-1.5 text-center w-[22%]">Priority</th>
                              <th className="pb-1 px-1.5 text-right w-[23%]">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {module.features?.map((feat: any, fIdx: number) => (
                              <tr key={fIdx} className="hover:bg-slate-50/70">
                                <td className="py-1.5 px-1.5 align-top">
                                  <span className="font-semibold text-slate-800 text-[11px] block">{feat.title}</span>
                                  {feat.description && (
                                    <span className="text-[9.5px] text-slate-500 leading-tight block mt-0.5">{feat.description}</span>
                                  )}
                                </td>
                                <td className="py-1.5 px-1.5 text-center align-top">
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold ${
                                    feat.priority === 'Must Have' 
                                      ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                                      : feat.priority === 'Should Have'
                                      ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                                  }`}>
                                    {feat.priority || 'Must Have'}
                                  </span>
                                </td>
                                <td className="py-1.5 px-1.5 text-right align-top">
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-semibold ${
                                    feat.status === 'Included'
                                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}>
                                    {feat.status || 'Included'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Page 1 Footer */}
            <div className="pt-3 print:pt-2 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100 mt-2">
              <span className="font-medium">Injaazh Global • Confidential Engineering Specification</span>
              <span className="font-mono font-semibold">Page 1 of 2</span>
            </div>

          </div>
        </div>

        {/* Visual page separator on Web (hidden on Print and PDF) */}
        <div data-html2canvas-ignore="true" className="print:hidden flex items-center justify-center gap-3 my-6 text-xs font-semibold text-slate-400">
          <div className="h-px bg-slate-200 dark:bg-white/10 flex-1 max-w-[120px]" />
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] font-bold text-slate-400">
            Page 2 of 2 • Extended Scope, Prerequisites &amp; Sign-off
          </span>
          <div className="h-px bg-slate-200 dark:bg-white/10 flex-1 max-w-[120px]" />
        </div>

        {/* ================= PAGE 2: Extended Modules, Prerequisites & Sign-off ================= */}
        <div 
          ref={page2Ref}
          id="requirement-page-2"
          className="requirement-page-2 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden text-slate-900 print:border-none print:shadow-none print:rounded-none"
          style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
        >
          {/* Top Brand Accent */}
          <div className="h-2 bg-gradient-to-r from-[#6324FC] via-[#00E5FF] to-[#6324FC]" />

          <div className="p-6 sm:p-8 lg:p-10 print:p-5 print:py-3.5 flex flex-col justify-between">
            <div>
              
              {/* Page 2 Header */}
              <div className="flex items-center justify-between pb-3 print:pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <img 
                    src={INJAAZH_EMBLEM_BASE64} 
                    alt="Injaazh Emblem" 
                    className="w-7 h-7 rounded-lg object-contain shadow-xs shrink-0"
                  />
                  <img 
                    src={INJAAZH_LOGO_BASE64} 
                    alt={requirement.companyName || 'Injaazh Global'} 
                    className="h-5 w-auto object-contain"
                  />
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-mono font-bold text-slate-700">{requirement.docNumber}</span>
                </div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#6324FC] bg-[#6324FC]/10 px-2 py-0.5 rounded-full">
                  Page 2 of 2 • Scope Boundaries &amp; Sign-off
                </div>
              </div>

              {/* Extended Functional Modules (Part 2, if any) */}
              {page2Modules.length > 0 && (
                <div className="py-3 print:py-2 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6324FC] flex items-center gap-1.5">
                      <Layers size={11} /> Functional Scope Deliverables (Part 2)
                    </h4>
                    <span className="text-[9px] font-mono text-slate-400">
                      Modules {splitIndex + 1} to {modules.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {page2Modules.map((module: any, mIdx: number) => (
                      <div key={mIdx} className="rounded-xl border border-slate-200/80 overflow-hidden bg-slate-50/40">
                        <div className="bg-slate-100/70 px-3 py-1.5 border-b border-slate-200/80 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-[#6324FC] text-white flex items-center justify-center text-[10px] font-mono font-bold">
                              {splitIndex + mIdx + 1}
                            </span>
                            <span className="font-bold text-xs text-slate-900">{module.name}</span>
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 font-semibold">
                            {module.features?.length || 0} Features
                          </span>
                        </div>

                        {module.description && (
                          <p className="px-3 pt-1 text-[10px] text-slate-500 leading-relaxed italic">
                            {module.description}
                          </p>
                        )}

                        <div className="p-2 sm:p-2.5">
                          <table className="w-full text-left border-collapse text-xs">
                            <tbody className="divide-y divide-slate-100">
                              {module.features?.map((feat: any, fIdx: number) => (
                                <tr key={fIdx} className="hover:bg-slate-50/70">
                                  <td className="py-1 px-1.5 align-top w-[60%]">
                                    <span className="font-semibold text-slate-800 text-[11px] block">{feat.title}</span>
                                    {feat.description && (
                                      <span className="text-[9.5px] text-slate-500 leading-tight block mt-0.5">{feat.description}</span>
                                    )}
                                  </td>
                                  <td className="py-1 px-1.5 text-center align-top w-[20%]">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold ${
                                      feat.priority === 'Must Have' 
                                        ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                                        : feat.priority === 'Should Have'
                                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                                    }`}>
                                      {feat.priority || 'Must Have'}
                                    </span>
                                  </td>
                                  <td className="py-1 px-1.5 text-right align-top w-[20%]">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-semibold ${
                                      feat.status === 'Included'
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}>
                                      {feat.status || 'Included'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Client Prerequisites & Assets Matrix */}
              <div className="py-3 print:py-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <CheckSquare size={12} className="text-[#6324FC]" />
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6324FC]">
                    Client Prerequisites &amp; Technical Dependencies
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 mb-2">Required credentials, third-party accounts, and data to begin sprint implementation</p>

                {prerequisites.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">No external prerequisites required from client for this milestone.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {prerequisites.map((prereq: any, pIdx: number) => (
                      <div key={pIdx} className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 flex items-start gap-2">
                        <span className={`mt-0.5 shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] ${
                          prereq.provided ? 'bg-emerald-500 text-white' : 'border border-slate-300 text-transparent'
                        }`}>
                          ✓
                        </span>
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-slate-800 leading-snug">{prereq.title}</p>
                          {prereq.notes && (
                            <p className="text-[9.5px] text-slate-500">{prereq.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scope Boundaries & Out of Scope Declarations */}
              <div className="py-3 print:py-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldAlert size={12} className="text-rose-600" />
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                    Project Boundaries &amp; Out of Scope Declarations
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 mb-2">Explicitly excluded items to prevent architectural ambiguity or scope creep</p>

                {outOfScopeItems.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">No specific exclusions noted.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {outOfScopeItems.map((item: string, oIdx: number) => (
                      <div key={oIdx} className="p-2 rounded-lg bg-rose-50/50 border border-rose-100 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span className="text-xs text-rose-900 font-medium leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Authorizing Signatures & Sign-off Section */}
              <div className="pt-3 print:pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                  
                  {/* Left Column: Injaazh Engineering Representative */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Prepared &amp; Certified By
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#6324FC]/10 text-[#6324FC] border border-[#6324FC]/20">
                          Engineering Leadership
                        </span>
                      </div>

                      <div className="py-2.5 my-1 border-b border-slate-200">
                        <span className="font-serif italic text-xl text-slate-900 tracking-wide block select-none">
                          Injaazh Global Architecture Team
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5 text-xs pt-1.5">
                      <p className="font-bold text-slate-800">{requirement.companyName || 'Injaazh Global'}</p>
                      <p className="text-slate-500 text-[10px]">Date: {format(new Date(requirement.createdAt || new Date()), 'MMMM dd, yyyy')}</p>
                    </div>
                  </div>

                  {/* Right Column: Client Scope Sign-off */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Client Scope Sign-off &amp; Approval
                        </span>
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <ShieldCheck size={11} /> Certified Approved Scope
                          </span>
                        ) : isChangesRequested ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            <AlertCircle size={11} /> Changes Requested
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                            Awaiting Scope Sign-off
                          </span>
                        )}
                      </div>

                      {isApproved ? (
                        <div className="py-2.5 my-1 border-b border-emerald-300">
                          <span className="font-serif italic text-xl text-emerald-800 tracking-wide block">
                            {requirement.clientSignoff?.approvedBy || requirement.clientName}
                          </span>
                        </div>
                      ) : isChangesRequested ? (
                        <div className="py-2 my-1 border-b border-rose-200 text-rose-600 text-xs">
                          <p className="font-bold">Feedback Submitted by Client</p>
                          {requirement.clientSignoff?.feedbackNotes && (
                            <p className="text-[10px] text-slate-500 italic mt-0.5">"{requirement.clientSignoff.feedbackNotes}"</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          {/* Interactive Sign Block on Web View */}
                          {!isGeneratingPDF && (
                            <div data-html2canvas-ignore="true" className="my-1.5 print:hidden">
                              <button
                                type="button"
                                onClick={() => setShowApproveModal(true)}
                                className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-[#6324FC]/35 hover:border-[#6324FC] bg-white hover:bg-[#6324FC]/5 transition-all flex flex-col items-center justify-center gap-0.5 group cursor-pointer shadow-xs"
                              >
                                <div className="flex items-center gap-1.5 text-xs font-bold text-[#6324FC]">
                                  <CheckCircle2 size={15} className="group-hover:scale-110 transition-transform" />
                                  <span>Click Here to Sign &amp; Approve Scope</span>
                                </div>
                                <span className="text-[9px] text-slate-400 group-hover:text-slate-600">
                                  Digitally sign &amp; authorize sprint kickoff online
                                </span>
                              </button>
                            </div>
                          )}

                          {/* Print & PDF Fallback for physical signing */}
                          <div className="hidden print:block py-3 my-1 border-b border-slate-300">
                            <div className="h-5 border-b border-dashed border-slate-400 w-3/4 mb-1" />
                            <span className="text-[9px] text-slate-400 block">Client Authorized Signature</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-0.5 text-xs pt-1.5">
                      <p className="font-bold text-slate-800">
                        {isApproved ? requirement.clientSignoff?.approvedBy : requirement.clientName}
                      </p>
                      <p className="text-slate-500 text-[10px]">
                        {isApproved && requirement.clientSignoff?.approvedAt 
                          ? `Approved On: ${format(new Date(requirement.clientSignoff.approvedAt), 'MMMM dd, yyyy')}`
                          : 'Pending Client Signature'}
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Page 2 Footer */}
            <div className="pt-3 print:pt-2 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100 mt-2">
              <span className="font-medium">Injaazh Global • Confidential Engineering Specification</span>
              <span className="font-mono font-semibold">Page 2 of 2</span>
            </div>

          </div>
        </div>

      </main>

      {/* ========================================================================= */}
      {/* MODAL: APPROVE SCOPE & SIGN ONLINE */}
      {/* ========================================================================= */}
      {showApproveModal && (
        <div data-html2canvas-ignore="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 print:hidden">
          <div className="bg-white dark:bg-[#0E0F17] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-white/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="font-heading font-black text-lg text-slate-900 dark:text-white">
                  Approve Project Scope
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {requirement.docNumber} • {requirement.title}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Name (Digital Signature) *
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:border-[#6324FC]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Approval Notes / Special Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={signerNotes}
                  onChange={(e) => setSignerNotes(e.target.value)}
                  placeholder="Confirming sprint kickoff schedule or any notes for engineering..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-[#6324FC]"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] text-slate-500">
                By clicking "Confirm Approval", you digitally confirm acceptance of the itemized deliverables, prerequisites, and boundaries defined in this specification document.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 transition-all"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Confirm Approval</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUBMIT FEEDBACK / REQUEST CHANGES */}
      {/* ========================================================================= */}
      {showFeedbackModal && (
        <div data-html2canvas-ignore="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 print:hidden">
          <div className="bg-white dark:bg-[#0E0F17] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-white/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="font-heading font-black text-lg text-slate-900 dark:text-white">
                  Request Scope Changes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Submit scope questions or adjustments to our engineering team
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={feedbackAuthor}
                  onChange={(e) => setFeedbackAuthor(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:border-[#6324FC]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Describe Requested Changes or Questions *
                </label>
                <textarea
                  rows={4}
                  required
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Please clarify feature X, or we'd like to add module Y..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-[#6324FC]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#6324FC] to-[#8042FF] hover:from-[#5719ef] hover:to-[#712fee] rounded-xl shadow-lg shadow-[#6324FC]/25 flex items-center gap-1.5 transition-all"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Submit Feedback</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
