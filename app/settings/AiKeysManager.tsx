'use client';

import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, CheckCircle, XCircle, Activity, Play } from 'lucide-react';
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
      case 'openai': return 'text-emerald-500 bg-emerald-500/10';
      case 'gemini': return 'text-blue-500 bg-blue-500/10';
      case 'anthropic': return 'text-purple-500 bg-purple-500/10';
      case 'groq': return 'text-orange-500 bg-orange-500/10';
      case 'openrouter': return 'text-teal-500 bg-teal-500/10';
      default: return 'text-slate-500 bg-slate-500/10';
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-[#09090B] border border-[#232734] p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-6">
          <Plus size={16} className="text-indigo-400" /> Add New AI Key
        </h3>
        <form onSubmit={handleAddKey} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Provider</label>
            <select
              value={provider}
              onChange={(e: any) => setProvider(e.target.value)}
              className="w-full px-4 py-3 bg-[#11131A] border border-[#232734] rounded-xl focus:outline-none focus:border-indigo-500/50 text-white text-sm font-bold appearance-none cursor-pointer"
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
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-3 bg-[#11131A] border border-[#232734] rounded-xl focus:outline-none focus:border-indigo-500/50 text-white text-sm font-bold transition-all"
              placeholder="sk-..."
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Alias / Name (Optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-[#11131A] border border-[#232734] rounded-xl focus:outline-none focus:border-indigo-500/50 text-white text-sm font-bold transition-all"
              placeholder="e.g. Primary Groq Key"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Model ID (Optional)</label>
            <input
              type="text"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full px-4 py-3 bg-[#11131A] border border-[#232734] rounded-xl focus:outline-none focus:border-indigo-500/50 text-white text-sm font-bold transition-all"
              placeholder="e.g. google/gemini-pro"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Daily Request Limit</label>
            <input
              type="number"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
              className="w-full px-4 py-3 bg-[#11131A] border border-[#232734] rounded-xl focus:outline-none focus:border-indigo-500/50 text-white text-sm font-bold transition-all"
              min="1"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isAdding}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl transition-all hover:bg-slate-200 disabled:opacity-50 text-sm shadow-sm"
            >
              {isAdding ? <Activity className="animate-spin" size={16} /> : <Save size={16} />}
              Save API Key
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
          <Key size={16} className="text-indigo-400" /> Active AI Keys
        </h3>
        
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center">
            <Activity className="animate-spin mb-2" size={24} />
            Loading AI Keys...
          </div>
        ) : keys.length === 0 ? (
          <div className="bg-[#09090B] border border-[#232734] p-8 text-center rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-[#11131A] border border-[#232734] flex items-center justify-center mx-auto mb-4">
              <Key className="text-slate-500" size={24} />
            </div>
            <h4 className="text-white font-bold mb-2">No AI Keys Found</h4>
            <p className="text-slate-500 text-xs font-bold">Add your first API key above to start using AI features.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keys.map((k) => (
              <div key={k._id} className="bg-[#09090B] border border-[#232734] p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl border border-[#232734] bg-[#11131A] ${getProviderColor(k.provider)}`}>
                      <Activity size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white capitalize text-sm">
                        {k.provider} {k.name ? `- ${k.name}` : ''}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {k.modelId ? k.modelId : (k.apiKey.substring(0, 8) + '•••••••••••')}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleToggle(k._id, k.isActive)}
                    className={`${k.isActive ? 'text-emerald-500' : 'text-slate-500'} hover:scale-110 transition-transform`}
                    title={k.isActive ? "Active (Click to disable)" : "Disabled (Click to activate)"}
                  >
                    {k.isActive ? <CheckCircle size={20} /> : <XCircle size={20} />}
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#232734]">
                  <div className="text-xs font-bold text-slate-500">
                    <span className="text-indigo-400">{k.sentToday}</span> / {k.dailyLimit} req today
                  </div>
                  <button 
                    onClick={() => handleDelete(k._id)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
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

// Add Save icon since it was missing in imports
const Save = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
);
