'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, MoreHorizontal, Building2, Mail, Globe, Clock,
  User as UserIcon, DollarSign, Link as LinkIcon, Image as ImageIcon,
  X, Edit2, ArrowRight, Trash2, FileText, Calendar, ExternalLink,
  ChevronRight, ArrowUpRight, ArrowDownRight, Activity, StickyNote,
  LayoutList, Download, Users, Briefcase, DownloadCloud, Loader2, ChevronDown
} from 'lucide-react';
import { createMarketplaceClient, deleteMarketplaceClient, updateMarketplaceClient } from '@/actions/marketplaceClientActions';
import { countryToTimezoneMap } from '@/lib/countryToTimezone';
import { notify } from '@/lib/notify';
import { useUser } from '@/components/layout/UserContext';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';

interface ClientHubClientProps {
  initialClients: any[];
}

type PanelTab = 'profile' | 'notes' | 'timeline';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);
}
function fmtCompact(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(v || 0);
}
function fmtDate(d?: string) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d));
}
function getInitials(name: string) { return name ? name.substring(0, 2).toUpperCase() : '??'; }

const getPlatformBadge = (platform: string) => {
  switch (platform) {
    case 'Upwork': return { bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', border: 'border-[#10B981]/20', dot: 'bg-[#10B981]' };
    case 'Freelancer': return { bg: 'bg-[#0EA5E9]/10', text: 'text-[#0EA5E9]', border: 'border-[#0EA5E9]/20', dot: 'bg-[#0EA5E9]' };
    case 'Fiverr': return { bg: 'bg-[#84CC16]/10', text: 'text-[#84CC16]', border: 'border-[#84CC16]/20', dot: 'bg-[#84CC16]' };
    case 'Direct': return { bg: 'bg-[#A855F7]/10', text: 'text-[#A855F7]', border: 'border-[#A855F7]/20', dot: 'bg-[#A855F7]' };
    default: return { bg: 'bg-[#7C3AED]/10', text: 'text-[#7C3AED]', border: 'border-[#7C3AED]/20', dot: 'bg-[#7C3AED]' };
  }
};

const getAvatarColor = (name: string) => {
  const colors = [
    { bg: 'bg-[#EC4899]/10', text: 'text-[#EC4899]', border: 'border-[#EC4899]/20' },
    { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20' },
    { bg: 'bg-[#14B8A6]/10', text: 'text-[#14B8A6]', border: 'border-[#14B8A6]/20' },
    { bg: 'bg-[#8B5CF6]/10', text: 'text-[#8B5CF6]', border: 'border-[#8B5CF6]/20' },
    { bg: 'bg-[#F43F5E]/10', text: 'text-[#F43F5E]', border: 'border-[#F43F5E]/20' },
    { bg: 'bg-[#3B82F6]/10', text: 'text-[#3B82F6]', border: 'border-[#3B82F6]/20' },
  ];
  if (!name) return colors[0];
  const charCode = name.charCodeAt(0);
  return colors[charCode % colors.length];
};

// ── Input Field Component ──────────────────────────────────────────────────
const InputField = ({ label, icon: Icon, type = "text", value, onChange, placeholder = "", required = false }: any) => (
  <div className="group relative w-full">
    <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">
      {Icon && <Icon size={12} className="text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" />}
      {label} {required && <span className="text-[#EF4444]">*</span>}
    </label>
    <input required={required} type={type} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/10 transition-all placeholder-[#94A3B8]/60" />
  </div>
);

const getLocalTime = (timezone: string) => {
  if (!timezone) return null;
  try {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', timeZone: timezone }).format(new Date());
  } catch (e) {
    return null;
  }
};

export default function ClientHubClient({ initialClients }: ClientHubClientProps) {
  const { user } = useUser();
  const { confirm } = useConfirm();
  const [clients, setClients] = useState(initialClients);
  const [currentTimeTick, setCurrentTimeTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTimeTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);
  
  // ── Preserved State ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const [formData, setFormData] = useState({
    name: '', company: '', email: '', timezone: '', country: '', profileLink: '', profilePic: '', platform: 'Direct', totalSpent: 0,
  });

  // New slide panel tab state
  const [panelTab, setPanelTab] = useState<PanelTab>('profile');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // ── Preserved Logic ─────────────────────────────────────────────────────────
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      if (user?.role === 'marketplace_team' && client.platform === 'Direct') return false;
      if (activeFilter !== 'All' && client.platform !== activeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = client.name?.toLowerCase().includes(q);
        const companyMatch = client.company?.toLowerCase().includes(q);
        if (!nameMatch && !companyMatch) return false;
      }
      return true;
    });
  }, [clients, activeFilter, searchQuery, user]);

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    if (editingClient) {
      const result = await updateMarketplaceClient(editingClient._id, formData);
      if (result.success) {
        setClients(clients.map(c => c._id === editingClient._id ? result.data : c));
        if (selectedClient?._id === editingClient._id) setSelectedClient(result.data);
        notify.edit('Client updated successfully'); closeModal();
      } else { notify.error(result.error || 'Failed to update client'); }
    } else {
      const result = await createMarketplaceClient(formData);
      if (result.success) {
        setClients([result.data, ...clients]);
        notify.success('Client added successfully'); closeModal();
      } else { notify.error(result.error || 'Failed to add client'); }
    }
    setIsSubmitting(false);
  };

  const closeModal = () => {
    setIsAddModalOpen(false); setEditingClient(null);
    setFormData({ name: '', company: '', email: '', timezone: '', country: '', profileLink: '', profilePic: '', platform: 'Direct', totalSpent: 0 });
  };

  const openEditModal = (client: any) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '', company: client.company || '', email: client.email || '',
      timezone: client.timezone || '', country: client.country || '', profileLink: client.profileLink || '',
      profilePic: client.profilePic || '', platform: client.platform || 'Direct', totalSpent: client.totalSpent || 0,
    });
    setIsAddModalOpen(true);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const country = e.target.value;
    let timezone = formData.timezone;
    const tz = countryToTimezoneMap[country.toLowerCase().trim()];
    if (tz) timezone = tz;
    setFormData({ ...formData, country, timezone });
  };

  const handleDeleteClient = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirmed = await confirm({ message: 'Are you sure you want to delete this client?', danger: true });
    if (!isConfirmed) return;
    const result = await deleteMarketplaceClient(id);
    if (result.success) {
      setClients(clients.filter(c => c._id !== id));
      if (selectedClient?._id === id) setSelectedClient(null);
      notify.delete('Client deleted');
    } else { notify.error(result.error || 'Failed to delete client'); }
  };

  const handleSaveNotes = async () => {
    if (!selectedClient) return;
    setIsSavingNotes(true);
    try {
      const res = await updateMarketplaceClient(selectedClient._id, { notes: notesDraft });
      if (res.success) {
        setClients(clients.map(c => c._id === selectedClient._id ? res.data : c));
        setSelectedClient(res.data); notify.edit('Notes saved');
      } else { notify.error('Failed to save notes'); }
    } catch (err) { notify.error('An error occurred'); } 
    finally { setIsSavingNotes(false); }
  };

  useEffect(() => {
    if (selectedClient) setNotesDraft(selectedClient.notes || '');
  }, [selectedClient]);

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // ── KPI Logic ───────────────────────────────────────────────────────────────
  const thisMonth = new Date();
  const totalValue = clients.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
  const newThisMonth = clients.filter(c => {
    if (!c.createdAt) return false;
    const d = new Date(c.createdAt);
    return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear();
  }).length;
  const vipClients = clients.filter(c => (c.totalSpent || 0) > 10000).length;
  
  const kpis = [
    { label: 'Total Clients', value: clients.length, color: '#2563EB', trend: '+12%', up: true },
    { label: 'Active',        value: clients.length, color: '#10B981', trend: '+5%', up: true }, // Simplifying active for now
    { label: 'VIP Clients',   value: vipClients,     color: '#F59E0B', trend: '+1', up: true },
    { label: 'New This Month',value: newThisMonth,   color: '#7C3AED', trend: String(newThisMonth), up: true },
    { label: 'Lifetime Value',value: fmtCompact(totalValue), color: '#0EA5E9', trend: '+8%', up: true },
  ];

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } } };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] p-4 md:p-8 selection:bg-[#2563EB]/30">
      <div className="max-w-[1600px] mx-auto">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="mb-8">
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-[10px] bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
                  <Users size={17} />
                </div>
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Customer Relationship Management</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight font-jakarta mb-1.5">Clients</h1>
              <p className="text-sm font-medium text-[#94A3B8]">Manage your network, track spending, and organize communications.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-white dark:bg-[#11131A] text-[#94A3B8] border border-slate-200 dark:border-[#232734] hover:text-slate-900 dark:hover:text-white transition-all">
                <DownloadCloud size={15} /> <span className="hidden sm:inline">Export</span>
              </button>
              <button onClick={() => setIsAddModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#2563EB]/90 text-slate-900 dark:text-white shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_28px_rgba(37,99,235,0.45)] transition-all border border-[#2563EB]/80">
                <Plus size={16} strokeWidth={2.5} /> Add Client
              </button>
            </div>
          </motion.div>

          {/* ── KPI Cards ─────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {kpis.map((k, i) => (
              <motion.div key={k.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 280, damping: 26 }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[18px] p-4 cursor-default group transition-all shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-none"
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[11px] font-bold text-[#94A3B8] leading-tight max-w-[80px]">{k.label}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${k.up ? 'text-[#10B981] bg-[#10B981]/10' : 'text-[#EF4444] bg-[#EF4444]/10'}`}>
                    {k.up ? <ArrowUpRight size={10} className="inline" /> : <ArrowDownRight size={10} className="inline" />} {k.trend}
                  </span>
                </div>
                <p className="text-xl font-bold font-mono tracking-tight" style={{ color: k.color }}>{k.value}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Filter Bar ────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm group">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors pointer-events-none" />
              <input
                type="text"
                placeholder="Search clients…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white placeholder-[#94A3B8]/60 text-sm font-medium rounded-xl pl-11 pr-10 py-2.5 focus:outline-none focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-slate-200 dark:bg-[#232734] flex items-center justify-center text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Platform filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto scrollbar-none">
              {['All', 'Direct', 'Upwork', 'Freelancer', 'Fiverr'].map(f => {
                if (user?.role === 'marketplace_team' && f === 'Direct') return null;
                return (
                  <button key={f} onClick={() => setActiveFilter(f)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex-shrink-0 ${activeFilter === f ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30' : 'bg-white dark:bg-[#11131A] text-[#94A3B8] border-slate-200 dark:border-[#232734] hover:text-slate-900 dark:hover:text-white'}`}>
                    {f}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 hidden md:block" />

            {/* Count */}
            <div className="hidden md:flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl">
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{filteredClients.length}</span>
              <span className="text-xs font-semibold text-[#94A3B8]">clients</span>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Main Content Table ───────────────────────────────────────────── */}
        {filteredClients.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="py-32 flex flex-col items-center justify-center bg-white dark:bg-[#11131A] border border-dashed border-slate-200 dark:border-[#232734] rounded-[20px]">
            <div className="w-16 h-16 rounded-[20px] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center mb-4">
              <Users size={24} className="text-slate-400 dark:text-slate-600" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">No clients found</p>
            <p className="text-xs text-[#94A3B8] mb-6">Add a new client to get started.</p>
            <button onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#2563EB]/90 text-slate-900 dark:text-white text-xs font-bold rounded-xl transition-all">
              <Plus size={14} strokeWidth={2.5} /> Add Client
            </button>
          </motion.div>
        ) : (
          <div className="overflow-hidden rounded-[20px] border border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A] shadow-sm dark:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900/50">
                  <tr className="border-b border-slate-200 dark:border-[#232734]">
                    <th className="pl-5 pr-4 py-3 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest min-w-[240px]">Client</th>
                    <th className="pr-4 py-3 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest min-w-[120px]">Platform</th>
                    <th className="pr-4 py-3 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest min-w-[140px] hidden md:table-cell">Location</th>
                    <th className="pr-4 py-3 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest min-w-[180px] hidden lg:table-cell">Contact</th>
                    <th className="pr-4 py-3 text-right text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest min-w-[120px]">Total Revenue</th>
                    <th className="pr-5 py-3 w-16 text-right text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredClients.map((client: any, i: number) => {
                      const badge = getPlatformBadge(client.platform);
                      const avatar = getAvatarColor(client.name);
                      const localTime = getLocalTime(client.timezone);
                      return (
                        <motion.tr key={client._id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ delay: i * 0.03, type: 'spring', stiffness: 320, damping: 28 }}
                          onClick={() => setSelectedClient(client)}
                          className="border-b border-slate-200 dark:border-slate-800/50 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          {/* Client Name/Avatar */}
                          <td className="pl-5 pr-4 py-4">
                            <div className="flex items-center gap-3">
                              {client.profilePic ? (
                                <img src={client.profilePic} alt="" className="w-9 h-9 rounded-[10px] object-cover border border-slate-200 dark:border-[#232734] flex-shrink-0" />
                              ) : (
                                <div className={`w-9 h-9 rounded-[10px] ${avatar.bg} border ${avatar.border} flex items-center justify-center ${avatar.text} font-bold text-xs flex-shrink-0`}>
                                  {getInitials(client.name)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate hover:text-[#2563EB] transition-colors">{client.name}</p>
                                <p className="text-xs text-[#94A3B8] truncate flex items-center gap-1 mt-0.5">
                                  {client.company ? <><Building2 size={10} /> {client.company}</> : <span className="uppercase tracking-wider text-[9px] font-bold text-[#475569]">Individual</span>}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Platform */}
                          <td className="pr-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${badge.bg} ${badge.border} ${badge.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${badge.dot}`} />
                              {client.platform}
                            </span>
                          </td>

                          {/* Location */}
                          <td className="pr-4 py-4 hidden md:table-cell">
                            {client.country ? (
                              <div className="flex flex-col">
                                <span className="text-sm text-slate-900 dark:text-white flex items-center gap-1.5"><Globe size={13} className="text-[#94A3B8]" /> {client.country}</span>
                                {localTime ? (
                                  <span className="text-[10px] font-bold text-[#0EA5E9] mt-0.5 pl-[19px]">🕙 {localTime} Local</span>
                                ) : client.timezone && (
                                  <span className="text-[10px] font-bold text-[#94A3B8] mt-0.5 pl-[19px]">{client.timezone}</span>
                                )}
                              </div>
                            ) : <span className="text-sm text-[#475569]">—</span>}
                          </td>

                          {/* Contact */}
                          <td className="pr-4 py-4 hidden lg:table-cell">
                            {client.email ? (
                              <a href={`mailto:${client.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-[#2563EB] transition-colors truncate">
                                <Mail size={13} /> {client.email}
                              </a>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); openEditModal(client); }} className="text-[10px] font-bold text-[#94A3B8]/60 hover:text-[#2563EB] transition-colors border border-dashed border-slate-200 dark:border-[#232734] px-2 py-1 rounded-md bg-white dark:bg-[#11131A] shadow-sm">
                                + Add Contact
                              </button>
                            )}
                          </td>

                          {/* Revenue */}
                          <td className="pr-4 py-4 text-right">
                            <span className={`text-sm font-bold font-mono ${client.totalSpent > 0 ? 'text-[#10B981]' : 'text-slate-500'}`}>{fmtCurrency(client.totalSpent)}</span>
                          </td>

                          {/* Actions */}
                          <td className="pr-5 py-4" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditModal(client)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#232734] transition-all" aria-label="Edit">
                                <Edit2 size={13} />
                              </button>
                              <div className="relative">
                                <button onClick={e => toggleMenu(client._id, e)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#232734] transition-all" aria-label="More actions">
                                  <MoreHorizontal size={13} />
                                </button>
                                <AnimatePresence>
                                  {openMenuId === client._id && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                                      transition={{ duration: 0.12 }}
                                      className="absolute right-0 top-8 z-50 w-40 bg-white dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] shadow-xl rounded-[14px] overflow-hidden"
                                    >
                                      <button onClick={e => { setOpenMenuId(null); openEditModal(client); }}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#232734] transition-colors">
                                        <Edit2 size={13} /> Edit
                                      </button>
                                      <button onClick={e => { setOpenMenuId(null); handleDeleteClient(client._id, e); }}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors">
                                        <Trash2 size={13} /> Delete
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
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

        {/* ── Client Slide Panel ────────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedClient && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                onClick={() => setSelectedClient(null)} className="fixed inset-0 bg-black/30 dark:bg-[#09090B]/70 backdrop-blur-sm z-50" />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 lg:p-10 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 24 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="relative w-full max-w-lg max-h-[90vh] bg-white dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-2xl z-50 flex flex-col shadow-2xl overflow-hidden pointer-events-auto"
              >
                {/* Panel Header */}
                <div className="flex-shrink-0 p-6 border-b border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A]">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Client Profile</span>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => handleDeleteClient(selectedClient._id, e as any)} className="p-2 rounded-[10px] text-[#EF4444] hover:bg-[#EF4444]/10 border border-transparent transition-all" aria-label="Delete">
                        <Trash2 size={14} />
                      </button>
                      <button onClick={() => setSelectedClient(null)} className="p-2 rounded-[10px] text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734] border border-slate-200 dark:border-[#232734] transition-all" aria-label="Close">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 mb-4">
                    {selectedClient.profilePic ? (
                      <img src={selectedClient.profilePic} alt="" className="w-12 h-12 rounded-[14px] object-cover border border-slate-200 dark:border-[#232734]" />
                    ) : (
                      <div className={`w-12 h-12 rounded-[14px] ${getAvatarColor(selectedClient.name).bg} border ${getAvatarColor(selectedClient.name).border} flex items-center justify-center ${getAvatarColor(selectedClient.name).text} font-bold text-lg flex-shrink-0`}>
                        {getInitials(selectedClient.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate mb-1">{selectedClient.name}</h2>
                      <p className="text-sm text-[#94A3B8] truncate flex items-center gap-1.5">{selectedClient.company ? <><Building2 size={12}/> {selectedClient.company}</> : 'Individual'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-xs font-bold">
                      <DollarSign size={11} /> {fmtCurrency(selectedClient.totalSpent)}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${getPlatformBadge(selectedClient.platform).bg} ${getPlatformBadge(selectedClient.platform).border} ${getPlatformBadge(selectedClient.platform).text}`}>
                      {selectedClient.platform}
                    </span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex-shrink-0 flex items-center border-b border-slate-200 dark:border-[#232734] px-6 bg-slate-100 dark:bg-[#0D0F16]">
                  {[{ key: 'profile' as const, label: 'Profile', icon: UserIcon }, { key: 'notes' as const, label: 'Notes', icon: StickyNote }, { key: 'timeline' as const, label: 'Timeline', icon: Activity }].map(t => (
                    <button key={t.key} onClick={() => setPanelTab(t.key)}
                      className={`relative flex items-center gap-2 px-4 py-3.5 text-xs font-bold transition-all ${panelTab === t.key ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                      <t.icon size={13} /> {t.label}
                      {panelTab === t.key && <motion.div layoutId="clientPanelTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-t-full" />}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {panelTab === 'profile' && (
                      <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="p-6 space-y-5">
                        <div>
                          <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Contact Information</h3>
                          <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[16px] px-5 py-1 divide-y divide-slate-200 dark:divide-[#232734]/60">
                            {selectedClient.email && (
                              <div className="flex items-center gap-4 py-3">
                                <div className="flex items-center gap-2 w-20 flex-shrink-0"><Mail size={13} className="text-[#94A3B8]" /><span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest">Email</span></div>
                                <a href={`mailto:${selectedClient.email}`} className="flex-1 text-sm font-semibold text-slate-900 dark:text-white hover:text-[#2563EB] truncate">{selectedClient.email}</a>
                              </div>
                            )}
                            {(selectedClient.country || selectedClient.timezone) && (
                              <div className="flex items-center gap-4 py-3">
                                <div className="flex items-center gap-2 w-20 flex-shrink-0"><Globe size={13} className="text-[#94A3B8]" /><span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest">Location</span></div>
                                <span className="flex-1 text-sm font-semibold text-slate-900 dark:text-white truncate">{selectedClient.country || 'Unknown'} {selectedClient.timezone && <span className="text-[#94A3B8] ml-1">({selectedClient.timezone})</span>}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-4 py-3">
                              <div className="flex items-center gap-2 w-20 flex-shrink-0"><Calendar size={13} className="text-[#94A3B8]" /><span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest">Added</span></div>
                              <span className="flex-1 text-sm font-semibold text-slate-900 dark:text-white">{fmtDate(selectedClient.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        {selectedClient.profileLink && (
                          <a href={selectedClient.profileLink} target="_blank" rel="noopener noreferrer" 
                            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#232734] dark:hover:bg-[#2a2e3d] border border-slate-200 dark:border-[#232734] text-slate-700 dark:text-white font-bold text-xs rounded-[10px] transition-colors">
                            View {selectedClient.platform} Profile <ExternalLink size={13} />
                          </a>
                        )}
                        <button onClick={() => openEditModal(selectedClient)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#2563EB]/90 text-slate-900 dark:text-white font-bold text-xs rounded-[10px] transition-all">
                          <Edit2 size={13} /> Edit Client
                        </button>
                      </motion.div>
                    )}

                    {panelTab === 'notes' && (
                      <motion.div key="notes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="p-6">
                        <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[16px] overflow-hidden relative">
                          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-[#232734]">
                            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Notes</span>
                          </div>
                          <textarea
                            value={notesDraft}
                            onChange={e => setNotesDraft(e.target.value)}
                            className="w-full bg-transparent px-4 py-4 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none leading-relaxed min-h-[300px]"
                            placeholder="Add client notes, meeting takeaways, or logs…"
                          />
                          {notesDraft !== (selectedClient.notes || '') && (
                            <button onClick={handleSaveNotes} disabled={isSavingNotes}
                              className="absolute bottom-4 right-4 px-4 py-2 bg-[#2563EB] hover:bg-[#2563EB]/90 text-slate-900 dark:text-white font-bold text-xs rounded-[10px] transition-all disabled:opacity-50">
                              {isSavingNotes ? 'Saving…' : 'Save Notes'}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {panelTab === 'timeline' && (
                      <motion.div key="timeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="p-6">
                        <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-5">Activity Timeline</h3>
                        <div className="space-y-0">
                          {[
                            { icon: UserIcon, color: '#2563EB', title: 'Client Added', sub: 'To marketplace network', time: fmtDate(selectedClient.createdAt) },
                            { icon: Clock, color: '#94A3B8', title: 'Last Updated', sub: 'Profile or notes changed', time: fmtDate(selectedClient.updatedAt) },
                          ].map(({ icon: Icon, color, title, sub, time }, i, arr) => (
                            <div key={title} className="flex gap-4 items-start">
                              <div className="flex flex-col items-center flex-shrink-0">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                                  <Icon size={13} style={{ color }} />
                                </div>
                                {i < arr.length - 1 && <div className="w-px flex-1 bg-slate-200 dark:bg-[#232734] mt-1" style={{ minHeight: 20 }} />}
                              </div>
                              <div className="pb-5 min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-0.5">{title}</p>
                                <p className="text-xs text-[#94A3B8]">{sub}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold mt-1">{time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* ── Add/Edit Modal (preserved exactly but restyled) ───────────────── */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-md" onClick={closeModal} />
              <motion.div initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 24 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="relative w-full max-w-2xl bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px] flex flex-col overflow-hidden shadow-2xl"
              >
                <div className="flex justify-between items-start p-6 border-b border-slate-200 dark:border-[#232734] bg-slate-50 dark:bg-[#09090B]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[14px] bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] flex items-center justify-center text-[#2563EB]">
                      {editingClient ? <Edit2 size={20} /> : <UserIcon size={20} />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
                      <p className="text-xs font-semibold text-[#94A3B8] mt-1">Manage details for your network.</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="p-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
                    <X size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleSaveClient} className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Client Name" icon={UserIcon} value={formData.name} onChange={(e:any) => setFormData({...formData, name: e.target.value})} required placeholder="e.g. John Doe" />
                    <div className="group relative w-full">
                      <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">
                        <Globe size={12} className="text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" /> Platform
                      </label>
                      <div className="relative">
                        <select value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/10 transition-all appearance-none cursor-pointer">
                          {user?.role !== 'marketplace_team' && <option value="Direct">Direct</option>}
                          <option value="Upwork">Upwork</option>
                          <option value="Freelancer">Freelancer</option>
                          <option value="Fiverr">Fiverr</option>
                          <option value="Other">Other</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Company (Optional)" icon={Building2} value={formData.company} onChange={(e:any) => setFormData({...formData, company: e.target.value})} placeholder="e.g. Acme Corp" />
                    <InputField label="Email Address" icon={Mail} type="email" value={formData.email} onChange={(e:any) => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-[20px]">
                    <InputField label="Country" icon={Globe} value={formData.country} onChange={handleCountryChange} placeholder="e.g. United States" />
                    <InputField label="Timezone" icon={Clock} value={formData.timezone} onChange={(e:any) => setFormData({...formData, timezone: e.target.value})} placeholder="e.g. EST" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Profile Link" icon={LinkIcon} type="url" value={formData.profileLink} onChange={(e:any) => setFormData({...formData, profileLink: e.target.value})} placeholder="https://..." />
                    <InputField label="Avatar Image URL" icon={ImageIcon} type="url" value={formData.profilePic} onChange={(e:any) => setFormData({...formData, profilePic: e.target.value})} placeholder="https://..." />
                  </div>

                  <div className="pt-6 mt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-[#232734]">
                    <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-xl text-xs font-bold text-[#94A3B8] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734] transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting || !formData.name} className="px-8 py-2.5 bg-[#2563EB] hover:bg-[#2563EB]/90 text-slate-900 dark:text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
                      {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <>{editingClient ? 'Update Client' : 'Save Client'} <ArrowRight size={14} /></>}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
