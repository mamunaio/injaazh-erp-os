'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Building, 
  Trash2, 
  Mail, 
  Globe, 
  MapPin, 
  Search, 
  Star, 
  MessageSquare, 
  FileText, 
  ExternalLink, 
  Send, 
  Calendar, 
  Clock, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Flame,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prospect, ProspectStatus, ReplyTag } from '@/types/leadGen';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import DatePicker from '@/components/ui/DatePicker';
import { useScrollLock } from '@/lib/useScrollLock';
import toast from 'react-hot-toast';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prospect: Partial<Prospect>) => Promise<void>;
  onDelete?: (id: string) => Promise<void> | void;
  initialData?: Prospect | null;
}

const STATUS_OPTIONS: { value: ProspectStatus; label: string; color: string; badge: string }[] = [
  { value: 'New', label: 'New Prospect', color: '#64748B', badge: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  { value: 'Verified', label: 'Contact Verified', color: '#00E5FF', badge: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
  { value: 'Email 1 sent', label: 'Email 1 Sent', color: '#6324FC', badge: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
  { value: 'Follow-up 1', label: 'Follow-up 1', color: '#8B5CF6', badge: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { value: 'Follow-up 2', label: 'Follow-up 2', color: '#EC4899', badge: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
  { value: 'Reply received', label: 'Reply Received', color: '#14B8A6', badge: 'bg-teal-500/10 text-teal-500 border-teal-500/20' },
  { value: 'Audit sent', label: 'Video Audit Sent', color: '#F59E0B', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { value: 'Call booked', label: 'Strategy Call Booked', color: '#FF6A00', badge: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  { value: 'Won', label: 'Retainer Closed (Won)', color: '#10B981', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { value: 'Lost', label: 'Disqualified / Lost', color: '#64748B', badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  { value: 'Suppressed', label: 'Suppressed (DNC)', color: '#EF4444', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
];

const REPLY_OPTIONS: { value: ReplyTag; label: string; color: string; desc: string }[] = [
  { value: 'None', label: 'None', color: '#64748B', desc: 'No reply received yet' },
  { value: 'Positive', label: 'Positive Interest', color: '#10B981', desc: 'Lead showed interest or requested audit' },
  { value: 'Neutral', label: 'Neutral Question', color: '#F59E0B', desc: 'Asked for info or forwarded to GM' },
  { value: 'Negative', label: 'Not Interested', color: '#EF4444', desc: 'Declined service politely' },
  { value: 'Unsubscribe', label: 'Unsubscribe (Auto Suppress)', color: '#DC2626', desc: 'Requested removal from list' },
];

export default function LeadModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}: LeadModalProps) {
  const [company, setCompany] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [website, setWebsite] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState<'Yes' | 'No' | 'Pending'>('Pending');
  const [mapsRank, setMapsRank] = useState('');
  const [reviewCount, setReviewCount] = useState<number | string>(0);
  const [rating, setRating] = useState<number | string>(4.8);
  const [gap, setGap] = useState('');
  const [screenshotLink, setScreenshotLink] = useState('');
  const [status, setStatus] = useState<ProspectStatus>('New');
  const [replyTag, setReplyTag] = useState<ReplyTag>('None');
  const [lastContact, setLastContact] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { confirm } = useConfirm();

  // Custom Dropdown Open States
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLDivElement>(null);

  // Click outside & Escape key to close custom dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setIsStatusOpen(false);
      }
      if (replyRef.current && !replyRef.current.contains(e.target as Node)) {
        setIsReplyOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsStatusOpen(false);
        setIsReplyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Universal Body & Document Scroll Lock
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) {
      setIsStatusOpen(false);
      setIsReplyOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setCompany(initialData.company || '');
      setCity(initialData.city || '');
      setState(initialData.state || '');
      setWebsite(initialData.website || '');
      setBusinessEmail(initialData.businessEmail || '');
      setEmailVerified(initialData.emailVerified || 'Pending');
      setMapsRank(initialData.mapsRank || '');
      setReviewCount(initialData.reviewCount ?? 0);
      setRating(initialData.rating ?? 4.8);
      setGap(initialData.gap || '');
      setScreenshotLink(initialData.screenshotLink || '');
      setStatus(initialData.status || 'New');
      setReplyTag(initialData.replyTag || 'None');
      setLastContact(initialData.lastContact || '');
      setNextFollowUp(initialData.nextFollowUp || '');
      setNotes(initialData.notes || '');
    } else {
      setCompany('');
      setCity('');
      setState('');
      setWebsite('');
      setBusinessEmail('');
      setEmailVerified('Pending');
      setMapsRank('');
      setReviewCount(0);
      setRating(4.8);
      setGap('');
      setScreenshotLink('');
      setStatus('New');
      setReplyTag('None');
      setLastContact('');
      const d = new Date();
      d.setDate(d.getDate() + 3);
      setNextFollowUp(d.toISOString().split('T')[0]);
      setNotes('');
    }
  }, [initialData, isOpen]);

  const handleDelete = async () => {
    if (!initialData || !onDelete) return;
    const ok = await confirm({
      title: 'Delete HVAC Prospect',
      message: `Are you sure you want to permanently delete "${initialData.company}" from your outreach pipeline? This action cannot be reversed.`,
      confirmText: 'Delete Record',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (ok) {
      setDeleting(true);
      try {
        await onDelete(initialData.id);
        toast.success(`Deleted ${initialData.company}`);
        onClose();
      } catch {
        toast.error('Failed to delete prospect');
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) {
      toast.error('Please enter the HVAC company name');
      return;
    }
    if (!businessEmail.trim()) {
      toast.error('Please enter the business email address');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        company: company.trim(),
        city: city.trim(),
        state: state.trim(),
        website: website.trim(),
        businessEmail: businessEmail.trim(),
        emailVerified,
        mapsRank: mapsRank.trim(),
        reviewCount: Number(reviewCount) || 0,
        rating: Number(rating) || 0,
        gap: gap.trim(),
        screenshotLink: screenshotLink.trim(),
        status,
        replyTag,
        lastContact,
        nextFollowUp,
        notes: notes.trim(),
      });
      toast.success(initialData ? 'Prospect updated successfully!' : 'New prospect added to pipeline!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save prospect');
    } finally {
      setSaving(false);
    }
  };

  const currentStatusObj = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  const currentReplyObj = REPLY_OPTIONS.find((r) => r.value === replyTag) || REPLY_OPTIONS[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md overflow-hidden overscroll-contain"
        >
          {/* Backdrop Click Dismiss */}
          <div className="fixed inset-0" onClick={onClose} />

          {/* Modal Card Surface */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden overscroll-contain"
          >
            {/* Top Multi-tone Neon Accent Glow Line */}
            <div 
              className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#FF6A00] to-transparent shadow-[0_0_15px_#FF6A00]"
            />
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-gradient-to-br from-[#FF6A00]/15 via-[#6324FC]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="p-5 md:p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between relative z-10 bg-slate-50/50 dark:bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0 bg-[#FF6A00]/10 border border-[#FF6A00]/30 text-[#FF6A00]"
                  style={{ boxShadow: '0 0 20px rgba(255, 106, 0, 0.2)' }}
                >
                  <Flame size={24} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/10 text-[#FF6A00] flex items-center gap-1">
                      <Sparkles size={10} />
                      HVAC PIPELINE CRM
                    </span>
                    <span className="text-xs text-secondary">•</span>
                    <span className="text-xs font-mono text-secondary">
                      {initialData ? `ID: #${initialData.id.slice(-6).toUpperCase()}` : 'NEW PROSPECT ENTRY'}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {initialData ? 'Edit Prospect Lead Details' : 'Add New HVAC Prospect Lead'}
                  </h2>
                  <p className="text-xs font-sans text-secondary mt-0.5">
                    Configure company details, Google Maps telemetry, audit gaps, and outreach status.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-500/20 text-secondary hover:text-rose-500 dark:hover:text-rose-400 border border-black/5 dark:border-white/5 hover:border-rose-500/30 transition-colors"
                title="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form 
              id="lead-modal-form" 
              onSubmit={handleSubmit} 
              className="p-5 md:p-6 space-y-5 flex-1 overflow-y-auto overscroll-contain custom-scrollbar relative z-10"
            >
              {/* SECTION 1: Company & Contact Intelligence */}
              <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/60 dark:bg-[#11131a]/60 p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                  <Building size={15} className="text-[#FF6A00]" />
                  <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Company &amp; Contact Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Company Name */}
                  <div>
                    <label className="block text-[11px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      HVAC Company Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Summit Air & Heat"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#FF6A00] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Business Email */}
                  <div>
                    <label className="block text-[11px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      Business Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                      <input
                        type="email"
                        required
                        placeholder="service@summithvac.com"
                        value={businessEmail}
                        onChange={(e) => setBusinessEmail(e.target.value)}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#FF6A00] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Website */}
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      Website URL
                    </label>
                    <div className="relative">
                      <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                      <input
                        type="text"
                        placeholder="https://summithvac.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#FF6A00] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-[11px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      City
                    </label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Austin"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#FF6A00] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-[11px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      State / Region
                    </label>
                    <input
                      type="text"
                      placeholder="TX"
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      maxLength={4}
                      className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#FF6A00] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono placeholder:text-secondary outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Google Maps & Local SEO Telemetry */}
              <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/60 dark:bg-[#11131a]/60 p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/10">
                  <Search size={15} className="text-[#00E5FF]" />
                  <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Google Maps &amp; Local SEO Audit Telemetry
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Maps Rank Query */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      Maps Rank &amp; Query
                    </label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                      <input
                        type="text"
                        placeholder='#7 "ac repair austin tx"'
                        value={mapsRank}
                        onChange={(e) => setMapsRank(e.target.value)}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#00E5FF] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors font-mono"
                      />
                    </div>
                  </div>

                  {/* Google Rating */}
                  <div>
                    <label className="block text-[11px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      Google Rating (0-5)
                    </label>
                    <div className="relative">
                      <Star size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" />
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#00E5FF] rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white font-mono placeholder:text-secondary outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Review Count */}
                  <div>
                    <label className="block text-[11px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      Review Count
                    </label>
                    <div className="relative">
                      <MessageSquare size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                      <input
                        type="number"
                        min="0"
                        value={reviewCount}
                        onChange={(e) => setReviewCount(e.target.value)}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#00E5FF] rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white font-mono placeholder:text-secondary outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Verification Segmented Pill Selector */}
                <div>
                  <label className="block text-[11px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                    Email Verification Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Pending', 'Yes', 'No'] as const).map((opt) => {
                      const isSelected = emailVerified === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setEmailVerified(opt)}
                          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-heading font-bold transition-all border ${
                            isSelected
                              ? opt === 'Yes'
                                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                : opt === 'No'
                                ? 'bg-rose-500/15 border-rose-500/50 text-rose-600 dark:text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                                : 'bg-amber-500/15 border-amber-500/50 text-amber-600 dark:text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                              : 'bg-white dark:bg-[#060608] border-black/5 dark:border-white/5 text-secondary hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {opt === 'Yes' && <CheckCircle2 size={14} className="text-emerald-500" />}
                          {opt === 'Pending' && <Clock size={14} className="text-amber-500" />}
                          {opt === 'No' && <XCircle size={14} className="text-rose-500" />}
                          <span>{opt === 'Yes' ? 'Verified (Yes)' : opt === 'No' ? 'Bounced (No)' : 'Pending Check'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Profile Gap Observation & Proof URL */}
              <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/60 dark:bg-[#11131a]/60 p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/10">
                  <AlertCircle size={15} className="text-amber-500" />
                  <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Audit Profile Gap &amp; Proof Asset
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Audit Gap */}
                  <div>
                    <label className="block text-[11px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      GBP / Profile Gap Observation
                    </label>
                    <div className="relative">
                      <FileText size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                      <input
                        type="text"
                        placeholder="e.g. Missing service list; 2 negative reviews unanswered"
                        value={gap}
                        onChange={(e) => setGap(e.target.value)}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-amber-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Screenshot Link */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-heading font-bold text-secondary uppercase tracking-widest">
                        Screenshot Proof URL
                      </label>
                      {screenshotLink && (
                        <a
                          href={screenshotLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-heading font-bold text-[#00E5FF] hover:underline"
                        >
                          <ExternalLink size={12} />
                          <span>Preview Proof</span>
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <ExternalLink size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                      <input
                        type="url"
                        placeholder="https://i.gyazo.com/proof_audit.png"
                        value={screenshotLink}
                        onChange={(e) => setScreenshotLink(e.target.value)}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-amber-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Outreach Stage & Follow-Up Cadence */}
              <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/60 dark:bg-[#11131a]/60 p-4 sm:p-5 space-y-4 relative z-20">
                <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/10">
                  <Send size={15} className="text-[#6324FC]" />
                  <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Pipeline Stage &amp; Follow-Up Schedule
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Custom Outreach Stage Status Dropdown */}
                  <div>
                    <label className="block text-[11px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      Outreach Stage Status
                    </label>
                    <div ref={statusRef} className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsStatusOpen(!isStatusOpen);
                          setIsReplyOpen(false);
                        }}
                        className={`w-full flex items-center justify-between bg-white dark:bg-[#060608] border rounded-xl px-3.5 py-2.5 text-xs font-heading font-bold text-slate-900 dark:text-white transition-all shadow-sm ${
                          isStatusOpen
                            ? 'border-[#6324FC] ring-2 ring-[#6324FC]/20'
                            : 'border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                            style={{
                              backgroundColor: currentStatusObj.color,
                              boxShadow: `0 0 8px ${currentStatusObj.color}80`
                            }}
                          />
                          <span className="truncate">{currentStatusObj.label}</span>
                        </div>
                        <ChevronDown
                          size={14}
                          className={`text-secondary shrink-0 transition-transform duration-200 ${
                            isStatusOpen ? 'rotate-180 text-[#6324FC]' : ''
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {isStatusOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#0d0e15] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/25 p-1.5 max-h-60 overflow-y-auto custom-scrollbar"
                          >
                            {STATUS_OPTIONS.map((st) => {
                              const isSelected = st.value === status;
                              return (
                                <div
                                  key={st.value}
                                  onClick={() => {
                                    setStatus(st.value);
                                    setIsStatusOpen(false);
                                  }}
                                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-heading transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#6324FC]/10 dark:bg-[#6324FC]/20 text-slate-900 dark:text-white font-bold'
                                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white font-medium'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                      className="w-2 h-2 rounded-full shrink-0"
                                      style={{
                                        backgroundColor: st.color,
                                        boxShadow: isSelected ? `0 0 8px ${st.color}` : undefined
                                      }}
                                    />
                                    <span className="truncate">{st.label}</span>
                                  </div>
                                  {isSelected && (
                                    <Check size={14} className="text-[#6324FC] dark:text-[#00E5FF] shrink-0" />
                                  )}
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Custom Prospect Reply Tag Dropdown */}
                  <div>
                    <label className="block text-[11px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      Prospect Reply Tag
                    </label>
                    <div ref={replyRef} className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsReplyOpen(!isReplyOpen);
                          setIsStatusOpen(false);
                        }}
                        className={`w-full flex items-center justify-between bg-white dark:bg-[#060608] border rounded-xl px-3.5 py-2.5 text-xs font-heading font-bold text-slate-900 dark:text-white transition-all shadow-sm ${
                          isReplyOpen
                            ? 'border-[#6324FC] ring-2 ring-[#6324FC]/20'
                            : 'border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                            style={{
                              backgroundColor: currentReplyObj.color,
                              boxShadow: `0 0 8px ${currentReplyObj.color}80`
                            }}
                          />
                          <span className="truncate">{currentReplyObj.label}</span>
                        </div>
                        <ChevronDown
                          size={14}
                          className={`text-secondary shrink-0 transition-transform duration-200 ${
                            isReplyOpen ? 'rotate-180 text-[#6324FC]' : ''
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {isReplyOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#0d0e15] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/25 p-1.5 max-h-60 overflow-y-auto custom-scrollbar"
                          >
                            {REPLY_OPTIONS.map((rep) => {
                              const isSelected = rep.value === replyTag;
                              return (
                                <div
                                  key={rep.value}
                                  onClick={() => {
                                    setReplyTag(rep.value);
                                    if (rep.value === 'Unsubscribe') {
                                      setStatus('Suppressed');
                                      toast('Prospect set to Suppressed (Unsubscribed)', { icon: '🚫' });
                                    }
                                    setIsReplyOpen(false);
                                  }}
                                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-heading transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#6324FC]/10 dark:bg-[#6324FC]/20 text-slate-900 dark:text-white font-bold'
                                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white font-medium'
                                  }`}
                                >
                                  <div className="min-w-0 pr-2">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{
                                          backgroundColor: rep.color,
                                          boxShadow: isSelected ? `0 0 8px ${rep.color}` : undefined
                                        }}
                                      />
                                      <span className="truncate">{rep.label}</span>
                                    </div>
                                    <p className="text-[10px] text-secondary font-sans font-normal mt-0.5 pl-4 truncate">
                                      {rep.desc}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <Check size={14} className="text-[#6324FC] dark:text-[#00E5FF] shrink-0" />
                                  )}
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Dates: Last Contact & Next Follow-Up */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#6324FC]" /> Last Contact Date
                    </label>
                    <DatePicker
                      value={lastContact}
                      onChange={setLastContact}
                      placeholder="Select Last Contact"
                      color="#6324FC"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#FF6A00]" /> Next Follow-Up Date
                    </label>
                    <DatePicker
                      value={nextFollowUp}
                      onChange={setNextFollowUp}
                      placeholder="Select Next Follow-up"
                      color="#FF6A00"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: Strategic Notes & Intelligence */}
              <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/60 dark:bg-[#11131a]/60 p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                  <Sparkles size={15} className="text-emerald-500" />
                  <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Executive Notes &amp; Strategy Context
                  </h3>
                </div>
                <textarea
                  rows={3}
                  placeholder="Record personalized notes: owner name, Loom pitch angle, heat pump rebate mentions, or follow-up feedback..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors resize-none leading-relaxed"
                />
              </div>
            </form>

            {/* Modal Footer Controls */}
            <div className="p-4 md:px-6 md:py-4 border-t border-black/5 dark:border-white/10 bg-slate-50/70 dark:bg-black/30 flex items-center justify-between gap-3 relative z-10">
              <div>
                {initialData && onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting || saving}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-heading font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition active:scale-95 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    <span>{deleting ? 'Deleting...' : 'Delete Lead'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="lead-modal-form"
                  disabled={saving || deleting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] via-[#F97316] to-[#6324FC] hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-heading font-bold text-white transition-all shadow-[0_0_20px_rgba(255,106,0,0.35)] flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Lead...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>{initialData ? 'Update Prospect Record' : 'Save Prospect to Pipeline'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
