'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useTheme } from 'next-themes';
import TwoFactorSetupModal from '@/components/TwoFactorSetupModal';
import { checkTwoFactorStatus } from '@/app/actions/twoFactorActions';
import { 
  User, Bell, ShieldCheck, Key, AlertTriangle, Save, Play, Volume2, MonitorSmartphone, LogOut,
  Download, Trash2, Eye, EyeOff, Activity, CreditCard, Mail, CheckCircle, Send, Users,
  Building2, Briefcase, Lock, Palette, Blocks, HardDrive, History, RefreshCcw, Info, CheckCircle2,
  Lightbulb, Clock, Camera, Moon, Sun, Monitor, Check, PanelLeft, PanelLeftClose, Plus, ChevronRight,
  MessageSquare, Video, Code2, FileText, ExternalLink, Database, RotateCcw, FileArchive
} from 'lucide-react';
import { useAppearance } from '@/components/layout/AppearanceContext';
import { getSystemSettings, saveSystemSettings, testSmtpConnection } from '@/app/actions/settingsActions';
import { sendTestEmail } from '@/app/actions/emailActions';
import { useUser } from '@/components/layout/UserContext';
import { getTeamMembers, createTeamMember, updateTeamMemberRole, deleteTeamMember, updateUserProfile } from '@/app/actions/teamActions';
import { getActiveSessions, revokeSession } from '@/app/actions/sessionActions';
import EmailAccountsManager from './EmailAccountsManager';
import AiKeysManager from './AiKeysManager';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';

const MOCK_ROLES = [
  { id: 'owner', name: 'Owner', description: 'Full access to all settings, billing, and team management.', users: 1, isSystem: true },
  { id: 'admin', name: 'Admin', description: 'Can manage most settings, team members, but not billing.', users: 3, isSystem: true },
  { id: 'editor', name: 'Editor', description: 'Can create and edit content, manage leads, but cannot change settings.', users: 8, isSystem: false },
  { id: 'viewer', name: 'Viewer', description: 'Read-only access to dashboards and basic records.', users: 12, isSystem: false },
];

const THEMES = [
  { id: 'light', name: 'Light', icon: Sun },
  { id: 'dark', name: 'Dark', icon: Moon },
  { id: 'system', name: 'System', icon: Monitor }
];

const PERMISSIONS = [
  { category: 'CRM & Deals', items: [{ id: 'crm_read', label: 'View Leads & Deals' }, { id: 'crm_write', label: 'Edit Leads & Deals' }, { id: 'crm_delete', label: 'Delete Records' }] },
  { category: 'Finance', items: [{ id: 'fin_read', label: 'View Revenue & Expenses' }, { id: 'fin_write', label: 'Manage Invoices' }] },
  { category: 'Settings', items: [{ id: 'set_team', label: 'Manage Team' }, { id: 'set_bill', label: 'Manage Billing' }] },
];

const DEFAULT_ROLE_PERMS: Record<string, string[]> = {
  owner: ['crm_read', 'crm_write', 'crm_delete', 'fin_read', 'fin_write', 'set_team', 'set_bill'],
  admin: ['crm_read', 'crm_write', 'crm_delete', 'fin_read', 'fin_write', 'set_team'],
  editor: ['crm_read', 'crm_write', 'fin_read'],
  viewer: ['crm_read', 'fin_read']
};

const INITIAL_INTEGRATIONS = [
  { id: 'slack', name: 'Slack', description: 'Send notifications and updates to Slack channels.', icon: MessageSquare, color: '#E11D48', connected: true },
  { id: 'stripe', name: 'Stripe', description: 'Process payments and manage subscriptions.', icon: CreditCard, color: '#6366F1', connected: true },
  { id: 'google', name: 'Google Workspace', description: 'Sync calendar and contacts with Google.', icon: Mail, color: '#10B981', connected: false },
  { id: 'github', name: 'GitHub', description: 'Link commits and PRs to your projects.', icon: Code2, color: '#F8FAFC', connected: false },
  { id: 'zoom', name: 'Zoom', description: 'Automatically generate meeting links for CRM events.', icon: Video, color: '#3B82F6', connected: false },
  { id: 'notion', name: 'Notion', description: 'Embed Notion docs in project resources.', icon: FileText, color: '#A8A29E', connected: false },
];

const INITIAL_BACKUPS = [
  { id: 'b1', date: 'Jul 10, 2026, 02:00 AM', size: '45.2 MB', type: 'Automatic', status: 'Completed' },
  { id: 'b2', date: 'Jul 09, 2026, 02:00 AM', size: '44.8 MB', type: 'Automatic', status: 'Completed' },
  { id: 'b3', date: 'Jul 08, 2026, 04:15 PM', size: '42.1 MB', type: 'Manual', status: 'Completed' },
];

const INITIAL_AUDIT_LOGS = [
  { id: 'log1', user: 'Mamun H.', action: 'Created Manual Backup', ip: '192.168.1.45', time: 'Just now', status: 'success' },
  { id: 'log2', user: 'Alex L.', action: 'Failed login attempt', ip: '10.0.0.12', time: '10 mins ago', status: 'danger' },
  { id: 'log3', user: 'System', action: 'Automated Database Cleanup', ip: 'localhost', time: '1 hour ago', status: 'success' },
  { id: 'log4', user: 'Mamun H.', action: 'Updated Settings', ip: '192.168.1.45', time: '2 hours ago', status: 'success' },
  { id: 'log5', user: 'Sarah J.', action: 'Deleted Lead (John Doe)', ip: '172.16.0.4', time: 'Yesterday', status: 'warning' },
];

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
      
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1);
      osc1.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.2);

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
  <div className={`bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px] p-6 lg:p-8 relative ${className}`}>
    {children}
  </div>
);

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'workspace', label: 'Workspace', icon: Briefcase },
  { id: 'team', label: 'Team', icon: Users, adminOnly: true },
  { id: 'roles', label: 'Roles & Permissions', icon: Lock, adminOnly: true },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'api_keys', label: 'API Keys', icon: Key },
  { id: 'email_accounts', label: 'Outreach Emails', icon: Mail },
  { id: 'smtp', label: 'SMTP Configurations', icon: Mail },
  { id: 'integrations', label: 'Integrations', icon: Blocks },
  { id: 'billing', label: 'Billing', icon: CreditCard, adminOnly: true },
  { id: 'backup', label: 'Backup & Restore', icon: HardDrive, adminOnly: true },
  { id: 'audit', label: 'Audit Logs', icon: History, adminOnly: true },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true, adminOnly: true },
];

export default function SettingsClient() {
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // 2FA States
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // SMTP Configuration States
  const [smtpSettings, setSmtpSettings] = useState({ host: '', port: 587, user: '', pass: '', fromName: '', fromEmail: '' });
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState('');

  // User Profile States
  const { user, refreshUser } = useUser();
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | undefined>(undefined);

  // Appearance States
  const { accentColor, setAccentColor, sidebarLayout, setSidebarLayout } = useAppearance();

  // Roles States
  const [selectedRole, setSelectedRole] = useState('admin');
  const [rolePerms, setRolePerms] = useState<Record<string, string[]>>(DEFAULT_ROLE_PERMS);

  const togglePermission = (roleId: string, permId: string) => {
    if (roleId === 'owner') return; // Cannot edit owner
    setRolePerms(prev => {
      const current = prev[roleId] || [];
      const updated = current.includes(permId) ? current.filter(p => p !== permId) : [...current, permId];
      return { ...prev, [roleId]: updated };
    });
    triggerChange();
  };

  // Integrations States
  const [integrations, setIntegrations] = useState(INITIAL_INTEGRATIONS);
  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(app => app.id === id ? { ...app, connected: !app.connected } : app));
    triggerChange();
  };

  // Backup States
  const [backups, setBackups] = useState(INITIAL_BACKUPS);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleCreateBackup = () => {
    setIsBackingUp(true);
    if(masterSound) playSound('pop');
    setTimeout(() => {
      setIsBackingUp(false);
      const newBackup = {
        id: `b${Date.now()}`,
        date: new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        size: '46.1 MB',
        type: 'Manual',
        status: 'Completed'
      };
      setBackups(prev => [newBackup, ...prev]);
      toast.success('Backup created successfully!');
      if(masterSound) playSound('success');
    }, 2500);
  };

  const handleDeleteBackup = (id: string) => {
    setBackups(prev => prev.filter(b => b.id !== id));
    toast.success('Backup deleted');
    if(masterSound) playSound('pop');
  };

  // Audit Logs States
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);

  const handleRefreshLogs = () => {
    setIsRefreshingLogs(true);
    if(masterSound) playSound('pop');
    setTimeout(() => {
      setIsRefreshingLogs(false);
      const newLog = {
        id: `log${Date.now()}`,
        user: 'Mamun H.',
        action: 'Viewed Audit Logs',
        ip: '192.168.1.45',
        time: 'Just now',
        status: 'success'
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }, 1500);
  };

  // Own Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Team Management States
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('editor');
  const [isInviting, setIsInviting] = useState(false);

  // Filter Tabs based on role
  const tabsToRender = TABS.filter(t => !t.adminOnly || (t.adminOnly && (user?.role === 'admin' || user?.role === 'owner')));

  useEffect(() => {
    setMounted(true);
    checkTwoFactorStatus().then(res => { if (res.success) setIs2FAEnabled(res.enabled || false); });
    getSystemSettings('smtp').then(res => { if (res.success && res.data) setSmtpSettings(res.data); });
  }, []);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
      setProfileImage(user.image);
    }
    if (user?.role === 'admin' || user?.role === 'owner') {
      getTeamMembers().then(res => { if (res.success && res.data) setTeamMembers(res.data); });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'security') {
      setIsLoadingSessions(true);
      getActiveSessions().then(res => {
        if (res.success && res.sessions) setActiveSessions(res.sessions);
        setIsLoadingSessions(false);
      });
    }
  }, [activeTab]);
  
  // Notification States
  const [masterSound, setMasterSound] = useState(true);
  const [soundSettings, setSoundSettings] = useState({ newLead: true, leadConverted: true, paymentReceived: true });
  const [dangerConfirm, setDangerConfirm] = useState('');

  const triggerChange = () => setHasUnsavedChanges(true);

  const handleSave = async () => {
    setIsSaving(true);
    toast.loading('Saving preferences...', { id: 'save' });
    
    try {
      if (activeTab === 'profile') {
        const res = await updateUserProfile({ name: profileName, email: profileEmail, image: profileImage });
        if (!res.success) throw new Error(res.error || 'Failed to update profile');
        await refreshUser();
        toast.success('Profile updated successfully!', { id: 'save' });
      } else if (activeTab === 'smtp') {
        const res = await saveSystemSettings('smtp', smtpSettings);
        if (!res.success) throw new Error(res.error || 'Failed to save SMTP configurations');
        toast.success('SMTP settings saved successfully!', { id: 'save' });
      } else {
        toast.success('Settings saved successfully!', { id: 'save' });
      }
      if (masterSound) playSound('success');
      setHasUnsavedChanges(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings.', { id: 'save' });
      if (masterSound) playSound('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Image size must be less than 2MB');
    const reader = new FileReader();
    reader.onloadend = () => { setProfileImage(reader.result as string); triggerChange(); };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) return toast.error('All fields required');
    if (newPassword !== confirmNewPassword) return toast.error('Passwords do not match');
    if (newPassword.length < 8) return toast.error('Password must be at least 8 characters');

    setIsChangingPassword(true);
    toast.loading('Changing password...', { id: 'ch-pass' });
    try {
      const res = await updateUserProfile({ name: profileName, email: profileEmail, currentPassword, newPassword });
      if (res.success) {
        toast.success('Password updated!', { id: 'ch-pass' });
        setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
        if (masterSound) playSound('success');
      } else {
        toast.error(res.error || 'Failed to change password', { id: 'ch-pass' });
        if (masterSound) playSound('error');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred', { id: 'ch-pass' });
      if (masterSound) playSound('error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail || !invitePassword) return toast.error('Please fill in all details');
    setIsInviting(true);
    toast.loading('Creating team member...', { id: 'invite' });
    try {
      const res = await createTeamMember({ name: inviteName, email: inviteEmail, password: invitePassword, role: inviteRole });
      if (res.success) {
        toast.success('Team member added!', { id: 'invite' });
        setInviteName(''); setInviteEmail(''); setInvitePassword(''); setInviteRole('editor');
        const updated = await getTeamMembers();
        if (updated.success && updated.data) setTeamMembers(updated.data);
        if (masterSound) playSound('success');
      } else {
        toast.error(res.error || 'Failed to add team member', { id: 'invite' });
        if (masterSound) playSound('error');
      }
    } catch (err: any) {
      toast.error(err.message, { id: 'invite' });
      if (masterSound) playSound('error');
    } finally {
      setIsInviting(false);
    }
  };

  const handleToggleRole = async (memberId: string, role: string) => {
    toast.loading('Updating role...', { id: 'role-update' });
    try {
      const res = await updateTeamMemberRole(memberId, role);
      if (res.success) {
        toast.success('Role updated!', { id: 'role-update' });
        setTeamMembers(prev => prev.map(m => m._id === memberId ? { ...m, role } : m));
        if (masterSound) playSound('success');
      } else {
        toast.error(res.error || 'Failed to update role', { id: 'role-update' });
        if (masterSound) playSound('error');
      }
    } catch (err: any) {
      toast.error(err.message, { id: 'role-update' });
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    const isConfirmed = await confirm({ message: 'Remove team member?', danger: true });
    if (!isConfirmed) return;
    toast.loading('Removing team member...', { id: 'team-delete' });
    try {
      const res = await deleteTeamMember(memberId);
      if (res.success) {
        toast.success('Team member removed!', { id: 'team-delete' });
        setTeamMembers(prev => prev.filter(m => m._id !== memberId));
        if (masterSound) playSound('success');
      } else {
        toast.error(res.error || 'Failed to remove member', { id: 'team-delete' });
      }
    } catch (err: any) {
      toast.error(err.message, { id: 'team-delete' });
    }
  };

  const handleTestConnection = async () => {
    if (!smtpSettings.host || !smtpSettings.user || !smtpSettings.pass) return toast.error('Fill credentials first');
    setIsTestingConnection(true);
    toast.loading('Testing SMTP connection...', { id: 'smtp-test' });
    try {
      const res = await testSmtpConnection(smtpSettings);
      if (res.success) {
        toast.success(res.message || 'SMTP Connection established!', { id: 'smtp-test' });
        setTestResult({ success: true, message: res.message || 'SMTP Connection established successfully.' });
        if (masterSound) playSound('success');
      } else {
        toast.error(res.error || 'SMTP Connection failed.', { id: 'smtp-test' });
        setTestResult({ success: false, message: res.error || 'Failed to connect.' });
        if (masterSound) playSound('error');
      }
    } catch (err: any) {
      toast.error(err.message, { id: 'smtp-test' });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress) return toast.error('Enter an email address');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmailAddress)) return toast.error('Invalid email');
    setIsSendingTestEmail(true);
    toast.loading('Saving & sending test email...', { id: 'test-email' });
    try {
      const saveRes = await saveSystemSettings('smtp', smtpSettings);
      if (!saveRes.success) throw new Error('Failed to save SMTP');
      const res = await sendTestEmail({ to: testEmailAddress });
      if (res.success) {
        toast.success('Test email sent successfully!', { id: 'test-email' });
        if (masterSound) playSound('success');
        setTestEmailAddress('');
      } else {
        toast.error(res.error || 'Failed to send', { id: 'test-email' });
        if (masterSound) playSound('error');
      }
    } catch (err: any) {
      toast.error(err.message, { id: 'test-email' });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleSoundToggle = (key: keyof typeof soundSettings) => {
    setSoundSettings(prev => ({ ...prev, [key]: !prev[key] }));
    triggerChange();
    if (!soundSettings[key] && masterSound) playSound('pop');
  };

  return (
    <div className="bg-slate-50 dark:bg-[#09090B] min-h-screen text-slate-900 dark:text-white font-inter selection:bg-primary-600/30 pb-32">
      
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-[10px] bg-primary-600/10 border border-primary-600/20 flex items-center justify-center text-primary-600">
                <Blocks size={17} />
              </div>
              <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">System Configuration</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-jakarta mb-1.5">Settings</h1>
            <p className="text-sm font-medium text-[#94A3B8]">Manage preferences and system configurations across your workspace.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <RefreshCcw size={16} /> Reset Changes
            </button>
            <AnimatePresence>
              {(hasUnsavedChanges || isSaving) && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={handleSave} 
                  disabled={isSaving} 
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(37,99,235,0.25)] border bg-primary-600 hover:bg-primary-600/90 text-slate-900 dark:text-white border-primary-600/80"
                >
                  {isSaving ? <Activity size={16} className="animate-spin" /> : <Save size={16} />} 
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── 3-Column Layout ──────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar Menu */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="sticky top-6 flex flex-col gap-6">
              {[
                { title: 'Personal', items: ['profile', 'appearance', 'notifications'] },
                { title: 'Workspace', items: ['company', 'workspace', 'team', 'roles'] },
                { title: 'Advanced & Developer', items: ['api_keys', 'smtp', 'email_accounts', 'integrations', 'security', 'billing', 'backup', 'audit', 'danger'] }
              ].map(group => {
                const groupTabs = tabsToRender.filter(t => group.items.includes(t.id));
                if (groupTabs.length === 0) return null;
                return (
                  <div key={group.title} className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest pl-3 mb-2">{group.title}</span>
                    {groupTabs.map(tab => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveTab(tab.id); if (masterSound) playSound('pop'); }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${
                            isActive 
                              ? tab.danger ? 'bg-rose-500/10 text-rose-500' : 'bg-white shadow-sm border border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent dark:text-slate-400 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <Icon size={18} className={isActive ? (tab.danger ? 'text-rose-500' : 'text-primary-600') : 'opacity-70'} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Content (Forms) */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* ── PROFILE ── */}
                {activeTab === 'profile' && (
                  <GlassCard>
                    <div className="border-b border-slate-200 dark:border-[#232734] pb-6 mb-8">
                      <h2 className="text-xl font-bold font-jakarta mb-1">Profile Settings</h2>
                      <p className="text-sm text-[#94A3B8]">Manage your personal information and display settings.</p>
                    </div>
                    
                    <div className="flex items-center gap-6 mb-10">
                      <label className="w-24 h-24 rounded-full bg-slate-50 dark:bg-[#09090B] border-2 border-slate-200 dark:border-[#232734] flex items-center justify-center cursor-pointer hover:border-primary-600/50 transition-all group relative overflow-hidden">
                        {profileImage ? (
                          <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User size={32} className="text-[#94A3B8] group-hover:scale-110 group-hover:text-primary-600 transition-all" />
                        )}
                        <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1 backdrop-blur-[2px]">
                          <Camera size={16} className="text-slate-900 dark:text-white" />
                          <span className="text-slate-900 dark:text-white text-[10px] font-bold uppercase tracking-widest">Change</span>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                      <div>
                        <h3 className="font-bold mb-1 text-slate-900 dark:text-white">Avatar Profile</h3>
                        <p className="text-xs font-medium text-[#94A3B8] mb-3">JPG, GIF or PNG. Max size of 2MB.</p>
                        <button className="text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm px-3 py-1.5 rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors" onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}>
                          Upload Picture
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-2 ml-1">Full Name</label>
                        <input type="text" value={profileName} onChange={(e) => { setProfileName(e.target.value); triggerChange(); }} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500/50 rounded-xl focus:outline-none dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 font-medium text-sm transition-all shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-2 ml-1">Email Address</label>
                        <input type="email" value={profileEmail} onChange={(e) => { setProfileEmail(e.target.value); triggerChange(); }} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500/50 rounded-xl focus:outline-none dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 font-medium text-sm transition-all shadow-sm" />
                      </div>
                    </div>

                    <div className="pt-8 border-t border-slate-200 dark:border-[#232734]">
                      <h3 className="font-bold mb-6">Change Password</h3>
                      <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                        <div>
                          <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-2 ml-1">Current Password</label>
                          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500/50 rounded-xl focus:outline-none dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 text-sm font-bold transition-all shadow-sm" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-2 ml-1">New Password</label>
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500/50 rounded-xl focus:outline-none dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 text-sm font-bold transition-all shadow-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
                            <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500/50 rounded-xl focus:outline-none dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 text-sm font-bold transition-all shadow-sm" />
                          </div>
                        </div>
                        <button type="submit" disabled={isChangingPassword} className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-primary-600/20 hover:text-primary-600 text-slate-900 dark:text-white font-bold rounded-xl transition-all text-sm disabled:opacity-50 border border-transparent hover:border-primary-600/30">
                          {isChangingPassword ? 'Updating...' : 'Update Password'}
                        </button>
                      </form>
                    </div>
                  </GlassCard>
                )}

                {/* ── COMPANY & WORKSPACE ── */}
                {(activeTab === 'company' || activeTab === 'workspace') && (
                  <GlassCard>
                    <div className="border-b border-slate-200 dark:border-[#232734] pb-6 mb-8">
                      <h2 className="text-xl font-bold font-jakarta mb-1">{activeTab === 'company' ? 'Company Details' : 'Workspace Configuration'}</h2>
                      <p className="text-sm text-[#94A3B8]">Manage global settings and branding.</p>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-2 ml-1">Company Name</label>
                        <input type="text" defaultValue="Injaazh Global" className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500/50 rounded-xl focus:outline-none dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 font-medium text-sm transition-all" onChange={triggerChange} />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-2 ml-1">Timezone</label>
                          <select className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500/50 rounded-xl focus:outline-none dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 font-medium text-sm transition-all appearance-none" onChange={triggerChange}>
                            <option>UTC (GMT+00:00)</option>
                            <option>EST (GMT-05:00)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-2 ml-1">Currency</label>
                          <select className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500/50 rounded-xl focus:outline-none dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 font-medium text-sm transition-all appearance-none" onChange={triggerChange}>
                            <option>USD ($)</option>
                            <option>EUR (€)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* ── NOTIFICATIONS ── */}
                {activeTab === 'notifications' && (
                  <GlassCard>
                    <div className="border-b border-slate-200 dark:border-[#232734] pb-6 mb-8 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-bold font-jakarta mb-1">Notifications & Sounds</h2>
                        <p className="text-sm text-[#94A3B8]">Configure how and when you receive alerts.</p>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer bg-slate-50 dark:bg-[#09090B] px-4 py-2 rounded-xl border border-slate-200 dark:border-[#232734]">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#94A3B8]">Master Sound</span>
                        <div className="relative">
                          <input type="checkbox" className="sr-only" checked={masterSound} onChange={() => { setMasterSound(!masterSound); if (!masterSound) playSound('success'); triggerChange(); }} />
                          <div className={`block w-10 h-6 rounded-full transition-colors ${masterSound ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${masterSound ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                      </label>
                    </div>

                    <div className="space-y-4">
                      {[
                        { id: 'newLead', label: 'New Lead Added', desc: 'Plays a subtle pop when a lead enters the system.', sound: 'pop' as const },
                        { id: 'leadConverted', label: 'Lead Converted', desc: 'Plays a success chime when a deal is won.', sound: 'success' as const },
                        { id: 'paymentReceived', label: 'Payment Received', desc: 'Plays a distinct coin chime when income is logged.', sound: 'cash' as const },
                      ].map(item => (
                        <div key={item.id} className={`flex items-center justify-between p-5 rounded-xl border transition-all ${soundSettings[item.id as keyof typeof soundSettings] && masterSound ? 'bg-slate-50 dark:bg-[#09090B] border-primary-600/30 shadow-[0_0_15px_rgba(37,99,235,0.05)]' : 'bg-slate-50 dark:bg-[#09090B] border-slate-200 dark:border-[#232734]'}`}>
                          <div className="flex items-center gap-4">
                            <button onClick={() => masterSound ? playSound(item.sound) : toast.error("Master sound muted")} className="w-10 h-10 rounded-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] flex items-center justify-center text-[#94A3B8] hover:text-primary-600 transition-all" title="Preview Sound">
                              <Play size={14} className="ml-1" />
                            </button>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{item.label}</h4>
                              <p className="text-xs font-medium text-[#94A3B8] mt-0.5">{item.desc}</p>
                            </div>
                          </div>
                          <label className="relative cursor-pointer">
                            <input type="checkbox" className="sr-only" disabled={!masterSound} checked={soundSettings[item.id as keyof typeof soundSettings]} onChange={() => handleSoundToggle(item.id as keyof typeof soundSettings)} />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${!masterSound ? 'bg-slate-200 dark:bg-slate-700 opacity-50' : soundSettings[item.id as keyof typeof soundSettings] ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${!masterSound ? 'opacity-50' : ''} ${soundSettings[item.id as keyof typeof soundSettings] ? 'transform translate-x-4' : ''}`}></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* ── SECURITY ── */}
                {activeTab === 'security' && (
                  <GlassCard>
                    <div className="border-b border-slate-200 dark:border-[#232734] pb-6 mb-8">
                      <h2 className="text-xl font-bold font-jakarta mb-1">Security & Access Control</h2>
                      <p className="text-sm text-[#94A3B8]">Manage 2FA, sessions, and security protocols.</p>
                    </div>
                    
                    <div className="mb-10 p-6 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex flex-col md:flex-row justify-between items-center gap-6">
                      <div>
                        <h3 className="mb-1 text-slate-900 dark:text-white font-bold text-sm">Two-Factor Authentication (2FA)</h3>
                        <p className="text-xs font-medium text-[#94A3B8]">
                          {is2FAEnabled ? 'Your account is currently secured with 2FA.' : 'Secure your account with an authenticator app.'}
                        </p>
                      </div>
                      {is2FAEnabled ? (
                        <button onClick={() => { setIsDisabling2FA(true); setIs2FAModalOpen(true); }} className="px-5 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold rounded-lg text-sm hover:bg-rose-500/20">
                          Disable 2FA
                        </button>
                      ) : (
                        <button onClick={() => { setIsDisabling2FA(false); setIs2FAModalOpen(true); }} className="px-5 py-2 bg-primary-600 text-slate-900 dark:text-white font-bold rounded-lg text-sm hover:bg-primary-600/90 shadow-sm border border-primary-600/80">
                          Enable 2FA
                        </button>
                      )}
                    </div>
                    <TwoFactorSetupModal isOpen={is2FAModalOpen} onClose={() => setIs2FAModalOpen(false)} isDisabling={isDisabling2FA} onSuccess={() => setIs2FAEnabled(!isDisabling2FA)} />

                    <h3 className="mb-4 flex items-center gap-2 font-bold text-sm uppercase tracking-widest text-[#94A3B8]">
                      Active Sessions
                    </h3>
                    <div className="space-y-3">
                      {isLoadingSessions ? (
                        <div className="p-8 text-center flex justify-center"><Activity className="animate-spin text-primary-600" /></div>
                      ) : activeSessions.length === 0 ? (
                        <div className="p-6 text-center text-xs font-bold text-[#94A3B8]">No active sessions found.</div>
                      ) : activeSessions.map((session) => (
                        <div key={session._id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] flex items-center justify-center">
                              <MonitorSmartphone size={18} className="text-[#94A3B8]" />
                            </div>
                            <div>
                              <h4 className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm mb-0.5">
                                {session.device} 
                                {session.isCurrent && <span className="text-[9px] bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/20 px-2 py-0.5 rounded-md uppercase tracking-widest">Current</span>}
                              </h4>
                              <p className="text-xs font-medium text-[#94A3B8]">{session.browser} • {session.os} • {session.location}</p>
                            </div>
                          </div>
                          {!session.isCurrent && (
                            <button onClick={async () => {
                                const res = await revokeSession(session.sessionId);
                                if (res.success) { toast.success('Session revoked'); setActiveSessions(prev => prev.filter(s => s._id !== session._id)); } 
                                else toast.error('Failed to revoke session');
                              }}
                              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-lg text-xs transition-colors border border-rose-500/20">
                              Revoke Access
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* ── TEAM (Admin) ── */}
                {activeTab === 'team' && (
                  <GlassCard>
                    <div className="border-b border-slate-200 dark:border-[#232734] pb-6 mb-8 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-bold font-jakarta mb-1">Team Management</h2>
                        <p className="text-sm text-[#94A3B8]">Invite members and manage roles.</p>
                      </div>
                    </div>
                    
                    <form onSubmit={handleInviteMember} className="mb-10 p-6 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                      <div>
                        <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-2 ml-1">Name</label>
                        <input type="text" placeholder="John Doe" value={inviteName} onChange={(e) => setInviteName(e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl focus:outline-none focus:border-primary-600/60 text-slate-900 dark:text-white text-sm transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-2 ml-1">Email</label>
                        <input type="email" placeholder="john@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl focus:outline-none focus:border-primary-600/60 text-slate-900 dark:text-white text-sm transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-2 ml-1">Role</label>
                        <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl focus:outline-none focus:border-primary-600/60 text-slate-900 dark:text-white text-sm transition-all appearance-none cursor-pointer">
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="marketplace_team">Marketplace Team</option>
                        </select>
                      </div>
                      <button type="submit" disabled={isInviting} className="w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-600/90 text-slate-900 dark:text-white font-bold rounded-xl transition-all text-sm h-[42px]">
                        {isInviting ? 'Inviting...' : 'Invite Member'}
                      </button>
                    </form>

                    <h3 className="mb-4 font-bold text-sm uppercase tracking-widest text-[#94A3B8]">Active Members</h3>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#232734] bg-slate-50 dark:bg-[#09090B]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-[#232734] text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">
                            <th className="py-4 px-5">Name</th>
                            <th className="py-4 px-5">Role</th>
                            <th className="py-4 px-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamMembers.map(member => (
                            <tr key={member._id} className="border-b border-[#232734]/50 hover:bg-white dark:bg-[#11131A] transition-colors group">
                              <td className="py-4 px-5">
                                <span className="font-bold text-slate-900 dark:text-white text-sm block">{member.name}</span>
                                <span className="text-xs text-[#94A3B8]">{member.email}</span>
                              </td>
                              <td className="py-4 px-5">
                                <select value={member.role} onChange={(e) => handleToggleRole(member._id, e.target.value)} className="px-3 py-1.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-lg focus:outline-none focus:border-primary-600/50 text-slate-900 dark:text-white text-xs font-bold appearance-none cursor-pointer">
                                  <option value="owner">Owner</option>
                                  <option value="admin">Admin</option>
                                  <option value="editor">Editor</option>
                                </select>
                              </td>
                              <td className="py-4 px-5 text-right">
                                <button onClick={() => handleDeleteMember(member._id)} className="p-2 text-[#94A3B8] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </GlassCard>
                )}

                {/* ── API KEYS ── */}
                {activeTab === 'api_keys' && (
                  <GlassCard>
                    <div className="border-b border-slate-200 dark:border-[#232734] pb-6 mb-8">
                      <h2 className="text-xl font-bold font-jakarta mb-1">API Keys & Webhooks</h2>
                      <p className="text-sm text-[#94A3B8]">Manage your external API keys and integrations.</p>
                    </div>
                    <AiKeysManager />
                  </GlassCard>
                )}

                {/* ── EMAIL & SMTP ── */}
                {activeTab === 'email_accounts' && (
                  <GlassCard>
                    <div className="border-b border-slate-200 dark:border-[#232734] pb-6 mb-8">
                      <h2 className="text-xl font-bold font-jakarta mb-1">Outreach Emails</h2>
                      <p className="text-sm text-[#94A3B8]">Connect email accounts for outbound campaigns.</p>
                    </div>
                    <EmailAccountsManager />
                  </GlassCard>
                )}

                {activeTab === 'smtp' && (
                  <GlassCard>
                    <div className="border-b border-slate-200 dark:border-[#232734] pb-6 mb-8">
                      <h2 className="text-xl font-bold font-jakarta mb-1">SMTP Configurations</h2>
                      <p className="text-sm text-[#94A3B8]">Configure system-wide outgoing email server.</p>
                    </div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-2 ml-1">SMTP Host</label>
                          <input type="text" value={smtpSettings.host} onChange={(e) => { setSmtpSettings(prev => ({ ...prev, host: e.target.value })); triggerChange(); }} className="w-full px-4 py-3 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl focus:border-primary-600/60 text-slate-900 dark:text-white font-medium text-sm focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-2 ml-1">Port</label>
                          <input type="number" value={smtpSettings.port} onChange={(e) => { setSmtpSettings(prev => ({ ...prev, port: parseInt(e.target.value) || 587 })); triggerChange(); }} className="w-full px-4 py-3 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl focus:border-primary-600/60 text-slate-900 dark:text-white font-medium text-sm focus:outline-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-2 ml-1">Username / Email</label>
                          <input type="email" value={smtpSettings.user} onChange={(e) => { setSmtpSettings(prev => ({ ...prev, user: e.target.value })); triggerChange(); }} className="w-full px-4 py-3 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl focus:border-primary-600/60 text-slate-900 dark:text-white font-medium text-sm focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-2 ml-1">App Password</label>
                          <div className="relative">
                            <input type={showSmtpPass ? 'text' : 'password'} value={smtpSettings.pass} onChange={(e) => { setSmtpSettings(prev => ({ ...prev, pass: e.target.value })); triggerChange(); }} className="w-full px-4 py-3 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl focus:border-primary-600/60 text-slate-900 dark:text-white font-mono text-sm focus:outline-none pr-10" />
                            <button type="button" onClick={() => setShowSmtpPass(!showSmtpPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><Eye size={16} /></button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-6 border-t border-slate-200 dark:border-[#232734] flex justify-between items-center">
                        <p className="text-xs font-bold text-[#94A3B8]">Run handshake test before saving.</p>
                        <button type="button" onClick={handleTestConnection} disabled={isTestingConnection} className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-[#323746] text-slate-900 dark:text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors">
                          {isTestingConnection ? <Activity size={14} className="animate-spin" /> : <Activity size={14} />} Test Connection
                        </button>
                      </div>
                      {testResult && (
                        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 border ${testResult.success ? 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]'}`}>
                          {testResult.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} {testResult.message}
                        </div>
                      )}
                    </div>
                  </GlassCard>
                )}

                {/* ── APPEARANCE ── */}
                {activeTab === 'appearance' && (
                  <GlassCard>
                    <div className="border-b border-slate-200 dark:border-[#232734] pb-6 mb-8">
                      <h2 className="text-xl font-bold font-jakarta mb-1">Appearance & Interface</h2>
                      <p className="text-sm text-[#94A3B8]">Customize the look and feel of your workspace.</p>
                    </div>

                    <div className="space-y-10">
                      {/* Theme Selection */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Theme Preference</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {THEMES.map(t => (
                            <button key={t.id} onClick={() => { setTheme(t.id); triggerChange(); }} className={`relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${mounted && theme === t.id ? 'bg-primary-600/5 border-primary-600 text-primary-600' : 'bg-slate-50 dark:bg-[#09090B] border-slate-200 dark:border-[#232734] text-[#94A3B8] hover:border-[#232734]/80'}`}>
                              <t.icon size={24} className={mounted && theme === t.id ? 'text-primary-600' : 'text-[#94A3B8]'} />
                              <span className={`text-sm font-bold ${mounted && theme === t.id ? 'text-slate-900 dark:text-white' : 'text-[#94A3B8]'}`}>{t.name}</span>
                              {mounted && theme === t.id && <div className="absolute top-3 right-3"><CheckCircle2 size={16} /></div>}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Accent Color */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Accent Color</h3>
                        <div className="flex flex-wrap items-center gap-4">
                          {[
                            { id: 'violet', color: '#7C3AED', name: 'Violet' },
                            { id: 'blue', color: 'var(--color-primary-600)', name: 'Blue' },
                            { id: 'emerald', color: '#10B981', name: 'Emerald' },
                            { id: 'rose', color: '#E11D48', name: 'Rose' },
                            { id: 'amber', color: '#F59E0B', name: 'Amber' }
                          ].map(c => (
                            <button key={c.id} onClick={() => { setAccentColor(c.id as any); triggerChange(); }} className={`group flex flex-col items-center gap-2`} title={c.name}>
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${accentColor === c.id ? 'ring-[3px] ring-white ring-offset-4 ring-offset-[#11131A]' : 'hover:scale-110'}`} style={{ backgroundColor: c.color }}>
                                {accentColor === c.id && <Check size={20} className="text-slate-900 dark:text-white" />}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sidebar Layout */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Sidebar Layout</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { id: 'expanded', label: 'Expanded (Default)', icon: PanelLeft, desc: 'Full menu with labels.' },
                            { id: 'collapsed', label: 'Collapsed', icon: PanelLeftClose, desc: 'Icons only to save space.' }
                          ].map(l => (
                            <button key={l.id} onClick={() => { setSidebarLayout(l.id as any); triggerChange(); }} className={`flex items-start text-left gap-4 p-5 rounded-2xl border-2 transition-all ${sidebarLayout === l.id ? 'bg-primary-600/5 border-primary-600' : 'bg-slate-50 dark:bg-[#09090B] border-slate-200 dark:border-[#232734] hover:border-[#232734]/80'}`}>
                              <div className={`mt-0.5 ${sidebarLayout === l.id ? 'text-primary-600' : 'text-[#94A3B8]'}`}>
                                <l.icon size={20} />
                              </div>
                              <div>
                                <h4 className={`font-bold text-sm mb-1 ${sidebarLayout === l.id ? 'text-slate-900 dark:text-white' : 'text-[#94A3B8]'}`}>{l.label}</h4>
                                <p className="text-xs text-[#94A3B8] font-medium">{l.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* ── AUDIT LOGS ── */}
                {activeTab === 'audit' && (
                  <GlassCard>
                    <div className="border-b border-slate-200 dark:border-[#232734] pb-6 mb-6 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                      <div>
                        <h2 className="text-xl font-bold font-jakarta mb-1">Audit Logs</h2>
                        <p className="text-sm text-[#94A3B8]">Track system activities and security events.</p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={handleRefreshLogs} disabled={isRefreshingLogs} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#11131A] hover:bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition-all border border-slate-200 dark:border-[#232734] disabled:opacity-50">
                          <RefreshCcw size={14} className={isRefreshingLogs ? 'animate-spin' : ''} /> Refresh
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600/10 hover:bg-primary-600/20 text-primary-600 border border-primary-600/20 text-xs font-bold transition-all">
                          <Download size={14} /> Export CSV
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#232734] bg-slate-50 dark:bg-[#09090B]">
                      <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-[#232734] text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest bg-[#11131A]/50">
                            <th className="py-4 px-5">User / System</th>
                            <th className="py-4 px-5">Event Action</th>
                            <th className="py-4 px-5">IP Address</th>
                            <th className="py-4 px-5">Time</th>
                            <th className="py-4 px-5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.map(log => (
                            <tr key={log.id} className="border-b border-[#232734]/50 hover:bg-white dark:bg-[#11131A] transition-colors group">
                              <td className="py-4 px-5 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shadow-sm">
                                  <User size={14} className="text-[#94A3B8]" />
                                </div>
                                <span className="font-bold text-sm text-slate-900 dark:text-white">{log.user}</span>
                              </td>
                              <td className="py-4 px-5 text-sm font-medium text-[#E2E8F0]">{log.action}</td>
                              <td className="py-4 px-5 text-xs text-[#94A3B8] font-mono">{log.ip}</td>
                              <td className="py-4 px-5 text-xs text-[#94A3B8]">{log.time}</td>
                              <td className="py-4 px-5 text-right">
                                {log.status === 'success' && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 text-[10px] font-bold uppercase tracking-wider"><CheckCircle2 size={12} /> Success</span>}
                                {log.status === 'warning' && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 text-[10px] font-bold uppercase tracking-wider"><AlertTriangle size={12} /> Warning</span>}
                                {log.status === 'danger' && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-bold uppercase tracking-wider"><AlertTriangle size={12} /> Failed</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </GlassCard>
                )}

                {/* ── INTEGRATIONS ── */}
                {activeTab === 'integrations' && (
                  <GlassCard>
                    <div className="border-b border-slate-200 dark:border-[#232734] pb-6 mb-8 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-bold font-jakarta mb-1">Connected Apps</h2>
                        <p className="text-sm text-[#94A3B8]">Integrate Injaazh ERP with your favorite tools.</p>
                      </div>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-[#323746] text-slate-900 dark:text-white text-xs font-bold transition-all shadow-sm">
                        <ExternalLink size={16} /> App Marketplace
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {integrations.map(app => (
                        <div key={app.id} className="flex flex-col p-5 rounded-2xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] hover:border-[#232734]/80 transition-all group relative overflow-hidden">
                          {app.connected && <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" style={{ backgroundColor: `${app.color}20` }} />}
                          <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${app.color}15`, color: app.color, border: `1px solid ${app.color}30` }}>
                              <app.icon size={24} />
                            </div>
                            {app.connected ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 text-[10px] font-bold uppercase tracking-wider">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Connected
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider">
                                Not Connected
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 relative z-10">{app.name}</h3>
                          <p className="text-xs text-[#94A3B8] font-medium leading-relaxed mb-6 flex-1 relative z-10">{app.description}</p>
                          <div className="pt-4 border-t border-slate-200 dark:border-[#232734] flex justify-between items-center relative z-10">
                            {app.connected ? (
                              <>
                                <button className="text-xs font-bold text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors">Configure</button>
                                <button onClick={() => { toast.success(`${app.name} disconnected`); if(masterSound) playSound('pop'); toggleIntegration(app.id); }} className="text-xs font-bold text-rose-500 hover:text-rose-400 transition-colors">Disconnect</button>
                              </>
                            ) : (
                              <button onClick={() => { toast.success(`${app.name} connected`); if(masterSound) playSound('success'); toggleIntegration(app.id); }} className="w-full py-2 bg-primary-600 hover:bg-primary-600/90 text-slate-900 dark:text-white rounded-lg text-xs font-bold transition-all shadow-sm">
                                Connect App
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* ── BACKUP & RESTORE ── */}
                {activeTab === 'backup' && (
                  <GlassCard>
                    <div className="border-b border-slate-200 dark:border-[#232734] pb-6 mb-8 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                      <div>
                        <h2 className="text-xl font-bold font-jakarta mb-1">Backup & Restore</h2>
                        <p className="text-sm text-[#94A3B8]">Manage automated backups or create manual snapshots.</p>
                      </div>
                      <button 
                        onClick={handleCreateBackup} 
                        disabled={isBackingUp} 
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-600/90 text-slate-900 dark:text-white text-sm font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.25)] border border-primary-600/80 disabled:opacity-70"
                      >
                        {isBackingUp ? <Activity size={16} className="animate-spin" /> : <Database size={16} />}
                        {isBackingUp ? 'Creating Backup...' : 'Create Backup'}
                      </button>
                    </div>

                    {isBackingUp && (
                      <div className="mb-8 p-6 rounded-2xl bg-slate-50 dark:bg-[#09090B] border border-primary-600/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-600/10 to-transparent animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }}></div>
                        <div className="relative z-10 flex flex-col items-center justify-center py-4">
                          <Database size={32} className="text-primary-600 animate-pulse mb-4" />
                          <h4 className="font-bold text-slate-900 dark:text-white mb-1">Generating Database Snapshot</h4>
                          <p className="text-xs text-[#94A3B8]">Compressing leads, deals, and configurations...</p>
                          <div className="w-full max-w-md h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-6 overflow-hidden">
                            <div className="h-full bg-primary-600 rounded-full animate-[progress_2.5s_ease-in-out_forwards]" style={{ width: '0%' }}></div>
                          </div>
                        </div>
                        <style>{`
                          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                          @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
                        `}</style>
                      </div>
                    )}

                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest pl-1">Available Backups</h3>
                      {backups.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-2xl">
                          <FileArchive size={32} className="text-[#94A3B8] mx-auto mb-3 opacity-50" />
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No backups found</h4>
                          <p className="text-xs text-[#64748B]">Create a manual backup to get started.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {backups.map(backup => (
                            <div key={backup.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] hover:border-[#232734]/80 transition-all group">
                              <div className="flex items-center gap-4 mb-4 md:mb-0">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${backup.type === 'Manual' ? 'bg-primary-600/10 text-primary-600' : 'bg-[#10B981]/10 text-[#10B981]'}`}>
                                  <FileArchive size={18} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{backup.date}</h4>
                                    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white dark:bg-[#11131A] text-[#94A3B8] border border-slate-200 dark:border-[#232734]">{backup.type}</span>
                                  </div>
                                  <p className="text-xs font-medium text-[#64748B] flex items-center gap-1.5">
                                    <HardDrive size={12} /> {backup.size} • 
                                    <span className="text-[#10B981] flex items-center gap-1"><CheckCircle2 size={12} /> {backup.status}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#11131A] hover:bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-[#232734] rounded-lg text-xs font-bold text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-all">
                                  <Download size={14} /> Download
                                </button>
                                <button onClick={() => { toast.success('Restore initiated!'); if(masterSound) playSound('pop'); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600/10 hover:bg-primary-600/20 border border-primary-600/20 rounded-lg text-xs font-bold text-primary-600 transition-all">
                                  <RotateCcw size={14} /> Restore
                                </button>
                                <button onClick={() => handleDeleteBackup(backup.id)} className="p-1.5 text-[#64748B] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all ml-1">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </GlassCard>
                )}

                {/* ── ROLES & PERMISSIONS ── */}
                {activeTab === 'roles' && (
                  <GlassCard>
                    <div className="border-b border-slate-200 dark:border-[#232734] pb-6 mb-8 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-bold font-jakarta mb-1">Roles & Permissions</h2>
                        <p className="text-sm text-[#94A3B8]">Define what team members can see and do.</p>
                      </div>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-600/90 text-slate-900 dark:text-white text-xs font-bold transition-all shadow-sm">
                        <Plus size={16} /> Create Custom Role
                      </button>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Left: Role List */}
                      <div className="w-full lg:w-1/3 space-y-3">
                        <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-4">Available Roles</h3>
                        {MOCK_ROLES.map(role => (
                          <button
                            key={role.id}
                            onClick={() => setSelectedRole(role.id)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
                              selectedRole === role.id 
                                ? 'bg-primary-600/10 border-primary-600/50 shadow-[0_0_15px_rgba(37,99,235,0.1)]' 
                                : 'bg-slate-50 dark:bg-[#09090B] border-slate-200 dark:border-[#232734] hover:border-[#232734]/80'
                            }`}
                          >
                            <div className="flex justify-between items-start w-full">
                              <span className={`font-bold text-sm ${selectedRole === role.id ? 'text-slate-900 dark:text-white' : 'text-[#E2E8F0]'}`}>{role.name}</span>
                              <div className="flex gap-2 items-center">
                                {role.isSystem && <span className="text-[9px] font-bold uppercase tracking-widest bg-slate-200 dark:bg-slate-700 text-[#94A3B8] px-1.5 py-0.5 rounded">System</span>}
                                <span className="text-xs text-[#94A3B8]">{role.users} Users</span>
                              </div>
                            </div>
                            <p className={`text-xs ${selectedRole === role.id ? 'text-[#94A3B8]' : 'text-[#64748B]'} leading-relaxed`}>{role.description}</p>
                          </button>
                        ))}
                      </div>

                      {/* Right: Permissions */}
                      <div className="flex-1 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ShieldCheck size={16} className="text-primary-600" />
                            {MOCK_ROLES.find(r => r.id === selectedRole)?.name} Permissions
                          </h3>
                          {selectedRole === 'owner' && <span className="text-xs text-[#F59E0B] font-bold bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-3 py-1 rounded-md">Full Access</span>}
                        </div>

                        <div className="space-y-6">
                          {PERMISSIONS.map(category => (
                            <div key={category.category}>
                              <h4 className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-3 pb-2 border-b border-slate-200 dark:border-[#232734]">{category.category}</h4>
                              <div className="space-y-3">
                                {category.items.map(perm => {
                                  const isChecked = rolePerms[selectedRole]?.includes(perm.id) || false;
                                  const isDisabled = selectedRole === 'owner';
                                  
                                  return (
                                    <label key={perm.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${!isDisabled && 'cursor-pointer'} ${isChecked ? 'bg-white dark:bg-[#11131A] border-primary-600/30' : 'bg-transparent border-transparent hover:bg-white dark:bg-[#11131A]'}`}>
                                      <span className={`text-sm font-bold ${isChecked ? 'text-slate-900 dark:text-white' : 'text-[#94A3B8]'}`}>{perm.label}</span>
                                      <div className="relative">
                                        <input type="checkbox" className="sr-only" checked={isChecked} disabled={isDisabled} onChange={() => togglePermission(selectedRole, perm.id)} />
                                        <div className={`block w-10 h-6 rounded-full transition-colors ${isDisabled ? 'opacity-50' : ''} ${isChecked ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isChecked ? 'transform translate-x-4' : ''}`}></div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* ── BILLING ── */}
                {activeTab === 'billing' && (
                  <GlassCard>
                    <div className="border-b border-slate-200 dark:border-[#232734] pb-6 mb-8">
                      <h2 className="text-xl font-bold font-jakarta mb-1">Usage & Billing</h2>
                      <p className="text-sm text-[#94A3B8]">Manage your subscription plan and resource limits.</p>
                    </div>
                    
                    <div className="p-8 rounded-2xl bg-gradient-to-br from-[#11131A] to-[#09090B] border border-primary-600/20 relative overflow-hidden mb-8">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                      <div className="relative z-10">
                        <span className="px-3 py-1 bg-primary-600/10 text-primary-600 border border-primary-600/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Enterprise Plan</span>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Injaazh ERP Pro</h3>
                        <p className="text-sm font-medium text-[#94A3B8] mb-6">$99.00 / month, next billing on Aug 1, 2026</p>
                        <button className="px-6 py-2.5 bg-white text-black font-bold rounded-xl text-sm transition-all shadow-sm">Manage Subscription</button>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* ── DANGER ZONE ── */}
                {activeTab === 'danger' && (
                  <GlassCard className="border-rose-500/20">
                    <div className="border-b border-rose-500/20 pb-6 mb-8">
                      <h2 className="text-xl font-bold font-jakarta text-rose-500 mb-1">Danger Zone</h2>
                      <p className="text-sm text-rose-500/60">Destructive actions that cannot be undone.</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#09090B] border border-rose-500/30">
                      <h4 className="font-bold text-rose-500 mb-2">Factory Reset Database</h4>
                      <p className="text-xs font-medium text-rose-500/60 mb-6">Permanently delete all leads, projects, transactions, and proposals.</p>
                      <div className="flex gap-4">
                        <input type="text" value={dangerConfirm} onChange={(e) => setDangerConfirm(e.target.value)} placeholder="Type CONFIRM" className="flex-1 px-4 py-2 bg-white dark:bg-[#11131A] border border-rose-500/30 rounded-xl focus:outline-none focus:border-rose-500/60 text-rose-500 font-bold placeholder-rose-900/50" />
                        <button disabled={dangerConfirm !== 'CONFIRM'} onClick={() => { toast.error('Factory Reset Initiated!', { icon: '⚠️' }); if(masterSound) playSound('error'); setDangerConfirm(''); }} className={`px-6 py-2 bg-rose-500 text-slate-900 dark:text-white font-bold rounded-xl transition-all ${dangerConfirm === 'CONFIRM' ? 'hover:bg-rose-600' : 'opacity-50 cursor-not-allowed'}`}>Reset</button>
                      </div>
                    </div>
                  </GlassCard>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Info Panel (Desktop Only) */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-2xl p-5 shadow-sm">
                <h4 className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4">
                  <Activity size={14} className="text-[#10B981]" /> System Status
                </h4>
                <div className="space-y-3 text-xs font-medium">
                  <div className="flex justify-between items-center text-[#94A3B8]"><span>Version</span> <span className="text-slate-900 dark:text-white">v2.4.0-stable</span></div>
                  <div className="flex justify-between items-center text-[#94A3B8]"><span>Services</span> <span className="text-[#10B981] flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></div> Operational</span></div>
                  <div className="flex justify-between items-center text-[#94A3B8]"><span>Last Updated</span> <span className="text-slate-900 dark:text-white">Today at 10:42 AM</span></div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary-600/10 to-transparent border border-primary-600/20 rounded-2xl p-5 shadow-sm">
                <h4 className="flex items-center gap-2 text-xs font-bold text-primary-600 uppercase tracking-widest mb-3">
                  <Lightbulb size={14} /> Quick Tip
                </h4>
                <p className="text-xs font-medium text-[#94A3B8] leading-relaxed">
                  Enable Two-Factor Authentication (2FA) for all admin accounts to ensure maximum workspace security.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
