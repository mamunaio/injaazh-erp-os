'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Mail, Bot, Type, Loader2, CheckCircle, Clock } from 'lucide-react';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl neu-flat rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] min-h-[500px]"
      >
        <div className="flex justify-between items-center p-6 md:p-8 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Mail size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">Campaign Builder</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Design your automated email sequence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all relative z-10">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {initialData && initialData._id && (
          <div className="px-6 md:px-8 py-4 shrink-0">
            <div className="inline-flex items-center p-1.5 bg-slate-200/50 dark:bg-[#1A1D24] rounded-2xl">
              <button
                onClick={() => setActiveTab('sequences')}
                className={`px-8 py-2.5 font-bold text-sm rounded-xl transition-all ${
                  activeTab === 'sequences' ? 'bg-white dark:bg-[#232734] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sequences
              </button>
              <button
                onClick={() => setActiveTab('leads')}
                className={`px-8 py-2.5 font-bold text-sm rounded-xl transition-all ${
                  activeTab === 'leads' ? 'bg-white dark:bg-[#232734] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Leads
              </button>
            </div>
          </div>
        )}

        <div className="p-6 md:p-8 overflow-y-auto flex-1 min-h-0 custom-scrollbar relative">
          {activeTab === 'sequences' ? (
            <div className="max-w-3xl mx-auto">
              {/* Campaign Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="group">
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest pl-1">Campaign Name</label>
                  <input 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Q3 Roofers Outreach"
                    className="w-full bg-slate-50 dark:bg-[#111111] border-none rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)]"
                  />
                </div>
                <div className="group">
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest pl-1">Target Niche <span className="font-medium normal-case tracking-normal text-slate-400">(Optional)</span></label>
                  <input 
                    value={niche}
                    onChange={e => setNiche(e.target.value)}
                    placeholder="e.g. Roofing, Real Estate"
                    className="w-full bg-slate-50 dark:bg-[#111111] border-none rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)]"
                  />
                </div>
              </div>

              {/* Sequence Builder */}
              <div className="space-y-8 relative">
                {/* Visual connecting line */}
                <div className="absolute left-[2.25rem] top-8 bottom-24 w-1 bg-gradient-to-b from-indigo-200 to-indigo-100 dark:from-indigo-500/20 dark:to-transparent rounded-full hidden sm:block"></div>

                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <Mail size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Sequence Timeline</h3>
                </div>
                
                {sequences.map((step, idx) => (
                  <div key={idx} className="relative z-10">
                    {/* Wait block if not first step */}
                    {idx > 0 && (
                      <div className="flex items-center gap-4 ml-0 sm:ml-20 mb-6 group">
                        <div className="flex items-center gap-3 bg-white dark:bg-[#1A1D24] px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-[#232734] shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors">
                          <Clock size={16} className="text-indigo-500" />
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Wait</span>
                          <input 
                            type="number"
                            min="1"
                            value={step.delayDays}
                            onChange={e => updateStep(idx, 'delayDays', parseInt(e.target.value))}
                            className="w-16 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl px-2 py-1.5 text-center font-black text-indigo-600 dark:text-indigo-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">days</span>
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-50 dark:bg-[#111111] border border-slate-200/50 dark:border-[#232734]/30 rounded-[2rem] p-6 sm:p-8 relative group shadow-sm transition-shadow">
                      {sequences.length > 1 && (
                        <button 
                          onClick={() => removeStep(idx)}
                          className="absolute top-6 right-6 p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      
                      <div className="flex items-center gap-5 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-500/20 shrink-0">
                          {step.stepNumber}
                        </div>
                        <div>
                          <h4 className="font-black text-lg text-slate-900 dark:text-white">Step {step.stepNumber}</h4>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">{step.useAI ? 'AI Generated Email' : 'Fixed Template Email'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest pl-1">Subject Line</label>
                          <input 
                            value={step.subjectTemplate}
                            onChange={e => updateStep(idx, 'subjectTemplate', e.target.value)}
                            placeholder="e.g. Quick question regarding {{company_name}}"
                            className="w-full bg-white dark:bg-[#09090B] border-none rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)]"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Email Body</label>
                            
                            <div className="flex items-center bg-slate-100 dark:bg-[#09090B] p-1 rounded-xl">
                              <button 
                                onClick={() => updateStep(idx, 'useAI', false)}
                                className={`flex items-center gap-2 text-[11px] font-bold px-4 py-2 rounded-lg transition-all ${!step.useAI ? 'bg-white dark:bg-[#232734] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                              >
                                <Type size={14} /> Fixed
                              </button>
                              <button 
                                onClick={() => updateStep(idx, 'useAI', true)}
                                className={`flex items-center gap-2 text-[11px] font-bold px-4 py-2 rounded-lg transition-all ${step.useAI ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                              >
                                <Bot size={14} /> AI Mode
                              </button>
                            </div>
                          </div>
                          
                          <div className="relative">
                            {step.useAI && (
                              <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-20 blur-[2px]"></div>
                            )}
                            <textarea 
                              value={step.bodyTemplate}
                              onChange={e => updateStep(idx, 'bodyTemplate', e.target.value)}
                              placeholder={step.useAI ? "Write instructions for the AI on how to write this email... (e.g. Keep it under 50 words, mention their recent news)" : "Write the exact email body here. Use {{company_name}} for variables..."}
                              className={`w-full relative z-10 bg-white dark:bg-[#09090B] border ${step.useAI ? 'border-indigo-200 dark:border-indigo-500/30' : 'border-transparent dark:border-[#232734]/30'} rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm resize-none h-48 leading-relaxed shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)]`}
                            />
                          </div>
                          {step.useAI && (
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-3 font-semibold flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                              <Bot size={16} /> The AI will read this prompt and generate a highly personalized email for each lead.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pt-4 sm:ml-20 relative z-10">
                  <button 
                    onClick={addStep}
                    className="w-full py-6 bg-slate-50 dark:bg-[#111111] border-none hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 rounded-[2rem] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-sm transition-all flex flex-col items-center justify-center gap-3 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#1A1D24] group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                      <Plus size={20} strokeWidth={2.5} />
                    </div>
                    Add Next Sequence Step
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <CampaignLeadsManager campaignId={initialData._id} />
          )}
        </div>

        {activeTab === 'sequences' && (
          <div className="p-6 md:px-8 md:py-6 flex justify-end gap-4 shrink-0">
            <button 
              onClick={onClose}
              className="px-8 py-3.5 rounded-2xl font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} strokeWidth={2.5} />}
              Save Campaign
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
