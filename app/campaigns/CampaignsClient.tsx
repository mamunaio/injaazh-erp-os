'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, Play, Pause, CheckCircle, Mail, Settings, Users, Activity, Trash2, AlertTriangle, X, Zap } from 'lucide-react';
import CampaignBuilderModal from './CampaignBuilderModal';
import CampaignLogsModal from './CampaignLogsModal';
import { updateCampaignStatus, deleteCampaign } from '@/app/actions/campaignActions';
import { forceRunCampaign } from '@/app/actions/outreachAutomationActions';
import toast from 'react-hot-toast';

export default function CampaignsClient({ initialCampaigns }: { initialCampaigns: any[] }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [logsCampaign, setLogsCampaign] = useState<any>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isForceRunning, setIsForceRunning] = useState<string | null>(null);

  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    // Optimistic update
    setCampaigns(campaigns.map(c => c._id === campaignId ? { ...c, status: newStatus } : c));
    const res = await updateCampaignStatus(campaignId, newStatus);
    if (!res.success) {
      alert("Failed to update status");
      // Revert if failed
      setCampaigns(campaigns);
    }
  };

  const confirmDelete = async () => {
    if (!campaignToDelete) return;
    setIsDeleting(true);
    
    const previousCampaigns = [...campaigns];
    setCampaigns(campaigns.filter(c => c._id !== campaignToDelete));
    
    const res = await deleteCampaign(campaignToDelete);
    if (!res.success) {
      alert("Failed to delete campaign");
      setCampaigns(previousCampaigns);
    }
    
    setIsDeleting(false);
    setCampaignToDelete(null);
  };

  const handleForceRun = async (campaignId: string) => {
    setIsForceRunning(campaignId);
    toast.loading("Processing leads...", { id: "forceRun" });
    const res = await forceRunCampaign(campaignId);
    if (res.success) {
      toast.success(res.message || "Processed successfully", { id: "forceRun" });
      // Reload campaigns to get fresh counts
      window.location.reload();
    } else {
      toast.error("Error: " + res.error, { id: "forceRun" });
    }
    setIsForceRunning(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-[#0f111a]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Email Campaigns</h1>
          <p className="text-sm text-slate-400">Automate outreach sequences based on niches</p>
        </div>
        
        <button 
          onClick={() => setIsBuilderOpen(true)}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <Plus size={18} strokeWidth={3} />
          Create Campaign
        </button>
      </div>

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
          <Target size={48} className="mx-auto text-slate-500 mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">No Campaigns Yet</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">Create your first campaign to start sending automated, sequenced outreach emails to your leads.</p>
          <button 
            onClick={() => setIsBuilderOpen(true)}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-all inline-flex items-center gap-2"
          >
            <Plus size={18} /> Get Started
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign._id} className="bg-[#0f111a]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:border-indigo-500/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-lg font-bold text-white truncate mb-1">{campaign.name}</h3>
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                    <Target size={12} /> {campaign.niche || 'General'}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                    campaign.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    campaign.status === 'Paused' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                    campaign.status === 'Completed' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {campaign.status}
                  </div>
                  <button 
                    onClick={() => setCampaignToDelete(campaign._id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                    title="Delete Campaign"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6 py-4 border-y border-white/5 mb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-500">Sequences</span>
                  <span className="text-lg font-black text-white flex items-center gap-1.5">
                    <Mail size={16} className="text-slate-400" /> {campaign.sequences?.length || 0}
                  </span>
                </div>
                <div className="w-px h-8 bg-white/5"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-500">Leads</span>
                  <span className="text-lg font-black text-white flex items-center gap-1.5">
                    <Users size={16} className="text-slate-400" /> {campaign.leadCount || 0}
                  </span>
                </div>
              </div>

      <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => {
                    setLogsCampaign(campaign);
                    setIsLogsOpen(true);
                  }}
                  className="px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  title="Activity Logs"
                >
                  <Activity size={14} />
                </button>
                <button 
                  onClick={() => {
                    setEditingCampaign(campaign);
                    setIsBuilderOpen(true);
                  }}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Settings size={14} /> Manage
                </button>
                {campaign.status === 'Active' ? (
                  <>
                    <button 
                      onClick={() => handleForceRun(campaign._id)} 
                      disabled={isForceRunning === campaign._id}
                      className="px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      title="Force send pending emails now"
                    >
                      <Zap size={14} className={isForceRunning === campaign._id ? "animate-pulse" : ""} />
                    </button>
                    <button onClick={() => handleStatusChange(campaign._id, 'Paused')} className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5">
                      <Pause size={14} /> Pause
                    </button>
                  </>
                ) : campaign.status === 'Completed' ? (
                  <button disabled className="px-4 py-2 bg-indigo-500/5 text-indigo-400/50 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-not-allowed border border-indigo-500/10">
                    <CheckCircle size={14} /> Done
                  </button>
                ) : (
                  <button onClick={() => handleStatusChange(campaign._id, 'Active')} className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5">
                    <Play size={14} /> Start
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Campaign Builder Modal */}
      <CampaignBuilderModal 
        isOpen={isBuilderOpen}
        initialData={editingCampaign}
        onClose={() => {
          setIsBuilderOpen(false);
          setEditingCampaign(null);
        }}
        onSave={(savedCampaign) => {
          if (editingCampaign) {
            setCampaigns(campaigns.map(c => c._id === savedCampaign._id ? savedCampaign : c));
          } else {
            setCampaigns([savedCampaign, ...campaigns]);
          }
          setIsBuilderOpen(false);
          setEditingCampaign(null);
        }}
      />

      <CampaignLogsModal 
        isOpen={isLogsOpen}
        campaign={logsCampaign}
        onClose={() => {
          setIsLogsOpen(false);
          setLogsCampaign(null);
        }}
      />

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {campaignToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-[#0f111a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Campaign?</h3>
                <p className="text-sm text-slate-400 mb-6">
                  Are you sure you want to delete this campaign? All its leads, sequence settings, and outreach logs will be permanently removed. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setCampaignToDelete(null)}
                    disabled={isDeleting}
                    className="px-5 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
