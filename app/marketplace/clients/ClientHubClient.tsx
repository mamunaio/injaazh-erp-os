'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, MoreVertical, Building2, Mail, Globe, Clock, User as UserIcon, DollarSign, Link as LinkIcon, Image as ImageIcon, X, Edit2 } from 'lucide-react';
import { createMarketplaceClient, deleteMarketplaceClient, updateMarketplaceClient } from '@/actions/marketplaceClientActions';
import { countryToTimezoneMap } from '@/lib/countryToTimezone';
import toast from 'react-hot-toast';

interface ClientHubClientProps {
  initialClients: any[];
}

export default function ClientHubClient({ initialClients }: ClientHubClientProps) {
  const [clients, setClients] = useState(initialClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    timezone: '',
    country: '',
    profileLink: '',
    profilePic: '',
    platform: 'Direct',
    totalSpent: 0,
  });

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (editingClient) {
      const result = await updateMarketplaceClient(editingClient._id, formData);
      if (result.success) {
        setClients(clients.map(c => c._id === editingClient._id ? result.data : c));
        toast.success('Client updated successfully');
        closeModal();
      } else {
        toast.error(result.error || 'Failed to update client');
      }
    } else {
      const result = await createMarketplaceClient(formData);
      if (result.success) {
        setClients([result.data, ...clients]);
        toast.success('Client added successfully');
        closeModal();
      } else {
        toast.error(result.error || 'Failed to add client');
      }
    }
    
    setIsSubmitting(false);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingClient(null);
    setFormData({
      name: '', company: '', email: '', timezone: '', country: '', profileLink: '', profilePic: '', platform: 'Direct', totalSpent: 0
    });
  };

  const openEditModal = (client: any) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      company: client.company || '',
      email: client.email || '',
      timezone: client.timezone || '',
      country: client.country || '',
      profileLink: client.profileLink || '',
      profilePic: client.profilePic || '',
      platform: client.platform || 'Direct',
      totalSpent: client.totalSpent || 0,
    });
    setIsAddModalOpen(true);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const country = e.target.value;
    let timezone = formData.timezone;

    const tz = countryToTimezoneMap[country.toLowerCase().trim()];
    if (tz) {
      timezone = tz;
    }

    setFormData({ ...formData, country, timezone });
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    
    const result = await deleteMarketplaceClient(id);
    if (result.success) {
      setClients(clients.filter(c => c._id !== id));
      toast.success('Client deleted');
    } else {
      toast.error(result.error || 'Failed to delete client');
    }
  };

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'Upwork': return 'text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400 border-green-200 dark:border-green-500/20';
      case 'Freelancer': return 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      case 'Fiverr': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
      default: return 'text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-500/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/50 dark:border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-jakarta font-bold mb-3 border border-indigo-100 dark:border-indigo-500/20">
            <Globe size={14} /> Global Network
          </div>
          <h1 
            className="text-6xl md:text-7xl font-jakarta font-black tracking-tight leading-none mb-3"
            style={{
              background: 'linear-gradient(to right, #6366f1, #a855f7, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
              filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))',
            }}
          >
            Client Hub
          </h1>
          <p className="text-[15px] font-inter leading-relaxed tracking-wide text-slate-500 dark:text-slate-400 max-w-xl">
            Manage your marketplace and freelance network. Add client details, track spending, and link directly to their profiles.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search clients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm font-inter text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm text-slate-800 dark:text-white transition-all placeholder:text-slate-400"
            />
          </div>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-jakarta font-bold rounded-2xl shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto"
          >
            <Plus size={18} /> Add Client
          </button>
        </div>
      </div>

      {/* Grid of Clients */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2rem]">
          <UserIcon size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-jakarta font-black text-slate-700 dark:text-slate-300">No clients found</h3>
          <p className="text-[15px] font-inter text-slate-500 dark:text-slate-400 mt-1">Add a new client to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <motion.div 
              key={client._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => openEditModal(client)}
              className="group bg-white/80 dark:bg-slate-900/40 backdrop-blur-3xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-300 relative flex flex-col cursor-pointer overflow-hidden"
            >
              {/* Dynamic Glow background */}
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
              
              {/* Top color accent */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="p-6 flex-1 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {client.profilePic ? (
                        <img src={client.profilePic} alt={client.name} className="w-14 h-14 rounded-2xl object-cover shadow-md border border-slate-200 dark:border-white/10" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-2xl shadow-sm border border-indigo-100 dark:border-indigo-500/20">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 rounded-lg p-0.5 shadow-sm border border-slate-100 dark:border-white/5">
                        <span className={`flex items-center justify-center w-6 h-6 rounded-md ${getPlatformBadge(client.platform)}`}>
                          {client.platform === 'Upwork' && <span className="font-bold text-[10px]">Up</span>}
                          {client.platform === 'Freelancer' && <span className="font-bold text-[10px]">Fl</span>}
                          {client.platform === 'Fiverr' && <span className="font-bold text-[10px]">Fi</span>}
                          {client.platform === 'Direct' && <span className="font-bold text-[10px]">Dr</span>}
                          {client.platform === 'Other' && <span className="font-bold text-[10px]">Ot</span>}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-jakarta font-black text-xl text-slate-800 dark:text-white leading-tight">
                        {client.profileLink ? (
                          <a href={client.profileLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            {client.name}
                          </a>
                        ) : (
                          client.name
                        )}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-sm font-inter font-medium text-slate-500 dark:text-slate-400">
                        {client.company ? (
                          <><Building2 size={14} className="text-slate-400" /> {client.company}</>
                        ) : (
                          <span className="text-slate-400 text-xs uppercase tracking-wider">{client.platform} Client</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteClient(client._id); }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  {(client.country || client.timezone) && (
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                      {client.country && (
                        <div className="flex items-center gap-2 text-sm font-jakarta font-bold text-slate-700 dark:text-slate-300 flex-1">
                          <Globe size={16} className="text-indigo-500" /> {client.country}
                        </div>
                      )}
                      {client.timezone && (
                        <div className="flex items-center gap-2 text-sm font-jakarta font-bold text-slate-700 dark:text-slate-300 flex-1 border-l border-slate-200 dark:border-white/10 pl-4">
                          <Clock size={16} className="text-purple-500" /> {client.timezone.split(' ')[0]}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {client.email && (
                    <div className="flex items-center gap-3 text-sm font-inter text-slate-600 dark:text-slate-400 px-1">
                      <Mail size={16} className="text-slate-400" /> 
                      <a href={`mailto:${client.email}`} onClick={e => e.stopPropagation()} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        {client.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center rounded-b-3xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center border border-green-200 dark:border-green-500/30">
                    <DollarSign size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs font-jakarta font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Spent</span>
                </div>
                <div className="font-mono font-black text-slate-800 dark:text-white text-xl">
                  ${(client.totalSpent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md" 
              onClick={closeModal} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-white/50 dark:border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 md:p-8 border-b border-slate-200/50 dark:border-white/10 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10">
                <h2 className="text-3xl font-jakarta font-black text-slate-800 dark:text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    {editingClient ? <Edit2 size={20} /> : <UserIcon size={20} />}
                  </div>
                  {editingClient ? 'Edit Client' : 'Add New Client'}
                </h2>
              </div>
              
              <form onSubmit={handleSaveClient} className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[70vh] bg-slate-50/50 dark:bg-black/20">
                
                {/* Client Name */}
                <div className="group relative">
                  <label className="block text-xs font-jakarta font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Client Name *</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={18} />
                    <input 
                      required 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. John Doe"
                      className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl pl-11 pr-4 py-3.5 text-sm font-inter text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm hover:border-slate-300 dark:hover:border-white/20" 
                    />
                  </div>
                </div>
                
                {/* Platform */}
                <div className="group relative">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Platform</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={18} />
                    <select 
                      value={formData.platform}
                      onChange={e => setFormData({...formData, platform: e.target.value})}
                      className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm hover:border-slate-300 dark:hover:border-white/20 appearance-none"
                    >
                      <option value="Direct">Direct</option>
                      <option value="Upwork">Upwork</option>
                      <option value="Freelancer">Freelancer</option>
                      <option value="Fiverr">Fiverr</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Company */}
                <div className="group relative">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Company (Optional)</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={18} />
                    <input 
                      type="text" 
                      value={formData.company}
                      onChange={e => setFormData({...formData, company: e.target.value})}
                      placeholder="e.g. Acme Corp"
                      className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm hover:border-slate-300 dark:hover:border-white/20" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="group relative">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Country</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={18} />
                      <input 
                        type="text" 
                        value={formData.country}
                        onChange={handleCountryChange}
                        placeholder="e.g. USA"
                        className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm hover:border-slate-300 dark:hover:border-white/20" 
                      />
                    </div>
                  </div>
                  <div className="group relative">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Timezone</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={18} />
                      <input 
                        type="text" 
                        value={formData.timezone}
                        onChange={e => setFormData({...formData, timezone: e.target.value})}
                        placeholder="e.g. EST"
                        className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm hover:border-slate-300 dark:hover:border-white/20" 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="group relative">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Profile Link</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={18} />
                      <input 
                        type="url" 
                        value={formData.profileLink}
                        onChange={e => setFormData({...formData, profileLink: e.target.value})}
                        placeholder="https://..."
                        className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm hover:border-slate-300 dark:hover:border-white/20" 
                      />
                    </div>
                  </div>
                  <div className="group relative">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Profile Picture</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={18} />
                      <input 
                        type="url" 
                        value={formData.profilePic}
                        onChange={e => setFormData({...formData, profilePic: e.target.value})}
                        placeholder="https://..."
                        className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm hover:border-slate-300 dark:hover:border-white/20" 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-slate-200/50 dark:border-white/10">
                  <button 
                    type="button" 
                    onClick={closeModal}
                    className="px-6 py-3 rounded-xl text-sm font-jakarta font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !formData.name}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/30 text-white font-jakarta font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : (editingClient ? 'Update Client' : 'Save Client')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
