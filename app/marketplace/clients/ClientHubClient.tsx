'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Building2, Mail, Globe, Clock,
  User as UserIcon, DollarSign, Link as LinkIcon, Image as ImageIcon,
  X, Edit2, Trash2, FileText, Calendar, ExternalLink,
  ChevronRight, ChevronLeft, ArrowUpRight, Activity, StickyNote,
  LayoutGrid, List, DownloadCloud, Loader2, Sparkles,
  ArrowLeft, Users, Briefcase, ShoppingCart, Shield,
  Copy, Check, Flame, FolderKanban
} from 'lucide-react';
import { 
  createMarketplaceClient, 
  deleteMarketplaceClient, 
  updateMarketplaceClient 
} from '@/actions/marketplaceClientActions';
import { createMarketplaceProject } from '@/app/actions/marketplaceActions';
import { countryToTimezoneMap } from '@/lib/countryToTimezone';
import { useUser } from '@/components/layout/UserContext';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import toast, { Toaster } from 'react-hot-toast';
import CreateMarketplaceProjectModal from '@/components/CreateMarketplaceProjectModal';
import { useScrollLock } from '@/lib/useScrollLock';

interface ClientHubClientProps {
  initialClients: any[];
  allProjects?: any[];
}

type PanelTab = 'profile' | 'notes' | 'timeline';
type ViewMode = 'grid' | 'table';
type SortOption = 'revenue-desc' | 'revenue-asc' | 'name-asc' | 'newest' | 'projects-desc';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(v || 0);
}

function fmtDate(d?: string) {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(new Date(d));
  } catch {
    return '—';
  }
}

function getInitials(name: string) { 
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase(); 
}

const PLATFORMS_CONFIG: Record<string, { 
  name: string; 
  icon: any; 
  color: string; 
  glowColor: string;
  borderColor: string;
  badgeClass: string;
  bg: string;
  dot: string; 
}> = {
  'Freelancer': { 
    name: 'Freelancer', 
    icon: Globe, 
    color: '#00E5FF', 
    glowColor: 'rgba(0,229,255,0.25)',
    borderColor: 'hover:border-[#00E5FF]/60',
    badgeClass: 'bg-[#00E5FF]/10 text-cyan-600 dark:text-[#00E5FF] border-[#00E5FF]/30',
    bg: 'bg-[#00E5FF]/10', 
    dot: 'bg-[#00E5FF]' 
  },
  'Direct': { 
    name: 'Direct Client', 
    icon: Users, 
    color: '#6324FC', 
    glowColor: 'rgba(99,36,252,0.25)',
    borderColor: 'hover:border-[#6324FC]/60',
    badgeClass: 'bg-[#6324FC]/10 text-indigo-600 dark:text-purple-300 border-[#6324FC]/30',
    bg: 'bg-[#6324FC]/10', 
    dot: 'bg-[#6324FC]' 
  },
  'Upwork': { 
    name: 'Upwork', 
    icon: Briefcase, 
    color: '#10B981', 
    glowColor: 'rgba(16,185,129,0.25)',
    borderColor: 'hover:border-[#10B981]/60',
    badgeClass: 'bg-[#10B981]/10 text-emerald-600 dark:text-emerald-400 border-[#10B981]/30',
    bg: 'bg-[#10B981]/10', 
    dot: 'bg-[#10B981]' 
  },
  'Fiverr': { 
    name: 'Fiverr', 
    icon: ShoppingCart, 
    color: '#EC4899', 
    glowColor: 'rgba(236,72,153,0.25)',
    borderColor: 'hover:border-[#EC4899]/60',
    badgeClass: 'bg-[#EC4899]/10 text-pink-600 dark:text-pink-400 border-[#EC4899]/30',
    bg: 'bg-[#EC4899]/10', 
    dot: 'bg-[#EC4899]' 
  },
  'Other': { 
    name: 'Other', 
    icon: Shield, 
    color: '#F59E0B', 
    glowColor: 'rgba(245,158,11,0.25)',
    borderColor: 'hover:border-[#F59E0B]/60',
    badgeClass: 'bg-[#F59E0B]/10 text-amber-600 dark:text-amber-400 border-[#F59E0B]/30',
    bg: 'bg-[#F59E0B]/10', 
    dot: 'bg-[#F59E0B]' 
  }
};

const getPlatformBadge = (platform: string) => {
  const norm = Object.keys(PLATFORMS_CONFIG).find(k => k.toLowerCase() === (platform || '').toLowerCase());
  return norm ? PLATFORMS_CONFIG[norm] : PLATFORMS_CONFIG['Direct'];
};

const getLocalTime = (timezone: string) => {
  if (!timezone) return null;
  try {
    return new Intl.DateTimeFormat('en-US', { 
      hour: 'numeric', 
      minute: 'numeric',
      timeZone: timezone.includes('/') ? timezone : undefined 
    }).format(new Date());
  } catch {
    return null;
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 26 } }
};

export default function ClientHubClient({ initialClients = [], allProjects = [] }: ClientHubClientProps) {
  const router = useRouter();
  const { user } = useUser();
  const { confirm } = useConfirm();
  
  const [clients, setClients] = useState(initialClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  const [tierFilter, setTierFilter] = useState<'All' | 'VIP' | 'Growth' | 'Starter'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('revenue-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Modals & Panels
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Create project shortcut modal from client
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [createProjectPlatform, setCreateProjectPlatform] = useState('Freelancer');

  // Client Notes State
  const [notesDraft, setNotesDraft] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    timezone: '',
    country: '',
    profileLink: '',
    profilePic: '',
    platform: 'Freelancer',
    totalSpent: 0,
    notes: '',
  });

  useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);

  useEffect(() => {
    if (selectedClient) {
      setNotesDraft(selectedClient.notes || '');
    }
  }, [selectedClient]);

  // Prevent background page scrolling when modal is open
  const isAnyModalOpen = Boolean(selectedClient || isAddModalOpen || isCreateProjectOpen);
  useScrollLock(isAnyModalOpen);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Client name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingClient) {
        const result = await updateMarketplaceClient(editingClient._id, formData);
        if (result.success && result.data) {
          setClients(prev => prev.map(c => c._id === editingClient._id ? { ...c, ...result.data } : c));
          if (selectedClient?._id === editingClient._id) {
            setSelectedClient((prev: any) => ({ ...prev, ...result.data }));
          }
          toast.success('Client updated successfully');
          closeModal();
        } else {
          toast.error(result.error || 'Failed to update client');
        }
      } else {
        const result = await createMarketplaceClient(formData);
        if (result.success && result.data) {
          setClients(prev => [{ ...result.data, totalSpent: 0, projectCount: 0, projects: [] }, ...prev]);
          toast.success(`Client "${result.data.name}" added!`);
          closeModal();
        } else {
          toast.error(result.error || 'Failed to add client');
        }
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (client: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      company: client.company || '',
      email: client.email || '',
      timezone: client.timezone || '',
      country: client.country || '',
      profileLink: client.profileLink || '',
      profilePic: client.profilePic || '',
      platform: client.platform || 'Freelancer',
      totalSpent: client.totalSpent || 0,
      notes: client.notes || '',
    });
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingClient(null);
    setFormData({
      name: '',
      company: '',
      email: '',
      timezone: '',
      country: '',
      profileLink: '',
      profilePic: '',
      platform: 'Freelancer',
      totalSpent: 0,
      notes: '',
    });
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const country = e.target.value;
    let timezone = formData.timezone;
    const tz = countryToTimezoneMap[country.toLowerCase().trim()];
    if (tz) timezone = tz;
    setFormData({ ...formData, country, timezone });
  };

  const handleDeleteClient = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isConfirmed = await confirm({
      title: 'Delete Client Record?',
      message: 'Are you sure you want to delete this client? This action cannot be undone.',
      danger: true,
      confirmText: 'Delete Client',
    });
    if (!isConfirmed) return;

    try {
      const result = await deleteMarketplaceClient(id);
      if (result.success) {
        setClients(prev => prev.filter(c => c._id !== id));
        if (selectedClient?._id === id) setSelectedClient(null);
        toast.success('Client deleted');
      } else {
        toast.error(result.error || 'Failed to delete client');
      }
    } catch {
      toast.error('Error deleting client');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedClient) return;
    setIsSavingNotes(true);
    try {
      const res = await updateMarketplaceClient(selectedClient._id, { notes: notesDraft });
      if (res.success && res.data) {
        setClients(prev => prev.map(c => c._id === selectedClient._id ? { ...c, notes: notesDraft } : c));
        setSelectedClient((prev: any) => ({ ...prev, notes: notesDraft }));
        toast.success('Notes saved');
      } else {
        toast.error('Failed to save notes');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCopyEmail = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    toast.success('Email copied to clipboard');
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleExportCSV = () => {
    if (clients.length === 0) {
      toast.error('No clients to export');
      return;
    }

    const headers = ['Name', 'Company', 'Email', 'Platform', 'Country', 'Timezone', 'Total Spent', 'Projects', 'Created At'];
    const rows = clients.map(c => [
      `"${c.name || ''}"`,
      `"${c.company || ''}"`,
      `"${c.email || ''}"`,
      `"${c.platform || ''}"`,
      `"${c.country || ''}"`,
      `"${c.timezone || ''}"`,
      c.totalSpent || 0,
      c.projectCount || (c.projects ? c.projects.length : 0),
      `"${fmtDate(c.createdAt)}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `marketplace_clients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported clients to CSV');
  };

  // ── Filtered & Sorted Clients ─────────────────────────────────────────────
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      if (user?.role === 'marketplace_team' && client.platform === 'Direct') return false;
      
      // Platform filter
      if (platformFilter !== 'All') {
        if ((client.platform || '').toLowerCase() !== platformFilter.toLowerCase()) return false;
      }

      // Spending tier filter
      const spent = client.totalSpent || 0;
      if (tierFilter === 'VIP' && spent < 5000) return false;
      if (tierFilter === 'Growth' && (spent < 1000 || spent >= 5000)) return false;
      if (tierFilter === 'Starter' && spent >= 1000) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = client.name?.toLowerCase().includes(q);
        const companyMatch = client.company?.toLowerCase().includes(q);
        const emailMatch = client.email?.toLowerCase().includes(q);
        const countryMatch = client.country?.toLowerCase().includes(q);
        const notesMatch = client.notes?.toLowerCase().includes(q);
        if (!nameMatch && !companyMatch && !emailMatch && !countryMatch && !notesMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'revenue-desc') return (b.totalSpent || 0) - (a.totalSpent || 0);
      if (sortBy === 'revenue-asc') return (a.totalSpent || 0) - (b.totalSpent || 0);
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      if (sortBy === 'projects-desc') return (b.projectCount || b.projects?.length || 0) - (a.projectCount || a.projects?.length || 0);
      return 0;
    });
  }, [clients, platformFilter, tierFilter, searchQuery, sortBy, user]);

  // Reset pagination to page 1 whenever filters or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, platformFilter, tierFilter, sortBy]);

  const totalItems = filteredClients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedClients = useMemo(() => {
    const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
    return filteredClients.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredClients, validPage]);

  // ── KPI Telemetry Calculations ────────────────────────────────────────────
  const totalRevenue = clients.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
  const vipCount = clients.filter(c => (c.totalSpent || 0) >= 5000).length;
  const avgSpent = clients.length > 0 ? Math.round(totalRevenue / clients.length) : 0;
  
  const uniqueCountries = useMemo(() => {
    const set = new Set(clients.map(c => c.country?.trim()).filter(Boolean));
    return set.size;
  }, [clients]);

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = { Freelancer: 0, Direct: 0, Upwork: 0, Fiverr: 0 };
    clients.forEach(c => {
      const p = c.platform || 'Direct';
      if (counts[p] !== undefined) counts[p]++;
      else counts['Direct']++;
    });
    return counts;
  }, [clients]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060608] text-slate-900 dark:text-white p-4 md:p-8 pt-6 pb-24 font-sans selection:bg-[#6324FC] selection:text-white">
      <Toaster position="top-right" />
      
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/6 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#6324FC]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-[#00E5FF]/5 rounded-full blur-[130px]" />
      </div>

      <div className="max-w-[1680px] mx-auto relative z-10 space-y-6">

        {/* ── Page Header & Telemetry Actions ───────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
          
          {/* Navigation Breadcrumb Bar */}
          <div className="flex items-center justify-between gap-4">
            <Link 
              href="/marketplace"
              className="group inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-[#6324FC]/60 dark:hover:border-[#00E5FF]/60 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-heading font-bold shadow-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,36,252,0.25)] hover:-translate-x-1"
            >
              <div className="w-5 h-5 rounded-lg bg-black/5 dark:bg-white/5 group-hover:bg-[#6324FC]/15 dark:group-hover:bg-[#00E5FF]/15 flex items-center justify-center text-secondary group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-all duration-300">
                <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
              </div>
              <span>Back to Marketplace Directory</span>
              <span className="text-secondary/40 font-mono text-[11px]">•</span>
              <span className="text-secondary font-mono text-[11px]">CRM Hub</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/60 dark:bg-[#0a0a0d]/60 backdrop-blur-md border border-black/5 dark:border-white/5 text-xs font-mono text-secondary">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" />
              <span>Marketplace</span>
              <span className="opacity-40">/</span>
              <span className="text-slate-900 dark:text-white font-bold">CRM Clients</span>
            </div>
          </div>

          {/* Dynamic Channel Header Banner (Unified Card matching Executive Hub) */}
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden shadow-lg dark:shadow-2xl">
            {/* Top Neon Glow line */}
            <div 
              className="absolute top-0 left-0 right-0 h-[2.5px]"
              style={{ 
                backgroundImage: 'linear-gradient(to right, transparent, #00E5FF, transparent)',
                boxShadow: '0 0 14px #00E5FF'
              }}
            />

            <div className="flex items-center gap-5">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md shrink-0 transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundColor: '#00E5FF15',
                  border: '1px solid #00E5FF35',
                  color: '#00E5FF',
                  boxShadow: '0 0 25px #00E5FF25'
                }}
              >
                <Globe size={32} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border bg-cyan-500/10 text-cyan-600 dark:text-[#00E5FF] border-cyan-500/30">
                    <Sparkles size={10} className="inline mr-1" />
                    CLIENT NETWORK CRM
                  </span>
                  <span className="text-xs text-secondary">•</span>
                  <span className="text-xs font-mono text-secondary">
                    {clients.length} Total Client Accounts Logged
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-slate-900 dark:text-white">
                  Client Network & CRM
                </h1>
                <p className="text-xs md:text-sm font-sans text-secondary mt-0.5">
                  Global client directory, contract history, lifetime value tracking, and communication telemetry.
                </p>
              </div>
            </div>

            {/* Action Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Search Input */}
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects or clients..." 
                  className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-secondary hover:text-slate-900 dark:hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'grid' ? 'bg-[#6324FC] text-white shadow-[0_0_10px_rgba(99,36,252,0.5)]' : 'text-secondary hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Grid Cards View"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'table' ? 'bg-[#6324FC] text-white shadow-[0_0_10px_rgba(99,36,252,0.5)]' : 'text-secondary hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Data Table View"
                >
                  <List size={15} />
                </button>
              </div>
              
              {/* + Add Client Laser Beam CTA (Symmetrically Calibrated Clockwise Single Stream) */}
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="h-10 group relative p-[2px] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(99,36,252,0.35)] hover:shadow-[0_0_35px_rgba(0,229,255,0.5),0_0_20px_rgba(236,72,153,0.35)]"
              >
                {/* Perfectly Centered Square Conic Glow Aura (Uniform Distance on All 4 Sides) */}
                <span 
                  className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] blur-[8px] opacity-85 pointer-events-none" 
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
                  }}
                />
                
                {/* Crisp Symmetrical Single Laser Beam Stream (Clockwise: Left to Right Loop) */}
                <span 
                  className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] opacity-100 pointer-events-none" 
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
                  }}
                />
                
                {/* Inner High-Contrast Surface: Concentric 10px radius matching outer 12px minus 2px */}
                <div className="relative z-10 w-full h-full px-4 rounded-[10px] bg-white dark:bg-[#0a0a0d] group-hover:bg-slate-50 dark:group-hover:bg-[#121218] text-slate-900 dark:text-white font-heading font-bold text-xs flex items-center gap-2 transition-all">
                  <Briefcase size={14} className="text-[#00E5FF] group-hover:rotate-6 group-hover:scale-110 drop-shadow-[0_0_6px_#00E5FF] transition-transform duration-300" />
                  <span className="tracking-wide group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-[#6324FC] dark:group-hover:from-white dark:group-hover:via-[#00E5FF] dark:group-hover:to-[#EC4899] transition-all whitespace-nowrap">
                    + Add Client
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* ── Executive KPI Telemetry Cards (Dashboard Elevation) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 pt-1">
            
            {/* KPI 1: Total Clients */}
            <motion.div
              variants={itemVariants}
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#6324FC]/60 hover:shadow-[0_16px_36px_rgba(99,36,252,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              {/* Radial Hover Spotlight */}
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#6324FC]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              {/* Top Accent Neon Line - Expands on Hover */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#6324FC]" />
              {/* Subtle Card Glass Sheen */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#6324FC]/15 border border-[#6324FC]/30 flex items-center justify-center text-indigo-600 dark:text-[#6324FC] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(99,36,252,0.6)] group-hover:border-[#6324FC] transition-all duration-300 shadow-sm">
                  <Users size={20} />
                </div>
                <span className="text-xs font-heading font-bold text-indigo-600 dark:text-[#00E5FF] bg-[#6324FC]/10 dark:bg-[#6324FC]/15 px-2.5 py-1 rounded-lg border border-[#6324FC]/20 dark:border-[#6324FC]/30 group-hover:border-[#6324FC]/50 transition-colors">
                  Live Network
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Total Client Accounts</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#6324FC] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#00E5FF] transition-all">
                  {clients.length}
                </p>
                <div className="mt-2 flex items-center gap-1.5 flex-wrap text-xs font-mono">
                  <span className="text-cyan-600 dark:text-[#00E5FF] font-bold">{platformCounts.Freelancer} FL</span>
                  <span className="text-secondary">·</span>
                  <span className="text-indigo-600 dark:text-[#A78BFA] font-bold">{platformCounts.Direct} Direct</span>
                  <span className="text-secondary">·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{platformCounts.Upwork} Up</span>
                  <span className="text-secondary">·</span>
                  <span className="text-pink-600 dark:text-pink-400 font-bold">{platformCounts.Fiverr} Fiv</span>
                </div>
              </div>
            </motion.div>

            {/* KPI 2: Lifetime Revenue (LTV) */}
            <motion.div
              variants={itemVariants}
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#10B981]/60 hover:shadow-[0_16px_36px_rgba(16,185,129,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#10B981]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#10B981] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#10B981]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-emerald-600 dark:text-[#10B981] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] group-hover:border-[#10B981] transition-all duration-300 shadow-sm">
                  <DollarSign size={20} />
                </div>
                <span className="text-xs font-heading font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                  <Flame size={13} /> Realized Inflow
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Lifetime Client Spend</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight mt-0.5 group-hover:text-[#10B981] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-emerald-300 dark:group-hover:to-[#00E5FF] transition-all">
                  {fmtCurrency(totalRevenue)}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">Average LTV: {fmtCurrency(avgSpent)} / client</p>
              </div>
            </motion.div>

            {/* KPI 3: VIP Enterprise Clients */}
            <motion.div
              variants={itemVariants}
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#F59E0B]/60 hover:shadow-[0_16px_36px_rgba(245,158,11,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#F59E0B]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#F59E0B]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-amber-600 dark:text-[#F59E0B] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] group-hover:border-[#F59E0B] transition-all duration-300 shadow-sm">
                  <Sparkles size={20} />
                </div>
                <span className="text-xs font-heading font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
                  &gt;$5,000+
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">VIP Enterprise Tier</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-amber-600 dark:text-amber-400 font-mono tracking-tight mt-0.5 group-hover:text-[#F59E0B] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-amber-300 dark:group-hover:to-[#00E5FF] transition-all">
                  {vipCount}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">High-value enterprise partnerships</p>
              </div>
            </motion.div>

            {/* KPI 4: Global Reach & Timezones */}
            <motion.div
              variants={itemVariants}
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#00E5FF]/60 hover:shadow-[0_16px_36px_rgba(0,229,255,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#00E5FF]/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#00E5FF]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center text-cyan-600 dark:text-[#00E5FF] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.6)] group-hover:border-[#00E5FF] transition-all duration-300 shadow-sm">
                  <Globe size={20} />
                </div>
                <span className="text-xs font-heading font-bold text-cyan-600 dark:text-[#00E5FF] bg-[#00E5FF]/10 px-2.5 py-1 rounded-lg border border-[#00E5FF]/20 group-hover:border-[#00E5FF]/40 transition-colors">
                  Global Reach
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Country Footprint</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-cyan-600 dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#00E5FF] transition-all">
                  {uniqueCountries}
                </p>
              </div>
            </motion.div>

          </div>

          {/* ── Secondary Platform & Tier Filter Toolbar ─────────────────────── */}
          <div className="p-4 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl space-y-3.5 shadow-sm dark:shadow-lg">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              
              {/* Platform Pills */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl overflow-x-auto scrollbar-none">
                {['All', 'Freelancer', 'Direct', 'Upwork', 'Fiverr'].map(p => {
                  if (user?.role === 'marketplace_team' && p === 'Direct') return null;
                  const isSelected = platformFilter.toLowerCase() === p.toLowerCase();
                  const pConf = p === 'All' ? null : PLATFORMS_CONFIG[p];
                  return (
                    <button
                      key={p}
                      onClick={() => setPlatformFilter(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        isSelected 
                          ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white border border-black/10 dark:border-white/20 shadow-sm' 
                          : 'text-slate-600 dark:text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                      style={{
                        borderColor: isSelected && pConf ? pConf.color : undefined,
                        color: isSelected && pConf ? pConf.color : undefined
                      }}
                    >
                      {pConf && <pConf.icon size={12} />}
                      <span>{p === 'Direct' ? 'Direct Client' : p}</span>
                    </button>
                  );
                })}
              </div>

              {/* Controls: Tier Filter, Sort, & Export CSV */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Tier Filter */}
                <select
                  value={tierFilter}
                  onChange={(e: any) => setTierFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-heading font-bold text-slate-700 dark:text-secondary focus:text-slate-900 dark:focus:text-white outline-none cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-all"
                >
                  <option value="All">All Tiers</option>
                  <option value="VIP">VIP (&gt;$5,000)</option>
                  <option value="Growth">Growth ($1k-$5k)</option>
                  <option value="Starter">Starter (&lt;$1k)</option>
                </select>

                {/* Sort Filter */}
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-heading font-bold text-slate-700 dark:text-secondary focus:text-slate-900 dark:focus:text-white outline-none cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-all"
                >
                  <option value="revenue-desc">Highest Revenue</option>
                  <option value="revenue-asc">Lowest Revenue</option>
                  <option value="projects-desc">Most Projects</option>
                  <option value="newest">Newest Added</option>
                  <option value="name-asc">Name (A-Z)</option>
                </select>

                {/* Export CSV Button */}
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-heading font-bold bg-slate-100 dark:bg-[#060608] hover:bg-slate-200 dark:hover:bg-[#121218] text-slate-700 dark:text-secondary hover:text-slate-900 dark:hover:text-white border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all cursor-pointer shadow-sm"
                  title="Export Clients to CSV"
                >
                  <DownloadCloud size={14} />
                  <span>Export CSV</span>
                </button>
              </div>

            </div>

            {/* Active Filters Summary */}
            <div className="flex items-center justify-between text-[11px] font-mono text-secondary pt-1 border-t border-black/5 dark:border-white/5">
              <div>
                Showing <span className="text-slate-900 dark:text-white font-bold">{totalItems === 0 ? 0 : (validPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(validPage * ITEMS_PER_PAGE, totalItems)}</span> of <span className="text-slate-900 dark:text-white font-bold">{totalItems}</span> clients (<span className="font-bold text-slate-900 dark:text-white">{clients.length}</span> total)
              </div>
              {(searchQuery || platformFilter !== 'All' || tierFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setPlatformFilter('All');
                    setTierFilter('All');
                  }}
                  className="text-indigo-600 dark:text-[#00E5FF] hover:underline font-bold"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

        </motion.div>

        {/* ── Main Content: Grid vs Table View ──────────────────────────────── */}
        {filteredClients.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-12 md:p-16 rounded-3xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 text-center flex flex-col items-center justify-center shadow-sm dark:shadow-xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-secondary mb-4">
              <Users size={28} />
            </div>
            <h3 className="text-base sm:text-lg font-heading font-bold text-slate-900 dark:text-white mb-1">
              No clients matched your criteria
            </h3>
            <p className="text-xs text-secondary max-w-sm mb-6">
              Try adjusting your search query, platform filter, or add a new client to your CRM database.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6324FC] hover:bg-[#521bd6] text-white text-xs font-heading font-bold transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)]"
            >
              <Plus size={14} /> Add New Client
            </button>
          </motion.div>
        ) : viewMode === 'grid' ? (
          /* ── GRID VIEW (CARDS WITH EXACT SYSTEM DESIGN & HOVER EFFECTS) ── */
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {paginatedClients.map((client: any) => {
              const pBadge = getPlatformBadge(client.platform);
              const localTime = getLocalTime(client.timezone);
              const projectCount = client.projectCount || (client.projects ? client.projects.length : 0);

              return (
                <motion.div
                  key={client._id}
                  variants={itemVariants}
                  onClick={() => setSelectedClient(client)}
                  className={`group glass-card rounded-2xl p-5 md:p-6 min-h-[220px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25 shadow-sm hover:shadow-[0_16px_36px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.7)] ${pBadge.borderColor}`}
                >
                  {/* Radial Hover Spotlight (Dashboard Signature) */}
                  <div 
                    className="absolute -top-10 -right-10 w-36 h-36 blur-[35px] rounded-full opacity-30 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none"
                    style={{ backgroundColor: pBadge.color }}
                  />

                  {/* Top Accent Neon Line - Center-anchored, expands on hover */}
                  <div 
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] transition-all duration-500 opacity-90 shadow-[0_0_10px]"
                    style={{ 
                      backgroundImage: `linear-gradient(to right, transparent, ${pBadge.color}, transparent)`,
                      boxShadow: `0 0 10px ${pBadge.color}`
                    }}
                  />

                  {/* Subtle Card Glass Sheen Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Left Accent Bar (Dashboard Signature) */}
                  <div 
                    className="absolute left-0 top-6 bottom-6 w-[3px] rounded-r-full transition-all duration-300 opacity-80 group-hover:opacity-100"
                    style={{
                      backgroundColor: pBadge.color,
                      boxShadow: `0 0 8px ${pBadge.color}`
                    }}
                  />

                  {/* Card Header: Avatar & Platform Badge */}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-3 mb-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        {client.profilePic ? (
                          <img 
                            src={client.profilePic} 
                            alt={client.name} 
                            className="w-10 h-10 rounded-xl object-cover border border-black/10 dark:border-white/15 shrink-0 shadow-sm group-hover:scale-110 group-hover:border-black/20 dark:group-hover:border-white/30 transition-all duration-300"
                          />
                        ) : (
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-extrabold text-xs shrink-0 shadow-sm transition-all duration-300 group-hover:scale-110"
                            style={{
                              backgroundColor: `${pBadge.color}15`,
                              border: `1px solid ${pBadge.color}35`,
                              color: pBadge.color,
                              boxShadow: `0 0 10px ${pBadge.color}20`
                            }}
                          >
                            {getInitials(client.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-sm font-heading font-extrabold text-slate-900 dark:text-white truncate transition-all duration-300">
                            <span className="group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-indigo-600 dark:group-hover:from-white dark:group-hover:to-[#00E5FF] transition-all">
                              {client.name}
                            </span>
                          </h3>
                          <p className="text-[11px] text-secondary truncate flex items-center gap-1 mt-0.5">
                            {client.company ? (
                              <>
                                <Building2 size={11} className="shrink-0 text-secondary/70" />
                                <span className="truncate">{client.company}</span>
                              </>
                            ) : (
                              <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-secondary/70">Individual Client</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Platform Pill */}
                      <span 
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold shrink-0 border ${pBadge.bg} ${pBadge.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${pBadge.dot}`} />
                        {client.platform || 'Direct'}
                      </span>
                    </div>

                    {/* Metadata & Location / Local Time */}
                    <div className="space-y-1.5 py-2.5 border-y border-black/5 dark:border-white/5 text-xs text-secondary">
                      {/* Location & Time */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 truncate">
                          <Globe size={12} className="text-secondary/70 shrink-0" />
                          <span className="truncate">{client.country || 'International'}</span>
                        </span>
                        {localTime ? (
                          <span className="font-mono text-cyan-600 dark:text-[#00E5FF] text-[10px] font-bold">
                            {localTime}
                          </span>
                        ) : client.timezone ? (
                          <span className="font-mono text-secondary text-[10px]">
                            {client.timezone}
                          </span>
                        ) : null}
                      </div>

                      {/* Email */}
                      {client.email && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1.5 truncate text-secondary hover:text-slate-900 dark:hover:text-white">
                            <Mail size={12} className="text-secondary/70 shrink-0" />
                            <span className="truncate">{client.email}</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyEmail(client.email, e)}
                            className="p-1 text-secondary hover:text-indigo-600 dark:hover:text-[#00E5FF] transition-colors"
                            title="Copy Email"
                          >
                            {copiedEmail === client.email ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Financial Telemetry & Quick Actions */}
                  <div className="pt-3.5 mt-2 relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-[9px] font-heading font-bold text-secondary uppercase tracking-widest">
                          Lifetime Revenue
                        </div>
                        <div className="text-base font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                          {fmtCurrency(client.totalSpent)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[9px] font-heading font-bold text-secondary uppercase tracking-widest">
                          Contracts
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                          {projectCount} Project{projectCount === 1 ? '' : 's'}
                        </div>
                      </div>
                    </div>

                    {/* Quick Button Toolbar */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-black/5 dark:border-white/5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClient(client);
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-[#6324FC]/20 text-slate-700 dark:text-secondary hover:text-indigo-600 dark:hover:text-[#00E5FF] text-[11px] font-heading font-bold transition-all flex items-center justify-center gap-1 border border-black/5 dark:border-white/5 hover:border-indigo-300 dark:hover:border-[#6324FC]/40"
                      >
                        <FileText size={12} /> Dossier
                      </button>

                      {client.profileLink && (
                        <a
                          href={client.profileLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-secondary hover:text-slate-900 dark:hover:text-white transition-colors border border-black/5 dark:border-white/5"
                          title="Open Platform Profile"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={(e) => openEditModal(client, e)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-secondary hover:text-slate-900 dark:hover:text-white transition-colors border border-black/5 dark:border-white/5"
                        title="Edit Client"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteClient(client._id, e)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-600 dark:text-secondary hover:text-rose-600 dark:hover:text-rose-400 transition-colors border border-black/5 dark:border-white/5 hover:border-rose-200 dark:hover:border-rose-500/30"
                        title="Delete Client"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          /* ── TABLE VIEW (TELEMETRY TABLE) ── */
          <div className="overflow-hidden bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl shadow-sm dark:shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#060608] border-b border-black/10 dark:border-white/10">
                  <tr>
                    <th className="pl-5 pr-4 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest min-w-[220px]">
                      Client & Company
                    </th>
                    <th className="pr-4 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest min-w-[120px]">
                      Platform
                    </th>
                    <th className="pr-4 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest min-w-[160px]">
                      Location & Time
                    </th>
                    <th className="pr-4 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest min-w-[180px] hidden md:table-cell">
                      Contact Info
                    </th>
                    <th className="pr-4 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest min-w-[100px] text-center">
                      Contracts
                    </th>
                    <th className="pr-4 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest min-w-[130px] text-right">
                      Lifetime Spend
                    </th>
                    <th className="pr-5 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest text-right w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  <AnimatePresence>
                    {paginatedClients.map((client: any) => {
                      const pBadge = getPlatformBadge(client.platform);
                      const localTime = getLocalTime(client.timezone);
                      const projectCount = client.projectCount || (client.projects ? client.projects.length : 0);

                      return (
                        <motion.tr
                          key={client._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setSelectedClient(client)}
                          className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                        >
                          {/* Client & Avatar */}
                          <td className="pl-5 pr-4 py-3.5">
                            <div className="flex items-center gap-3">
                              {client.profilePic ? (
                                <img 
                                  src={client.profilePic} 
                                  alt="" 
                                  className="w-9 h-9 rounded-xl object-cover border border-black/10 dark:border-white/10 shrink-0 shadow-sm" 
                                />
                              ) : (
                                <div 
                                  className="w-9 h-9 rounded-xl flex items-center justify-center font-heading font-bold text-xs shrink-0 shadow-sm"
                                  style={{
                                    backgroundColor: `${pBadge.color}15`,
                                    border: `1px solid ${pBadge.color}35`,
                                    color: pBadge.color
                                  }}
                                >
                                  {getInitials(client.name)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-heading font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-[#00E5FF] transition-colors text-xs">
                                  {client.name}
                                </p>
                                <p className="text-[10px] text-secondary truncate flex items-center gap-1 mt-0.5">
                                  {client.company ? (
                                    <>
                                      <Building2 size={10} className="shrink-0" /> {client.company}
                                    </>
                                  ) : (
                                    <span className="uppercase tracking-wider font-mono text-[9px] text-secondary/70">Individual</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Platform */}
                          <td className="pr-4 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${pBadge.bg} ${pBadge.badgeClass}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${pBadge.dot}`} />
                              {client.platform || 'Direct'}
                            </span>
                          </td>

                          {/* Location & Time */}
                          <td className="pr-4 py-3.5">
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-800 dark:text-white flex items-center gap-1.5 truncate">
                                <Globe size={12} className="text-secondary shrink-0" />
                                <span className="truncate">{client.country || '—'}</span>
                              </span>
                              {localTime && (
                                <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-[#00E5FF] pl-4 mt-0.5">
                                  🕙 {localTime}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="pr-4 py-3.5 hidden md:table-cell">
                            {client.email ? (
                              <div className="flex items-center gap-1.5 text-xs text-secondary hover:text-slate-900 dark:hover:text-white">
                                <Mail size={12} className="shrink-0" />
                                <span className="truncate">{client.email}</span>
                              </div>
                            ) : (
                              <span className="text-secondary/50 text-[10px] font-mono">—</span>
                            )}
                          </td>

                          {/* Contracts Count */}
                          <td className="pr-4 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono font-bold text-slate-900 dark:text-white">
                              <FolderKanban size={11} className="text-secondary" /> {projectCount}
                            </span>
                          </td>

                          {/* Lifetime Spend */}
                          <td className="pr-4 py-3.5 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                            {fmtCurrency(client.totalSpent)}
                          </td>

                          {/* Actions */}
                          <td className="pr-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedClient(client)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
                                title="Open Dossier"
                              >
                                <FileText size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => openEditModal(client, e)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteClient(client._id, e)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-600 dark:text-secondary hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PAGINATION CONTROLS (MAX 12 CLIENTS PER PAGE) */}
        {/* ========================================================================= */}
        {filteredClients.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 pb-8 border-t border-black/10 dark:border-white/10">
            {/* Range counter */}
            <div className="text-xs font-mono text-secondary">
              Showing <span className="font-bold text-slate-900 dark:text-white">{(validPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold text-slate-900 dark:text-white">{Math.min(validPage * ITEMS_PER_PAGE, totalItems)}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> clients
            </div>

            {/* Page navigation buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                {/* Prev Button */}
                <button
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(1, prev - 1));
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }}
                  disabled={validPage === 1}
                  className="px-3.5 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0d] text-xs font-heading font-bold text-slate-800 dark:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex items-center gap-1 shadow-sm"
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const isActive = pageNum === validPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 350, behavior: 'smooth' });
                        }}
                        className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center ${
                          isActive
                            ? 'bg-[#6324FC] text-white shadow-[0_0_15px_rgba(99,36,252,0.4)] scale-105 font-extrabold'
                            : 'bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 text-secondary hover:text-slate-900 dark:hover:text-white hover:border-black/20 dark:hover:border-white/20'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }}
                  disabled={validPage === totalPages}
                  className="px-3.5 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0d] text-xs font-heading font-bold text-slate-800 dark:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex items-center gap-1 shadow-sm"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Slide-Over Dossier Drawer (Client Details) ────────────────────── */}
        <AnimatePresence>
          {selectedClient && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-xl" 
                onClick={() => setSelectedClient(null)} 
              />

              {/* Dossier Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="relative w-full max-w-2xl my-auto bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.25),0_0_30px_rgba(99,36,252,0.1)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_30px_rgba(99,36,252,0.25)] flex flex-col overflow-hidden z-10 max-h-[92vh] overscroll-contain"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top Platform Line */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[2.5px] z-20"
                  style={{ 
                    backgroundImage: `linear-gradient(to right, transparent, ${getPlatformBadge(selectedClient.platform).color}, transparent)`,
                    boxShadow: `0 0 15px ${getPlatformBadge(selectedClient.platform).color}`
                  }}
                />

                {/* Dossier Header */}
                <div className="p-5 md:p-6 border-b border-black/10 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      {selectedClient.profilePic ? (
                        <img 
                          src={selectedClient.profilePic} 
                          alt="" 
                          className="w-14 h-14 rounded-2xl object-cover border border-black/10 dark:border-white/15 shadow-md shrink-0" 
                        />
                      ) : (
                        <div 
                          className="w-14 h-14 rounded-2xl flex items-center justify-center font-heading font-extrabold text-xl shadow-md shrink-0"
                          style={{
                            backgroundColor: `${getPlatformBadge(selectedClient.platform).color}15`,
                            border: `1px solid ${getPlatformBadge(selectedClient.platform).color}35`,
                            color: getPlatformBadge(selectedClient.platform).color
                          }}
                        >
                          {getInitials(selectedClient.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg md:text-xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                            {selectedClient.name}
                          </h2>
                          <span 
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${getPlatformBadge(selectedClient.platform).bg} ${getPlatformBadge(selectedClient.platform).badgeClass}`}
                          >
                            {selectedClient.platform || 'Direct'}
                          </span>
                        </div>
                        <p className="text-xs font-sans text-secondary mt-0.5 flex items-center gap-1.5">
                          {selectedClient.company ? (
                            <>
                              <Building2 size={12} className="text-secondary/80" /> {selectedClient.company}
                            </>
                          ) : (
                            <span>Individual Client</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedClient(null)} 
                      className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-600 dark:text-secondary hover:text-rose-600 dark:hover:text-rose-400 border border-black/5 dark:border-white/5 hover:border-rose-200 dark:hover:border-rose-500/30 transition-colors shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Top Metric Callouts */}
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5">
                      <div className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">
                        Lifetime Value (LTV)
                      </div>
                      <div className="text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {fmtCurrency(selectedClient.totalSpent)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5">
                      <div className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">
                        Associated Projects
                      </div>
                      <div className="text-lg font-mono font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {selectedClient.projectCount || selectedClient.projects?.length || 0} Contracts
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs Selector */}
                <div className="flex items-center border-b border-black/10 dark:border-white/10 px-5 md:px-6 bg-slate-50/80 dark:bg-[#060608]">
                  {[
                    { key: 'profile' as const, label: 'Overview & Contracts', icon: UserIcon },
                    { key: 'notes' as const, label: 'Strategic CRM Notes', icon: StickyNote },
                    { key: 'timeline' as const, label: 'Activity Timeline', icon: Activity }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setPanelTab(tab.key)}
                      className={`relative flex items-center gap-2 px-4 py-3 text-xs font-heading font-bold transition-all ${
                        panelTab === tab.key 
                          ? 'text-slate-900 dark:text-white' 
                          : 'text-slate-600 dark:text-secondary hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <tab.icon size={13} />
                      <span>{tab.label}</span>
                      {panelTab === tab.key && (
                        <motion.div 
                          layoutId="clientPanelTabGlow" 
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#6324FC] to-[#00E5FF] shadow-[0_0_8px_#00E5FF]" 
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab Body */}
                <div className="p-5 md:p-6 overflow-y-auto max-h-[55vh] custom-scrollbar space-y-5 overscroll-contain">
                  <AnimatePresence mode="wait">
                    
                    {/* TAB 1: OVERVIEW & ASSOCIATED CONTRACTS */}
                    {panelTab === 'profile' && (
                      <motion.div
                        key="tab-profile"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-5"
                      >
                        {/* Contact Information Card */}
                        <div>
                          <h4 className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-2.5">
                            Client Details & Location
                          </h4>
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <span className="text-[10px] font-mono text-secondary uppercase block">Email Address</span>
                                <span className="text-xs font-mono text-slate-900 dark:text-white font-medium break-all">
                                  {selectedClient.email || 'Not provided'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-mono text-secondary uppercase block">Location & Country</span>
                                <span className="text-xs text-slate-900 dark:text-white font-medium flex items-center gap-1 mt-0.5">
                                  <Globe size={12} className="text-indigo-600 dark:text-[#00E5FF]" /> {selectedClient.country || 'International'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-mono text-secondary uppercase block">Timezone & Local Clock</span>
                                <span className="text-xs font-mono text-indigo-600 dark:text-[#00E5FF] font-bold mt-0.5 block">
                                  {selectedClient.timezone ? `${selectedClient.timezone}` : 'UTC'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-mono text-secondary uppercase block">Added to CRM</span>
                                <span className="text-xs font-mono text-slate-900 dark:text-white font-medium mt-0.5 block">
                                  {fmtDate(selectedClient.createdAt)}
                                </span>
                              </div>
                            </div>

                            {selectedClient.profileLink && (
                              <div className="pt-2 border-t border-black/5 dark:border-white/5">
                                <a
                                  href={selectedClient.profileLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-heading font-bold text-indigo-600 dark:text-[#00E5FF] border border-black/10 dark:border-white/10 transition-colors"
                                >
                                  <span>View {selectedClient.platform} Profile</span>
                                  <ExternalLink size={12} />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Associated Projects List */}
                        <div>
                          <div className="flex items-center justify-between mb-2.5">
                            <h4 className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">
                              Associated Contracts ({selectedClient.projects?.length || 0})
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                setCreateProjectPlatform(selectedClient.platform || 'Freelancer');
                                setIsCreateProjectOpen(true);
                              }}
                              className="text-[10px] font-heading font-bold text-indigo-600 dark:text-[#00E5FF] hover:underline flex items-center gap-1"
                            >
                              <Plus size={11} /> Create Project
                            </button>
                          </div>

                          {selectedClient.projects && selectedClient.projects.length > 0 ? (
                            <div className="space-y-2">
                              {selectedClient.projects.map((proj: any) => (
                                <div
                                  key={proj._id}
                                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all flex items-center justify-between gap-3 group"
                                >
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-heading font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-[#00E5FF] transition-colors truncate">
                                      {proj.title}
                                    </h5>
                                    <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-secondary">
                                      <span className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white">
                                        {proj.platform}
                                      </span>
                                      <span>·</span>
                                      <span className={proj.status === 'Completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-[#00E5FF]'}>
                                        {proj.status}
                                      </span>
                                      <span>·</span>
                                      <span>{fmtDate(proj.createdAt)}</span>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                                      {proj.budget || fmtCurrency(proj.earned)}
                                    </span>
                                    <Link
                                      href={`/marketplace/${(proj.platform || 'freelancer').toLowerCase()}/${proj._id}`}
                                      className="text-[10px] text-secondary hover:text-slate-900 dark:hover:text-white font-mono inline-flex items-center gap-0.5 mt-0.5"
                                    >
                                      Details <ChevronRight size={11} />
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5 text-center text-xs text-secondary">
                              No active or past contracts linked to this client yet.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* TAB 2: STRATEGIC NOTES */}
                    {panelTab === 'notes' && (
                      <motion.div
                        key="tab-notes"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">
                            Client Preferences, Meeting Logs & Brief
                          </label>
                          <span className="text-[10px] font-mono text-secondary">
                            {notesDraft.length} characters
                          </span>
                        </div>
                        <textarea
                          rows={10}
                          value={notesDraft}
                          onChange={(e) => setNotesDraft(e.target.value)}
                          placeholder="Record project briefs, negotiation notes, preferred communication channels, hourly rates, or delivery expectations..."
                          className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-2xl p-4 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors resize-none leading-relaxed font-sans"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={handleSaveNotes}
                            disabled={isSavingNotes || notesDraft === (selectedClient.notes || '')}
                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 disabled:opacity-40 text-xs font-heading font-bold text-white transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)] flex items-center gap-1.5"
                          >
                            <Sparkles size={13} />
                            <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB 3: ACTIVITY TIMELINE */}
                    {panelTab === 'timeline' && (
                      <motion.div
                        key="tab-timeline"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-4"
                      >
                        <h4 className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">
                          Audit Trail & Events
                        </h4>
                        <div className="space-y-3">
                          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5 flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-[#6324FC]/15 text-indigo-600 dark:text-[#00E5FF] flex items-center justify-center shrink-0 mt-0.5">
                              <UserIcon size={14} />
                            </div>
                            <div>
                              <p className="text-xs font-heading font-bold text-slate-900 dark:text-white">Client Account Created</p>
                              <p className="text-[10px] text-secondary font-mono mt-0.5">{fmtDate(selectedClient.createdAt)}</p>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5 flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                              <Clock size={14} />
                            </div>
                            <div>
                              <p className="text-xs font-heading font-bold text-slate-900 dark:text-white">Last Modified</p>
                              <p className="text-[10px] text-secondary font-mono mt-0.5">{fmtDate(selectedClient.updatedAt)}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

                {/* Dossier Footer Toolbar */}
                <div className="p-4 md:px-6 md:py-4 border-t border-black/10 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClient(selectedClient._id, e)}
                    className="px-3.5 py-2 rounded-xl text-xs font-heading font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 flex items-center gap-1.5"
                  >
                    <Trash2 size={13} /> Delete Client
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(selectedClient)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-heading font-bold text-slate-800 dark:text-white border border-black/10 dark:border-white/10 transition-colors flex items-center gap-1.5"
                    >
                      <Edit2 size={13} /> Edit Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateProjectPlatform(selectedClient.platform || 'Freelancer');
                        setIsCreateProjectOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-xs font-heading font-bold text-white transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)] flex items-center gap-1.5"
                    >
                      <Plus size={13} /> New Project
                    </button>
                  </div>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Add / Edit Client Modal ───────────────────────────────────────── */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-xl" 
                onClick={closeModal} 
              />

              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="relative w-full max-w-2xl my-auto bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.25),0_0_30px_rgba(99,36,252,0.15)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_30px_rgba(99,36,252,0.25)] flex flex-col overflow-hidden z-10 overscroll-contain"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top Glow Line */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[2.5px] z-20"
                  style={{ 
                    backgroundImage: `linear-gradient(to right, transparent, ${getPlatformBadge(formData.platform).color}, transparent)`,
                    boxShadow: `0 0 15px ${getPlatformBadge(formData.platform).color}`
                  }}
                />

                {/* Header */}
                <div className="p-5 md:p-6 border-b border-black/10 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                      style={{
                        backgroundColor: `${getPlatformBadge(formData.platform).color}15`,
                        border: `1px solid ${getPlatformBadge(formData.platform).color}35`,
                        color: getPlatformBadge(formData.platform).color,
                      }}
                    >
                      {editingClient ? <Edit2 size={20} /> : <UserIcon size={20} />}
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {editingClient ? 'Edit Client Profile' : 'Add New Marketplace Client'}
                      </h2>
                      <p className="text-xs text-secondary mt-0.5">
                        Configure client identity, platform origin, location and contact telemetry.
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={closeModal} 
                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-600 dark:text-secondary hover:text-rose-600 dark:hover:text-rose-400 border border-black/5 dark:border-white/5 hover:border-rose-200 dark:hover:border-rose-500/30 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Form */}
                <form id="client-form" onSubmit={handleSaveClient} className="p-5 md:p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar overscroll-contain">
                  
                  {/* Platform Selector */}
                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      Platform Channel
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['Freelancer', 'Direct', 'Upwork', 'Fiverr'].map(p => {
                        if (user?.role === 'marketplace_team' && p === 'Direct') return null;
                        const pConf = PLATFORMS_CONFIG[p];
                        const PIcon = pConf.icon;
                        const isSelected = formData.platform.toLowerCase() === p.toLowerCase();
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setFormData({ ...formData, platform: p })}
                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-heading font-bold transition-all border ${
                              isSelected 
                                ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white border-indigo-200 dark:border-white/30 shadow-sm' 
                                : 'bg-slate-50 dark:bg-[#060608] text-slate-700 dark:text-secondary hover:text-slate-900 dark:hover:text-white border-black/10 dark:border-white/5 hover:border-black/20 dark:hover:border-white/15'
                            }`}
                            style={{
                              borderColor: isSelected ? pConf.color : undefined,
                              boxShadow: isSelected ? `0 0 12px ${pConf.color}30` : undefined
                            }}
                          >
                            <PIcon size={14} style={{ color: pConf.color }} />
                            <span>{p === 'Direct' ? 'Direct Client' : p}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Name & Company */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                        Client Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Sarah Jenkins"
                          className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                        Company / Brand Name
                      </label>
                      <div className="relative">
                        <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                        <input
                          type="text"
                          value={formData.company}
                          onChange={e => setFormData({ ...formData, company: e.target.value })}
                          placeholder="e.g. Apex Digital Corp"
                          className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email & Country */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          placeholder="sarah@apexdigital.com"
                          className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                        Country (Auto Timezone)
                      </label>
                      <div className="relative">
                        <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                        <input
                          type="text"
                          value={formData.country}
                          onChange={handleCountryChange}
                          placeholder="e.g. United States, Germany, UAE"
                          className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      Timezone Identifier
                    </label>
                    <div className="relative">
                      <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                      <input
                        type="text"
                        value={formData.timezone}
                        onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                        placeholder="e.g. America/New_York or EST (UTC-5)"
                        className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono placeholder:text-secondary outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Profile URL & Avatar URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                        Platform Profile URL
                      </label>
                      <div className="relative">
                        <LinkIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                        <input
                          type="url"
                          value={formData.profileLink}
                          onChange={e => setFormData({ ...formData, profileLink: e.target.value })}
                          placeholder="https://freelancer.com/u/clientname"
                          className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                        Avatar Image URL (Optional)
                      </label>
                      <div className="relative">
                        <ImageIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                        <input
                          type="url"
                          value={formData.profilePic}
                          onChange={e => setFormData({ ...formData, profilePic: e.target.value })}
                          placeholder="https://..."
                          className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      Initial Notes / Scope Brief
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Brief notes about the client, project preferences, or contract details..."
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors resize-none leading-relaxed"
                    />
                  </div>

                </form>

                {/* Footer */}
                <div className="p-4 md:px-6 md:py-4 border-t border-black/10 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2.5 rounded-xl text-xs font-heading font-bold text-slate-600 dark:text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="client-form"
                    disabled={isSubmitting || !formData.name.trim()}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-xs font-heading font-bold text-white transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)] flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>{editingClient ? 'Update Client' : 'Save Client'}</span>
                      </>
                    )}
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Create Project Modal (Launched from Client Dossier) ────────────── */}
        <CreateMarketplaceProjectModal
          isOpen={isCreateProjectOpen}
          onClose={() => setIsCreateProjectOpen(false)}
          defaultPlatform={createProjectPlatform}
          onSave={async (projectData) => {
            try {
              const res = await createMarketplaceProject(projectData);
              if (res.success && res.data) {
                toast.success('Project launched successfully!');
                setIsCreateProjectOpen(false);
                router.refresh();
              } else {
                toast.error(res.error || 'Failed to create project');
              }
            } catch {
              toast.error('Error launching project');
            }
          }}
        />

      </div>
    </div>
  );
}
