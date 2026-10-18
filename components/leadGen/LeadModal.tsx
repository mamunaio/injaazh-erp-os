'use client';

import React, { useState, useEffect } from 'react';
import { X, Building, Trash2 } from 'lucide-react';
import { Prospect, ProspectStatus, ReplyTag } from '@/types/leadGen';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prospect: Partial<Prospect>) => Promise<void>;
  onDelete?: (id: string) => Promise<void> | void;
  initialData?: Prospect | null;
}

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
  const [reviewCount, setReviewCount] = useState(0);
  const [rating, setRating] = useState(4.0);
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

  const handleDelete = async () => {
    if (!initialData || !onDelete) return;
    const ok = await confirm({
      title: 'Delete Prospect',
      message: `Are you sure you want to permanently delete "${initialData.company}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (ok) {
      setDeleting(true);
      try {
        await onDelete(initialData.id);
        onClose();
      } finally {
        setDeleting(false);
      }
    }
  };

  useEffect(() => {
    if (initialData) {
      setCompany(initialData.company || '');
      setCity(initialData.city || '');
      setState(initialData.state || '');
      setWebsite(initialData.website || '');
      setBusinessEmail(initialData.businessEmail || '');
      setEmailVerified(initialData.emailVerified || 'Pending');
      setMapsRank(initialData.mapsRank || '');
      setReviewCount(initialData.reviewCount || 0);
      setRating(initialData.rating || 4.0);
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
      setRating(4.0);
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        company,
        city,
        state,
        website,
        businessEmail,
        emailVerified,
        mapsRank,
        reviewCount: Number(reviewCount),
        rating: Number(rating),
        gap,
        screenshotLink,
        status,
        replyTag,
        lastContact,
        nextFollowUp,
        notes,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c0d14] p-6 lg:p-8 shadow-2xl my-8 text-slate-900 dark:text-white">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center space-x-2.5">
          <Building className="h-6 w-6 text-[#6324FC] dark:text-[#00E5FF]" />
          <span>{initialData ? 'Edit Prospect Lead Details' : 'Add New Prospect Lead'}</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">HVAC Company Name *</label>
              <input
                type="text"
                required
                placeholder="e.g., Summit HVAC Services"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Business Email Address *</label>
              <input
                type="email"
                required
                placeholder="info@acmehvac.com"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* City, State, Website */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">City</label>
              <input
                type="text"
                placeholder="Austin"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">State</label>
              <input
                type="text"
                placeholder="TX"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Website URL</label>
              <input
                type="text"
                placeholder="https://example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Verification, Maps Rank, Reviews, Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Verified?</label>
              <select
                value={emailVerified}
                onChange={(e) => setEmailVerified(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              >
                <option value="Yes" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Yes</option>
                <option value="No" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">No</option>
                <option value="Pending" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Maps Rank Query</label>
              <input
                type="text"
                placeholder="#6 'hvac repair austin'"
                value={mapsRank}
                onChange={(e) => setMapsRank(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Review Count</label>
              <input
                type="number"
                min="0"
                value={reviewCount}
                onChange={(e) => setReviewCount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Google Rating</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Audit Gap & Screenshot link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Audit Profile Gap Observation
              </label>
              <input
                type="text"
                placeholder="e.g., No service list on Google Business Profile"
                value={gap}
                onChange={(e) => setGap(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Screenshot Proof URL</label>
              <input
                type="url"
                placeholder="https://example.com/screenshot.png"
                value={screenshotLink}
                onChange={(e) => setScreenshotLink(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Status & Reply Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Outreach Stage Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              >
                <option value="New" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">New</option>
                <option value="Verified" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Verified</option>
                <option value="Email 1 sent" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Email 1 sent</option>
                <option value="Follow-up 1" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Follow-up 1</option>
                <option value="Follow-up 2" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Follow-up 2</option>
                <option value="Reply received" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Reply received</option>
                <option value="Audit sent" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Audit sent</option>
                <option value="Call booked" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Call booked</option>
                <option value="Won" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Won</option>
                <option value="Lost" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Lost</option>
                <option value="Suppressed" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Suppressed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Reply Tag</label>
              <select
                value={replyTag}
                onChange={(e) => {
                  const val = e.target.value as ReplyTag;
                  setReplyTag(val);
                  if (val === 'Unsubscribe') {
                    setStatus('Suppressed');
                  }
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              >
                <option value="None" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">None</option>
                <option value="Positive" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Positive</option>
                <option value="Neutral" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Neutral</option>
                <option value="Negative" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Negative</option>
                <option value="Unsubscribe" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Unsubscribe (Auto Suppress)</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Last Contact Date</label>
              <input
                type="date"
                value={lastContact}
                onChange={(e) => setLastContact(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Next Follow-Up Date
              </label>
              <input
                type="date"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Notes &amp; Context</label>
            <textarea
              rows={2}
              placeholder="e.g., Sent personalized Loom video regarding heat pump rebate rankings..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/10">
            <div>
              {initialData && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || saving}
                  className="inline-flex items-center space-x-1.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition active:scale-95 disabled:opacity-50"
                  title="Delete Prospect"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{deleting ? 'Deleting...' : 'Delete Lead'}</span>
                </button>
              )}
            </div>
            <div className="flex items-center space-x-3.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || deleting}
                className="rounded-xl bg-gradient-to-r from-[#6324FC] to-[#4F46E5] hover:opacity-95 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#6324FC]/25 transition active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Saving...' : initialData ? 'Update Lead' : 'Save Prospect'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
