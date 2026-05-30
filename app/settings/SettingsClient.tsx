'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import TwoFactorSetupModal from '@/components/TwoFactorSetupModal';
import { checkTwoFactorStatus } from '@/app/actions/twoFactorActions';
import { 
  User, 
  Bell, 
  ShieldCheck, 
  Key, 
  AlertTriangle,
  Save,
  Play,
  Volume2,
  MonitorSmartphone,
  LogOut,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Activity,
  CreditCard,
  Mail,
  CheckCircle,
  Send
} from 'lucide-react';
import { getSystemSettings, saveSystemSettings, testSmtpConnection } from '@/app/actions/settingsActions';
import { sendTestEmail } from '@/app/actions/emailActions';

const playSound = (type: 'success' | 'pop' | 'error' | 'cash') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'success') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc1.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.2); // C6

      osc2.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.8);
    } else if (type === 'pop') {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'cash') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'square';
      
      osc1.frequency.setValueAtTime(1500, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.05);

      osc2.frequency.setValueAtTime(2000, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.05);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start(ctx.currentTime + 0.05);
      osc1.stop(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 0.35);
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {
    console.error("Audio Context not supported");
  }
};

const GlassCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/20 dark:border-purple-500/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(167,139,250,0.05)] rounded-3xl p-8 ${className}`}>
    {children}
  </div>
);

const TABS = [
  { id: 'general', label: 'General & Profile', icon: User },
  { id: 'notifications', label: 'Notifications & Sounds', icon: Bell },
  { id: 'security', label: 'Security & Access', icon: ShieldCheck },
  { id: 'smtp', label: 'SMTP Configurations', icon: Mail },
  { id: 'api', label: 'API & Webhooks', icon: Key },
  { id: 'billing', label: 'Usage & Billing', icon: CreditCard },
  { id: 'danger', label: 'Data & Danger Zone', icon: AlertTriangle, danger: true },
];

export default function SettingsClient() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  
  // 2FA States
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);

  // SMTP Configuration States
  const [smtpSettings, setSmtpSettings] = useState({
    host: '',
    port: 587,
    user: '',
    pass: '',
    fromName: '',
    fromEmail: '',
  });
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState('');

  useEffect(() => {
    checkTwoFactorStatus().then(res => {
      if (res.success) setIs2FAEnabled(res.enabled || false);
    });

    // Fetch dynamic SMTP settings
    getSystemSettings('smtp').then(res => {
      if (res.success && res.data) {
        setSmtpSettings(res.data);
      }
    });
  }, []);
  
  // Notification States
  const [masterSound, setMasterSound] = useState(true);
  const [soundSettings, setSoundSettings] = useState({
    newLead: true,
    leadConverted: true,
    paymentReceived: true,
  });

  const [dangerConfirm, setDangerConfirm] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    toast.loading('Saving preferences...', { id: 'save' });
    
    try {
      // Save SMTP settings dynamically
      const res = await saveSystemSettings('smtp', smtpSettings);
      if (!res.success) {
        throw new Error(res.error || 'Failed to save SMTP configurations');
      }

      toast.success('Settings saved successfully!', { id: 'save' });
      if (masterSound) playSound('success');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings.', { id: 'save' });
      if (masterSound) playSound('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!smtpSettings.host || !smtpSettings.user || !smtpSettings.pass) {
      toast.error('Please fill in Host, Username, and Password first.');
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);
    toast.loading('Testing SMTP connection...', { id: 'smtp-test' });

    try {
      const res = await testSmtpConnection(smtpSettings);
      if (res.success) {
        toast.success(res.message || 'SMTP Connection established!', { id: 'smtp-test' });
        setTestResult({ success: true, message: res.message || 'SMTP Connection established successfully.' });
        if (masterSound) playSound('success');
      } else {
        toast.error(res.error || 'SMTP Connection failed.', { id: 'smtp-test' });
        setTestResult({ success: false, message: res.error || 'Failed to connect. Please check credentials.' });
        if (masterSound) playSound('error');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to run connection test.', { id: 'smtp-test' });
      setTestResult({ success: false, message: err.message || 'Unknown error occurred.' });
      if (masterSound) playSound('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      toast.error('Please enter an email address to send test email.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmailAddress)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    // Check if SMTP is configured
    if (!smtpSettings.host || !smtpSettings.user || !smtpSettings.pass) {
      toast.error('Please configure and save SMTP settings first.');
      return;
    }

    // First, save the current settings to database
    setIsSendingTestEmail(true);
    toast.loading('Saving settings and sending test email...', { id: 'test-email' });

    try {
      // Save settings first
      const saveRes = await saveSystemSettings('smtp', smtpSettings);
      if (!saveRes.success) {
        throw new Error('Failed to save SMTP settings. Please try again.');
      }

      // Then send test email
      const res = await sendTestEmail({ to: testEmailAddress });
      if (res.success) {
        toast.success('Test email sent successfully! Check your inbox.', { id: 'test-email' });
        if (masterSound) playSound('success');
        setTestEmailAddress(''); // Clear input after success
      } else {
        toast.error(res.error || 'Failed to send test email.', { id: 'test-email' });
        if (masterSound) playSound('error');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send test email.', { id: 'test-email' });
      if (masterSound) playSound('error');
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleSoundToggle = (key: keyof typeof soundSettings) => {
    setSoundSettings(prev => ({ ...prev, [key]: !prev[key] }));
    if (!soundSettings[key] && masterSound) {
      playSound('pop');
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-6xl md:text-7xl font-jakarta font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 mb-3 drop-shadow-sm">
            Settings
          </h1>
          <p className="text-[15px] font-inter leading-relaxed tracking-wide text-slate-500 dark:text-slate-400">
            Manage your agency preferences and system configurations
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-jakarta font-bold rounded-2xl hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all text-sm group ${isSaving ? 'opacity-70' : ''}`}
        >
          {isSaving ? <Activity size={18} className="animate-spin" /> : <Save size={18} className="group-hover:scale-110 transition-transform" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Menu */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/20 dark:border-purple-500/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(167,139,250,0.05)] rounded-3xl p-4 flex flex-col gap-2">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (masterSound) playSound('pop');
                  }}
                  className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 font-jakarta font-bold text-sm relative overflow-hidden ${
                    isActive 
                      ? tab.danger 
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                        : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab" 
                      className={`absolute left-0 w-1.5 h-8 rounded-r-full ${tab.danger ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`} 
                    />
                  )}
                  <Icon size={20} className={isActive ? '' : 'opacity-70'} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
              transition={{ duration: 0.3 }}
            >
              
              {/* TAB: General */}
              {activeTab === 'general' && (
                <GlassCard>
                  <h2 className="text-3xl font-jakarta font-black text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3">
                    <User className="text-indigo-500" /> General & Profile
                  </h2>
                  <div className="space-y-6 max-w-2xl">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 border border-white/50 dark:border-white/10 flex items-center justify-center cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden">
                        <User size={32} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-bold">Upload</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">Profile Picture</h3>
                        <p className="text-xs text-slate-500 mt-1">Recommended size: 500x500px</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-jakarta font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">Agency Name</label>
                        <input type="text" defaultValue="Injaazh Global" className="w-full px-5 py-3.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/30 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-inter text-[15px]" />
                      </div>
                      <div>
                        <label className="block text-sm font-jakarta font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">Admin Name</label>
                        <input type="text" defaultValue="System Admin" className="w-full px-5 py-3.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/30 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-inter text-[15px]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                      <input type="email" defaultValue="admin@injaazh.com" className="w-full px-5 py-3.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/30 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-medium" />
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* TAB: Notifications & Sounds */}
              {activeTab === 'notifications' && (
                <GlassCard>
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-jakarta font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                      <Volume2 className="text-indigo-500" /> Notifications & Sounds
                    </h2>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <span className="text-sm font-jakarta font-bold text-slate-500">Master Sound</span>
                      <div className="relative">
                        <input type="checkbox" className="sr-only" checked={masterSound} onChange={() => {
                          setMasterSound(!masterSound);
                          if (!masterSound) playSound('success');
                        }} />
                        <div className={`block w-14 h-8 rounded-full transition-colors ${masterSound ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${masterSound ? 'transform translate-x-6' : ''}`}></div>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-4">
                    {/* Sound Settings Items */}
                    {[
                      { id: 'newLead', label: 'New Lead Added', desc: 'Plays a subtle pop when a lead enters the system.', sound: 'pop' as const },
                      { id: 'leadConverted', label: 'Lead Converted to Client', desc: 'Plays a success chime when a deal is won.', sound: 'success' as const },
                      { id: 'paymentReceived', label: 'Payment Received', desc: 'Plays a distinct coin chime when income is logged.', sound: 'cash' as const },
                    ].map(item => (
                      <div key={item.id} className={`flex items-center justify-between p-6 rounded-3xl border transition-all ${soundSettings[item.id as keyof typeof soundSettings] && masterSound ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-white/30 dark:bg-slate-800/30 border-white/20 dark:border-slate-700/50'}`}>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => masterSound ? playSound(item.sound) : toast.error("Master sound is muted")}
                            className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-indigo-500 hover:scale-110 hover:shadow-lg hover:shadow-indigo-500/20 transition-all border border-slate-100 dark:border-slate-700"
                            title="Preview Sound"
                          >
                            <Play size={20} className="ml-1" />
                          </button>
                          <div>
                            <h4 className="font-jakarta font-black text-slate-800 dark:text-slate-200">{item.label}</h4>
                            <p className="text-xs font-inter text-slate-500">{item.desc}</p>
                          </div>
                        </div>
                        <label className="relative cursor-pointer">
                          <input type="checkbox" className="sr-only" disabled={!masterSound} checked={soundSettings[item.id as keyof typeof soundSettings]} onChange={() => handleSoundToggle(item.id as keyof typeof soundSettings)} />
                          <div className={`block w-12 h-6 rounded-full transition-colors ${!masterSound ? 'bg-slate-200 dark:bg-slate-800 opacity-50' : soundSettings[item.id as keyof typeof soundSettings] ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${!masterSound ? 'opacity-50' : ''} ${soundSettings[item.id as keyof typeof soundSettings] ? 'transform translate-x-6' : ''}`}></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* TAB: Security */}
              {activeTab === 'security' && (
                <GlassCard>
                  <h2 className="text-3xl font-jakarta font-black text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3">
                    <ShieldCheck className="text-indigo-500" /> Security & Access Control
                  </h2>
                  
                  <div className="mb-10 p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                      <h3 className="font-jakarta font-black text-indigo-700 dark:text-indigo-400 mb-1">Two-Factor Authentication (2FA)</h3>
                      <p className="text-sm font-inter text-slate-600 dark:text-slate-400">
                        {is2FAEnabled ? 'Your account is secured with 2FA.' : 'Secure your account with an authenticator app.'}
                      </p>
                    </div>
                    {is2FAEnabled ? (
                      <button 
                        onClick={() => {
                          setIsDisabling2FA(true);
                          setIs2FAModalOpen(true);
                        }}
                        className="px-6 py-3 bg-rose-600/10 text-rose-600 font-jakarta font-bold rounded-xl shadow-sm hover:bg-rose-600 hover:text-white transition-colors whitespace-nowrap"
                      >
                        Disable 2FA
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setIsDisabling2FA(false);
                          setIs2FAModalOpen(true);
                        }}
                        className="px-6 py-3 bg-indigo-600 text-white font-jakarta font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
                      >
                        Enable 2FA
                      </button>
                    )}
                  </div>

                  <TwoFactorSetupModal 
                    isOpen={is2FAModalOpen}
                    onClose={() => setIs2FAModalOpen(false)}
                    isDisabling={isDisabling2FA}
                    onSuccess={() => {
                      setIs2FAEnabled(!isDisabling2FA);
                    }}
                  />

                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <MonitorSmartphone size={18} className="text-slate-400" /> Active Sessions
                  </h3>
                  
                  <div className="space-y-4">
                    {[
                      { device: 'MacBook Pro 16"', browser: 'Chrome', location: 'Dhaka, BD', current: true },
                      { device: 'iPhone 14 Pro', browser: 'Safari', location: 'Dhaka, BD', current: false },
                    ].map((session, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 rounded-2xl bg-white/30 dark:bg-slate-800/30 border border-white/20 dark:border-slate-700/50 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                            <MonitorSmartphone size={20} className="text-slate-500" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                              {session.device} 
                              {session.current && <span className="text-[10px] bg-teal-500/20 text-teal-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Current</span>}
                            </h4>
                            <p className="text-xs font-medium text-slate-500">{session.browser} • {session.location}</p>
                          </div>
                        </div>
                        {!session.current && (
                          <button 
                            onClick={() => {
                              toast.success('Session revoked successfully');
                              if (masterSound) playSound('success');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-600 font-bold rounded-xl hover:bg-rose-500 hover:text-white transition-all text-xs"
                          >
                            <LogOut size={14} /> Revoke Access
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* TAB: API */}
              {activeTab === 'api' && (
                <GlassCard>
                  <h2 className="text-3xl font-jakarta font-black text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3">
                    <Key className="text-indigo-500" /> API Keys & Webhooks
                  </h2>
                  
                  <div className="space-y-8">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Google Gemini API Key (AI Assistant)</label>
                      <div className="relative">
                        <input 
                          type={showKey ? 'text' : 'password'} 
                          defaultValue="AIzaSyB_f-XVZOMwGgD1kUxm1Q44wCMjqqIuKtY" 
                          className="w-full px-5 py-3.5 pr-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/30 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-medium font-mono text-sm" 
                        />
                        <button 
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                        >
                          {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center justify-between">
                        <span>Webhook Endpoints</span>
                        <button className="text-xs font-bold text-indigo-500 hover:text-indigo-600">+ Add Webhook</button>
                      </h3>
                      <div className="p-4 rounded-2xl bg-white/30 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 flex items-center justify-between opacity-50">
                        <p className="text-xs font-mono text-slate-500">No webhooks configured yet.</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* TAB: SMTP Configurations */}
              {activeTab === 'smtp' && (
                <GlassCard>
                  <h2 className="text-3xl font-jakarta font-black text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3">
                    <Mail className="text-indigo-500" /> SMTP Configurations
                  </h2>
                  
                  <div className="space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-jakarta font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">SMTP Host</label>
                        <input 
                          type="text" 
                          placeholder="e.g. smtp.gmail.com" 
                          value={smtpSettings.host} 
                          onChange={(e) => setSmtpSettings(prev => ({ ...prev, host: e.target.value }))}
                          className="w-full px-5 py-3.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/30 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-inter text-[15px]" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">SMTP Port</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 587" 
                          value={smtpSettings.port} 
                          onChange={(e) => setSmtpSettings(prev => ({ ...prev, port: parseInt(e.target.value) || 587 }))}
                          className="w-full px-5 py-3.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/30 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-medium" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">SMTP Username / Email</label>
                        <input 
                          type="email" 
                          placeholder="e.g. your-email@gmail.com" 
                          value={smtpSettings.user} 
                          onChange={(e) => setSmtpSettings(prev => ({ ...prev, user: e.target.value }))}
                          className="w-full px-5 py-3.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/30 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-medium" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">SMTP Password / App Password</label>
                        <div className="relative">
                          <input 
                            type={showSmtpPass ? 'text' : 'password'} 
                            placeholder="e.g. App Password" 
                            value={smtpSettings.pass} 
                            onChange={(e) => setSmtpSettings(prev => ({ ...prev, pass: e.target.value }))}
                            className="w-full px-5 py-3.5 pr-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/30 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-medium font-mono text-sm" 
                          />
                          <button 
                            type="button"
                            onClick={() => setShowSmtpPass(!showSmtpPass)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer"
                          >
                            {showSmtpPass ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sender Name (From Name)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Mamun" 
                          value={smtpSettings.fromName} 
                          onChange={(e) => setSmtpSettings(prev => ({ ...prev, fromName: e.target.value }))}
                          className="w-full px-5 py-3.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/30 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-medium" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sender Email (From Email)</label>
                        <input 
                          type="email" 
                          placeholder="e.g. mamun@injaazh.com" 
                          value={smtpSettings.fromEmail} 
                          onChange={(e) => setSmtpSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                          className="w-full px-5 py-3.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/30 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-medium" 
                        />
                      </div>
                    </div>

                    {/* Test Connection Button & Status Glow */}
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                      <div>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Real SMTP Handshake Test</span>
                        <p className="text-xs text-slate-400 mt-1">Nodemailer will run a quick verified handshake to confirm your configurations.</p>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">💡 Tip: Test connection first, then click "Save Changes" at the top.</p>
                      </div>

                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={isTestingConnection}
                        className="px-6 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20 font-bold rounded-2xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 disabled:opacity-40"
                      >
                        {isTestingConnection ? (
                          <>
                            <Activity size={14} className="animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <MonitorSmartphone size={14} />
                            <span>Test Connection</span>
                          </>
                        )}
                      </button>
                    </div>

                    {testResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-2xl text-xs flex items-start gap-3 border ${
                          testResult.success 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {testResult.success ? <CheckCircle size={16} className="mt-0.5" /> : <AlertTriangle size={16} className="mt-0.5" />}
                        <div>
                          <div className="font-extrabold">{testResult.success ? 'Success!' : 'Configuration Error'}</div>
                          <p className="mt-0.5 font-medium leading-relaxed">{testResult.message}</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Send Test Email Section */}
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                      <div className="mb-4">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Send Test Email</span>
                        <p className="text-xs text-slate-400 mt-1">Send a beautifully designed test email to verify your SMTP configuration is working end-to-end.</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-2">
                          <AlertTriangle size={12} />
                          <span>Settings will be automatically saved before sending test email.</span>
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <input 
                          type="email" 
                          placeholder="Enter email address to receive test email" 
                          value={testEmailAddress}
                          onChange={(e) => setTestEmailAddress(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isSendingTestEmail) {
                              handleSendTestEmail();
                            }
                          }}
                          className="flex-1 px-5 py-3.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/30 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-200 font-inter text-[15px]" 
                        />
                        <button
                          type="button"
                          onClick={handleSendTestEmail}
                          disabled={isSendingTestEmail || !testEmailAddress}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 font-jakarta font-bold rounded-2xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {isSendingTestEmail ? (
                            <>
                              <Activity size={16} className="animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send size={16} />
                              <span>Send Test Email</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                </GlassCard>
              )}

              {/* TAB: Billing */}
              {activeTab === 'billing' && (
                <GlassCard>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3">
                    <CreditCard className="text-indigo-500" /> Usage & Billing
                  </h2>
                  
                  <div className="mb-10 p-8 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/30">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div>
                        <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block backdrop-blur-md">Current Plan</span>
                        <h3 className="text-4xl font-black mb-1">Agency Pro</h3>
                        <p className="text-indigo-100 font-medium">$99.00 / month</p>
                      </div>
                      <button className="px-8 py-3 bg-white text-indigo-600 font-black rounded-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all">
                        Manage Billing
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-6">Resource Limits</h3>
                  
                  <div className="space-y-8">
                    {/* Progress 1 */}
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300">AI Assistant Credits</span>
                        <span className="text-sm font-black text-slate-500">8,500 / 10,000</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '85%' }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Progress 2 */}
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Database Storage</span>
                        <span className="text-sm font-black text-slate-500">2.1 GB / 5.0 GB</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '42%' }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* TAB: Danger Zone */}
              {activeTab === 'danger' && (
                <GlassCard className="border-rose-500/20 dark:border-rose-500/20">
                  <h2 className="text-2xl font-black text-rose-600 dark:text-rose-400 mb-8 flex items-center gap-3">
                    <AlertTriangle className="text-rose-500" /> Data & Danger Zone
                  </h2>

                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-white/30 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div>
                        <h4 className="font-black text-slate-800 dark:text-slate-200">Export All Data</h4>
                        <p className="text-xs font-medium text-slate-500 mt-1">Download a JSON/CSV copy of all your agency data.</p>
                      </div>
                      <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl hover:scale-105 transition-transform text-sm whitespace-nowrap">
                        <Download size={16} /> Request Export
                      </button>
                    </div>

                    <div className="p-8 rounded-3xl bg-rose-500/5 border-2 border-rose-500/20">
                      <h4 className="font-black text-rose-600 dark:text-rose-400 text-xl mb-2">Factory Reset Database</h4>
                      <p className="text-sm font-medium text-rose-500/70 mb-6">This will permanently delete all leads, projects, transactions, and proposals. This action cannot be undone.</p>
                      
                      <div className="max-w-md">
                        <label className="block text-xs font-bold text-rose-600 mb-2 uppercase tracking-wider">Type "CONFIRM" to unlock</label>
                        <div className="flex gap-4">
                          <input 
                            type="text" 
                            value={dangerConfirm}
                            onChange={(e) => setDangerConfirm(e.target.value)}
                            placeholder="CONFIRM" 
                            className="flex-1 px-5 py-3 bg-white dark:bg-slate-900 border border-rose-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-rose-600 font-black tracking-widest placeholder-rose-300" 
                          />
                          <button 
                            disabled={dangerConfirm !== 'CONFIRM'}
                            onClick={() => {
                              toast.error('Factory Reset Initiated!', { icon: '⚠️' });
                              if (masterSound) playSound('error');
                              setDangerConfirm('');
                            }}
                            className={`flex items-center gap-2 px-6 py-3 bg-rose-600 text-white font-black rounded-xl transition-all ${dangerConfirm === 'CONFIRM' ? 'hover:bg-rose-700 hover:shadow-[0_0_20px_rgba(225,29,72,0.4)]' : 'opacity-50 cursor-not-allowed'}`}
                          >
                            <Trash2 size={18} /> Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
