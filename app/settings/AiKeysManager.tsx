'use client';

import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, CheckCircle, XCircle, Activity, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAiKeys, addAiKey, deleteAiKey, toggleAiKeyStatus } from '@/app/actions/aiKeyActions';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';

export default function AiKeysManager() {
  const { confirm } = useConfirm();
  const [keys, setKeys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'anthropic' | 'groq' | 'deepseek' | 'openrouter'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [name, setName] = useState('');
  const [modelId, setModelId] = useState('');
  const [dailyLimit, setDailyLimit] = useState(50);

  const fetchKeys = async () => {
    setIsLoading(true);
    const res = await getAiKeys();
    if (res.success && res.data) {
      setKeys(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      toast.error('API Key is required');
      return;
    }

    setIsAdding(true);
    toast.loading('Adding AI Key...', { id: 'add-key' });

    const res = await addAiKey({ 
      provider, 
      apiKey, 
      name,
      modelId,
      dailyLimit
    });
    
    if (res.success) {
      toast.success(res.message || 'Key added', { id: 'add-key' });
      setApiKey('');
      setName('');
      setModelId('');
      fetchKeys();
    } else {
      toast.error(res.error || 'Failed to add key', { id: 'add-key' });
    }
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (await confirm({ message: 'Are you sure you want to delete this API key?', danger: true })) {
      toast.loading('Deleting...', { id: 'del-key' });
      const res = await deleteAiKey(id);
      if (res.success) {
        toast.success('Deleted successfully', { id: 'del-key' });
        fetchKeys();
      } else {
        toast.error(res.error || 'Failed to delete', { id: 'del-key' });
      }
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const res = await toggleAiKeyStatus(id, currentStatus);
    if (res.success) {
      toast.success('Status updated');
      fetchKeys();
    } else {
      toast.error(res.error || 'Failed to update status');
    }
  };

  const getProviderColor = (p: string) => {
    switch(p) {
      case 'openai': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'gemini': return 'text-[#00E5FF] bg-[#00E5FF]/10 border-[#00E5FF]/20';
      case 'anthropic': return 'text-[#6324FC] bg-[#6324FC]/10 border-[#6324FC]/20';
      case 'groq': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'openrouter': return 'text-teal-500 bg-teal-500/10 border-teal-500/20';
      default: return 'text-secondary bg-slate-500/10 border-black/10';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 p-5 sm:p-6 rounded-3xl shadow-sm">
        <h3 className="text-xs font-heading font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-5">
          <Plus size={15} className="text-[#6324FC] dark:text-[#00E5FF]" /> Add New AI Key
        </h3>
        <form onSubmit={handleAddKey} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Provider</label>
            <select
              value={provider}
              onChange={(e: any) => setProvider(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white text-xs font-heading font-bold appearance-none cursor-pointer"
            >
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI (ChatGPT)</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="groq">Groq</option>
              <option value="deepseek">DeepSeek</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white text-xs font-mono transition-all placeholder:text-secondary"
              placeholder="sk-..."
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Alias / Name (Optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white text-xs transition-all placeholder:text-secondary"
              placeholder="e.g. Primary Groq Key"
            />
          </div>
          <div>
            <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Model ID (Optional)</label>
            <input
              type="text"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white text-xs font-mono transition-all placeholder:text-secondary"
              placeholder="e.g. gemini-1.5-pro"
            />
          </div>
          <div>
            <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Daily Request Limit</label>
            <input
              type="number"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white text-xs font-mono transition-all"
              min="1"
            />
          </div>
          <div className="md:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              disabled={isAdding}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white font-heading font-bold rounded-xl transition-all disabled:opacity-50 text-xs shadow-[0_0_15px_rgba(99,36,252,0.4)]"
            >
              {isAdding ? <Activity className="animate-spin" size={14} /> : <Save size={14} />}
              Save API Key
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-heading font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Key size={15} className="text-[#6324FC] dark:text-[#00E5FF]" /> Active AI Keys
        </h3>
        
        {isLoading ? (
          <div className="p-8 text-center text-secondary flex flex-col items-center justify-center">
            <Activity className="animate-spin mb-2 text-[#6324FC]" size={20} />
            <span className="text-xs">Loading AI Keys...</span>
          </div>
        ) : keys.length === 0 ? (
          <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 p-8 text-center rounded-3xl">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center mx-auto mb-3">
              <Key className="text-secondary" size={20} />
            </div>
            <h4 className="text-slate-900 dark:text-white font-heading font-bold text-sm mb-1">No AI Keys Found</h4>
            <p className="text-secondary text-xs">Add your first API key above to start using AI features.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {keys.map((k) => (
              <div key={k._id} className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 p-4 rounded-2xl flex flex-col justify-between hover:border-[#6324FC]/50 transition-all shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${getProviderColor(k.provider)}`}>
                      <Activity size={16} />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-slate-900 dark:text-white capitalize text-xs">
                        {k.provider} {k.name ? `- ${k.name}` : ''}
                      </h4>
                      <p className="text-[10px] text-secondary font-mono mt-0.5">
                        {k.modelId ? k.modelId : (k.apiKey.substring(0, 8) + '•••••••••••')}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleToggle(k._id, k.isActive)}
                    className={`${k.isActive ? 'text-emerald-500' : 'text-secondary'} hover:scale-110 transition-transform`}
                    title={k.isActive ? "Active (Click to disable)" : "Disabled (Click to activate)"}
                  >
                    {k.isActive ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-black/5 dark:border-white/5">
                  <div className="text-[11px] font-mono font-bold text-secondary">
                    <span className="text-[#6324FC] dark:text-[#00E5FF]">{k.sentToday}</span> / {k.dailyLimit} req today
                  </div>
                  <button 
                    onClick={() => handleDelete(k._id)}
                    className="p-1.5 text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
