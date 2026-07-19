'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Mail, Bot, Type, Loader2, CheckCircle } from 'lucide-react';
import { createCampaign, updateCampaign } from '@/app/actions/campaignActions';
import toast from 'react-hot-toast';

import CampaignLeadsManager from './CampaignLeadsManager';

export default function CampaignBuilderModal({ isOpen, onClose, onSave, initialData = null }: { isOpen: boolean, onClose: () => void, onSave: (campaign: any) => void, initialData?: any }) {
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('');
  const [sequences, setSequences] = useState<any[]>([
    { stepNumber: 1, delayDays: 0, subjectTemplate: '', bodyTemplate: '', useAI: true }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'sequences' | 'leads'>('sequences');

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setNiche(initialData.niche || '');
      if (initialData.sequences && initialData.sequences.length > 0) {
        setSequences(initialData.sequences);
      }
    } else {
      setName('');
      setNiche('');
      setSequences([{ stepNumber: 1, delayDays: 0, subjectTemplate: '', bodyTemplate: '', useAI: true }]);
      setActiveTab('sequences'); // Reset tab on new campaign
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const addStep = () => {
    setSequences([...sequences, {
      stepNumber: sequences.length + 1,
      delayDays: 3,
      subjectTemplate: '',
      bodyTemplate: '',
      useAI: true
    }]);
  };

  const removeStep = (index: number) => {
    const newSeq = [...sequences];
    newSeq.splice(index, 1);
    newSeq.forEach((seq, i) => seq.stepNumber = i + 1);
    setSequences(newSeq);
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSeq = [...sequences];
    newSeq[index][field] = value;
    setSequences(newSeq);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    // Validate sequences
    for (const seq of sequences) {
      if (!seq.bodyTemplate.trim()) {
        toast.error(`Please write the email content or AI instructions for Step ${seq.stepNumber}`);
        return;
      }
    }

    setIsSaving(true);
    let res;
    
    if (initialData && initialData._id) {
      res = await updateCampaign(initialData._id, {
        name,
        niche,
        sequences
      });
    } else {
      res = await createCampaign({
        name,
        niche,
        status: 'Draft',
        sequences
      });
    }
    setIsSaving(false);
    if (res.success) {
      toast.success("Campaign saved successfully");
      onSave(res.campaign);
    } else {
      toast.error("Error: " + res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] min-h-[500px]"
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-[#232734] bg-slate-50 dark:bg-[#09090B]">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Campaign Builder</h2>
            <p className="text-sm font-semibold text-[#94A3B8] mt-1">Design your automated email sequence</p>
          </div>
          <button onClick={onClose} className="p-2.5 text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734] rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {initialData && initialData._id && (
          <div className="flex border-b border-slate-200 dark:border-[#232734] bg-slate-50 dark:bg-[#09090B] px-6 pt-4">
            <button
              onClick={() => setActiveTab('sequences')}
              className={`px-6 py-3.5 font-bold text-sm border-b-2 transition-colors ${
                activeTab === 'sequences' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sequences
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-6 py-3.5 font-bold text-sm border-b-2 transition-colors ${
                activeTab === 'leads' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Leads
            </button>
          </div>
        )}

        <div className="p-8 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          {activeTab === 'sequences' ? (
            <>
              {/* Campaign Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div>
                  <label className="block text-xs font-black text-[#94A3B8] mb-3 uppercase tracking-widest">Campaign Name</label>
                  <input 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Q3 Roofers Outreach"
                    className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl px-4 py-3.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#2563EB] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#94A3B8] mb-3 uppercase tracking-widest">Target Niche (Optional)</label>
                  <input 
                    value={niche}
                    onChange={e => setNiche(e.target.value)}
                    placeholder="e.g. Roofing, Real Estate"
                    className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl px-4 py-3.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#2563EB] transition-colors"
                  />
                </div>
              </div>

              <div className="h-px bg-slate-200 dark:bg-[#232734] w-full mb-10"></div>

              {/* Sequence Builder */}
              <div className="space-y-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <Mail size={22} className="text-[#2563EB]" /> Sequence Steps
                </h3>
                
                {sequences.map((step, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] border-l-4 border-l-[#2563EB] rounded-2xl p-6 relative group shadow-sm">
                    {sequences.length > 1 && (
                      <button 
                        onClick={() => removeStep(idx)}
                        className="absolute top-6 right-6 p-2 text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] flex items-center justify-center font-black text-base shadow-[0_0_10px_rgba(37,99,235,0.2)]">
                        {step.stepNumber}
                      </div>
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white">Step {step.stepNumber}</h4>
                      
                      {idx > 0 && (
                        <div className="flex items-center gap-3 ml-6 bg-white dark:bg-[#11131A] px-4 py-2 rounded-xl border border-slate-200 dark:border-[#232734]">
                          <span className="text-xs font-bold text-[#94A3B8] uppercase">Wait</span>
                          <input 
                            type="number"
                            min="1"
                            value={step.delayDays}
                            onChange={e => updateStep(idx, 'delayDays', parseInt(e.target.value))}
                            className="w-14 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-lg px-2 py-1 text-center font-bold text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#2563EB]"
                          />
                          <span className="text-xs font-bold text-[#94A3B8] uppercase">days after previous</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-xs font-black text-[#94A3B8] mb-3 uppercase tracking-widest">Subject Line</label>
                        <input 
                          value={step.subjectTemplate}
                          onChange={e => updateStep(idx, 'subjectTemplate', e.target.value)}
                          placeholder="e.g. Quick question regarding {{company_name}}"
                          className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#2563EB] text-sm"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-xs font-black text-[#94A3B8] uppercase tracking-widest">Email Body</label>
                          <button 
                            onClick={() => updateStep(idx, 'useAI', !step.useAI)}
                            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border ${step.useAI ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20' : 'bg-slate-50 dark:bg-[#09090B] text-[#94A3B8] border-slate-200 dark:border-[#232734] hover:text-slate-900 dark:hover:text-white hover:border-[#94A3B8]'}`}
                          >
                            {step.useAI ? <Bot size={14} /> : <Type size={14} />}
                            {step.useAI ? 'AI Generated (Prompt Mode)' : 'Fixed Template'}
                          </button>
                        </div>
                        <textarea 
                          value={step.bodyTemplate}
                          onChange={e => updateStep(idx, 'bodyTemplate', e.target.value)}
                          placeholder={step.useAI ? "Write instructions for the AI on how to write this email..." : "Write the exact email body here. Use {{company_name}} for variables..."}
                          className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl px-4 py-4 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#2563EB] text-sm resize-none h-40 leading-relaxed"
                        />
                        {step.useAI && (
                          <p className="text-xs text-[#2563EB] mt-3 font-semibold flex items-center gap-1.5 bg-[#2563EB]/10 px-3 py-2 rounded-lg border border-[#2563EB]/20">
                            <Bot size={14} /> The AI will read this prompt and generate a highly personalized email for each lead.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <button 
                  onClick={addStep}
                  className="w-full py-5 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] hover:bg-[#1E293B]/50 hover:border-[#94A3B8] rounded-2xl text-[#94A3B8] hover:text-slate-900 dark:hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Plus size={18} strokeWidth={2.5} /> Add Next Step
                </button>
              </div>
            </>
          ) : (
            <CampaignLeadsManager campaignId={initialData._id} />
          )}
        </div>

        {activeTab === 'sequences' && (
          <div className="p-6 border-t border-slate-200 dark:border-[#232734] bg-slate-50 dark:bg-[#09090B] flex justify-end gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734] transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-[#2563EB] hover:bg-[#2563EB]/90 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-[#2563EB]/20"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} strokeWidth={2.5} />}
              Save Campaign
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
