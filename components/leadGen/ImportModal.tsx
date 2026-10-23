'use client';

import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { useScrollLock } from '@/lib/useScrollLock';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  useScrollLock(isOpen);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/lead-gen/import-prospects', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import spreadsheet file');
      }
      setMessage(`Successfully imported ${data.count} prospects into pipeline!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md overscroll-contain"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c0d14] p-6 lg:p-8 shadow-2xl text-slate-900 dark:text-white overscroll-contain">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center space-x-2.5">
          <FileSpreadsheet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          <span>Import Prospects from File</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5">
          Upload your .xlsx, .xls, or .csv file. The spreadsheet should have &apos;Company&apos; and &apos;Business Email&apos; header columns.
        </p>

        <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-black/40 p-7 text-center hover:border-[#6324FC]/50 transition cursor-pointer">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
            id="fileUploadInput"
          />
          <label htmlFor="fileUploadInput" className="cursor-pointer block">
            <Upload className="mx-auto h-9 w-9 text-[#6324FC] dark:text-[#00E5FF] mb-2.5" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block truncate">
              {file ? file.name : 'Click to select spreadsheet file'}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports .xlsx, .xls, and .csv formats
            </p>
          </label>
        </div>

        {message && (
          <div className="mt-4 flex items-center space-x-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center space-x-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-semibold">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3.5 pt-4 border-t border-black/5 dark:border-white/10">
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            Cancel
          </button>
          <button
            disabled={!file || uploading}
            onClick={handleUpload}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:opacity-95 disabled:opacity-50 transition shadow active:scale-95"
          >
            {uploading ? 'Importing...' : 'Upload & Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
