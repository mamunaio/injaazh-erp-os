'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Edit2, Loader2, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import Papa from 'papaparse';
import { getCampaignLeads, importCSVToCampaign, removeLeadFromCampaign, updateCampaignLeadInfo } from '@/app/actions/campaignActions';
import toast from 'react-hot-toast';

export default function CampaignLeadsManager({ campaignId }: { campaignId: string }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ company_name: '', contact_person: '', email: '', lead_context: '' });

  const fetchLeads = async () => {
    setLoading(true);
    const res = await getCampaignLeads(campaignId);
    if (res.success) setLeads(res.leads);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, [campaignId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        const validRows = data.filter(row => row['Business Name'] || row['Name'] || row['company_name']);
        
        if (validRows.length === 0) {
          toast.error("No valid leads found in CSV");
          return;
        }

        setIsUploading(true);
        const mappedData = validRows.map(row => ({
          company_name: row['Business Name'] || row['Name'] || row['company_name'] || '',
          contact_person: row['Contact Person'] || row['contact_person'] || '',
          email: row['Email'] || row['email'] || '',
          phone: row['Phone'] || row['phone'] || '',
          website_url: row['Website'] || row['website_url'] || '',
          lead_context: row['Context'] || row['lead_context'] || ''
        }));

        const res = await importCSVToCampaign(campaignId, mappedData);
        setIsUploading(false);
        
        if (res.success) {
          toast.success(`Imported ${res.count} leads to campaign`);
          fetchLeads();
        } else {
          toast.error("Import failed: " + res.error);
        }
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const handleRemove = async (campaignLeadId: string) => {
    if (!confirm("Remove this lead from the campaign?")) return;
    const res = await removeLeadFromCampaign(campaignLeadId);
    if (res.success) {
      toast.success("Lead removed");
      setLeads(leads.filter(l => l._id !== campaignLeadId));
    } else {
      toast.error("Failed to remove: " + res.error);
    }
  };

  const startEdit = (lead: any) => {
    setEditingLeadId(lead.leadId._id);
    setEditForm({
      company_name: lead.leadId.company_name,
      contact_person: lead.leadId.contact_person || '',
      email: lead.leadId.email || '',
      lead_context: lead.leadId.lead_context || ''
    });
  };

  const saveEdit = async () => {
    if (!editingLeadId) return;
    const res = await updateCampaignLeadInfo(editingLeadId, editForm);
    if (res.success) {
      toast.success("Lead updated");
      setEditingLeadId(null);
      fetchLeads();
    } else {
      toast.error("Failed to update: " + res.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-2xl">
        <div>
          <h3 className="font-bold text-white flex items-center gap-2"><Users size={18} className="text-indigo-400" /> Campaign Leads</h3>
          <p className="text-xs text-slate-400 mt-1">Manage leads currently enrolled in this sequence</p>
        </div>
        <div>
          <label className="cursor-pointer px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-xl transition-colors flex items-center gap-2">
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-indigo-500" /></div>
      ) : leads.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
          <p className="text-sm text-slate-400">No leads in this campaign yet.</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-black/40 text-xs uppercase font-bold text-slate-500">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status / Step</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leads.map((cl) => (
                <tr key={cl._id} className="hover:bg-white/5 transition-colors">
                  {editingLeadId === cl.leadId._id ? (
                    <td colSpan={4} className="px-4 py-4 bg-indigo-500/5">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <input value={editForm.company_name} onChange={e => setEditForm({...editForm, company_name: e.target.value})} placeholder="Company Name" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" />
                        <input value={editForm.contact_person} onChange={e => setEditForm({...editForm, contact_person: e.target.value})} placeholder="Contact Person" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" />
                        <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} placeholder="Email" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" />
                        <input value={editForm.lead_context} onChange={e => setEditForm({...editForm, lead_context: e.target.value})} placeholder="AI Context" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingLeadId(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white">Cancel</button>
                        <button onClick={saveEdit} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500 text-white hover:bg-indigo-600">Save</button>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-white">
                        {cl.leadId.company_name}
                        {cl.leadId.lead_context && <div className="text-[10px] text-indigo-400 truncate max-w-[200px]" title={cl.leadId.lead_context}>Ctx: {cl.leadId.lead_context}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white">{cl.leadId.contact_person || '-'}</div>
                        <div className="text-xs text-slate-500">{cl.leadId.email || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex w-max px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            cl.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 
                            cl.status === 'Finished' ? 'bg-slate-500/10 text-slate-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>{cl.status}</span>
                          <span className="text-[10px] text-slate-500 font-bold">Step {cl.currentStep}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => startEdit(cl)} className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors" title="Edit Lead"><Edit2 size={14} /></button>
                          <button onClick={() => handleRemove(cl._id)} className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors" title="Remove from Campaign"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
