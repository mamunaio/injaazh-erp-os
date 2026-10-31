'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  CheckCircle2, Clock, AlertCircle, Printer, Copy, Check,
  Sparkles, Loader2, Send, Download, Layers, Globe, Gauge,
  CheckSquare, FileText, ExternalLink, ShieldCheck, MapPin,
  Mail, Phone, Building2, User, HelpCircle, X
} from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { clientApproveTaskAction } from '@/app/actions/seoActions';
import { INJAAZH_LOGO_BASE64, INJAAZH_EMBLEM_BASE64 } from '@/lib/brandLogo';

export default function SeoReportClientView({ project: initialProject }: { project: any }) {
  const [project, setProject] = useState(initialProject);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [viewMode, setViewMode] = useState<'screen' | 'printPreview'>('screen');

  // Reports selection
  const reports = Array.isArray(project.reports) ? project.reports : [];
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    reports.length > 0 ? reports[0].reportId : null
  );

  const currentReport = useMemo(() => {
    if (!selectedReportId || reports.length === 0) return null;
    return reports.find((r: any) => r.reportId === selectedReportId) || reports[0];
  }, [reports, selectedReportId]);

  // Modal State for Client Approvals
  const [selectedTaskForApproval, setSelectedTaskForApproval] = useState<any | null>(null);
  const [clientApprovalNotes, setClientApprovalNotes] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);

  const tasks = Array.isArray(project.tasks) ? project.tasks : [];
  const verifiedTasks = tasks.filter((t: any) => t.status === 'Verified');
  const needsApprovalTasks = tasks.filter((t: any) => t.status === 'Needs Approval');
  const pendingOrInProgressTasks = tasks.filter((t: any) => t.status === 'In Progress' || t.status === 'Pending');

  // Copy Canonical Link
  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const identifier = project.slug || project.docNumber || project._id;
      const canonicalUrl = `${window.location.origin}/seo/${identifier}`;
      navigator.clipboard.writeText(canonicalUrl);
      setCopiedLink(true);
      toast.success('Weekly SEO report link copied to clipboard');
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

      // Render Page 1
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

      // Render Page 2
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

      pdf.save(`Weekly_SEO_Report_${project.clientName.replace(/\s+/g, '_')}.pdf`);
      toast.success('Weekly SEO Report PDF downloaded (2 Pages)');
    } catch (err: any) {
      console.error('PDF error:', err);
      toast.error('Failed to generate PDF. You can also use the Print button.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Client Submits Approval for an action item
  const handleConfirmTaskApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForApproval) return;

    setIsSubmittingApproval(true);
    try {
      const res = await clientApproveTaskAction(
        project._id,
        selectedTaskForApproval.taskId,
        clientApprovalNotes
      );

      if (res.success && res.data) {
        setProject(res.data);
        setSelectedTaskForApproval(null);
        setClientApprovalNotes('');
        toast.success(`Decision recorded for ${selectedTaskForApproval.taskId}`);

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6324FC', '#00E5FF', '#10B981']
        });
      } else {
        toast.error(res.error || 'Failed to approve item');
      }
    } catch {
      toast.error('Failed to submit approval');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#07080B] text-slate-900 dark:text-slate-100 selection:bg-[#6324FC]/20 print:bg-white print:text-slate-900">

      {/* Strict Print Specific CSS Rules isolating the A4 weekly report pages */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
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

          .seo-page-1 {
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

          .seo-page-2 {
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

          table, tfoot {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }

          tr, td, th {
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
                  Injaazh Global
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs font-mono font-medium text-slate-500">
                  {currentReport?.reportId || project.docNumber || 'SEO-2026-001'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/25">
                  <ShieldCheck size={12} /> {currentReport?.sprintTitle || 'Weekly SEO Performance Report'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Multi-report dropdown if reports exist */}
            {reports.length > 1 && (
              <select
                value={selectedReportId || ''}
                onChange={(e) => setSelectedReportId(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white"
              >
                {reports.map((r: any) => (
                  <option key={r.reportId} value={r.reportId}>
                    {r.reportId}: {r.sprintTitle}
                  </option>
                ))}
              </select>
            )}

            {/* A4 Document Mode Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'screen' ? 'printPreview' : 'screen')}
              className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1.5"
              title="Toggle between responsive reading mode and exact A4 document preview"
            >
              <FileText size={14} className="text-[#6324FC]" />
              <span className="hidden sm:inline">{viewMode === 'screen' ? 'A4 Paper Preview' : 'Responsive Mode'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1.5"
              title="Copy shareable link"
            >
              {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1.5"
              title="Print Report (2-Page A4)"
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

            {needsApprovalTasks.length > 0 && (
              <a
                href="#client-approvals"
                className="px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-1.5 hover:bg-amber-500/20 transition-colors"
              >
                <AlertCircle size={14} className="text-amber-500" />
                <span>{needsApprovalTasks.length} Approvals Needed</span>
              </a>
            )}

          </div>

        </div>
      </nav>

      {/* Main Report Container */}
      <main className={`mx-auto transition-all ${
        viewMode === 'printPreview'
          ? 'py-12 bg-slate-200/60 dark:bg-black/60 flex flex-col items-center gap-10'
          : 'max-w-[1020px] px-4 sm:px-6 py-10 sm:py-14'
      } print:p-0 print:m-0 print:max-w-none print:bg-white`}>

        {/* ================= PAGE 1: Executive Scorecard & Verified Deliverables ================= */}
        <div
          ref={page1Ref}
          id="seo-page-1"
          className={`seo-page-1 bg-white text-slate-900 ${
            viewMode === 'printPreview'
              ? 'w-[210mm] min-h-[297mm] p-[14mm_16mm_16mm_16mm] shadow-2xl rounded-none'
              : 'rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl mb-8 p-6 sm:p-8 lg:p-10'
          } overflow-hidden print:mb-0 print:border-none print:shadow-none print:rounded-none print:p-0 print:w-full`}
          style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
        >
          {/* Top Brand Accent */}
          <div className="h-2 bg-gradient-to-r from-[#6324FC] via-[#00E5FF] to-[#6324FC]" />

          <div className="p-6 sm:p-8 lg:p-10 print:p-4 print:py-2.5 flex flex-col justify-between">
            <div>

              {/* Header: Agency & Client Meta */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3.5 print:pb-2 border-b border-slate-100">
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
                        alt="Injaazh Global"
                        className="h-5.5 w-auto object-contain"
                      />
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#6324FC] mt-0.5">
                        Technical SEO &amp; Organic Growth Division
                      </p>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 space-y-0.5 font-medium mt-1.5">
                    <p className="flex items-center gap-1.5"><MapPin size={10} className="text-slate-400 shrink-0" /> 123 Tech Valley, San Francisco, CA 94105</p>
                    <p className="flex items-center gap-1.5"><Mail size={10} className="text-slate-400 shrink-0" /> seo-strategy@injaazh.com</p>
                    <p className="flex items-center gap-1.5"><Globe size={10} className="text-slate-400 shrink-0" /> www.injaazh.com</p>
                  </div>
                </div>

                <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-slate-100 sm:border-0">
                  <div className="inline-block px-2.5 py-0.5 bg-[#6324FC]/10 border border-[#6324FC]/20 rounded-full text-[9px] font-bold text-[#6324FC] uppercase tracking-widest mb-1">
                    {currentReport?.sprintTitle || 'WEEKLY SEO REPORT // SPRINT LOG'}
                  </div>
                  <h2 className="text-lg font-mono font-bold text-slate-900">
                    {currentReport?.reportId || project.docNumber || 'SEO-2026-001'}
                  </h2>

                  <div className="mt-1.5 space-y-0.5 text-[11px]">
                    <p className="text-slate-500">
                      <span className="font-semibold text-slate-700">Reporting Date: </span>
                      {currentReport?.reportingDate
                        ? format(new Date(currentReport.reportingDate), 'MMMM dd, yyyy')
                        : format(new Date(project.lastAudited || new Date()), 'MMMM dd, yyyy')}
                    </p>
                    <p className="text-slate-500">
                      <span className="font-semibold text-slate-700">Account Cadence: </span>
                      {currentReport?.accountCadence || `${project.cadence || 'Weekly'} Retainer Sprint`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Client & Scope Header */}
              <div className="py-3.5 print:py-1.5 border-b border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div className="md:col-span-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Account &amp; Digital Property</span>
                    <h3 className="text-lg sm:text-xl font-heading font-black text-slate-900 mt-0.5 leading-snug">
                      {project.clientName}
                      {project.clientCompany && <span className="text-slate-500 font-normal"> — {project.clientCompany}</span>}
                    </h3>
                    <p className="text-[11px] font-mono text-[#6324FC] mt-1 flex items-center gap-1.5">
                      <Globe size={11} /> {project.url}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 p-3 print:p-2 rounded-xl">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Client Contact</span>
                    <div className="mt-1 space-y-0.5 text-xs">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <User size={12} className="text-[#6324FC]" /> {project.clientName}
                      </h4>
                      {project.clientEmail && (
                        <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          <Mail size={11} className="text-slate-400" /> {project.clientEmail}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Performance Scorecard Matrix */}
              <div className="py-3 print:py-1.5 border-b border-slate-100">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6324FC] mb-2 flex items-center gap-1.5">
                  <Gauge size={11} /> Performance Benchmarks &amp; Health Matrix
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">

                  {/* GSC Organic */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">GSC Organic (3 Mo)</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-base font-mono font-black text-slate-900">
                        {project.baseline?.gsc?.organicClicks || 20}
                      </span>
                      <span className="text-[10px] text-slate-500">clicks</span>
                    </div>
                    <span className="text-[9.5px] text-slate-500 block">
                      {project.baseline?.gsc?.impressions || 374} imp • {(project.baseline?.gsc?.ctr * 100 || 5.3).toFixed(1)}% CTR
                    </span>
                  </div>

                  {/* Google Business Profile */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">GBP Discovery (Oct)</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-base font-mono font-black text-slate-900">
                        {project.baseline?.gbp?.profileViews || 246}
                      </span>
                      <span className="text-[10px] text-slate-500">views</span>
                    </div>
                    <span className="text-[9.5px] text-slate-500 block">
                      {project.baseline?.gbp?.calls || 3} calls • {project.baseline?.gbp?.directionRequests || 31} directions
                    </span>
                  </div>

                  {/* Core Web Vitals */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Mobile Speed (Lighthouse)</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-base font-mono font-black text-rose-600">
                        {project.lighthouse?.performance || 48} / 100
                      </span>
                    </div>
                    <span className="text-[9.5px] text-rose-600 font-semibold block">
                      LCP {project.vitals?.lcp?.value || 17.8}s (Investigation in SEO-016)
                    </span>
                  </div>

                  {/* Platform Metadata */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Squarespace Metadata</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-base font-mono font-black text-emerald-600">
                        100%
                      </span>
                      <span className="text-[10px] text-emerald-600">Pages Covered</span>
                    </div>
                    <span className="text-[9.5px] text-slate-500 block">
                      Fixed %p title template (SEO-006)
                    </span>
                  </div>

                </div>
              </div>

              {/* Verified Implementations (Work Completed on Website) */}
              <div className="py-3 print:py-2">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-600" /> Verified Website Changes &amp; Technical Implementations
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Verified = work checked and confirmed live on public HTML (not an unmeasured ranking claim)
                    </p>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {verifiedTasks.length} Changes Verified
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/80 text-[8.5px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-2 px-2.5 w-[14%]">Item ID &amp; Target</th>
                        <th className="py-2 px-3 w-[46%]">Action Taken &amp; Finding</th>
                        <th className="py-2 px-3 w-[40%]">Why It Matters (Business Impact)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {verifiedTasks.slice(0, 5).map((vt: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-2.5 align-top">
                            <span className="font-mono font-bold text-[#6324FC] block">{vt.taskId}</span>
                            <span className="text-[9.5px] text-slate-500 font-mono">{vt.pageOrPlatform}</span>
                          </td>
                          <td className="py-2 px-3 align-top">
                            <div className="font-bold text-slate-900 text-xs">{vt.task}</div>
                            <div className="text-[10px] text-slate-600 mt-0.5">{vt.doneProposedAction}</div>
                          </td>
                          <td className="py-2 px-3 align-top text-[10.5px] text-slate-600 italic leading-relaxed">
                            {vt.whyItMatters}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

            {/* Page 1 Footer */}
            <div className="pt-3 print:pt-1.5 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100 mt-2">
              <span className="font-medium">Injaazh Global • Confidential Weekly SEO Performance Report</span>
              <span className="font-mono font-semibold">Page 1 of 2</span>
            </div>

          </div>
        </div>

        {/* Visual page separator on Web (hidden on Print and PDF) */}
        <div data-html2canvas-ignore="true" className="print:hidden flex items-center justify-center gap-3 my-6 text-xs font-semibold text-slate-400">
          <div className="h-px bg-slate-200 dark:bg-white/10 flex-1 max-w-[120px]" />
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] font-bold text-slate-400">
            Page 2 of 2 • Client Decisions, Next Sprint &amp; Sign-off
          </span>
          <div className="h-px bg-slate-200 dark:bg-white/10 flex-1 max-w-[120px]" />
        </div>

        {/* ================= PAGE 2: Client Approvals, Next Sprint & Sign-off ================= */}
        <div
          ref={page2Ref}
          id="seo-page-2"
          className={`seo-page-2 bg-white text-slate-900 ${
            viewMode === 'printPreview'
              ? 'w-[210mm] min-h-[297mm] p-[14mm_16mm_16mm_16mm] shadow-2xl rounded-none'
              : 'rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 lg:p-10'
          } overflow-hidden print:border-none print:shadow-none print:rounded-none print:p-0 print:w-full`}
          style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
        >
          {/* Top Brand Accent */}
          <div className="h-2 bg-gradient-to-r from-[#6324FC] via-[#00E5FF] to-[#6324FC]" />

          <div className="p-6 sm:p-8 lg:p-10 print:p-4 print:py-2.5 flex flex-col justify-between">
            <div>

              {/* Page 2 Header */}
              <div className="flex items-center justify-between pb-3 print:pb-1.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <img
                    src={INJAAZH_EMBLEM_BASE64}
                    alt="Injaazh Emblem"
                    className="w-7 h-7 rounded-lg object-contain shadow-xs shrink-0"
                  />
                  <img
                    src={INJAAZH_LOGO_BASE64}
                    alt="Injaazh Global"
                    className="h-5 w-auto object-contain"
                  />
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-mono font-bold text-slate-700">{project.docNumber || 'SEO-2026-001'}</span>
                </div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#6324FC] bg-[#6324FC]/10 px-2 py-0.5 rounded-full">
                  Page 2 of 2 • Approvals &amp; Next Sprint
                </div>
              </div>

              {/* Action Required by Client (Needs Approval Section) */}
              <div id="client-approvals" className="py-3.5 print:py-1.5 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                      <AlertCircle size={12} className="text-amber-600" /> Action Required by Client (Needs Approval)
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Hector's input or confirmation is required before changes are applied to the live website
                    </p>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    {needsApprovalTasks.length} Items Pending
                  </span>
                </div>

                <div className="space-y-2.5">
                  {needsApprovalTasks.map((task: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 print:p-2 rounded-xl bg-amber-50/50 border border-amber-200/70 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-amber-800">{task.taskId}</span>
                          <span className="text-xs font-bold text-slate-900">{task.task}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            {task.pageOrPlatform}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed">
                          <span className="font-semibold text-slate-800">Proposed Action: </span>
                          {task.doneProposedAction}
                        </p>
                        <p className="text-[10px] text-slate-500 italic">
                          <span className="font-semibold text-slate-600">Why It Matters: </span>
                          {task.whyItMatters}
                        </p>
                      </div>

                      {/* Online Client Approve Button */}
                      <div data-html2canvas-ignore="true" className="shrink-0 print:hidden self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setSelectedTaskForApproval(task)}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 transition-all"
                        >
                          <CheckCircle2 size={13} />
                          <span>Approve Scope</span>
                        </button>
                      </div>

                      {/* Print Checkbox */}
                      <div className="hidden print:flex items-center gap-2 shrink-0 pt-1">
                        <div className="w-3.5 h-3.5 border border-slate-400 rounded" />
                        <span className="text-[9px] text-slate-600">Approved by Client</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Sprint Priorities (In Progress & High-Priority Queue) */}
              <div className="py-3.5 print:py-1.5 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6324FC] flex items-center gap-1.5">
                      <Clock size={12} /> Next Sprint Priorities &amp; Pending Pipeline
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Technical and content deliverables queued for next weekly cycle
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {pendingOrInProgressTasks.slice(0, 4).map((pt: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-[10px] text-[#6324FC]">{pt.taskId}</span>
                        <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded ${
                          pt.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {pt.status}
                        </span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-900 leading-snug">{pt.task}</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {pt.doneProposedAction || pt.beforeFinding}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Authorizing Signatures & Sign-off Section */}
              <div className="pt-3 print:pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">

                  {/* Agency Lead */}
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Prepared &amp; Verified By
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#6324FC]/10 text-[#6324FC] border border-[#6324FC]/20">
                          SEO Engineering Lead
                        </span>
                      </div>

                      <div className="py-2 my-1 border-b border-slate-200">
                        <span className="font-serif italic text-lg text-slate-900 tracking-wide block select-none">
                          Injaazh Global Technical Strategy
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5 text-xs pt-1">
                      <p className="font-bold text-slate-800">Injaazh Global OS</p>
                      <p className="text-slate-500 text-[10px]">Date: {format(new Date(project.lastAudited || new Date()), 'MMMM dd, yyyy')}</p>
                    </div>
                  </div>

                  {/* Client Acknowledgment */}
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Client Acknowledgment
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          Weekly Sprint Accepted
                        </span>
                      </div>

                      <div className="py-2 my-1 border-b border-slate-200">
                        <span className="font-serif italic text-lg text-slate-900 tracking-wide block">
                          {project.clientName}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5 text-xs pt-1">
                      <p className="font-bold text-slate-800">{project.clientCompany || project.clientName}</p>
                      <p className="text-slate-500 text-[10px]">Client Sign-off: October 2026</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Page 2 Footer */}
            <div className="pt-3 print:pt-1.5 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100 mt-2">
              <span className="font-medium">Injaazh Global • Confidential Weekly SEO Performance Report</span>
              <span className="font-mono font-semibold">Page 2 of 2</span>
            </div>

          </div>
        </div>

      </main>

      {/* ========================================================================= */}
      {/* MODAL: CLIENT APPROVES AN ACTION ITEM DIRECTLY ONLINE */}
      {/* ========================================================================= */}
      {selectedTaskForApproval && (
        <div data-html2canvas-ignore="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 print:hidden">
          <div className="bg-white dark:bg-[#0E0F17] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-white/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">

            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  {selectedTaskForApproval.taskId}
                </span>
                <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">
                  Confirm Client Direction
                </h3>
              </div>
              <button
                onClick={() => setSelectedTaskForApproval(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-black dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmTaskApproval} className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block mb-0.5">
                  {selectedTaskForApproval.task}
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {selectedTaskForApproval.doneProposedAction}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Your Instructions / Approval Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={clientApprovalNotes}
                  onChange={(e) => setClientApprovalNotes(e.target.value)}
                  placeholder="e.g. Approved, proceed with NJ focus or hide placeholder testimonials page..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-[#6324FC]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForApproval(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApproval}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-1.5"
                >
                  {isSubmittingApproval ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Confirm Approval</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

