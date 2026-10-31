'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle2, Clock, AlertCircle, Plus, Search,
  Trash2, Edit, ExternalLink, Globe, Gauge, Eye, Copy,
  Check, Sparkles, Filter, X, ChevronDown, CheckSquare,
  Square, Calendar, User, FileText, BarChart3, Layers,
  Cpu, ShieldCheck, Loader2, Key, Target, Compass, Lock,
  ArrowUpDown, Hash, MapPin, TrendingUp, AlertTriangle, Activity, LayoutGrid, List
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  addOrUpdateTask,
  deleteTask,
  auditSeoProject,
  createSeoReport,
  updateSeoReport,
  deleteSeoReport,
  addOrUpdateKeyword,
  deleteKeyword
} from '@/app/actions/seoActions';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import CustomSelect, { CustomSelectOption } from '@/components/ui/CustomSelect';

// =========================================================================
// CANONICAL CONSTANTS & TAXONOMY (Matching Hector Rivera Excel Spreadsheet)
// =========================================================================

const TASK_STATUS_OPTIONS: CustomSelectOption[] = [
  { value: 'Verified', label: 'Verified', color: '#10B981' },
  { value: 'In Progress', label: 'In Progress', color: '#3B82F6' },
  { value: 'Needs Approval', label: 'Needs Approval', color: '#F59E0B' },
  { value: 'Pending', label: 'Pending', color: '#94A3B8' },
];

const TASK_PRIORITY_OPTIONS: CustomSelectOption[] = [
  { value: 'High', label: 'High Priority', color: '#EF4444' },
  { value: 'Medium', label: 'Medium Priority', color: '#F59E0B' },
  { value: 'Low', label: 'Low Priority', color: '#10B981' },
];

const TASK_WORK_TYPE_OPTIONS: CustomSelectOption[] = [
  { value: 'Review', label: 'Review' },
  { value: 'Audit', label: 'Audit' },
  { value: 'Measurement', label: 'Measurement' },
  { value: 'Implementation', label: 'Implementation' },
  { value: 'Verification', label: 'Verification' },
  { value: 'Content', label: 'Content' },
  { value: 'Research', label: 'Research' },
  { value: 'Reporting', label: 'Reporting' },
];

const TASK_WORK_TYPE_FILTER_OPTIONS: CustomSelectOption[] = [
  { value: 'All', label: 'All Work Types' },
  ...TASK_WORK_TYPE_OPTIONS,
];

const TASK_APPROVAL_SCOPE_OPTIONS: CustomSelectOption[] = [
  { value: 'Not required', label: 'Not required (Direct Technical Fix)' },
  { value: 'Required', label: 'Required (Needs Client Approval)' },
  { value: 'Review before changes', label: 'Review before changes' },
  { value: 'User implemented', label: 'User implemented' },
  { value: 'Not yet applied', label: 'Not yet applied' },
  { value: 'Required for corrections', label: 'Required for corrections' },
];

const KEYWORD_TYPE_OPTIONS: CustomSelectOption[] = [
  { value: 'Primary', label: 'Primary Target', color: '#6324FC' },
  { value: 'Secondary', label: 'Secondary / Long-Tail', color: '#00E5FF' },
];

const KEYWORD_TYPE_FILTER_OPTIONS: CustomSelectOption[] = [
  { value: 'All', label: 'All Keyword Types' },
  ...KEYWORD_TYPE_OPTIONS,
];

const SEARCH_INTENT_OPTIONS: CustomSelectOption[] = [
  { value: 'Commercial', label: 'Commercial (High Intent)', color: '#10B981' },
  { value: 'Transactional', label: 'Transactional (Booking/Purchase)', color: '#6324FC' },
  { value: 'Informational', label: 'Informational (Guides/Articles)', color: '#3B82F6' },
  { value: 'Navigational', label: 'Navigational (Brand/Location)', color: '#F59E0B' },
];

const SEARCH_INTENT_FILTER_OPTIONS: CustomSelectOption[] = [
  { value: 'All', label: 'All Search Intents' },
  ...SEARCH_INTENT_OPTIONS,
];

const KEYWORD_STATUS_OPTIONS: CustomSelectOption[] = [
  { value: 'Mapped', label: 'Mapped to Page', color: '#10B981' },
  { value: 'Needs Review', label: 'Needs Review / Optimization', color: '#F59E0B' },
  { value: 'Not Mapped', label: 'Not Mapped (Orphan Keyword)', color: '#EF4444' },
];

const KEYWORD_STATUS_FILTER_OPTIONS: CustomSelectOption[] = [
  { value: 'All', label: 'All Mapping Statuses' },
  ...KEYWORD_STATUS_OPTIONS,
];

const REPORT_CADENCE_OPTIONS: CustomSelectOption[] = [
  { value: 'Weekly Sprint', label: 'Weekly Sprint' },
  { value: 'Bi-weekly Sprint', label: 'Bi-weekly Sprint' },
  { value: 'Monthly Retainer', label: 'Monthly Retainer' },
];

const REPORT_STATUS_OPTIONS: CustomSelectOption[] = [
  { value: 'Published', label: 'Published (Visible in Portal)', color: '#10B981' },
  { value: 'Draft', label: 'Draft (Internal Preview)', color: '#F59E0B' },
];

export default function SeoProjectWorkspaceClient({
  initialProject,
  userRole,
}: {
  initialProject: any;
  userRole?: string;
}) {
  const { confirm } = useConfirm();
  const [project, setProject] = useState(initialProject);

  // Tab Order Required: 1. tasks, 2. keywords, 3. baseline, 4. aeo, 5. reports
  const [activeMainTab, setActiveMainTab] = useState<'tasks' | 'keywords' | 'baseline' | 'aeo' | 'reports'>('tasks');

  // Task Filters & Search
  const [statusFilter, setStatusFilter] = useState('All');
  const [taskViewMode, setTaskViewMode] = useState<'grid' | 'table'>('grid');
  const [workTypeFilter, setWorkTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    taskId: '',
    priority: 'High',
    status: 'Pending',
    workType: 'Audit',
    pageOrPlatform: '',
    task: '',
    beforeFinding: '',
    doneProposedAction: '',
    whyItMatters: '',
    nextStep: '',
    owner: 'Mamun',
    evidence: '',
    approvalScope: 'Not required',
  });

  // Keyword Modal State (Phase 5)
  const keywords = useMemo(() => Array.isArray(project.keywords) ? project.keywords : [], [project.keywords]);
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<any | null>(null);
  const [isSubmittingKeyword, setIsSubmittingKeyword] = useState(false);
  const [keywordForm, setKeywordForm] = useState({
    keyword: '',
    keywordType: 'Primary',
    searchIntent: 'Commercial',
    targetUrl: '',
    targetLocation: project.targetLocation || 'New Jersey, US',
    searchVolume: 0,
    keywordDifficulty: 0,
    currentPosition: '' as string | number,
    targetPosition: '' as string | number,
    priority: 'High',
    mappingStatus: 'Not Mapped',
    notes: '',
  });

  // Keyword Filters & Search
  const [keywordSearchQuery, setKeywordSearchQuery] = useState('');
  const [keywordTypeFilter, setKeywordTypeFilter] = useState('All');
  const [keywordIntentFilter, setKeywordIntentFilter] = useState('All');
  const [keywordPriorityFilter, setKeywordPriorityFilter] = useState('All');
  const [keywordStatusFilter, setKeywordStatusFilter] = useState('All');
  const [keywordSortBy, setKeywordSortBy] = useState<'keyword' | 'searchVolume' | 'keywordDifficulty' | 'currentPosition' | 'priority'>('keyword');
  const [keywordSortDir, setKeywordSortDir] = useState<'asc' | 'desc'>('asc');

  // Reports State
  const reports = useMemo(() => Array.isArray(project.reports) ? project.reports : [], [project.reports]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportForm, setReportForm] = useState({
    reportId: '',
    sprintTitle: '',
    reportingDate: new Date().toISOString().split('T')[0],
    accountCadence: 'Weekly Sprint',
    executiveSummary: '',
    nextSprintFocus: '',
    status: 'Published',
  });

  const tasks = useMemo(() => Array.isArray(project.tasks) ? project.tasks : [], [project.tasks]);

  // =========================================================================
  // METRICS & COMPUTED VALUES
  // =========================================================================
  const metrics = useMemo(() => {
    const total = tasks.length;
    const verified = tasks.filter((t: any) => t.status === 'Verified').length;
    const inProgress = tasks.filter((t: any) => t.status === 'In Progress').length;
    const pending = tasks.filter((t: any) => t.status === 'Pending').length;
    const needsApproval = tasks.filter((t: any) => t.status === 'Needs Approval').length;
    return { total, verified, inProgress, pending, needsApproval };
  }, [tasks]);

  const workspaceTelemetry = useMemo(() => {
    const verifiedPercent = metrics.total > 0 ? Math.round((metrics.verified / metrics.total) * 100) : 0;
    return [
      {
        id: 'total-tasks',
        filterValue: 'All',
        label: 'Total Tasks',
        value: metrics.total,
        subtitle: '24 Canonical Action Items',
        badge: '100% Scope',
        icon: CheckSquare,
        color: '#6324FC',
      },
      {
        id: 'verified-live',
        filterValue: 'Verified',
        label: 'Verified Live',
        value: metrics.verified,
        subtitle: 'Confirmed on Public HTML',
        badge: `${verifiedPercent}% Verified`,
        icon: CheckCircle2,
        color: '#10B981',
      },
      {
        id: 'needs-approval',
        filterValue: 'Needs Approval',
        label: 'Client Approvals',
        value: metrics.needsApproval,
        subtitle: 'Required Before Deployment',
        badge: metrics.needsApproval > 0 ? `${metrics.needsApproval} Pending` : 'All Clear',
        icon: AlertCircle,
        color: '#F59E0B',
      },
      {
        id: 'in-progress',
        filterValue: 'In Progress',
        label: 'In Progress',
        value: metrics.inProgress,
        subtitle: 'Active Engineering Fixes',
        badge: 'Active Sprints',
        icon: Clock,
        color: '#00E5FF',
      },
      {
        id: 'pending-backlog',
        filterValue: 'Pending',
        label: 'Pending Backlog',
        value: metrics.pending,
        subtitle: 'Ready for Next Execution',
        badge: 'Queued',
        icon: Layers,
        color: '#8B5CF6',
      },
    ];
  }, [metrics]);

  const keywordMetrics = useMemo(() => {
    const total = keywords.length;
    const mapped = keywords.filter((k: any) => k.mappingStatus === 'Mapped').length;
    const needsReview = keywords.filter((k: any) => k.mappingStatus === 'Needs Review').length;
    const notMapped = keywords.filter((k: any) => k.mappingStatus === 'Not Mapped').length;
    const avgDifficulty = total > 0
      ? Math.round(keywords.reduce((acc: number, k: any) => acc + (k.keywordDifficulty || 0), 0) / total)
      : 0;
    return { total, mapped, needsReview, notMapped, avgDifficulty };
  }, [keywords]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t: any) => {
      const matchStatus = statusFilter === 'All' || t.status === statusFilter;
      const matchWorkType = workTypeFilter === 'All' || t.workType === workTypeFilter;
      const matchSearch =
        (t.taskId?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (t.task?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (t.pageOrPlatform?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (t.whyItMatters?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (t.doneProposedAction?.toLowerCase() || '').includes(searchQuery.toLowerCase());

      return matchStatus && matchWorkType && matchSearch;
    });
  }, [tasks, statusFilter, workTypeFilter, searchQuery]);

  // Filtered & Sorted Keywords
  const filteredKeywords = useMemo(() => {
    return keywords
      .filter((k: any) => {
        const matchSearch =
          (k.keyword?.toLowerCase() || '').includes(keywordSearchQuery.toLowerCase()) ||
          (k.targetUrl?.toLowerCase() || '').includes(keywordSearchQuery.toLowerCase()) ||
          (k.notes?.toLowerCase() || '').includes(keywordSearchQuery.toLowerCase());
        const matchType = keywordTypeFilter === 'All' || k.keywordType === keywordTypeFilter;
        const matchIntent = keywordIntentFilter === 'All' || k.searchIntent === keywordIntentFilter;
        const matchPriority = keywordPriorityFilter === 'All' || k.priority === keywordPriorityFilter;
        const matchStatus = keywordStatusFilter === 'All' || k.mappingStatus === keywordStatusFilter;

        return matchSearch && matchType && matchIntent && matchPriority && matchStatus;
      })
      .sort((a: any, b: any) => {
        let valA = a[keywordSortBy] ?? 0;
        let valB = b[keywordSortBy] ?? 0;
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return keywordSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return keywordSortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [keywords, keywordSearchQuery, keywordTypeFilter, keywordIntentFilter, keywordPriorityFilter, keywordStatusFilter, keywordSortBy, keywordSortDir]);

  // =========================================================================
  // TASK HANDLERS
  // =========================================================================
  const handleOpenAddTask = () => {
    const nextNum = (tasks.length + 1).toString().padStart(3, '0');
    setEditingTask(null);
    setTaskForm({
      taskId: `SEO-${nextNum}`,
      priority: 'High',
      status: 'Pending',
      workType: 'Implementation',
      pageOrPlatform: 'Homepage',
      task: '',
      beforeFinding: '',
      doneProposedAction: '',
      whyItMatters: '',
      nextStep: '',
      owner: 'Mamun',
      evidence: '',
      approvalScope: 'Not required',
    });
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: any) => {
    setEditingTask(task);
    setTaskForm({
      taskId: task.taskId || '',
      priority: task.priority || 'High',
      status: task.status || 'Pending',
      workType: task.workType || 'Audit',
      pageOrPlatform: task.pageOrPlatform || '',
      task: task.task || '',
      beforeFinding: task.beforeFinding || '',
      doneProposedAction: task.doneProposedAction || '',
      whyItMatters: task.whyItMatters || '',
      nextStep: task.nextStep || '',
      owner: task.owner || 'Mamun',
      evidence: task.evidence || '',
      approvalScope: task.approvalScope || 'Not required',
    });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.task.trim()) {
      toast.error('Task title is required');
      return;
    }

    setIsSubmittingTask(true);
    try {
      const res = await addOrUpdateTask(project._id, taskForm);
      if (res.success && res.data) {
        toast.success(res.message || 'Task saved successfully');
        setProject(res.data);
        setIsTaskModalOpen(false);
      } else {
        toast.error(res.error || 'Failed to save task');
      }
    } catch {
      toast.error('Failed to save task');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const isConfirmed = await confirm({
      title: 'Delete SEO Task?',
      message: `Are you sure you want to delete task "${taskId}"? This will update the project matrix.`,
      danger: true,
      confirmText: 'Delete Task',
    });

    if (!isConfirmed) return;

    try {
      const res = await deleteTask(project._id, taskId);
      if (res.success && res.data) {
        toast.success('Task deleted successfully');
        setProject(res.data);
      } else {
        toast.error(res.error || 'Failed to delete task');
      }
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleQuickStatusChange = async (task: any, newStatus: string) => {
    try {
      const payload = {
        ...task,
        status: newStatus,
        completedDate: newStatus === 'Verified' ? new Date().toISOString().split('T')[0] : task.completedDate,
      };
      const res = await addOrUpdateTask(project._id, payload);
      if (res.success && res.data) {
        toast.success(`${task.taskId} marked as ${newStatus}`);
        setProject(res.data);
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  // =========================================================================
  // KEYWORD HANDLERS (Phase 5)
  // =========================================================================
  const handleOpenAddKeyword = () => {
    setEditingKeyword(null);
    setKeywordForm({
      keyword: '',
      keywordType: 'Primary',
      searchIntent: 'Commercial',
      targetUrl: project.url || '',
      targetLocation: project.targetLocation || 'New Jersey, US',
      searchVolume: 0,
      keywordDifficulty: 0,
      currentPosition: '',
      targetPosition: '',
      priority: 'High',
      mappingStatus: 'Not Mapped',
      notes: '',
    });
    setIsKeywordModalOpen(true);
  };

  const handleOpenEditKeyword = (kw: any) => {
    setEditingKeyword(kw);
    setKeywordForm({
      keyword: kw.keyword || '',
      keywordType: kw.keywordType || 'Primary',
      searchIntent: kw.searchIntent || 'Commercial',
      targetUrl: kw.targetUrl || '',
      targetLocation: kw.targetLocation || project.targetLocation || 'New Jersey, US',
      searchVolume: kw.searchVolume ?? 0,
      keywordDifficulty: kw.keywordDifficulty ?? 0,
      currentPosition: kw.currentPosition !== null && kw.currentPosition !== undefined ? kw.currentPosition : '',
      targetPosition: kw.targetPosition !== null && kw.targetPosition !== undefined ? kw.targetPosition : '',
      priority: kw.priority || 'High',
      mappingStatus: kw.mappingStatus || 'Not Mapped',
      notes: kw.notes || '',
    });
    setIsKeywordModalOpen(true);
  };

  const handleSaveKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywordForm.keyword.trim()) {
      toast.error('Keyword string is required');
      return;
    }

    setIsSubmittingKeyword(true);
    try {
      const payload = {
        ...keywordForm,
        _id: editingKeyword?._id,
      };
      const res = await addOrUpdateKeyword(project._id, payload);
      if (res.success && res.data) {
        toast.success(res.message || 'Keyword mapping saved successfully');
        setProject(res.data);
        setIsKeywordModalOpen(false);
      } else {
        toast.error(res.error || 'Failed to save keyword');
      }
    } catch {
      toast.error('An unexpected error occurred while saving keyword');
    } finally {
      setIsSubmittingKeyword(false);
    }
  };

  const handleDeleteKeyword = async (kw: any) => {
    const isConfirmed = await confirm({
      title: 'Delete Keyword Mapping?',
      message: `Delete target keyword "${kw.keyword}"? Its ranking benchmarks and URL mapping will be removed.`,
      danger: true,
      confirmText: 'Delete Keyword',
    });

    if (!isConfirmed) return;

    try {
      const res = await deleteKeyword(project._id, kw._id);
      if (res.success && res.data) {
        toast.success(res.message || 'Keyword deleted');
        setProject(res.data);
      } else {
        toast.error(res.error || 'Failed to delete keyword');
      }
    } catch {
      toast.error('Failed to delete keyword');
    }
  };

  // =========================================================================
  // AUDIT & SHARE HANDLERS
  // =========================================================================
  const handleAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await auditSeoProject(project._id);
      if (res.success && res.data) {
        toast.success('Live Google PageSpeed audit completed!');
        setProject(res.data);
      } else {
        toast.error(res.error || 'Audit failed');
      }
    } catch {
      toast.error('Audit failed');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const identifier = project.slug || project.docNumber || project._id;
      const url = `${window.location.origin}/seo/${identifier}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success('Client weekly SEO report link copied!');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // =========================================================================
  // REPORT HANDLERS
  // =========================================================================
  const handleOpenAddReport = () => {
    const year = new Date().getFullYear();
    const count = reports.length + 1;
    setEditingReport(null);
    setReportForm({
      reportId: `REP-${year}-W${String(count).padStart(2, '0')}`,
      sprintTitle: `Sprint ${count}: Weekly SEO Performance & Technical Deliverables`,
      reportingDate: new Date().toISOString().split('T')[0],
      accountCadence: project.cadence ? `${project.cadence} Sprint` : 'Weekly Sprint',
      executiveSummary: project.weeklyNotes || '',
      nextSprintFocus: '',
      status: 'Published',
    });
    setIsReportModalOpen(true);
  };

  const handleOpenEditReport = (r: any) => {
    setEditingReport(r);
    setReportForm({
      reportId: r.reportId || '',
      sprintTitle: r.sprintTitle || '',
      reportingDate: r.reportingDate || new Date().toISOString().split('T')[0],
      accountCadence: r.accountCadence || 'Weekly Sprint',
      executiveSummary: r.executiveSummary || '',
      nextSprintFocus: r.nextSprintFocus || '',
      status: r.status || 'Published',
    });
    setIsReportModalOpen(true);
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.sprintTitle.trim()) {
      toast.error('Sprint title is required');
      return;
    }

    setIsSubmittingReport(true);
    try {
      if (editingReport) {
        const res = await updateSeoReport(project._id, editingReport._id || editingReport.reportId, reportForm);
        if (res.success && res.data) {
          toast.success(res.message || 'Report updated!');
          setProject(res.data);
          setIsReportModalOpen(false);
        } else {
          toast.error(res.error || 'Failed to update report');
        }
      } else {
        const res = await createSeoReport(project._id, reportForm);
        if (res.success && res.data) {
          toast.success(res.message || 'Weekly report created!');
          setProject(res.data);
          setIsReportModalOpen(false);
        } else {
          toast.error(res.error || 'Failed to create report');
        }
      }
    } catch {
      toast.error('Failed to save report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleDeleteReport = async (report: any) => {
    const isConfirmed = await confirm({
      title: 'Delete Weekly SEO Report?',
      message: `Delete report "${report.sprintTitle}" (${report.reportId})? This action cannot be undone.`,
      danger: true,
      confirmText: 'Delete Report',
    });

    if (!isConfirmed) return;

    try {
      const res = await deleteSeoReport(project._id, report._id || report.reportId);
      if (res.success && res.data) {
        toast.success(res.message || 'Report deleted');
        setProject(res.data);
      } else {
        toast.error(res.error || 'Failed to delete report');
      }
    } catch {
      toast.error('Failed to delete report');
    }
  };

  return (
    <div className="relative min-h-screen text-slate-900 dark:text-white font-sans selection:bg-[#6324FC] selection:text-white pb-20">

      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/6 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#6324FC]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#00E5FF]/5 rounded-full blur-[130px]" />
      </div>

      <div className="max-w-[1750px] mx-auto relative z-10 space-y-6">

        {/* ========================================================================= */}
        {/* HEADER BAR (Standardized Breadcrumb + Telemetry Profile + Actions) */}
        {/* ========================================================================= */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 pb-4 border-b border-black/5 dark:border-white/5">

          <div className="flex items-start sm:items-center gap-3.5">
            <Link
              href="/seo"
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors shrink-0 shadow-xs"
              title="Return to SEO Projects Hub"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              {/* Breadcrumb & Project Doc Number */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Link
                  href="/seo"
                  className="text-xs font-heading font-semibold text-slate-400 hover:text-[#6324FC] dark:hover:text-[#00E5FF] transition-colors"
                >
                  SEO &amp; Reporting
                </Link>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <span className="font-heading font-bold text-xs text-slate-700 dark:text-slate-300">
                  {project.clientCompany || project.clientName}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="font-mono font-bold text-xs text-[#6324FC] dark:text-[#00E5FF]">
                  {project.docNumber || 'SEO-2026-001'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {project.status} Retainer
                </span>
              </div>

              {/* Client Title and Domain */}
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white flex flex-wrap items-baseline gap-2">
                <span>{project.clientName}</span>
                {project.clientCompany && (
                  <span className="text-slate-400 text-base sm:text-lg font-medium">
                    ({project.clientCompany})
                  </span>
                )}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-slate-400 hover:text-[#6324FC] dark:hover:text-[#00E5FF] flex items-center gap-1.5 transition-colors"
                >
                  <Globe size={13} />
                  <span>{project.url}</span>
                  <ExternalLink size={11} />
                </a>

                {project.targetLocation && (
                  <span className="text-slate-400 flex items-center gap-1 font-medium">
                    <MapPin size={12} className="text-[#6324FC]" />
                    <span>{project.targetLocation}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Dashboard Standardized) */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">

            {/* Copy Shareable Client Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="h-9 px-3.5 rounded-xl bg-surface border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:border-[#6324FC]/40 text-xs font-heading font-semibold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              title="Copy public client report portal link"
            >
              {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-secondary" />}
              <span>{copiedLink ? 'Link Copied' : 'Share Portal'}</span>
            </button>

            {/* View Client Report Portal */}
            <Link
              href={`/seo/${project.slug || project._id}`}
              target="_blank"
              className="h-9 px-3.5 rounded-xl bg-surface border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:border-[#00E5FF]/50 text-xs font-heading font-semibold transition-all flex items-center gap-2 shadow-xs"
            >
              <Eye size={14} className="text-[#6324FC] dark:text-[#00E5FF]" />
              <span>Client Weekly Report</span>
              <ExternalLink size={12} className="opacity-50" />
            </Link>

            {/* Run Live PageSpeed Audit */}
            <button
              type="button"
              onClick={handleAudit}
              disabled={isAuditing}
              className="h-9 px-3.5 rounded-xl bg-[#6324FC]/10 border border-[#6324FC]/30 hover:border-[#6324FC] text-slate-800 dark:text-[#edeae2] text-xs font-heading font-semibold transition-all hover:shadow-[0_0_15px_rgba(99,36,252,0.3)] shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Gauge size={14} className={isAuditing ? 'animate-spin text-[#6324FC]' : 'text-[#6324FC] dark:text-[#00E5FF]'} />
              <span>{isAuditing ? 'Auditing...' : 'Live Audit'}</span>
            </button>

            {/* + Add Task Action (Dashboard Conic Laser Beam CTA) */}
            <button
              type="button"
              onClick={handleOpenAddTask}
              className="h-9 group relative p-[2px] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(99,36,252,0.35)] hover:shadow-[0_0_35px_rgba(0,229,255,0.5),0_0_20px_rgba(236,72,153,0.35)]"
            >
              {/* Perfectly Centered Square Conic Glow Aura */}
              <span
                className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] blur-[8px] opacity-85 pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
                }}
              />

              {/* Crisp Symmetrical Single Laser Beam Stream */}
              <span
                className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] opacity-100 pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
                }}
              />

              {/* Inner High-Contrast Surface */}
              <div className="relative z-10 w-full h-full px-3.5 rounded-[10px] bg-white dark:bg-[#0a0a0d] group-hover:bg-slate-50 dark:group-hover:bg-[#121218] text-slate-900 dark:text-white font-heading font-bold text-xs flex items-center gap-2 transition-all">
                <Plus size={15} className="text-[#00E5FF] group-hover:rotate-90 drop-shadow-[0_0_6px_#00E5FF] transition-transform duration-300" />
                <span className="tracking-wide group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-[#6324FC] dark:group-hover:from-white dark:group-hover:via-[#00E5FF] dark:group-hover:to-[#EC4899] transition-all">
                  + Add Task
                </span>
              </div>
            </button>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5 TELEMETRY KPI CARDS (Dashboard Glassmorphic Standardization) */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs font-heading font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
              <Activity size={15} className="text-[#6324FC]" /> Sprint Execution Telemetry
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-secondary">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10B981]" />
              <span>Sprint Synchronized</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5">
            {workspaceTelemetry.map((k) => {
              const isSelected = statusFilter === k.filterValue;
              const KIcon = k.icon;
              return (
                <div
                  key={k.id}
                  onClick={() => setStatusFilter(statusFilter === k.filterValue ? 'All' : k.filterValue)}
                  className={`group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 bg-white dark:bg-[#0a0a0d] border ${
                    isSelected
                      ? 'ring-2 ring-purple-500/50'
                      : 'border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25'
                  }`}
                  style={{
                    borderColor: isSelected ? k.color : undefined,
                    boxShadow: isSelected
                      ? `0 0 25px ${k.color}35`
                      : undefined,
                  }}
                >
                  {/* Radial Hover Spotlight */}
                  <div
                    className="absolute -top-10 -right-10 w-36 h-36 blur-[35px] rounded-full opacity-30 dark:opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none"
                    style={{ backgroundColor: `${k.color}40` }}
                  />

                  {/* Top Accent Neon Line - Expands on hover */}
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] transition-all duration-500 opacity-90 group-hover:opacity-100"
                    style={{
                      backgroundImage: `linear-gradient(to right, transparent, ${k.color}, transparent)`,
                      boxShadow: `0 0 10px ${k.color}`,
                    }}
                  />

                  {/* Subtle Card Glass Sheen Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.04] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Top Row: Icon Badge & Status Pill */}
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-sm border"
                      style={{
                        backgroundColor: `${k.color}15`,
                        borderColor: `${k.color}30`,
                        color: k.color,
                      }}
                    >
                      <KIcon size={21} />
                    </div>

                    <span
                      className="text-xs font-heading font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors shadow-xs"
                      style={{
                        backgroundColor: isSelected ? `${k.color}25` : `${k.color}15`,
                        borderColor: `${k.color}35`,
                        color: k.color,
                      }}
                    >
                      {isSelected ? '● Selected' : k.badge}
                    </span>
                  </div>

                  {/* Bottom Metric Block */}
                  <div className="relative z-10">
                    <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">
                      {k.label}
                    </p>
                    <p
                      className="text-2xl lg:text-3xl font-heading font-extrabold font-mono tracking-tight group-hover:scale-105 transition-transform duration-300 origin-left"
                      style={{ color: k.color }}
                    >
                      {k.value}
                    </p>
                    <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
                      {k.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN NAVIGATION TABS (Strict Order: 1. Tasks, 2. Keywords, 3. Baseline, 4. AEO, 5. Reports) */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 overflow-x-auto custom-scrollbar">

          {/* Tab 1: Task Execution Matrix */}
          <button
            type="button"
            onClick={() => setActiveMainTab('tasks')}
            className={`px-4 py-2.5 rounded-xl text-xs font-heading font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeMainTab === 'tasks'
                ? 'bg-[#6324FC] text-white shadow-md shadow-[#6324FC]/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <CheckSquare size={14} />
            <span>Task Execution Matrix</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeMainTab === 'tasks' ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-slate-400'
            }`}>
              {tasks.length}
            </span>
          </button>

          {/* Tab 2: Keyword Mapping (Immediately After Tasks) */}
          <button
            type="button"
            onClick={() => setActiveMainTab('keywords')}
            className={`px-4 py-2.5 rounded-xl text-xs font-heading font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeMainTab === 'keywords'
                ? 'bg-[#6324FC] text-white shadow-md shadow-[#6324FC]/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <Key size={14} />
            <span>Keyword Mapping</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeMainTab === 'keywords' ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-slate-400'
            }`}>
              {keywords.length}
            </span>
          </button>

          {/* Tab 3: Baseline Observations */}
          <button
            type="button"
            onClick={() => setActiveMainTab('baseline')}
            className={`px-4 py-2.5 rounded-xl text-xs font-heading font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeMainTab === 'baseline'
                ? 'bg-[#6324FC] text-white shadow-md shadow-[#6324FC]/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <BarChart3 size={14} />
            <span>Baseline Observations (GSC, GBP, PageSpeed)</span>
          </button>

          {/* Tab 4: AI Search Optimization */}
          <button
            type="button"
            onClick={() => setActiveMainTab('aeo')}
            className={`px-4 py-2.5 rounded-xl text-xs font-heading font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeMainTab === 'aeo'
                ? 'bg-[#6324FC] text-white shadow-md shadow-[#6324FC]/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <Cpu size={14} />
            <span>AI Search Engine Optimization (AEO)</span>
          </button>

          {/* Tab 5: Weekly Reports */}
          <button
            type="button"
            onClick={() => setActiveMainTab('reports')}
            className={`px-4 py-2.5 rounded-xl text-xs font-heading font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeMainTab === 'reports'
                ? 'bg-[#6324FC] text-white shadow-md shadow-[#6324FC]/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <FileText size={14} />
            <span>Weekly Reports</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeMainTab === 'reports' ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-slate-400'
            }`}>
              {reports.length}
            </span>
          </button>

        </div>

        {/* ========================================================================= */}
        {/* TAB 1: TASK EXECUTION MATRIX */}
        {/* ========================================================================= */}
        {activeMainTab === 'tasks' && (
          <div className="space-y-4">

            {/* View Mode Switcher + Search + Filters Bar (Matching Projects Dashboard) */}
            <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl p-3.5 shadow-xs flex flex-col lg:flex-row gap-3 justify-between items-center">

              {/* Left: View Mode Switcher (Grid View vs List Table) */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setTaskViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer ${
                    taskViewMode === 'grid'
                      ? 'bg-[#6324FC] text-white shadow-sm'
                      : 'text-secondary hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LayoutGrid size={13} />
                  <span>Grid View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTaskViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer ${
                    taskViewMode === 'table'
                      ? 'bg-[#6324FC] text-white shadow-sm'
                      : 'text-secondary hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <List size={13} />
                  <span>List Table</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 w-full max-w-md">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tasks by ID, action, platform, why it matters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#6324FC] transition-colors"
                />
              </div>

              {/* Status and Work Type Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
                <CustomSelect
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  options={[
                    { value: 'All', label: 'All Statuses' },
                    ...TASK_STATUS_OPTIONS
                  ]}
                  labelPrefix="Status"
                  size="sm"
                  minWidth={140}
                />

                <CustomSelect
                  value={workTypeFilter}
                  onChange={(val) => setWorkTypeFilter(val)}
                  options={TASK_WORK_TYPE_FILTER_OPTIONS}
                  labelPrefix="Work Type"
                  size="sm"
                  minWidth={160}
                />
              </div>

            </div>

            {/* Showing Count */}
            <div className="flex items-center justify-between text-xs font-mono text-secondary px-1">
              <span>Showing <strong className="text-slate-900 dark:text-white font-bold">{filteredTasks.length}</strong> of {tasks.length} total tasks</span>
            </div>

            {/* VIEW MODE 1: GRID CARDS (Dashboard Matching) */}
            {taskViewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
                {filteredTasks.length === 0 ? (
                  <div className="col-span-full py-16 text-center bg-white dark:bg-[#0a0a0d] rounded-2xl border border-black/10 dark:border-white/10">
                    <CheckSquare size={32} className="mx-auto text-slate-400 mb-2 opacity-60" />
                    <p className="text-sm font-heading font-bold text-slate-700 dark:text-slate-300">
                      No tasks match your current filter
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try clearing search or changing your filter dropdowns.
                    </p>
                  </div>
                ) : (
                  filteredTasks.map((t: any) => {
                    const statusColor = t.status === 'Verified' ? '#10B981' : t.status === 'In Progress' ? '#00E5FF' : t.status === 'Needs Approval' ? '#F59E0B' : '#94A3B8';
                    const priorityBg = t.priority === 'High' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' : t.priority === 'Medium' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';

                    return (
                      <div
                        key={t.taskId || t._id}
                        onClick={() => handleOpenEditTask(t)}
                        className="group glass-card rounded-2xl p-5 flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25 shadow-sm dark:shadow-md select-none min-h-[240px]"
                      >
                        {/* Radial Hover Spotlight */}
                        <div
                          className="absolute -top-10 -right-10 w-32 h-32 blur-[30px] rounded-full opacity-20 dark:opacity-30 group-hover:opacity-90 group-hover:scale-150 transition-all duration-500 pointer-events-none"
                          style={{ backgroundColor: statusColor }}
                        />

                        {/* Top Accent Neon Line - Expands on hover */}
                        <div
                          className="absolute top-0 left-1/2 -translate-x-1/2 w-10 group-hover:w-full h-[2.5px] transition-all duration-500 opacity-80 group-hover:opacity-100"
                          style={{
                            backgroundImage: `linear-gradient(to right, transparent, ${statusColor}, transparent)`,
                            boxShadow: `0 0 10px ${statusColor}`,
                          }}
                        />

                        {/* Subtle Card Glass Sheen Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.04] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                        {/* Card Header: Task ID, Status & Priority Badges */}
                        <div className="relative z-10 flex justify-between items-start gap-2">
                          <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/25 shadow-xs">
                            {t.taskId}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1"
                              style={{
                                backgroundColor: `${statusColor}15`,
                                borderColor: `${statusColor}35`,
                                color: statusColor,
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                              {t.status}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider border ${priorityBg}`}>
                              {t.priority}
                            </span>
                          </div>
                        </div>

                        {/* Title & Platform Tags */}
                        <div className="relative z-10 my-3 space-y-2">
                          <h4 className="text-xs font-heading font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors">
                            {t.task}
                          </h4>

                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 font-mono text-secondary">
                              <Globe size={10} className="text-[#6324FC]" /> {t.pageOrPlatform}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/20 font-semibold text-[9px]">
                              {t.workType}
                            </span>
                          </div>

                          {/* Findings / Proposed Action */}
                          {t.doneProposedAction ? (
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                              <span className="font-semibold text-slate-900 dark:text-white">Action: </span>
                              {t.doneProposedAction}
                            </p>
                          ) : t.beforeFinding ? (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">Before: </span>
                              {t.beforeFinding}
                            </p>
                          ) : null}
                        </div>

                        {/* Card Footer: Status Select + Owner & Actions */}
                        <div className="relative z-10 flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5 mt-auto">
                          <div onClick={(e) => e.stopPropagation()}>
                            <CustomSelect
                              value={t.status}
                              onChange={(newVal) => handleQuickStatusChange(t, newVal)}
                              options={TASK_STATUS_OPTIONS}
                              size="sm"
                              minWidth={130}
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-6 h-6 rounded-full bg-purple-500/15 dark:bg-[#6324FC]/20 text-[#6324FC] dark:text-[#00E5FF] border border-black/10 dark:border-white/10 flex items-center justify-center text-[7px] font-bold shadow-xs"
                              title={`Owner: ${t.owner || 'Mamun'}`}
                            >
                              {(t.owner || 'M').substring(0, 2).toUpperCase()}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditTask(t);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#6324FC] hover:bg-[#6324FC]/10 transition-colors"
                              title="Edit Task"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(t.taskId || t._id);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                              title="Delete Task"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* VIEW MODE 2: LIST TABLE (Comprehensive 10-Column Matrix) */}
            {taskViewMode === 'table' && (
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0d] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/90 dark:bg-white/[0.02] border-b border-black/10 dark:border-white/10 text-[9px] font-heading font-extrabold uppercase tracking-wider text-slate-400">
                        <th className="py-3.5 px-3.5 w-[75px]">ID</th>
                        <th className="py-3.5 px-2.5 w-[75px]">Priority</th>
                        <th className="py-3.5 px-3 w-[140px]">Status</th>
                        <th className="py-3.5 px-3 w-[110px]">Work Type</th>
                        <th className="py-3.5 px-3.5 w-[125px]">Page / Target</th>
                        <th className="py-3.5 px-3.5 w-[230px]">Task &amp; Findings</th>
                        <th className="py-3.5 px-4 w-[250px]">Action Taken</th>
                        <th className="py-3.5 px-4 w-[220px]">Why It Matters</th>
                        <th className="py-3.5 px-3 w-[85px]">Owner</th>
                        <th className="py-3.5 px-3.5 text-right w-[80px]">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {filteredTasks.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-14 text-center text-slate-400 italic">
                            No tasks match your current filter.
                          </td>
                        </tr>
                      ) : (
                        filteredTasks.map((t: any) => {
                          return (
                            <tr key={t.taskId || t._id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">

                              {/* ID */}
                              <td className="py-3.5 px-3.5 align-top font-mono font-bold text-[#6324FC] dark:text-[#00E5FF]">
                                {t.taskId}
                              </td>

                              {/* Priority */}
                              <td className="py-3.5 px-2.5 align-top">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                                  t.priority === 'High'
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                    : t.priority === 'Medium'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {t.priority}
                                </span>
                              </td>

                              {/* Status (Interactive Custom Dropdown) */}
                              <td className="py-3.5 px-3 align-top">
                                <CustomSelect
                                  value={t.status}
                                  onChange={(newVal) => handleQuickStatusChange(t, newVal)}
                                  options={TASK_STATUS_OPTIONS}
                                  size="sm"
                                  minWidth={140}
                                />
                              </td>

                              {/* Work Type */}
                              <td className="py-3.5 px-3 align-top">
                                <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded text-[11px]">
                                  {t.workType}
                                </span>
                              </td>

                              {/* Page / Platform */}
                              <td className="py-3.5 px-3.5 align-top font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                {t.pageOrPlatform}
                              </td>

                              {/* Task & Findings */}
                              <td className="py-3.5 px-3.5 align-top">
                                <div className="font-bold text-slate-900 dark:text-white leading-snug">
                                  {t.task}
                                </div>
                                {t.beforeFinding && (
                                  <div className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                                    <span className="font-semibold text-slate-500">Before: </span>
                                    {t.beforeFinding}
                                  </div>
                                )}
                              </td>

                              {/* Done / Proposed Action */}
                              <td className="py-3.5 px-4 align-top">
                                <div className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                  {t.doneProposedAction}
                                </div>
                                {t.evidence && (
                                  <div className="text-[9.5px] font-mono text-[#6324FC] dark:text-[#00E5FF] mt-1.5 truncate">
                                    Source: {t.evidence}
                                  </div>
                                )}
                              </td>

                              {/* Why It Matters */}
                              <td className="py-3.5 px-4 align-top text-slate-600 dark:text-slate-400 italic leading-relaxed text-[11px]">
                                {t.whyItMatters}
                              </td>

                              {/* Owner */}
                              <td className="py-3.5 px-3 align-top font-mono text-[10px] text-slate-500">
                                {t.owner}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-3.5 align-top text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditTask(t)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#6324FC] hover:bg-[#6324FC]/10 transition-colors"
                                    title="Edit task details"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTask(t.taskId || t._id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                    title="Delete task"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: KEYWORD MAPPING (Immediately After Tasks) */}
        {/* ========================================================================= */}
        {activeMainTab === 'keywords' && (
          <div className="space-y-4">

            {/* Keyword Telemetry Header */}
            <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-base font-heading font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Key size={18} className="text-[#6324FC] dark:text-[#00E5FF]" />
                  Keyword Mapping &amp; Target Landing Pages
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Map target commercial queries, search intent, and ranking benchmarks to client property URLs
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {/* + Add Keyword Laser CTA Button */}
                <button
                  type="button"
                  onClick={handleOpenAddKeyword}
                  className="h-9 group relative p-[2px] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(99,36,252,0.35)] hover:shadow-[0_0_35px_rgba(0,229,255,0.5),0_0_20px_rgba(236,72,153,0.35)]"
                >
                  <span
                    className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] blur-[8px] opacity-85 pointer-events-none"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
                    }}
                  />
                  <span
                    className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] opacity-100 pointer-events-none"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
                    }}
                  />
                  <div className="relative z-10 w-full h-full px-3.5 rounded-[10px] bg-white dark:bg-[#0a0a0d] group-hover:bg-slate-50 dark:group-hover:bg-[#121218] text-slate-900 dark:text-white font-heading font-bold text-xs flex items-center gap-2 transition-all">
                    <Plus size={15} className="text-[#00E5FF] group-hover:rotate-90 drop-shadow-[0_0_6px_#00E5FF] transition-transform duration-300" />
                    <span className="tracking-wide group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-[#6324FC] dark:group-hover:from-white dark:group-hover:via-[#00E5FF] dark:group-hover:to-[#EC4899] transition-all">
                      + Add Keyword
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Keyword Mini Telemetry Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="group glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 group-hover:w-full h-[2px] bg-[#6324FC] transition-all duration-300 shadow-[0_0_8px_#6324FC]" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-wider">Total Keywords</span>
                  <Key size={16} className="text-[#6324FC]" />
                </div>
                <div>
                  <div className="text-2xl font-heading font-black font-mono text-slate-900 dark:text-white">
                    {keywordMetrics.total}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Targeted search queries</span>
                </div>
              </div>

              <div className="group glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden bg-white dark:bg-[#0a0a0d] border border-emerald-500/20 hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 group-hover:w-full h-[2px] bg-emerald-500 transition-all duration-300 shadow-[0_0_8px_#10B981]" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-heading font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Mapped Pages</span>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
                <div>
                  <div className="text-2xl font-heading font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {keywordMetrics.mapped}
                  </div>
                  <span className="text-[10px] text-emerald-600/70 mt-0.5 block">Assigned to landing URLs</span>
                </div>
              </div>

              <div className="group glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden bg-white dark:bg-[#0a0a0d] border border-amber-500/20 hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 group-hover:w-full h-[2px] bg-amber-500 transition-all duration-300 shadow-[0_0_8px_#F59E0B]" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-heading font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Needs Review</span>
                  <AlertCircle size={16} className="text-amber-500" />
                </div>
                <div>
                  <div className="text-2xl font-heading font-black font-mono text-amber-600 dark:text-amber-400">
                    {keywordMetrics.needsReview}
                  </div>
                  <span className="text-[10px] text-amber-600/70 mt-0.5 block">Optimization required</span>
                </div>
              </div>

              <div className="group glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden bg-white dark:bg-[#0a0a0d] border border-cyan-500/20 hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 group-hover:w-full h-[2px] bg-cyan-500 transition-all duration-300 shadow-[0_0_8px_#00E5FF]" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-heading font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Avg Difficulty</span>
                  <Activity size={16} className="text-cyan-500" />
                </div>
                <div>
                  <div className="text-2xl font-heading font-black font-mono text-[#6324FC] dark:text-[#00E5FF]">
                    {keywordMetrics.avgDifficulty} / 100
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Competitive index</span>
                </div>
              </div>
            </div>

            {/* Keyword Filter & Control Bar */}
            <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl p-3.5 shadow-xs flex flex-wrap gap-2.5 justify-between items-center">

              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search keywords, target URL, or strategy notes..."
                  value={keywordSearchQuery}
                  onChange={(e) => setKeywordSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#6324FC] transition-colors"
                />
              </div>

              {/* Custom Dropdown Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <CustomSelect
                  value={keywordTypeFilter}
                  onChange={(val) => setKeywordTypeFilter(val)}
                  options={KEYWORD_TYPE_FILTER_OPTIONS}
                  size="sm"
                  minWidth={130}
                />

                <CustomSelect
                  value={keywordIntentFilter}
                  onChange={(val) => setKeywordIntentFilter(val)}
                  options={SEARCH_INTENT_FILTER_OPTIONS}
                  size="sm"
                  minWidth={140}
                />

                <CustomSelect
                  value={keywordStatusFilter}
                  onChange={(val) => setKeywordStatusFilter(val)}
                  options={KEYWORD_STATUS_FILTER_OPTIONS}
                  size="sm"
                  minWidth={140}
                />
              </div>

            </div>

            {/* Keyword Mapping Table */}
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0d] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">

                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-white/[0.02] border-b border-black/10 dark:border-white/10 text-[9px] font-heading font-extrabold uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 px-3.5 w-[220px]">Keyword</th>
                      <th className="py-3.5 px-3 w-[100px]">Type</th>
                      <th className="py-3.5 px-3 w-[120px]">Search Intent</th>
                      <th className="py-3.5 px-3.5 w-[200px]">Target Landing URL</th>
                      <th className="py-3.5 px-3 w-[130px]">Location</th>
                      <th className="py-3.5 px-2.5 w-[85px] text-center">Volume</th>
                      <th className="py-3.5 px-2.5 w-[85px] text-center">Difficulty</th>
                      <th className="py-3.5 px-2.5 w-[85px] text-center">Current</th>
                      <th className="py-3.5 px-2.5 w-[85px] text-center">Target</th>
                      <th className="py-3.5 px-2.5 w-[85px]">Priority</th>
                      <th className="py-3.5 px-3 w-[130px]">Mapping Status</th>
                      <th className="py-3.5 px-3.5 text-right w-[80px]">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {filteredKeywords.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-16 text-center">
                          <Key size={30} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                          <p className="text-sm font-heading font-bold text-slate-700 dark:text-slate-300">
                            {keywords.length === 0 ? 'No Keywords Mapped Yet' : 'No keywords match your filter'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            {keywords.length === 0
                              ? 'Map your target commercial phrases and search intent to designated pages.'
                              : 'Try adjusting your search query or dropdown filter.'}
                          </p>
                          {keywords.length === 0 && (
                            <button
                              type="button"
                              onClick={handleOpenAddKeyword}
                              className="mt-4 px-4 py-2 rounded-xl bg-[#6324FC] text-white text-xs font-bold shadow-xs hover:bg-[#521bd6] transition-all"
                            >
                              + Add First Target Keyword
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredKeywords.map((kw: any) => {
                        return (
                          <tr key={kw._id || kw.keyword} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">

                            {/* Keyword Title & Notes */}
                            <td className="py-3.5 px-3.5 align-top">
                              <span className="font-heading font-bold text-slate-900 dark:text-white block">
                                {kw.keyword}
                              </span>
                              {kw.notes && (
                                <span className="text-[10px] text-slate-400 italic block mt-0.5">
                                  {kw.notes}
                                </span>
                              )}
                            </td>

                            {/* Type */}
                            <td className="py-3.5 px-3 align-top">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-bold ${
                                kw.keywordType === 'Primary'
                                  ? 'bg-[#6324FC]/10 text-[#6324FC] dark:text-[#a782fc] border border-[#6324FC]/20'
                                  : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                              }`}>
                                {kw.keywordType}
                              </span>
                            </td>

                            {/* Search Intent */}
                            <td className="py-3.5 px-3 align-top">
                              <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] block">
                                {kw.searchIntent}
                              </span>
                            </td>

                            {/* Target URL */}
                            <td className="py-3.5 px-3.5 align-top font-mono text-[11px]">
                              {kw.targetUrl ? (
                                <a
                                  href={kw.targetUrl.startsWith('http') ? kw.targetUrl : `https://${kw.targetUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-600 dark:text-slate-400 hover:text-[#6324FC] dark:hover:text-[#00E5FF] flex items-center gap-1 transition-colors truncate max-w-[190px]"
                                >
                                  <Globe size={11} className="shrink-0" />
                                  <span className="truncate">{kw.targetUrl}</span>
                                </a>
                              ) : (
                                <span className="text-slate-400 italic">Unassigned</span>
                              )}
                            </td>

                            {/* Location */}
                            <td className="py-3.5 px-3 align-top text-slate-600 dark:text-slate-400 font-medium">
                              {kw.targetLocation || 'New Jersey, US'}
                            </td>

                            {/* Volume */}
                            <td className="py-3.5 px-2.5 align-top text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                              {kw.searchVolume ? kw.searchVolume.toLocaleString() : '—'}
                            </td>

                            {/* Difficulty */}
                            <td className="py-3.5 px-2.5 align-top text-center">
                              <span className={`font-mono font-bold ${
                                kw.keywordDifficulty > 60
                                  ? 'text-rose-500'
                                  : kw.keywordDifficulty > 30
                                  ? 'text-amber-500'
                                  : 'text-emerald-500'
                              }`}>
                                {kw.keywordDifficulty || 0}
                              </span>
                            </td>

                            {/* Current Position */}
                            <td className="py-3.5 px-2.5 align-top text-center font-mono font-extrabold text-slate-900 dark:text-white">
                              {kw.currentPosition !== null && kw.currentPosition !== undefined ? `#${kw.currentPosition}` : '—'}
                            </td>

                            {/* Target Position */}
                            <td className="py-3.5 px-2.5 align-top text-center font-mono font-bold text-[#6324FC] dark:text-[#00E5FF]">
                              {kw.targetPosition !== null && kw.targetPosition !== undefined ? `#${kw.targetPosition}` : '—'}
                            </td>

                            {/* Priority */}
                            <td className="py-3.5 px-2.5 align-top">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold ${
                                kw.priority === 'High'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                  : kw.priority === 'Medium'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {kw.priority}
                              </span>
                            </td>

                            {/* Mapping Status */}
                            <td className="py-3.5 px-3 align-top">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                kw.mappingStatus === 'Mapped'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : kw.mappingStatus === 'Needs Review'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  kw.mappingStatus === 'Mapped' ? 'bg-emerald-500' : kw.mappingStatus === 'Needs Review' ? 'bg-amber-500' : 'bg-rose-500'
                                }`} />
                                <span>{kw.mappingStatus}</span>
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-3.5 align-top text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditKeyword(kw)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#6324FC] hover:bg-[#6324FC]/10 transition-colors"
                                  title="Edit keyword mapping"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteKeyword(kw)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                  title="Delete keyword"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>

                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: BASELINE & SOURCE OBSERVATIONS */}
        {/* ========================================================================= */}
        {activeMainTab === 'baseline' && (
          <div className="space-y-6">

            {/* GSC Baseline Matrix (Dashboard Glassmorphic Standard) */}
            <div className="group glass-card rounded-2xl p-6 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25 shadow-sm dark:shadow-md transition-all duration-300 relative overflow-hidden space-y-4">
              {/* Radial Hover Spotlight */}
              <div
                className="absolute -top-10 -right-10 w-36 h-36 blur-[35px] rounded-full opacity-20 dark:opacity-30 group-hover:opacity-80 transition-all duration-500 pointer-events-none"
                style={{ backgroundColor: '#6324FC' }}
              />
              {/* Top Accent Neon Line */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] transition-all duration-500 opacity-90 group-hover:opacity-100"
                style={{
                  backgroundImage: 'linear-gradient(to right, transparent, #6324FC, transparent)',
                  boxShadow: '0 0 10px #6324FC',
                }}
              />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-heading font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 size={18} className="text-[#6324FC]" />
                    Google Search Console Baseline
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Filter: {project.baseline?.gsc?.period || 'Last 3 months / United States / Web'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-[#6324FC] dark:text-[#00E5FF] px-2.5 py-1 rounded-lg bg-[#6324FC]/10 border border-[#6324FC]/20">
                  US Search Filtered
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Clicks</span>
                  <div className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-1">
                    {project.baseline?.gsc?.organicClicks || 20}
                  </div>
                  <span className="text-[10px] text-slate-500">US Organic Traffic</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Impressions</span>
                  <div className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-1">
                    {project.baseline?.gsc?.impressions || 374}
                  </div>
                  <span className="text-[10px] text-slate-500">Search Appearances</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Average CTR</span>
                  <div className="text-2xl font-mono font-black text-emerald-500 mt-1">
                    {((project.baseline?.gsc?.ctr || 0.053) * 100).toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-slate-500">Click-through Rate</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Avg Position</span>
                  <div className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-1">
                    {project.baseline?.gsc?.averagePosition || 28.5}
                  </div>
                  <span className="text-[10px] text-slate-500">All Tracked Queries</span>
                </div>
              </div>
            </div>

            {/* Google Business Profile Discovery (Dashboard Glassmorphic Standard) */}
            <div className="group glass-card rounded-2xl p-6 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25 shadow-sm dark:shadow-md transition-all duration-300 relative overflow-hidden space-y-4">
              {/* Radial Hover Spotlight */}
              <div
                className="absolute -top-10 -right-10 w-36 h-36 blur-[35px] rounded-full opacity-20 dark:opacity-30 group-hover:opacity-80 transition-all duration-500 pointer-events-none"
                style={{ backgroundColor: '#00E5FF' }}
              />
              {/* Top Accent Neon Line */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] transition-all duration-500 opacity-90 group-hover:opacity-100"
                style={{
                  backgroundImage: 'linear-gradient(to right, transparent, #00E5FF, transparent)',
                  boxShadow: '0 0 10px #00E5FF',
                }}
              />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-heading font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe size={18} className="text-[#00E5FF]" />
                    Google Business Profile (October Discovery)
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Period: {project.baseline?.gbp?.period || 'October 2026 Discovery Matrix'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  {project.baseline?.gbp?.profileViews || 246} Profile Views
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Calls Initiated</span>
                  <div className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-1">
                    {project.baseline?.gbp?.calls || 3}
                  </div>
                  <span className="text-[10px] text-slate-500">Phone inquiries</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Direction Requests</span>
                  <div className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-1">
                    {project.baseline?.gbp?.directionRequests || 31}
                  </div>
                  <span className="text-[10px] text-slate-500">Studio maps routing</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Website Clicks</span>
                  <div className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-1">
                    {project.baseline?.gbp?.websiteClicks || 2}
                  </div>
                  <span className="text-[10px] text-slate-500">From Google Maps</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Interactions</span>
                  <div className="text-2xl font-mono font-black text-[#6324FC] dark:text-[#00E5FF] mt-1">
                    {project.baseline?.gbp?.profileInteractions || 36}
                  </div>
                  <span className="text-[10px] text-slate-500">Combined discovery actions</span>
                </div>
              </div>
            </div>

            {/* Core Web Vitals Lab Baseline (Dashboard Glassmorphic Standard) */}
            <div className="group glass-card rounded-2xl p-6 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25 shadow-sm dark:shadow-md transition-all duration-300 relative overflow-hidden space-y-4">
              {/* Radial Hover Spotlight */}
              <div
                className="absolute -top-10 -right-10 w-36 h-36 blur-[35px] rounded-full opacity-20 dark:opacity-30 group-hover:opacity-80 transition-all duration-500 pointer-events-none"
                style={{ backgroundColor: '#EF4444' }}
              />
              {/* Top Accent Neon Line */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] transition-all duration-500 opacity-90 group-hover:opacity-100"
                style={{
                  backgroundImage: 'linear-gradient(to right, transparent, #EF4444, transparent)',
                  boxShadow: '0 0 10px #EF4444',
                }}
              />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-heading font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Gauge size={18} className="text-rose-500" />
                    Lighthouse Speed &amp; Web Vitals Diagnostics
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Baseline test captured on {format(new Date(project.lastAudited || new Date()), 'PPpp')}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-rose-500 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  Mobile LCP Investigation (SEO-016)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Mobile Diagnostic Card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">Mobile Lighthouse</span>
                    <span className="font-mono font-black text-rose-500 text-lg">
                      {project.baseline?.pageSpeed?.mobile?.performance || 48} / 100
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-white dark:bg-[#0c0d14] border border-black/5 dark:border-white/5">
                      <span className="text-[9px] text-slate-400 block">LCP</span>
                      <span className="font-bold text-rose-500">{project.baseline?.pageSpeed?.mobile?.lcp || 17.8}s</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#0c0d14] border border-black/5 dark:border-white/5">
                      <span className="text-[9px] text-slate-400 block">FCP</span>
                      <span className="font-bold text-amber-500">{project.baseline?.pageSpeed?.mobile?.fcp || 5.5}s</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#0c0d14] border border-black/5 dark:border-white/5">
                      <span className="text-[9px] text-slate-400 block">TBT</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{project.baseline?.pageSpeed?.mobile?.tbt || 340}ms</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#0c0d14] border border-black/5 dark:border-white/5">
                      <span className="text-[9px] text-slate-400 block">CLS</span>
                      <span className="font-bold text-emerald-500">{project.baseline?.pageSpeed?.mobile?.cls || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Desktop Diagnostic Card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">Desktop Lighthouse</span>
                    <span className="font-mono font-black text-emerald-500 text-lg">
                      {project.baseline?.pageSpeed?.desktop?.performance || 86} / 100
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-white dark:bg-[#0c0d14] border border-black/5 dark:border-white/5">
                      <span className="text-[9px] text-slate-400 block">LCP</span>
                      <span className="font-bold text-emerald-500">{project.baseline?.pageSpeed?.desktop?.lcp || 3.3}s</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#0c0d14] border border-black/5 dark:border-white/5">
                      <span className="text-[9px] text-slate-400 block">FCP</span>
                      <span className="font-bold text-emerald-500">{project.baseline?.pageSpeed?.desktop?.fcp || 0.9}s</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#0c0d14] border border-black/5 dark:border-white/5">
                      <span className="text-[9px] text-slate-400 block">TBT</span>
                      <span className="font-bold text-amber-500">{project.baseline?.pageSpeed?.desktop?.tbt || 830}ms</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#0c0d14] border border-black/5 dark:border-white/5">
                      <span className="text-[9px] text-slate-400 block">CLS</span>
                      <span className="font-bold text-emerald-500">{project.baseline?.pageSpeed?.desktop?.cls || 0}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: AI SEARCH ENGINE OPTIMIZATION (AEO) */}
        {/* ========================================================================= */}
        {activeMainTab === 'aeo' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-heading font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu size={18} className="text-[#6324FC]" />
                AI Search Engine Visibility (ChatGPT, Perplexity &amp; Claude Citations)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates how often Hector Rivera Photography is recommended in direct conversational AI prompt answers
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                <span className="text-xs font-heading font-bold text-slate-400 uppercase tracking-wider block">ChatGPT Mentions Score</span>
                <div className="text-3xl font-mono font-black text-[#6324FC] dark:text-[#00E5FF] mt-2">
                  {project.aeo?.chatgptMentions || 142}
                </div>
                <span className="text-xs text-emerald-500 font-semibold mt-1 inline-block">
                  ↑ +{project.aeo?.chatgptTrendValue || 14}% month-over-month growth
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                <span className="text-xs font-heading font-bold text-slate-400 uppercase tracking-wider block">Perplexity AI Recommendation Index</span>
                <div className="text-3xl font-mono font-black text-emerald-500 mt-2">
                  {project.aeo?.perplexityScore || 82} / 100
                </div>
                <span className="text-xs text-emerald-500 font-semibold mt-1 inline-block">
                  ↑ +{project.aeo?.perplexityTrendValue || 8}% top NJ wedding citations
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: WEEKLY SEO REPORTS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeMainTab === 'reports' && (
          <div className="space-y-4">

            {/* Header & Create Report Action */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0a0a0d] p-5 rounded-2xl border border-black/10 dark:border-white/10 shadow-xs">
              <div>
                <h3 className="text-base font-heading font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText size={18} className="text-[#6324FC]" />
                  Weekly SEO Performance Deliverables
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Generate snapshot deliverables, manage sprint cadence, and track client approvals
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Link
                  href={`/seo/${project.slug || project._id}`}
                  target="_blank"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-xs font-heading font-bold hover:border-[#6324FC]/50 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Eye size={14} className="text-[#6324FC]" />
                  <span>View Public Portal</span>
                </Link>

                <button
                  type="button"
                  onClick={handleOpenAddReport}
                  className="h-9 group relative p-[2px] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(99,36,252,0.35)] hover:shadow-[0_0_35px_rgba(0,229,255,0.5),0_0_20px_rgba(236,72,153,0.35)]"
                >
                  <span
                    className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] blur-[8px] opacity-85 pointer-events-none"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
                    }}
                  />
                  <span
                    className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] opacity-100 pointer-events-none"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
                    }}
                  />
                  <div className="relative z-10 w-full h-full px-3.5 rounded-[10px] bg-white dark:bg-[#0a0a0d] group-hover:bg-slate-50 dark:group-hover:bg-[#121218] text-slate-900 dark:text-white font-heading font-bold text-xs flex items-center gap-2 transition-all">
                    <Plus size={15} className="text-[#00E5FF] group-hover:rotate-90 drop-shadow-[0_0_6px_#00E5FF] transition-transform duration-300" />
                    <span className="tracking-wide group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-[#6324FC] dark:group-hover:from-white dark:group-hover:via-[#00E5FF] dark:group-hover:to-[#EC4899] transition-all">
                      + Create Weekly Report
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Reports List */}
            {reports.length === 0 ? (
              <div className="py-16 px-6 text-center bg-white dark:bg-[#0a0a0d] rounded-2xl border border-black/10 dark:border-white/10">
                <FileText size={32} className="mx-auto text-slate-400 mb-3 opacity-60" />
                <h4 className="text-sm font-heading font-bold text-slate-900 dark:text-white">
                  No Weekly Reports Published Yet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Snapshot current task implementations and performance metrics into a weekly deliverable for {project.clientName}.
                </p>
                <button
                  onClick={handleOpenAddReport}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#6324FC] text-white text-xs font-bold shadow-xs hover:bg-[#521bd6] transition-all"
                >
                  Generate First Weekly Report
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {reports.map((report: any) => {
                  return (
                    <div
                      key={report._id || report.reportId}
                      className="group glass-card rounded-2xl p-5 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25 shadow-sm dark:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      {/* Top Accent Neon Line */}
                      <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-12 group-hover:w-full h-[2px] transition-all duration-500 opacity-80 group-hover:opacity-100"
                        style={{
                          backgroundImage: 'linear-gradient(to right, transparent, #6324FC, transparent)',
                          boxShadow: '0 0 10px #6324FC',
                        }}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#6324FC] dark:text-[#00E5FF]">
                            {report.reportId}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-xs font-medium text-slate-400">
                            {report.reportingDate}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {report.status}
                          </span>
                        </div>
                        <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                          {report.sprintTitle}
                        </h4>
                        {report.executiveSummary && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl line-clamp-2">
                            {report.executiveSummary}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Link
                          href={`/seo/${project.slug || project._id}`}
                          target="_blank"
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5"
                        >
                          <Eye size={13} /> View Portal
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEditReport(report)}
                          className="p-2 rounded-xl text-slate-400 hover:text-[#6324FC] hover:bg-[#6324FC]/10 transition-colors"
                          title="Edit Report"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReport(report)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                          title="Delete Report"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT SEO TASK (Preserves Task ID on Edit, Custom Dropdowns) */}
      {/* ========================================================================= */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0E0F17] rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl max-w-2xl w-full overflow-hidden text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-150">

            {/* Modal Header */}
            <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#6324FC]" />
                  <span className="text-[10px] font-mono font-bold text-[#6324FC] dark:text-[#00E5FF] uppercase tracking-wider">
                    {editingTask ? `EDIT TASK — ${taskForm.taskId}` : 'NEW WORK ITEM'}
                  </span>
                </div>
                <h3 className="text-lg font-heading font-extrabold text-slate-900 dark:text-white">
                  {editingTask ? 'Edit SEO Task Execution Item' : 'Add New SEO Work Item'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTask} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Task ID (Read-only on edit) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span>Task ID *</span>
                    {editingTask && <Lock size={11} className="text-slate-400" />}
                  </label>
                  <input
                    type="text"
                    required
                    readOnly={Boolean(editingTask)}
                    value={taskForm.taskId}
                    onChange={(e) => !editingTask && setTaskForm({ ...taskForm, taskId: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-mono font-bold ${
                      editingTask
                        ? 'bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/5 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white'
                    }`}
                  />
                  {editingTask && (
                    <span className="text-[9.5px] text-slate-400 mt-1 block">
                      Canonical identifier is locked
                    </span>
                  )}
                </div>

                {/* Priority Custom Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Priority Level
                  </label>
                  <CustomSelect
                    value={taskForm.priority}
                    onChange={(val) => setTaskForm({ ...taskForm, priority: val as any })}
                    options={TASK_PRIORITY_OPTIONS}
                    className="w-full"
                    triggerClassName="w-full"
                  />
                </div>

                {/* Status Custom Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Execution Status
                  </label>
                  <CustomSelect
                    value={taskForm.status}
                    onChange={(val) => setTaskForm({ ...taskForm, status: val as any })}
                    options={TASK_STATUS_OPTIONS}
                    className="w-full"
                    triggerClassName="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Work Type (Canonical 8 from Excel) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Work Type (Taxonomy)
                  </label>
                  <CustomSelect
                    value={taskForm.workType}
                    onChange={(val) => setTaskForm({ ...taskForm, workType: val as any })}
                    options={TASK_WORK_TYPE_OPTIONS}
                    className="w-full"
                    triggerClassName="w-full"
                  />
                </div>

                {/* Page / Platform */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Page / Platform Target *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Homepage, /pricing, GSC, GBP"
                    value={taskForm.pageOrPlatform}
                    onChange={(e) => setTaskForm({ ...taskForm, pageOrPlatform: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs focus:outline-hidden focus:border-[#6324FC]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Task Title &amp; Core Focus *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Remove extra title in Code Block"
                  value={taskForm.task}
                  onChange={(e) => setTaskForm({ ...taskForm, task: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold focus:outline-hidden focus:border-[#6324FC]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Before / Audit Finding
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Public HTML contains duplicate title tags causing search engine snippet confusion..."
                  value={taskForm.beforeFinding}
                  onChange={(e) => setTaskForm({ ...taskForm, beforeFinding: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs focus:outline-hidden focus:border-[#6324FC]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Done / Proposed Implementation Action
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Removed conflicting <title> tag from custom embedded code block on /pricing page..."
                  value={taskForm.doneProposedAction}
                  onChange={(e) => setTaskForm({ ...taskForm, doneProposedAction: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs focus:outline-hidden focus:border-[#6324FC]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Why It Matters (Commercial &amp; Technical SEO Impact)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Keeps single canonical title to prevent conflicting snippet output and indexation drops..."
                  value={taskForm.whyItMatters}
                  onChange={(e) => setTaskForm({ ...taskForm, whyItMatters: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs focus:outline-hidden focus:border-[#6324FC]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Task Owner / Lead
                  </label>
                  <input
                    type="text"
                    value={taskForm.owner}
                    onChange={(e) => setTaskForm({ ...taskForm, owner: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs focus:outline-hidden focus:border-[#6324FC]"
                  />
                </div>

                {/* Client Approval / Scope Custom Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Client Approval / Scope
                  </label>
                  <CustomSelect
                    value={taskForm.approvalScope}
                    onChange={(val) => setTaskForm({ ...taskForm, approvalScope: val })}
                    options={TASK_APPROVAL_SCOPE_OPTIONS}
                    className="w-full"
                    triggerClassName="w-full"
                  />
                  <span className="text-[9.5px] text-slate-400 mt-1 block">
                    Controls whether client authorization is required before live release
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Evidence / Source Verification
                </label>
                <input
                  type="text"
                  placeholder="e.g. URL link, screenshot citation, live HTML audit on Oct 28"
                  value={taskForm.evidence}
                  onChange={(e) => setTaskForm({ ...taskForm, evidence: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono focus:outline-hidden focus:border-[#6324FC]"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-black dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="px-5 py-2.5 rounded-xl bg-[#6324FC] hover:bg-[#521bd6] text-white text-xs font-bold shadow-md shadow-[#6324FC]/25 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isSubmittingTask ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{editingTask ? 'Save Task Changes' : 'Create Task Item'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT KEYWORD MAPPING (Phase 5) */}
      {/* ========================================================================= */}
      {isKeywordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0E0F17] rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl max-w-xl w-full overflow-hidden text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-150">

            {/* Modal Header */}
            <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#6324FC]" />
                  <span className="text-[10px] font-mono font-bold text-[#6324FC] dark:text-[#00E5FF] uppercase tracking-wider">
                    TARGET KEYWORD &amp; URL MAPPING
                  </span>
                </div>
                <h3 className="text-lg font-heading font-extrabold text-slate-900 dark:text-white">
                  {editingKeyword ? 'Edit Target Keyword Mapping' : 'Add Target Search Keyword'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsKeywordModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Keyword Form */}
            <form onSubmit={handleSaveKeyword} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Target Search Keyword *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. wedding photographer new jersey"
                  value={keywordForm.keyword}
                  onChange={(e) => setKeywordForm({ ...keywordForm, keyword: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold focus:outline-hidden focus:border-[#6324FC]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Keyword Type
                  </label>
                  <CustomSelect
                    value={keywordForm.keywordType}
                    onChange={(val) => setKeywordForm({ ...keywordForm, keywordType: val as any })}
                    options={KEYWORD_TYPE_OPTIONS}
                    className="w-full"
                    triggerClassName="w-full"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Search Intent
                  </label>
                  <CustomSelect
                    value={keywordForm.searchIntent}
                    onChange={(val) => setKeywordForm({ ...keywordForm, searchIntent: val as any })}
                    options={SEARCH_INTENT_OPTIONS}
                    className="w-full"
                    triggerClassName="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Target Landing Page URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://hectorriveraphotography.com/pricing"
                  value={keywordForm.targetUrl}
                  onChange={(e) => setKeywordForm({ ...keywordForm, targetUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono focus:outline-hidden focus:border-[#6324FC]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Search Volume (Mo.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1200"
                    value={keywordForm.searchVolume || ''}
                    onChange={(e) => setKeywordForm({ ...keywordForm, searchVolume: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono focus:outline-hidden focus:border-[#6324FC]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Difficulty (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 42"
                    value={keywordForm.keywordDifficulty || ''}
                    onChange={(e) => setKeywordForm({ ...keywordForm, keywordDifficulty: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono focus:outline-hidden focus:border-[#6324FC]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Target Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. New Jersey, US"
                    value={keywordForm.targetLocation}
                    onChange={(e) => setKeywordForm({ ...keywordForm, targetLocation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs focus:outline-hidden focus:border-[#6324FC]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Current Google Rank
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 18 (leave empty if unranked)"
                    value={keywordForm.currentPosition}
                    onChange={(e) => setKeywordForm({ ...keywordForm, currentPosition: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono focus:outline-hidden focus:border-[#6324FC]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Target Goal Rank
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 3"
                    value={keywordForm.targetPosition}
                    onChange={(e) => setKeywordForm({ ...keywordForm, targetPosition: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono focus:outline-hidden focus:border-[#6324FC]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <CustomSelect
                    value={keywordForm.priority}
                    onChange={(val) => setKeywordForm({ ...keywordForm, priority: val as any })}
                    options={TASK_PRIORITY_OPTIONS}
                    className="w-full"
                    triggerClassName="w-full"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Mapping Status
                  </label>
                  <CustomSelect
                    value={keywordForm.mappingStatus}
                    onChange={(val) => setKeywordForm({ ...keywordForm, mappingStatus: val as any })}
                    options={KEYWORD_STATUS_OPTIONS}
                    className="w-full"
                    triggerClassName="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Strategy Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Align H1, meta description, and alt tags with NJ wedding portfolio gallery..."
                  value={keywordForm.notes}
                  onChange={(e) => setKeywordForm({ ...keywordForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs focus:outline-hidden focus:border-[#6324FC]"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsKeywordModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-black dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingKeyword}
                  className="px-5 py-2.5 rounded-xl bg-[#6324FC] hover:bg-[#521bd6] text-white text-xs font-bold shadow-md shadow-[#6324FC]/25 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isSubmittingKeyword ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{editingKeyword ? 'Update Keyword Mapping' : 'Save Keyword'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT WEEKLY SEO REPORT */}
      {/* ========================================================================= */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0E0F17] rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl max-w-xl w-full overflow-hidden text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-150">

            <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#00E5FF]" />
                  <span className="text-[10px] font-mono font-bold text-[#6324FC] dark:text-[#00E5FF] uppercase tracking-wider">
                    WEEKLY CLIENT DELIVERABLE
                  </span>
                </div>
                <h3 className="text-lg font-heading font-extrabold text-slate-900 dark:text-white">
                  {editingReport ? 'Edit Weekly Performance Report' : 'Generate Weekly SEO Report'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveReport} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Report Document ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={reportForm.reportId}
                    onChange={(e) => setReportForm({ ...reportForm, reportId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Reporting Date
                  </label>
                  <input
                    type="date"
                    value={reportForm.reportingDate}
                    onChange={(e) => setReportForm({ ...reportForm, reportingDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Sprint / Deliverable Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 01: Baseline Audit & Technical Deliverables"
                  value={reportForm.sprintTitle}
                  onChange={(e) => setReportForm({ ...reportForm, sprintTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Account Cadence
                  </label>
                  <CustomSelect
                    value={reportForm.accountCadence}
                    onChange={(val) => setReportForm({ ...reportForm, accountCadence: val })}
                    options={REPORT_CADENCE_OPTIONS}
                    className="w-full"
                    triggerClassName="w-full"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Publication Status
                  </label>
                  <CustomSelect
                    value={reportForm.status}
                    onChange={(val) => setReportForm({ ...reportForm, status: val })}
                    options={REPORT_STATUS_OPTIONS}
                    className="w-full"
                    triggerClassName="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Executive Summary Narrative
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize key sprint achievements, title template fixes, and search visibility trends for the client..."
                  value={reportForm.executiveSummary}
                  onChange={(e) => setReportForm({ ...reportForm, executiveSummary: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Upcoming Sprint Focus / Next Steps
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Resolve placeholder page approvals, implement NJ commercial photography headings..."
                  value={reportForm.nextSprintFocus}
                  onChange={(e) => setReportForm({ ...reportForm, nextSprintFocus: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-black dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-5 py-2.5 rounded-xl bg-[#6324FC] hover:bg-[#521bd6] text-white text-xs font-bold shadow-md shadow-[#6324FC]/25 flex items-center gap-1.5"
                >
                  {isSubmittingReport ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{editingReport ? 'Save Report Changes' : 'Publish Report'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
