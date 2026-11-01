'use client';

import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { 
  FileText, Download, CheckCircle2, XCircle, Clock, 
  Calendar, Building2, User, Mail, Globe, MapPin, 
  Phone, ArrowRight, ShieldCheck, Printer, Copy, Check,
  Sparkles, AlertCircle, Loader2, Send
} from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { acceptProposalAction, declineProposalAction } from '@/app/actions/proposalActions';
import { INJAAZH_LOGO_BASE64, INJAAZH_EMBLEM_BASE64 } from '@/lib/brandLogo';

export default function ProposalClientView({ initialProposal }: { initialProposal: any }) {
  const [proposal, setProposal] = useState(initialProposal);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal States
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [signerName, setSignerName] = useState(proposal?.clientName || '');
  const [signerEmail, setSignerEmail] = useState(proposal?.clientEmail || '');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={13} className="text-emerald-500" /> Accepted & Signed
          </span>
        );
      case 'Declined':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <XCircle size={13} className="text-rose-500" /> Declined
          </span>
        );
      case 'Viewed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/30">
            <Clock size={13} /> Active Proposal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <Clock size={13} /> Pending Review
          </span>
        );
    }
  };

  // Copy Link Handler (Canonical title-based slug link)
  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const identifier = proposal.slug || proposal.proposalNumber || proposal._id;
      const canonicalUrl = `${window.location.origin}/proposal/${identifier}`;
      navigator.clipboard.writeText(canonicalUrl);
      setCopiedLink(true);
      toast.success('Proposal link copied to clipboard');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Dynamic Content-Aware Multi-Page PDF Export
  const handleDownloadPDF = async () => {
    if (!page1Ref.current || !page2Ref.current) return;
    setIsGeneratingPDF(true);

    try {
      // Small pause to allow React to render PDF-specific state
      await new Promise((resolve) => setTimeout(resolve, 100));

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // Footer reservation: 14mm from bottom of each page
      const footerReserveMm = 14;
      const contentHeightMm = pdfHeight - footerReserveMm; // 283mm

      // Helper function to capture an element and break it into clean page slices
      const processSection = async (element: HTMLElement) => {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const scaleY = canvas.height / element.offsetHeight;
        const pageMaxCanvasH = canvas.width * (pdfHeight / pdfWidth);
        const contentMaxCanvasH = canvas.width * (contentHeightMm / pdfWidth);

        // If the entire canvas fits comfortably on one page
        if (canvas.height <= pageMaxCanvasH) {
          return [{ canvas, startY: 0, endY: canvas.height, heightMm: (canvas.height * pdfWidth) / canvas.width }];
        }

        // Element exceeds one page: compute safe break points at DOM element boundaries
        const elRect = element.getBoundingClientRect();
        const breakPoints: number[] = [];

        // 1. Table rows: ensure no table row is cut in half
        const rows = element.querySelectorAll('tbody tr');
        rows.forEach((tr) => {
          const r = tr.getBoundingClientRect();
          breakPoints.push((r.bottom - elRect.top) * scaleY);
        });

        // 2. Table footer: subtotal and totals
        const tfoot = element.querySelector('tfoot');
        if (tfoot) {
          const r = tfoot.getBoundingClientRect();
          breakPoints.push((r.bottom - elRect.top) * scaleY);
        }

        // 3. Section divisions and Signature boundary
        const sections = element.querySelectorAll('.border-b, .py-4, .pt-4, .py-3\\.5');
        sections.forEach((sec) => {
          const r = sec.getBoundingClientRect();
          breakPoints.push((r.bottom - elRect.top) * scaleY);
        });

        const sigs = element.querySelector('.proposal-signatures');
        if (sigs) {
          const r = sigs.getBoundingClientRect();
          breakPoints.push((r.top - elRect.top) * scaleY);
          breakPoints.push((r.bottom - elRect.top) * scaleY);
        }

        // Deduplicate and sort
        const sortedBreaks = Array.from(new Set(breakPoints)).sort((a, b) => a - b);

        const slices: { canvas: HTMLCanvasElement; startY: number; endY: number; heightMm: number }[] = [];
        let currentStartY = 0;

        while (currentStartY < canvas.height) {
          const maxEndY = currentStartY + contentMaxCanvasH;
          if (maxEndY >= canvas.height) {
            const sliceH = canvas.height - currentStartY;
            slices.push({
              canvas,
              startY: currentStartY,
              endY: canvas.height,
              heightMm: (sliceH * pdfWidth) / canvas.width,
            });
            break;
          }

          // Find the best break point that fits within maxEndY
          let bestBreak = maxEndY;
          for (let i = sortedBreaks.length - 1; i >= 0; i--) {
            if (sortedBreaks[i] > currentStartY + 120 * scaleY && sortedBreaks[i] <= maxEndY) {
              bestBreak = sortedBreaks[i];
              break;
            }
          }

          const sliceH = bestBreak - currentStartY;
          slices.push({
            canvas,
            startY: currentStartY,
            endY: bestBreak,
            heightMm: (sliceH * pdfWidth) / canvas.width,
          });
          currentStartY = bestBreak;
        }

        return slices;
      };

      // Process both Section 1 (Scope, Deliverables, Investment) and Section 2 (Milestones, Terms, Signatures)
      const section1Slices = await processSection(page1Ref.current);
      const section2Slices = await processSection(page2Ref.current);

      const allPages = [...section1Slices, ...section2Slices];
      const totalPages = allPages.length;

      allPages.forEach((slice, idx) => {
        if (idx > 0) {
          pdf.addPage();
        }

        // Render the slice onto a clean sub-canvas to ensure crisp, exact bitmap placement
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = slice.canvas.width;
        sliceCanvas.height = slice.endY - slice.startY;
        const ctx = sliceCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            slice.canvas,
            0,
            slice.startY,
            slice.canvas.width,
            slice.endY - slice.startY,
            0,
            0,
            slice.canvas.width,
            slice.endY - slice.startY
          );
        }

        const sliceImgData = sliceCanvas.toDataURL('image/png');
        pdf.addImage(sliceImgData, 'PNG', 0, 0, pdfWidth, slice.heightMm, undefined, 'FAST');

        // Draw Professional Vector Footer with Dynamic Page Numbering: "Page X of N"
        pdf.setDrawColor(226, 232, 240); // Slate-200 border line
        pdf.setLineWidth(0.3);
        pdf.line(10, 287, 200, 287);

        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184); // Slate-400
        pdf.text('Injaazh Global • Confidential Commercial Proposal', 10, 292);

        const pageText = `Page ${idx + 1} of ${totalPages}`;
        const pageTextWidth = pdf.getTextWidth(pageText);
        pdf.text(pageText, 200 - pageTextWidth, 292);
      });

      pdf.save(`Proposal_${proposal.proposalNumber || 'Document'}.pdf`);
      toast.success(`Proposal PDF downloaded (${totalPages} Pages)`);
    } catch (err: any) {
      console.error('PDF error:', err);
      toast.error('Failed to generate PDF. You can also use the Print button.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Accept Action
  const handleAcceptProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) {
      toast.error('Please enter your full name as signature');
      return;
    }
    if (!agreedToTerms) {
      toast.error('Please accept the proposal terms to proceed');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await acceptProposalAction(proposal._id, {
        signedName: signerName.trim(),
        signedEmail: signerEmail.trim(),
      });

      if (res.success && res.data) {
        setProposal(res.data);
        setShowAcceptModal(false);
        toast.success(res.message || 'Proposal Accepted Successfully!');

        // Celebration Confetti
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6324FC', '#00E5FF', '#10B981', '#F59E0B']
        });
      } else {
        toast.error(res.error || 'Failed to accept proposal');
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Decline Action
  const handleDeclineProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await declineProposalAction(proposal._id, declineReason.trim());
      if (res.success && res.data) {
        setProposal(res.data);
        setShowDeclineModal(false);
        toast.success('Your response has been recorded.');
      } else {
        toast.error(res.error || 'Failed to record response');
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDocPages = useMemo(() => {
    const itemCount = proposal.items?.length || 0;
    const milestoneCount = proposal.milestones?.length || 0;
    const p1Pages = itemCount <= 4 ? 1 : itemCount <= 8 ? 2 : Math.ceil(itemCount / 5);
    const p2Pages = milestoneCount > 3 ? 2 : 1;
    return Math.max(2, p1Pages + p2Pages);
  }, [proposal.items?.length, proposal.milestones?.length]);

  const currencySymbol = proposal.currency || '$';
  const isAccepted = proposal.status === 'Accepted';
  const isDeclined = proposal.status === 'Declined';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#07080B] text-slate-900 dark:text-slate-100 selection:bg-[#6324FC]/20 print:bg-white print:text-slate-900">
      
      {/* Print Specific CSS Rules to isolate the proposal document */}
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

          /* Hide Web UI Chrome & floating elements */
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

          /* Dynamic content-aware print pagination rules */
          .proposal-page-1 {
            page-break-after: auto !important;
            break-after: auto !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
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

          .proposal-page-2 {
            page-break-before: always !important;
            break-before: page !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
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

          table {
            page-break-inside: auto !important;
            break-inside: auto !important;
            width: 100% !important;
          }

          thead {
            display: table-header-group !important;
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          tfoot {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .proposal-signatures {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}} />

      {/* Sticky Action Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-[#0A0B10]/90 backdrop-blur-xl border-b border-black/5 dark:border-white/5 transition-all print:hidden">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          
          {/* Brand & Proposal ID */}
          <div className="flex items-center gap-3">
            <img 
              src={INJAAZH_EMBLEM_BASE64} 
              alt="Injaazh Emblem" 
              className="w-10 h-10 rounded-xl object-contain shadow-xs border border-black/5 dark:border-white/10"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                  {proposal.companyName || 'Injaazh Global'}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs font-mono font-medium text-slate-500">
                  {proposal.proposalNumber}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {getStatusBadge(proposal.status)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleCopyLink}
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1.5"
              title="Copy shareable proposal link"
            >
              {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1.5"
              title="Print proposal"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="p-2 sm:px-3.5 sm:py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isGeneratingPDF ? <Loader2 size={14} className="animate-spin text-[#6324FC]" /> : <Download size={14} />}
              <span className="hidden sm:inline">{isGeneratingPDF ? 'Generating...' : 'Download PDF'}</span>
            </button>

            {!isAccepted && !isDeclined && (
              <button
                onClick={() => setShowAcceptModal(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#6324FC] to-[#8042FF] hover:from-[#5719ef] hover:to-[#712fee] rounded-xl shadow-[0_4px_16px_rgba(99,36,252,0.3)] hover:shadow-[0_6px_20px_rgba(99,36,252,0.4)] transition-all flex items-center gap-1.5 active:scale-[0.98]"
              >
                <CheckCircle2 size={14} />
                <span>Accept Proposal</span>
              </button>
            )}

            {isAccepted && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold">
                <ShieldCheck size={14} />
                <span>Verified Signed</span>
              </div>
            )}
          </div>

        </div>
      </nav>

      {/* Main Proposal Body Container */}
      <main className="max-w-[1020px] mx-auto px-4 sm:px-6 py-10 sm:py-14 print:p-0 print:m-0 print:max-w-none">
        
        {/* Printable/Exportable Canvas Container */}
        {/* ================= PAGE 1: Scope, Deliverables & Investment ================= */}
        <div 
          ref={page1Ref}
          id="proposal-page-1"
          className="proposal-page-1 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden text-slate-900 mb-8 print:mb-0 print:border-none print:shadow-none print:rounded-none"
          style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
        >
          {/* Top Brand Banner */}
          <div className="h-2 bg-gradient-to-r from-[#6324FC] via-[#00E5FF] to-[#6324FC]" />

          <div className="p-6 sm:p-8 lg:p-10 print:p-5 print:py-3.5 flex flex-col justify-between">
            <div>
              {/* Header: Company & Proposal Info */}
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
                        alt={proposal.companyName || 'Injaazh Global'} 
                        className="h-5.5 w-auto object-contain"
                      />
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#6324FC] mt-0.5">
                        {proposal.companyTagline || 'Empowering Digital Transformation'}
                      </p>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 space-y-0.5 font-medium mt-1.5">
                    {proposal.companyAddress && <p className="flex items-center gap-1.5"><MapPin size={10} className="text-slate-400 shrink-0" /> {proposal.companyAddress}</p>}
                    <p className="flex items-center gap-1.5"><Mail size={10} className="text-slate-400 shrink-0" /> {proposal.companyEmail}</p>
                    {proposal.companyWebsite && <p className="flex items-center gap-1.5"><Globe size={10} className="text-slate-400 shrink-0" /> {proposal.companyWebsite}</p>}
                  </div>
                </div>

                {/* Right: Proposal Meta */}
                <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-slate-100 sm:border-0">
                  <div className="inline-block px-2.5 py-0.5 bg-[#6324FC]/10 border border-[#6324FC]/20 rounded-full text-[9px] font-bold text-[#6324FC] uppercase tracking-widest mb-1">
                    PROJECT PROPOSAL
                  </div>
                  <h2 className="text-lg font-mono font-bold text-slate-900">
                    {proposal.proposalNumber}
                  </h2>
                  
                  <div className="mt-1.5 space-y-0.5 text-[11px]">
                    <p className="text-slate-500">
                      <span className="font-semibold text-slate-700">Date Issued: </span>
                      {format(new Date(proposal.issueDate), 'MMMM dd, yyyy')}
                    </p>
                    <p className="text-slate-500">
                      <span className="font-semibold text-slate-700">Valid Until: </span>
                      {format(new Date(proposal.validUntil), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Target Client & Project Title */}
              <div className="py-3.5 print:py-2.5 border-b border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div className="md:col-span-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Proposal Title & Objective</span>
                    <h3 className="text-lg sm:text-xl font-heading font-black text-slate-900 mt-0.5 leading-snug">
                      {proposal.title}
                    </h3>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 p-3 print:p-2 rounded-xl">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Prepared Exclusively For</span>
                    <div className="mt-1 space-y-0.5">
                      <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <User size={12} className="text-[#6324FC] shrink-0" /> {proposal.clientName}
                      </h4>
                      {proposal.clientCompany && (
                        <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                          <Building2 size={11} className="text-slate-400 shrink-0" /> {proposal.clientCompany}
                        </p>
                      )}
                      {proposal.clientEmail && (
                        <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          <Mail size={11} className="text-slate-400 shrink-0" /> {proposal.clientEmail}
                        </p>
                      )}
                      {proposal.clientPhone && (
                        <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          <Phone size={11} className="text-slate-400 shrink-0" /> {proposal.clientPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Executive Summary Section */}
              {proposal.executiveSummary && (
                <div className="py-3 print:py-2 border-b border-slate-100">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6324FC] mb-1 flex items-center gap-1.5">
                    <Sparkles size={11} /> Executive Summary & Solution Overview
                  </h4>
                  <div className="text-[11px] leading-relaxed text-slate-600 whitespace-pre-line font-normal">
                    {proposal.executiveSummary}
                  </div>
                </div>
              )}

              {/* Scope of Deliverables & Integrated Pricing Table */}
              <div className="py-3.5 print:py-2.5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6324FC] flex items-center gap-1.5">
                      <FileText size={11} /> Scope of Work & Deliverables
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Itemized deliverables, implementation scope, and investment schedule</p>
                  </div>
                </div>

                {/* Items Table with Integrated Totals in tfoot */}
                <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/80 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-2 px-3 sm:px-4 w-[55%]">Deliverable / Description</th>
                        <th className="py-2 px-2 text-center w-[15%]">Qty</th>
                        <th className="py-2 px-3 text-right w-[15%]">Rate</th>
                        <th className="py-2 px-3 sm:px-4 text-right w-[15%]">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {proposal.items?.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2 px-3 sm:px-4 align-top">
                            <div className="font-bold text-slate-900 text-xs">
                              {item.title}
                            </div>
                            {item.description && (
                              <div className="text-[10px] text-slate-500 mt-0.5 whitespace-pre-line leading-relaxed">
                                {item.description}
                              </div>
                            )}
                            {item.category && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[8.5px] font-semibold rounded bg-[#6324FC]/10 text-[#6324FC]">
                                {item.category}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center align-top font-medium text-slate-600 text-xs">
                            {item.quantity}
                          </td>
                          <td className="py-2 px-3 text-right align-top font-mono font-medium text-slate-600 text-xs">
                            {currencySymbol}{Number(item.rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 sm:px-4 text-right align-top font-mono font-bold text-slate-900 text-xs">
                            {currencySymbol}{Number(item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    {/* Integrated Financial Totals in Table Footer - NEVER ORPHANED */}
                    <tfoot className="border-t-2 border-slate-200 bg-slate-50/70 text-xs">
                      <tr className="border-b border-slate-100">
                        <td colSpan={3} className="py-1.5 px-3 sm:px-4 text-right font-medium text-slate-500 text-[11px]">
                          Subtotal
                        </td>
                        <td className="py-1.5 px-3 sm:px-4 text-right font-mono font-bold text-slate-800 text-xs">
                          {currencySymbol}{Number(proposal.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      {proposal.discountAmount > 0 && (
                        <tr className="border-b border-slate-100">
                          <td colSpan={3} className="py-1 px-3 sm:px-4 text-right font-medium text-emerald-600 text-[11px]">
                            Discount
                          </td>
                          <td className="py-1 px-3 sm:px-4 text-right font-mono font-bold text-emerald-600 text-xs">
                            -{currencySymbol}{Number(proposal.discountAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}
                      {proposal.taxRate > 0 && (
                        <tr className="border-b border-slate-100">
                          <td colSpan={3} className="py-1 px-3 sm:px-4 text-right font-medium text-slate-500 text-[11px]">
                            Tax ({proposal.taxRate}%)
                          </td>
                          <td className="py-1 px-3 sm:px-4 text-right font-mono font-bold text-slate-800 text-xs">
                            {currencySymbol}{Number(proposal.taxAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-[#6324FC]/5 font-black text-slate-900 border-t border-slate-200">
                        <td colSpan={3} className="py-2 px-3 sm:px-4 text-right uppercase tracking-wider text-[11px] text-[#6324FC] font-heading font-black">
                          Total Investment
                        </td>
                        <td className="py-2 px-3 sm:px-4 text-right font-mono text-sm text-[#6324FC] font-black">
                          {currencySymbol}{Number(proposal.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

              </div>
            </div>

            {/* Page 1 Footer */}
            <div data-html2canvas-ignore="true" className="pt-3 print:pt-2 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100 mt-2">
              <span className="font-medium">Injaazh Global • Confidential Commercial Proposal</span>
              <span className="font-mono font-semibold print:hidden">Page 1 of {totalDocPages}</span>
              <span className="font-mono font-semibold hidden print:inline">Commercial Scope • Page 1</span>
            </div>

          </div>
        </div>

        {/* Visual page separator on Web (hidden on Print and PDF) */}
        <div data-html2canvas-ignore="true" className="print:hidden flex items-center justify-center gap-3 my-6 text-xs font-semibold text-slate-400">
          <div className="h-px bg-slate-200 dark:bg-white/10 flex-1 max-w-[120px]" />
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] font-bold text-slate-400">
            Milestones, Terms & Sign-off
          </span>
          <div className="h-px bg-slate-200 dark:bg-white/10 flex-1 max-w-[120px]" />
        </div>

        {/* ================= PAGE 2: Milestones, Terms & Acceptance ================= */}
        <div 
          ref={page2Ref}
          id="proposal-page-2"
          className="proposal-page-2 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden text-slate-900 print:border-none print:shadow-none print:rounded-none"
          style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
        >
          {/* Top Brand Banner */}
          <div className="h-2.5 bg-gradient-to-r from-[#6324FC] via-[#00E5FF] to-[#6324FC]" />

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
                    alt={proposal.companyName || 'Injaazh Global'} 
                    className="h-5 w-auto object-contain"
                  />
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-mono font-bold text-slate-700">{proposal.proposalNumber}</span>
                </div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#6324FC] bg-[#6324FC]/10 px-2 py-0.5 rounded-full">
                  Terms & Acceptance
                </div>
              </div>

              {/* Milestones & Timeline Section */}
              {proposal.milestones && proposal.milestones.length > 0 && (
                <div className="py-4 print:py-2 border-b border-slate-100">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6324FC] mb-1 flex items-center gap-1.5">
                    <Clock size={12} /> Estimated Timeline & Key Milestones
                  </h4>
                  <p className="text-[10px] text-slate-400 mb-2.5">Phase-by-phase implementation schedule</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 print:grid-cols-3">
                    {proposal.milestones.map((milestone: any, mIdx: number) => (
                      <div key={mIdx} className="p-3 print:p-2 rounded-xl bg-slate-50 border border-slate-200/70 relative">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                            Phase {mIdx + 1}
                          </span>
                          {milestone.duration && (
                            <span className="text-[10px] font-semibold text-[#6324FC]">
                              {milestone.duration}
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-xs text-slate-900">{milestone.title}</h5>
                        {milestone.description && (
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                            {milestone.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Terms & Conditions */}
              <div className="py-4 print:py-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 text-xs">
                <div>
                  <h5 className="font-bold uppercase tracking-wider text-slate-700 mb-1 text-[10px]">Payment Terms</h5>
                  <p className="text-slate-500 leading-relaxed whitespace-pre-line text-[10px]">
                    {proposal.paymentTerms || 'Standard 50% upfront, 50% on project completion.'}
                  </p>
                </div>

                <div>
                  <h5 className="font-bold uppercase tracking-wider text-slate-700 mb-1 text-[10px]">Terms & Agreement</h5>
                  <p className="text-slate-500 leading-relaxed whitespace-pre-line text-[10px]">
                    {proposal.termsAndConditions || 'Work proceeds immediately upon acceptance and initial deposit.'}
                  </p>
                </div>
              </div>

              {/* Authorizing Signatures & Acceptance Section */}
              <div className="pt-4 print:pt-2 proposal-signatures">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-stretch print:grid-cols-2">
                  
                  {/* Left Column: Injaazh Representative */}
                  <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Prepared & Authorized By
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#6324FC]/10 text-[#6324FC] border border-[#6324FC]/20">
                          Verified Agency
                        </span>
                      </div>

                      <div className="py-3 my-1 border-b border-slate-200">
                        <span className="font-serif italic text-xl text-slate-900 tracking-wide block select-none">
                          {proposal.companySignature || 'Injaazh Global'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5 text-xs pt-1.5">
                      <p className="font-bold text-slate-800">{proposal.companyName || 'Injaazh Global'}</p>
                      <p className="text-slate-500 text-[10px]">Date: {format(new Date(proposal.issueDate), 'MMMM dd, yyyy')}</p>
                    </div>
                  </div>

                  {/* Right Column: Client Acceptance & Sign-off */}
                  <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Client Acceptance & Sign-off
                        </span>
                        {isAccepted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <ShieldCheck size={11} /> Certified Signed
                          </span>
                        ) : isDeclined ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            <XCircle size={11} /> Declined
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                            Awaiting Signature
                          </span>
                        )}
                      </div>

                      {isAccepted ? (
                        <div className="py-3 my-1 border-b border-emerald-300">
                          <span className="font-serif italic text-xl text-emerald-800 tracking-wide block">
                            {proposal.clientSignature?.signedName}
                          </span>
                        </div>
                      ) : isDeclined ? (
                        <div className="py-3 my-1 border-b border-rose-200 text-rose-600 text-xs">
                          <p className="font-bold">Proposal declined by client</p>
                          {proposal.declineReason && (
                            <p className="text-[10px] text-slate-500 italic mt-0.5">"{proposal.declineReason}"</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          {/* Interactive Sign Block on Web View */}
                          {!isGeneratingPDF && (
                            <div data-html2canvas-ignore="true" className="my-1.5 print:hidden">
                              <button
                                type="button"
                                onClick={() => setShowAcceptModal(true)}
                                className="w-full py-3 px-3.5 rounded-xl border-2 border-dashed border-[#6324FC]/35 hover:border-[#6324FC] bg-white hover:bg-[#6324FC]/5 transition-all flex flex-col items-center justify-center gap-0.5 group cursor-pointer shadow-xs"
                              >
                                <div className="flex items-center gap-1.5 text-xs font-bold text-[#6324FC]">
                                  <CheckCircle2 size={15} className="group-hover:scale-110 transition-transform" />
                                  <span>Click Here to Sign & Accept Proposal</span>
                                </div>
                                <span className="text-[9px] text-slate-400 group-hover:text-slate-600">
                                  Digitally sign & confirm partnership online
                                </span>
                              </button>
                            </div>
                          )}

                          {/* Formal Signature Placeholder for PDF export & Print */}
                          <div className={isGeneratingPDF ? "py-3 my-1 border-b border-slate-300" : "hidden print:block py-3 my-1 border-b border-slate-300"}>
                            <span className="text-[11px] text-slate-400 italic block">
                              Authorized Client Signature & Date
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5">
                      <div>
                        <p className="font-bold text-slate-800">{proposal.clientName}</p>
                        {proposal.clientCompany && (
                          <p className="text-slate-500 text-[10px]">{proposal.clientCompany}</p>
                        )}
                        {isAccepted && proposal.clientSignature?.signedAt && (
                          <p className="text-emerald-700 text-[10px] font-mono mt-0.5">
                            Signed {format(new Date(proposal.clientSignature.signedAt), 'PPP p')}
                          </p>
                        )}
                      </div>
                      {!isAccepted && !isDeclined && (
                        <div data-html2canvas-ignore="true" className="print:hidden">
                          <button
                            type="button"
                            onClick={() => setShowDeclineModal(true)}
                            className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 transition-colors underline"
                          >
                            Request Changes
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Page 2 Footer */}
            <div data-html2canvas-ignore="true" className="pt-6 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 mt-6">
              <span className="font-medium">This proposal is generated by Injaazh ERP OS. Certified authentic digital document.</span>
              <span className="font-mono font-semibold print:hidden">Page {totalDocPages} of {totalDocPages}</span>
              <span className="font-mono font-semibold hidden print:inline">Terms & Signatures • Page {totalDocPages}</span>
            </div>

          </div>
        </div>

        {/* Bottom Help Note */}
        <div className="text-center mt-8 text-xs text-slate-400 font-medium print:hidden">
          Questions about this proposal? Contact us at{' '}
          <a href={`mailto:${proposal.companyEmail}`} className="text-[#6324FC] dark:text-[#00E5FF] hover:underline">
            {proposal.companyEmail}
          </a>
        </div>

      </main>

      {/* Accept & Sign Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E0F17] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 size={18} /> Accept Proposal
              </div>
              <button 
                onClick={() => setShowAcceptModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Confirm & Digitally Sign
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              You are accepting proposal <strong>{proposal.proposalNumber}</strong> ({currencySymbol}{Number(proposal.total || 0).toLocaleString()}).
            </p>

            <form onSubmit={handleAcceptProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Full Legal Name
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC]"
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Confirmation Email
                </label>
                <input 
                  type="email"
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC]"
                  value={signerEmail}
                  onChange={e => setSignerEmail(e.target.value)}
                />
              </div>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 cursor-pointer mt-2">
                <input 
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 rounded text-[#6324FC] focus:ring-[#6324FC]"
                />
                <span className="text-xs text-slate-600 dark:text-slate-300 leading-tight">
                  I agree to the scope, deliverables, and payment terms specified in this proposal.
                </span>
              </label>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAcceptModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !agreedToTerms}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Sign & Accept</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E0F17] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
                <AlertCircle size={18} /> Request Changes or Decline
              </div>
              <button 
                onClick={() => setShowDeclineModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Let us know if you need adjustments to scope, pricing, or timeline so we can revise the proposal for you.
            </p>

            <form onSubmit={handleDeclineProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Feedback or Reason
                </label>
                <textarea 
                  rows={4}
                  placeholder="Share details on what needs to be changed..."
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 resize-none"
                  value={declineReason}
                  onChange={e => setDeclineReason(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeclineModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Send Feedback</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

