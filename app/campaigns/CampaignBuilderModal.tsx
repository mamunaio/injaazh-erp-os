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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl bg-[#0f111a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] min-h-[500px]"
      >
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-white">Campaign Builder</h2>
            <p className="text-sm text-slate-400">Design your automated email sequence</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {initialData && initialData._id && (
          <div className="flex border-b border-white/10 bg-black/20 px-6 pt-4">
            <button
              onClick={() => setActiveTab('sequences')}
              className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${
                activeTab === 'sequences' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Sequences
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${
                activeTab === 'leads' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Leads
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'sequences' ? (
            <>
              {/* Campaign Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">Campaign Name</label>
                  <input 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Q3 Roofers Outreach"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">Target Niche (Optional)</label>
                  <input 
                    value={niche}
                    onChange={e => setNiche(e.target.value)}
                    placeholder="e.g. Roofing, Real Estate"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="h-px bg-white/10 w-full mb-8"></div>

              {/* Sequence Builder */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Mail size={18} className="text-indigo-400" /> Sequence Steps
                </h3>
                
                {sequences.map((step, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-5 relative group">
                    {sequences.length > 1 && (
                      <button 
                        onClick={() => removeStep(idx)}
                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                        {step.stepNumber}
                      </div>
                      <h4 className="font-bold text-white">Step {step.stepNumber}</h4>
                      
                      {idx > 0 && (
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-sm text-slate-400">Wait</span>
                          <input 
                            type="number"
                            min="1"
                            value={step.delayDays}
                            onChange={e => updateStep(idx, 'delayDays', parseInt(e.target.value))}
                            className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-center text-white text-sm"
                          />
                          <span className="text-sm text-slate-400">days after previous step</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Subject Line</label>
                        <input 
                          value={step.subjectTemplate}
                          onChange={e => updateStep(idx, 'subjectTemplate', e.target.value)}
                          placeholder="e.g. Quick question regarding {{company_name}}"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Body</label>
                          <button 
                            onClick={() => updateStep(idx, 'useAI', !step.useAI)}
                            className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md transition-colors ${step.useAI ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                          >
                            {step.useAI ? <Bot size={12} /> : <Type size={12} />}
                            {step.useAI ? 'AI Generated (Prompt Mode)' : 'Fixed Template'}
                          </button>
                        </div>
                        <textarea 
                          value={step.bodyTemplate}
                          onChange={e => updateStep(idx, 'bodyTemplate', e.target.value)}
                          placeholder={step.useAI ? "Write instructions for the AI on how to write this email..." : "Write the exact email body here. Use {{company_name}} for variables..."}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm resize-none h-32"
                        />
                        {step.useAI && (
                          <p className="text-xs text-indigo-400/70 mt-2 font-medium">
                            * The AI will read this prompt and generate a highly personalized email for each lead.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <button 
                  onClick={addStep}
                  className="w-full py-4 border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-2xl text-slate-400 hover:text-indigo-400 font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Add Next Step
                </button>
              </div>
            </>
          ) : (
            <CampaignLeadsManager campaignId={initialData._id} />
          )}
        </div>

        {activeTab === 'sequences' && (
          <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center gap-2"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Save Campaign
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
