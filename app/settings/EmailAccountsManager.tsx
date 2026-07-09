'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, CheckCircle, XCircle, Activity, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { addEmailAccount, getEmailAccounts, deleteEmailAccount, updateEmailAccountStatus, updateWarmupSettings } from '@/app/actions/emailAccountActions';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';

// Helper to play sounds without external files
const playStatusSound = (type: 'success' | 'error' | 'loading') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export default function EmailAccountsManager() {
  const { confirm } = useConfirm();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [email, setEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [accountType, setAccountType] = useState<'gmail' | 'smtp'>('gmail');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState<number>(465);
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [dailyLimit, setDailyLimit] = useState(15);
  const [showGuide, setShowGuide] = useState(false);

  const fetchAccounts = async () => {
    setIsLoading(true);
    const res = await getEmailAccounts();
    if (res.success && res.accounts) {
      setAccounts(res.accounts);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !appPassword) {
      toast.error('Email and App Password are required');
      return;
    }

    setIsAdding(true);
    toast.loading('Verifying and adding account...', { id: 'add-acc' });

    const res = await addEmailAccount({ 
      email, 
      senderName,
      appPassword, 
      dailyLimit,
      accountType,
      smtpHost: accountType === 'smtp' ? smtpHost : undefined,
      smtpPort: accountType === 'smtp' ? smtpPort : undefined,
      smtpSecure: accountType === 'smtp' ? smtpSecure : undefined
    });
    
    if (res.success && res.account) {
      window.dispatchEvent(new CustomEvent('fetch-notifications'));
      setEmail('');
      setSenderName('');
      setAppPassword('');
      setAccountType('gmail');
      setSmtpHost('');
      setDailyLimit(15);
      setAccounts([res.account, ...accounts]);
    } else {
      playStatusSound('error');
      toast.error(res.error || 'Failed to add account', { id: 'add-acc' });
    }
    setIsAdding(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const res = await updateEmailAccountStatus(id, !currentStatus);
    if (res.success) {
      setAccounts(accounts.map(acc => acc._id === id ? { ...acc, isActive: !currentStatus } : acc));
      window.dispatchEvent(new CustomEvent('fetch-notifications'));
    } else {
      playStatusSound('error');
      toast.error('Failed to update status');
    }
  };

  const handleToggleWarmup = async (id: string, account: any) => {
    const newStatus = !account.warmupEnabled;
    let newLimit = account.warmupDailyLimit || 5;
    
    if (newStatus) {
      const limitStr = prompt('Enter daily warmup limit (emails per day):', newLimit.toString());
      if (limitStr === null) return; // cancelled
      const parsedLimit = parseInt(limitStr, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        newLimit = parsedLimit;
      }
    }

    const res = await updateWarmupSettings(id, newStatus, newLimit);
    if (res.success) {
      setAccounts(accounts.map(acc => acc._id === id ? { ...acc, warmupEnabled: newStatus, warmupDailyLimit: newLimit } : acc));
      window.dispatchEvent(new CustomEvent('fetch-notifications'));
    } else {
      playStatusSound('error');
      toast.error('Failed to update warmup settings');
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({ message: 'Are you sure you want to remove this email account?', danger: true });
    if (!isConfirmed) return;
    
    const res = await deleteEmailAccount(id);
    if (res.success) {
      setAccounts(accounts.filter(acc => acc._id !== id));
      window.dispatchEvent(new CustomEvent('fetch-notifications'));
    } else {
      playStatusSound('error');
      toast.error('Failed to remove account');
    }
  };

  const filteredAccounts = accounts.filter(acc => (acc.accountType || 'gmail') === accountType);

  return (
    <div className="space-y-8">
      {/* Add New Account Form */}
      <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
        <h3 className="mb-4 flex items-center gap-2">
          <Mail className="text-indigo-500" size={20} />
          Add New Email Account
        </h3>
        
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setAccountType('gmail')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${accountType === 'gmail' ? 'neu-button text-indigo-500' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}
          >
            Google Workspace / Gmail
          </button>
          <button
            type="button"
            onClick={() => setAccountType('smtp')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${accountType === 'smtp' ? 'neu-button text-indigo-500' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}
          >
            Professional Webmail (SMTP)
          </button>
        </div>

        {accountType === 'gmail' ? (
          <>
            <p className="text-sm text-slate-500 mb-6">
              Connect your Google accounts using an App Password. These accounts will be used in rotation for automated outreach.
            </p>

            <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  Sender Name
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Mamun from Injaazh"
                  value={senderName} 
                  onChange={(e) => setSenderName(e.target.value)} 
                  className="w-full px-4 py-3 neu-flat rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  Email Address
                </label>
                <input 
                  type="email" 
                  placeholder="team@gmail.com"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full px-4 py-3 neu-flat rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                />
              </div>
              <div className="md:col-span-1">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    App Password
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-xs font-black text-indigo-500 hover:text-indigo-600 transition-colors underline decoration-indigo-500/30 underline-offset-2"
                  >
                    {showGuide ? 'Hide Guide' : 'How to get this?'}
                  </button>
                </div>
                <input 
                  type="password" 
                  placeholder="16-digit code"
                  value={appPassword} 
                  onChange={(e) => setAppPassword(e.target.value)} 
                  className="w-full px-4 py-3 neu-flat rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Daily Limit</label>
                <input 
                  type="number" 
                  min="1"
                  value={dailyLimit} 
                  onChange={(e) => setDailyLimit(parseInt(e.target.value) || 15)} 
                  className="w-full px-4 py-3 neu-flat rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                />
              </div>
              <div className="md:col-span-1">
                <button 
                  type="submit" 
                  disabled={isAdding}
                  className="w-full flex justify-center items-center gap-2 px-6 py-3 neu-button text-indigo-500 dark:text-indigo-400 font-bold rounded-2xl transition-all text-sm disabled:opacity-70"
                >
                  {isAdding ? <Activity size={16} className="animate-spin" /> : <Plus size={16} />}
                  {isAdding ? 'Verifying...' : 'Add Account'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-6">
              Connect multiple professional Webmail/SMTP accounts (e.g. Hostinger, Dreamhost, cPanel) to use them in rotation for outreach.
            </p>

            <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  Sender Name
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Sales Team"
                  value={senderName} 
                  onChange={(e) => setSenderName(e.target.value)} 
                  className="w-full px-4 py-3 neu-flat rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                />
              </div>
              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  SMTP Username / Email
                </label>
                <input 
                  type="email" 
                  placeholder="sales@company.com"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full px-4 py-3 neu-flat rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                />
              </div>
              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  SMTP Password
                </label>
                <input 
                  type="password" 
                  placeholder="••••••••••••"
                  value={appPassword} 
                  onChange={(e) => setAppPassword(e.target.value)} 
                  className="w-full px-4 py-3 neu-flat rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                />
              </div>
              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Daily Limit</label>
                <input 
                  type="number" 
                  min="1"
                  value={dailyLimit} 
                  onChange={(e) => setDailyLimit(parseInt(e.target.value) || 15)} 
                  className="w-full px-4 py-3 neu-flat rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                />
              </div>
              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  SMTP Host
                </label>
                <input 
                  type="text" 
                  placeholder="smtp.hostinger.com"
                  value={smtpHost} 
                  onChange={(e) => setSmtpHost(e.target.value)} 
                  className="w-full px-4 py-3 neu-flat rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                  required={accountType === 'smtp'}
                />
              </div>
              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  SMTP Port
                </label>
                <input 
                  type="number" 
                  value={smtpPort} 
                  onChange={(e) => setSmtpPort(parseInt(e.target.value) || 465)} 
                  className="w-full px-4 py-3 neu-flat rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                />
              </div>
              <div className="lg:col-span-2">
                <button 
                  type="submit" 
                  disabled={isAdding}
                  className="w-full flex justify-center items-center gap-2 px-6 py-3 neu-button text-indigo-500 dark:text-indigo-400 font-bold rounded-2xl transition-all text-sm disabled:opacity-70"
                >
                  {isAdding ? <Activity size={16} className="animate-spin" /> : <Plus size={16} />}
                  {isAdding ? 'Verifying...' : 'Add Professional Webmail'}
                </button>
              </div>
            </form>
          </>
        )}

        {showGuide && accountType === 'gmail' && (
          <div className="mt-6 p-5 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-indigo-200 dark:border-indigo-500/20 text-sm">
            <h4 className="font-bold text-slate-200 mb-3 text-base">কীভাবে 16-digit App Password পাবেন?</h4>
            <ol className="list-decimal pl-5 space-y-2 text-slate-600 dark:text-slate-400">
              <li>আপনার জিমেইলে লগ-ইন করে <a href="https://myaccount.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 underline decoration-indigo-500/30 underline-offset-2 font-bold">Manage your Google Account</a>-এ যান।</li>
              <li>বামদিকের মেনু থেকে <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 underline decoration-indigo-500/30 underline-offset-2 font-bold">Security</a>-তে ক্লিক করুন।</li>
              <li>নিশ্চিত করুন যে আপনার <b>2-Step Verification</b> চালু (On) করা আছে।</li>
              <li>Security পেজের সার্চ বারে <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 underline decoration-indigo-500/30 underline-offset-2 font-bold">"App passwords"</a> লিখে সার্চ করুন এবং ওপেন করুন (অথবা সরাসরি এই লিংকে ক্লিক করুন)।</li>
              <li><b>Select app</b>-এ ক্লিক করে <b>Other</b> সিলেক্ট করুন এবং নাম দিন <b>Injaazh ERP</b>।</li>
              <li><b>Generate</b>-এ ক্লিক করলে হলুদ বক্সে <b>১৬-ডিজিটের একটি কোড</b> পাবেন। ওই কোডটিই হলো আপনার App Password, যেটি এখানে পেস্ট করতে হবে!</li>
            </ol>
          </div>
        )}
      </div>

      {/* Accounts List */}
      <div>
        <h3 className="mb-4">
          Connected {accountType === 'smtp' ? 'SMTP' : 'Gmail'} Accounts
        </h3>
        {isLoading ? (
          <div className="flex justify-center p-8 text-indigo-500">
            <Activity className="animate-spin" />
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white/30 dark:bg-slate-800/30 rounded-3xl border border-slate-200 dark:border-slate-800">
            No {accountType === 'smtp' ? 'SMTP' : 'Gmail'} accounts connected yet. Add one above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map(account => (
              <div key={account._id} className={`p-5 rounded-2xl border ${account.isActive ? 'bg-white/80 dark:bg-slate-800/80 border-indigo-500/20' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'} relative overflow-hidden transition-all`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${account.isActive ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'}`}>
                      <Mail size={18} />
                    </div>
                    <div>
                      <h4 className="truncate max-w-[150px]" title={account.email}>
                        {account.senderName ? `${account.senderName} (${account.email})` : account.email}
                      </h4>
                      <div className="flex gap-1.5 mt-1">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${account.isActive ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'}`}>
                          {account.isActive ? 'Active' : 'Paused'}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                          {account.accountType === 'smtp' ? 'SMTP' : 'GMAIL'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(account._id)}
                    className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Quota Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-semibold text-slate-500">Daily Quota</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                      {account.sentToday} / {account.dailyLimit}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${account.sentToday >= account.dailyLimit ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                      style={{ width: `${Math.min(100, (account.sentToday / account.dailyLimit) * 100)}%` }}
                    />
                  </div>
                  {account.sentToday >= account.dailyLimit && (
                    <p className="text-[10px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertTriangle size={10} /> Quota Exhausted for today
                    </p>
                  )}
                </div>

                {/* Warmup Status */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <Activity size={12} className={account.warmupEnabled ? "text-green-500" : "text-slate-400"} />
                      Auto-Warmup
                    </span>
                    <button 
                      onClick={() => handleToggleWarmup(account._id, account)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${account.warmupEnabled ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'}`}
                    >
                      {account.warmupEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  
                  {account.warmupEnabled && (
                    <>
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] text-slate-400">Warmup Quota</span>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          {account.warmupSentToday || 0} / {account.warmupDailyLimit || 5}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-green-500"
                          style={{ width: `${Math.min(100, ((account.warmupSentToday || 0) / (account.warmupDailyLimit || 5)) * 100)}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>

                <button 
                  onClick={() => handleToggleStatus(account._id, account.isActive)}
                  className={`w-full py-2 rounded-xl text-xs font-bold border transition-colors ${account.isActive ? 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-500/30 dark:text-amber-400 dark:hover:bg-amber-500/10' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-500/30 dark:text-indigo-400 dark:hover:bg-indigo-500/10'}`}
                >
                  {account.isActive ? 'Pause Account' : 'Activate Account'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
