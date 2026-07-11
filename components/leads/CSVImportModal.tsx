'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { importCSVLeads } from '@/app/actions/leadActions';
import toast from 'react-hot-toast';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CSVImportModal({ isOpen, onClose, onSuccess }: CSVImportModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [stats, setStats] = useState<{ total: number; valid: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setStats(null);
    setIsUploading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (selectedFile: File) => {
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file');
      return;
    }

    setFile(selectedFile);
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        setParsedData(data);
        
        // Basic validation count
        const validRows = data.filter(row => 
          row['Business Name'] || row['Name'] || row['company_name']
        );
        
        setStats({
          total: data.length,
          valid: validRows.length
        });
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
        setFile(null);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    
    setIsUploading(true);
    
    // Map CSV headers to database fields
    const mappedData = parsedData.map(row => ({
      company_name: row['Business Name'] || row['Name'] || row['company_name'] || '',
      address: row['Address'] || row['address'] || '',
      phone: row['Phone'] || row['phone'] || '',
      website_url: row['Website'] || row['website'] || row['website_url'] || '',
      email: row['Email'] || row['email'] || '',
      facebook_url: row['Facebook'] || row['facebook'] || row['facebook_url'] || '',
      linkedin_url: row['LinkedIn'] || row['linkedin'] || row['linkedin_url'] || '',
      traffic_count: row['Traffic'] || row['traffic'] || row['traffic_count'] || '',
      business_profile_link: row['Business Profile Link'] || row['business_profile_link'] || '',
      outreach_status: row['Outreach Status'] || row['Outreach'] || row['outreach_status'] || 'New',
      nextFollowUpDate: row['Follow up date'] || row['Follow up Column 1'] || row['follow_up_date'] || null,
      rating: row['Rating'] || row['rating'] || '',
    })).filter(item => item.company_name !== ''); // Remove empty rows

    try {
      const res = await importCSVLeads(mappedData);
      
      if (res.success) {
        toast.success(`Successfully imported ${res.imported} leads!`);
        if (res.duplicates && res.duplicates > 0) {
          toast.error(`${res.duplicates} duplicates were skipped.`);
        }
        onSuccess();
        handleClose();
      } else {
        toast.error(res.error || 'Failed to import leads');
      }
    } catch (error) {
      console.error(error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload size={18} className="text-indigo-400" />
                Import Leads from CSV
              </h2>
              <button
                onClick={handleClose}
                className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {!file ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer
                    ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800'}`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv"
                    className="hidden"
                  />
                  <div className="mb-4 rounded-full bg-indigo-500/20 p-4 text-indigo-400">
                    <Upload size={28} />
                  </div>
                  <h3 className="mb-1 text-lg font-medium text-slate-800 dark:text-slate-200">
                    Click or drag file to this area to upload
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Support for a single CSV file upload. Ensure columns match the standard format.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-800 p-4">
                    <div className="rounded-lg bg-indigo-500/20 p-3 text-indigo-400">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800 dark:text-slate-200">{file.name}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <button 
                      onClick={() => setFile(null)}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-400 transition-colors"
                      disabled={isUploading}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {stats && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-800/50 p-4 text-center">
                        <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{stats.total}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Total Rows</div>
                      </div>
                      <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-800/50 p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">{stats.valid}</div>
                        <div className="text-xs text-emerald-500/70 uppercase tracking-wider mt-1">Valid Leads</div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200/90 flex gap-3">
                    <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      The system will automatically skip duplicate leads based on **Company Name** and **Email**.
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isUploading}
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleImport}
                      disabled={isUploading || !stats || stats.valid === 0}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white hover:bg-indigo-600 transition-colors disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Import {stats?.valid || 0} Leads
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
