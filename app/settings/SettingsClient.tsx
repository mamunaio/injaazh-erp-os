'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  MessageSquare, Video, Code2, FileText, ExternalLink, Database, RotateCcw, FileArchive, Search, PanelBottom
} from 'lucide-react';
import { useAppearance } from '@/components/layout/AppearanceContext';
import { getSystemSettings, saveSystemSettings, testSmtpConnection } from '@/app/actions/settingsActions';
import { sendTestEmail } from '@/app/actions/emailActions';
import { useUser } from '@/components/layout/UserContext';
import { getTeamMembers, createTeamMember, updateTeamMemberRole, deleteTeamMember, updateUserProfile } from '@/app/actions/teamActions';
import { getActiveSessions, revokeSession } from '@/app/actions/sessionActions';
import AiKeysManager from './AiKeysManager';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import { sounds } from '@/lib/sound';

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

const playSound = (type: 'success' | 'pop' | 'error' | 'cash' | 'income' | 'expense' | 'delete' | 'mailSend' | 'edit' | 'login' | 'login1' | 'login2' | 'login3' | 'notification') => {
  try {
    if (type === 'income' || type === 'cash') return sounds.income();
    if (type === 'expense') return sounds.expense();
    if (type === 'delete') return sounds.delete();
    if (type === 'mailSend') return sounds.mailSend();
    if (type === 'edit') return sounds.edit();
    if (type === 'login') return sounds.login();
    if (type === 'login1') return sounds.login1();
    if (type === 'login2') return sounds.login2();
    if (type === 'login3') return sounds.login3();
    if (type === 'success') return sounds.success();
    if (type === 'pop') return sounds.pop();
    if (type === 'error') return sounds.error();
    if (type === 'notification') return sounds.notification();
  } catch (e) {
    console.error("Audio playback error:", e);
  }
};

const GlassCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-6 lg:p-8 relative shadow-sm ${className}`}>
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
  const [systemTime, setSystemTime] = useState<string>("Today at 10:42 AM");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(`Today at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);
  
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
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('editor');
  const [isInviting, setIsInviting] = useState(false);

  const filteredTeamMembers = useMemo(() => {
    if (!teamSearchQuery.trim()) return teamMembers;
    const q = teamSearchQuery.toLowerCase();
    return teamMembers.filter(m => 
      m.name?.toLowerCase().includes(q) || 
      m.email?.toLowerCase().includes(q) || 
      m.role?.toLowerCase().includes(q)
    );
  }, [teamMembers, teamSearchQuery]);

  const rolesWithCounts = useMemo(() => {
    return [
      { id: 'owner', name: 'Owner', description: 'Full access to all settings, billing, and team management.', users: teamMembers.filter(m => m.role === 'owner').length, isSystem: true },
      { id: 'admin', name: 'Admin', description: 'Can manage most settings, team members, but not billing.', users: teamMembers.filter(m => m.role === 'admin').length, isSystem: true },
      { id: 'editor', name: 'Editor', description: 'Can create and edit content, manage projects and tasks.', users: teamMembers.filter(m => m.role === 'editor').length, isSystem: false },
      { id: 'marketplace_team', name: 'Marketplace Team', description: 'Access to marketplace projects and clients.', users: teamMembers.filter(m => m.role === 'marketplace_team').length, isSystem: false },
      { id: 'viewer', name: 'Viewer (Demo)', description: 'Read-only access to dashboards, records, and telemetry.', users: teamMembers.filter(m => m.role === 'viewer').length, isSystem: false },
    ];
  }, [teamMembers]);

  // Filter Tabs based on role
  const tabsToRender = TABS.filter(t => !t.adminOnly || (t.adminOnly && (user?.role === 'admin' || user?.role === 'owner')));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfileImage(user.image);
    }
  }, [user]);

  // Lazy load tab data on-demand only when relevant tab is active
  useEffect(() => {
    if ((activeTab === 'team' || activeTab === 'roles') && (user?.role === 'admin' || user?.role === 'owner')) {
      if (teamMembers.length === 0) {
        getTeamMembers().then(res => { if (res.success && res.data) setTeamMembers(res.data); });
      }
    } else if (activeTab === 'smtp') {
      if (!smtpSettings.host) {
        getSystemSettings('smtp').then(res => { if (res.success && res.data) setSmtpSettings(res.data); });
      }
    } else if (activeTab === 'security') {
      checkTwoFactorStatus().then(res => { if (res.success) setIs2FAEnabled(res.enabled || false); });
      setIsLoadingSessions(true);
      getActiveSessions().then(res => {
        if (res.success && res.sessions) setActiveSessions(res.sessions);
        setIsLoadingSessions(false);
      });
    }
  }, [activeTab, user?.role]);
  
  // Notification States
  const [masterSound, setMasterSound] = useState(true);
  const [soundSettings, setSoundSettings] = useState({ 
    systemBoot: true,
    paymentReceived: true,
    expenseLogged: true,
    itemDeleted: true,
    emailSent: true,
    errorAlert: true
  });
  const [soundVariants, setSoundVariants] = useState<Record<string, string>>({
    systemBoot: 'login1',
    paymentReceived: 'income1',
    expenseLogged: 'expense1',
    itemDeleted: 'delete1',
    emailSent: 'mailSend1',
    errorAlert: 'error1'
  });
  const [openSoundDropdown, setOpenSoundDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSoundVariants({
        systemBoot: localStorage.getItem('sound_systemBoot') || 'login1',
        paymentReceived: localStorage.getItem('sound_paymentReceived') || 'income1',
        expenseLogged: localStorage.getItem('sound_expenseLogged') || 'expense1',
        itemDeleted: localStorage.getItem('sound_itemDeleted') || 'delete1',
        emailSent: localStorage.getItem('sound_emailSent') || 'mailSend1',
        errorAlert: localStorage.getItem('sound_errorAlert') || 'error1'
      });
    }
  }, []);

  const handleSoundVariantChange = (itemKey: string, variantKey: string) => {
    setSoundVariants(prev => ({ ...prev, [itemKey]: variantKey }));
    localStorage.setItem(`sound_${itemKey}`, variantKey);
    if (masterSound) {
      if ((sounds as any)[variantKey]) (sounds as any)[variantKey]();
    }
    setOpenSoundDropdown(null);
  };

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
    <div className="bg-slate-50 dark:bg-[#060608] min-h-screen text-slate-900 dark:text-white font-sans selection:bg-[#6324FC]/30 pb-32">
      
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#6324FC]/10 border border-[#6324FC]/20 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF]">
                <Blocks size={16} />
              </div>
              <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">System Configuration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white mb-1">Settings</h1>
            <p className="text-xs text-secondary font-medium">Manage preferences and system configurations across your workspace.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-heading font-bold text-xs bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all shadow-xs">
              <RefreshCcw size={14} /> Reset Changes
            </button>
            <AnimatePresence>
              {(hasUnsavedChanges || isSaving) && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={handleSave} 
                  disabled={isSaving} 
                  className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-heading font-bold text-xs transition-all shadow-[0_0_20px_rgba(99,36,252,0.4)] bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white disabled:opacity-70"
                >
                  {isSaving ? <Activity size={14} className="animate-spin" /> : <Save size={14} />} 
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── 3-Column Layout ──────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Sidebar Menu */}
          <div className="w-full lg:w-60 flex-shrink-0">
            <div className="sticky top-6 flex flex-col gap-5">
              {[
                { title: 'Personal', items: ['profile', 'appearance', 'notifications'] },
                { title: 'Workspace', items: ['company', 'workspace', 'team', 'roles'] },
                { title: 'Advanced & Developer', items: ['api_keys', 'smtp', 'integrations', 'security', 'billing', 'backup', 'audit', 'danger'] }
              ].map(group => {
                const groupTabs = tabsToRender.filter(t => group.items.includes(t.id));
                if (groupTabs.length === 0) return null;
                return (
                  <div key={group.title} className="flex flex-col gap-1">
                    <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest pl-3 mb-1">{group.title}</span>
                    {groupTabs.map(tab => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveTab(tab.id); if (masterSound) playSound('pop'); }}
                          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 font-heading font-bold text-xs ${
                            isActive 
                              ? tab.danger 
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                                : 'bg-[#6324FC]/10 border border-[#6324FC]/30 text-[#6324FC] dark:text-[#00E5FF] shadow-[0_0_15px_rgba(99,36,252,0.08)]'
                              : 'text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.03] border border-transparent'
                          }`}
                        >
                          <Icon size={16} className={isActive ? (tab.danger ? 'text-rose-500' : 'text-[#6324FC] dark:text-[#00E5FF]') : 'text-secondary'} />
                          <span>{tab.label}</span>
                          {tab.id === 'team' && teamMembers.length > 0 && (
                            <span className="ml-auto px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-[#6324FC]/15 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/30">
                              {teamMembers.length}
                            </span>
                          )}
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
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8">
                      <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Profile Settings</h2>
                      <p className="text-xs text-secondary">Manage your personal information and display settings.</p>
                    </div>
                    
                    <div className="flex items-center gap-6 mb-8">
                      <label className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 flex items-center justify-center cursor-pointer hover:border-[#6324FC]/50 transition-all group relative overflow-hidden shadow-inner">
                        {profileImage ? (
                          <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User size={28} className="text-secondary group-hover:scale-110 group-hover:text-[#6324FC] transition-all" />
                        )}
                        <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1 backdrop-blur-[2px]">
                          <Camera size={14} className="text-slate-900 dark:text-white" />
                          <span className="text-slate-900 dark:text-white text-[9px] font-heading font-bold uppercase tracking-widest">Change</span>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                      <div>
                        <h3 className="font-heading font-bold text-sm mb-0.5 text-slate-900 dark:text-white">Avatar Profile</h3>
                        <p className="text-xs text-secondary mb-3">JPG, GIF or PNG. Max size of 2MB.</p>
                        <button className="text-xs font-heading font-bold bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 shadow-xs px-3 py-1.5 rounded-xl transition-colors" onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}>
                          Upload Picture
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <div>
                        <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                        <input type="text" value={profileName} onChange={(e) => { setProfileName(e.target.value); triggerChange(); }} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] font-medium text-xs transition-all shadow-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                        <input type="email" value={profileEmail} onChange={(e) => { setProfileEmail(e.target.value); triggerChange(); }} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] font-medium text-xs transition-all shadow-xs" />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-black/10 dark:border-white/10">
                      <h3 className="font-heading font-bold text-sm mb-4 text-slate-900 dark:text-white">Change Password</h3>
                      <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Current Password</label>
                          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] text-xs font-bold transition-all shadow-xs" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">New Password</label>
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] text-xs font-bold transition-all shadow-xs" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Confirm Password</label>
                            <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] text-xs font-bold transition-all shadow-xs" />
                          </div>
                        </div>
                        <button type="submit" disabled={isChangingPassword} className="px-4 py-2 bg-[#6324FC]/10 hover:bg-[#6324FC]/20 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/20 font-heading font-bold rounded-xl transition-all text-xs disabled:opacity-50">
                          {isChangingPassword ? 'Updating...' : 'Update Password'}
                        </button>
                      </form>
                    </div>
                  </GlassCard>
                )}

                {/* ── COMPANY ── */}
                {activeTab === 'company' && (
                  <GlassCard>
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8">
                      <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Company Details</h2>
                      <p className="text-xs text-secondary">Manage company information and branding.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Company Name</label>
                        <input type="text" defaultValue="Injaazh Global" className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] font-medium text-xs transition-all" onChange={triggerChange} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Tax / VAT ID</label>
                          <input type="text" defaultValue="GB123456789" className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] font-medium text-xs transition-all" onChange={triggerChange} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Company Website</label>
                          <input type="url" defaultValue="https://injaazh.com" className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] font-medium text-xs transition-all" onChange={triggerChange} />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* ── WORKSPACE ── */}
                {activeTab === 'workspace' && (
                  <GlassCard>
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8">
                      <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Workspace Configuration</h2>
                      <p className="text-xs text-secondary">Manage global settings and localization.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Timezone</label>
                          <select className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] font-medium text-xs transition-all appearance-none cursor-pointer" onChange={triggerChange}>
                            <option>UTC (GMT+00:00)</option>
                            <option>EST (GMT-05:00)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Currency</label>
                          <select className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] font-medium text-xs transition-all appearance-none cursor-pointer" onChange={triggerChange}>
                            <option>USD ($)</option>
                            <option>EUR (€)</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Date Format</label>
                          <select className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] font-medium text-xs transition-all appearance-none cursor-pointer" onChange={triggerChange}>
                            <option>MM/DD/YYYY</option>
                            <option>DD/MM/YYYY</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">System Language</label>
                          <select className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] font-medium text-xs transition-all appearance-none cursor-pointer" onChange={triggerChange}>
                            <option>English (US)</option>
                            <option>Bengali (BD)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* ── NOTIFICATIONS ── */}
                {activeTab === 'notifications' && (
                  <GlassCard>
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Notifications & Sounds</h2>
                        <p className="text-xs text-secondary">Configure how and when you receive alerts.</p>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer bg-slate-50 dark:bg-[#060608] px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/10">
                        <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-secondary">Master Sound</span>
                        <div className="relative">
                          <input type="checkbox" className="sr-only" checked={masterSound} onChange={() => { setMasterSound(!masterSound); if (!masterSound && (sounds as any)[soundVariants['paymentReceived']]) (sounds as any)[soundVariants['paymentReceived']](); triggerChange(); }} />
                          <div className={`block w-8 h-4.5 rounded-full transition-colors ${masterSound ? 'bg-[#6324FC]' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                          <div className={`absolute left-0.5 top-0.5 bg-white w-3.5 h-3.5 rounded-full transition-transform ${masterSound ? 'transform translate-x-3.5' : ''}`}></div>
                        </div>
                      </label>
                    </div>

                    <div className="space-y-3">
                      {[
                        { id: 'systemBoot', label: 'System Boot', desc: 'Plays a welcoming chord when logging in.', variants: [{val: 'login1', name: 'Classic Chord'}, {val: 'login2', name: 'Modern Ascending'}, {val: 'login3', name: 'Minimal Chime'}] },
                        { id: 'paymentReceived', label: 'Income Logged', desc: 'Plays a distinct coin chime when income is logged.', variants: [{val: 'income1', name: 'Coin Drop'}, {val: 'income2', name: 'Synth Cash'}, {val: 'income3', name: 'Rich Chime'}] },
                        { id: 'expenseLogged', label: 'Expense Logged', desc: 'Plays a low thud when an expense is recorded.', variants: [{val: 'expense1', name: 'Low Thud'}, {val: 'expense2', name: 'Double Tap'}, {val: 'expense3', name: 'Deep Saw'}] },
                        { id: 'itemDeleted', label: 'Item Deleted', desc: 'Plays a deep pop when something is deleted.', variants: [{val: 'delete1', name: 'Deep Pop'}, {val: 'delete2', name: 'Saw Snap'}, {val: 'delete3', name: 'Double Pluck'}] },
                        { id: 'emailSent', label: 'Email Sent', desc: 'Plays a swoosh sound when an outreach email is sent.', variants: [{val: 'mailSend1', name: 'Air Swoosh'}, {val: 'mailSend2', name: 'Digital Swoosh'}, {val: 'mailSend3', name: 'Long Swoosh'}] },
                        { id: 'errorAlert', label: 'Error Alert', desc: 'Plays an alert sound when an error occurs.', variants: [{val: 'error1', name: 'Harsh Buzz'}, {val: 'error2', name: 'Double Buzz'}, {val: 'error3', name: 'Discordant Chord'}] },
                      ].map(item => (
                        <div key={item.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${soundSettings[item.id as keyof typeof soundSettings] && masterSound ? 'bg-slate-50 dark:bg-[#060608] border-[#6324FC]/30 shadow-[0_0_15px_rgba(99,36,252,0.05)]' : 'bg-slate-50 dark:bg-[#060608] border-black/10 dark:border-white/10'}`}>
                          <div className="flex items-center gap-3.5">
                            <button onClick={() => masterSound ? (sounds as any)[soundVariants[item.id]]?.() : toast.error("Master sound muted")} className="w-9 h-9 rounded-xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 flex items-center justify-center text-secondary hover:text-[#6324FC] dark:hover:text-[#00E5FF] transition-all" title="Preview Sound">
                              <Play size={13} className="ml-0.5" />
                            </button>
                            <div>
                              <h4 className="font-heading font-bold text-xs text-slate-900 dark:text-white">{item.label}</h4>
                              <p className="text-[11px] text-secondary">{item.desc}</p>
                              
                              <div className="relative mt-2">
                                <button
                                  onClick={() => setOpenSoundDropdown(openSoundDropdown === item.id ? null : item.id)}
                                  className="flex items-center justify-between w-44 px-2.5 py-1 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white text-[11px] font-heading font-bold transition-all"
                                >
                                  <span>{item.variants.find(v => v.val === soundVariants[item.id])?.name || 'Select Sound'}</span>
                                  <ChevronRight className={`w-3 h-3 text-secondary transition-transform ${openSoundDropdown === item.id ? 'rotate-90' : ''}`} />
                                </button>
                                
                                <AnimatePresence>
                                  {openSoundDropdown === item.id && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -5 }}
                                      className="absolute z-10 w-44 mt-1 bg-white dark:bg-[#0a0a0d] backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-xl shadow-xl overflow-hidden"
                                    >
                                      {item.variants.map(v => (
                                        <button key={v.val} onClick={() => handleSoundVariantChange(item.id, v.val)} className="w-full text-left px-3 py-1.5 text-[11px] font-heading font-bold hover:bg-[#6324FC]/10 hover:text-[#6324FC] dark:hover:text-[#00E5FF] text-slate-700 dark:text-slate-300 transition-colors">{v.name}</button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </div>
                          <label className="relative cursor-pointer">
                            <input type="checkbox" className="sr-only" disabled={!masterSound} checked={soundSettings[item.id as keyof typeof soundSettings]} onChange={() => handleSoundToggle(item.id as keyof typeof soundSettings)} />
                            <div className={`block w-8 h-4.5 rounded-full transition-colors ${!masterSound ? 'bg-slate-200 dark:bg-white/10 opacity-50' : soundSettings[item.id as keyof typeof soundSettings] ? 'bg-[#6324FC]' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                            <div className={`absolute left-0.5 top-0.5 bg-white w-3.5 h-3.5 rounded-full transition-transform ${!masterSound ? 'opacity-50' : ''} ${soundSettings[item.id as keyof typeof soundSettings] ? 'transform translate-x-3.5' : ''}`}></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* ── SECURITY ── */}
                {activeTab === 'security' && (
                  <GlassCard>
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8">
                      <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Security & Access Control</h2>
                      <p className="text-xs text-secondary">Manage 2FA, sessions, and security protocols.</p>
                    </div>
                    
                    <div className="mb-8 p-5 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div>
                        <h3 className="mb-0.5 text-slate-900 dark:text-white font-heading font-bold text-xs">Two-Factor Authentication (2FA)</h3>
                        <p className="text-[11px] font-medium text-secondary">
                          {is2FAEnabled ? 'Your account is currently secured with 2FA.' : 'Secure your account with an authenticator app.'}
                        </p>
                      </div>
                      {is2FAEnabled ? (
                        <button onClick={() => { setIsDisabling2FA(true); setIs2FAModalOpen(true); }} className="px-4 py-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 font-heading font-bold rounded-xl text-xs hover:bg-rose-500/20 transition-all">
                          Disable 2FA
                        </button>
                      ) : (
                        <button onClick={() => { setIsDisabling2FA(false); setIs2FAModalOpen(true); }} className="px-4 py-1.5 bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] font-heading font-bold rounded-xl text-xs hover:bg-[#6324FC]/20 transition-all border border-[#6324FC]/20">
                          Enable 2FA
                        </button>
                      )}
                    </div>
                    <TwoFactorSetupModal isOpen={is2FAModalOpen} onClose={() => setIs2FAModalOpen(false)} isDisabling={isDisabling2FA} onSuccess={() => setIs2FAEnabled(!isDisabling2FA)} />

                    <h3 className="mb-3 flex items-center gap-2 font-heading font-bold text-xs uppercase tracking-widest text-secondary">
                      Active Sessions
                    </h3>
                    <div className="space-y-2.5">
                      {isLoadingSessions ? (
                        <div className="p-8 text-center flex justify-center"><Activity className="animate-spin text-[#6324FC]" /></div>
                      ) : activeSessions.length === 0 ? (
                        <div className="p-5 text-center text-xs font-heading font-bold text-secondary">No active sessions found.</div>
                      ) : activeSessions.map((session) => (
                        <div key={session._id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 flex items-center justify-center">
                              <MonitorSmartphone size={16} className="text-secondary" />
                            </div>
                            <div>
                              <h4 className="flex items-center gap-2 text-slate-900 dark:text-white font-heading font-bold text-xs mb-0.5">
                                {session.device} 
                                {session.isCurrent && <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-heading font-bold uppercase tracking-wider">Current</span>}
                              </h4>
                              <p className="text-[11px] font-medium text-secondary">{session.browser} • {session.os} • {session.location}</p>
                            </div>
                          </div>
                          {!session.isCurrent && (
                            <button onClick={async () => {
                                const res = await revokeSession(session.sessionId);
                                if (res.success) { toast.success('Session revoked'); setActiveSessions(prev => prev.filter(s => s._id !== session._id)); } 
                                else toast.error('Failed to revoke session');
                              }}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-heading font-bold rounded-xl text-xs transition-colors border border-rose-500/20">
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
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Team & User Directory</h2>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#6324FC]/15 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/30">
                            {teamMembers.length} Users Total
                          </span>
                        </div>
                        <p className="text-xs text-secondary">Manage workspace members, assign roles, and provision new accounts.</p>
                      </div>
                    </div>

                    {/* KPI Telemetry Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 relative overflow-hidden group hover:border-[#6324FC]/40 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Total Users</span>
                          <div className="w-7 h-7 rounded-lg bg-[#6324FC]/10 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF]">
                            <Users size={14} />
                          </div>
                        </div>
                        <div className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
                          {teamMembers.length}
                        </div>
                        <div className="text-[10px] text-secondary font-mono mt-0.5">Active in system</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 relative overflow-hidden group hover:border-[#6324FC]/40 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Admins & Owners</span>
                          <div className="w-7 h-7 rounded-lg bg-[#6324FC]/10 flex items-center justify-center text-[#6324FC]">
                            <ShieldCheck size={14} />
                          </div>
                        </div>
                        <div className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
                          {teamMembers.filter(m => m.role === 'owner' || m.role === 'admin').length}
                        </div>
                        <div className="text-[10px] text-secondary font-mono mt-0.5">Full access</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 relative overflow-hidden group hover:border-[#00E5FF]/40 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Editors & Staff</span>
                          <div className="w-7 h-7 rounded-lg bg-[#00E5FF]/10 flex items-center justify-center text-[#00E5FF]">
                            <Briefcase size={14} />
                          </div>
                        </div>
                        <div className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
                          {teamMembers.filter(m => m.role === 'editor' || m.role === 'marketplace_team').length}
                        </div>
                        <div className="text-[10px] text-secondary font-mono mt-0.5">Standard access</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 relative overflow-hidden group hover:border-amber-500/40 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Viewers (Demo)</span>
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Eye size={14} />
                          </div>
                        </div>
                        <div className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
                          {teamMembers.filter(m => m.role === 'viewer').length}
                        </div>
                        <div className="text-[10px] text-secondary font-mono mt-0.5">Read-only accounts</div>
                      </div>
                    </div>

                    {/* Invite / Create User Form */}
                    <div className="mb-8 p-5 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10">
                      <h3 className="text-xs font-heading font-bold uppercase tracking-widest text-secondary mb-4 flex items-center gap-2">
                        <Plus size={14} className="text-[#6324FC] dark:text-[#00E5FF]" /> Add New User
                      </h3>
                      <form onSubmit={handleInviteMember} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                          <input type="text" placeholder="John Doe" required value={inviteName} onChange={(e) => setInviteName(e.target.value)} className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white text-xs font-medium transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                          <input type="email" placeholder="john@company.com" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white text-xs font-medium transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Initial Password</label>
                          <input type="password" placeholder="••••••••" required value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white text-xs font-medium transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Role</label>
                          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white text-xs font-heading font-bold transition-all appearance-none cursor-pointer">
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="marketplace_team">Marketplace Team</option>
                            <option value="viewer">Viewer (Demo / Read-Only)</option>
                          </select>
                        </div>
                        <button type="submit" disabled={isInviting} className="w-full px-4 py-2.5 bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white font-heading font-bold rounded-xl transition-all text-xs h-[42px] shadow-[0_0_15px_rgba(99,36,252,0.3)] disabled:opacity-50">
                          {isInviting ? 'Creating...' : '+ Create Account'}
                        </button>
                      </form>
                    </div>

                    {/* Member Directory List */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-xs uppercase tracking-widest text-secondary">Registered Users</h3>
                        <span className="text-xs text-secondary font-mono">({filteredTeamMembers.length})</span>
                      </div>
                      <div className="relative w-full sm:w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={teamSearchQuery}
                          onChange={(e) => setTeamSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#6324FC] transition-all"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10 bg-slate-50/50 dark:bg-[#060608]/50">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-black/5 dark:border-white/5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest bg-slate-50 dark:bg-[#060608]">
                            <th className="py-3 px-5">User</th>
                            <th className="py-3 px-5">Role Badge</th>
                            <th className="py-3 px-5">Role Permission Level</th>
                            <th className="py-3 px-5">Joined</th>
                            <th className="py-3 px-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTeamMembers.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-xs text-secondary font-medium">
                                No users found matching your search.
                              </td>
                            </tr>
                          ) : (
                            filteredTeamMembers.map(member => {
                              const roleColor = member.role === 'owner' 
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                                : member.role === 'admin'
                                ? 'bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] border-[#6324FC]/30'
                                : member.role === 'marketplace_team'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : member.role === 'viewer'
                                ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                                : 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20';

                              return (
                                <tr key={member._id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                                  <td className="py-3.5 px-5">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 flex items-center justify-center font-heading font-bold text-xs text-slate-800 dark:text-slate-200 shadow-xs">
                                        {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                                      </div>
                                      <div>
                                        <span className="font-heading font-bold text-slate-900 dark:text-white text-xs block">{member.name}</span>
                                        <span className="text-[11px] text-secondary font-mono">{member.email}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-5">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-heading font-bold uppercase tracking-wider border ${roleColor}`}>
                                      {member.role === 'owner' && '👑 Owner'}
                                      {member.role === 'admin' && '🛡️ Admin'}
                                      {member.role === 'editor' && '✏️ Editor'}
                                      {member.role === 'marketplace_team' && '🌐 Marketplace'}
                                      {member.role === 'viewer' && '👁️ Demo Viewer'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-5">
                                    <select 
                                      value={member.role} 
                                      disabled={member.role === 'owner' && user?.role !== 'owner'}
                                      onChange={(e) => handleToggleRole(member._id, e.target.value)} 
                                      className="px-2.5 py-1.5 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white text-xs font-heading font-bold appearance-none cursor-pointer disabled:opacity-50"
                                    >
                                      <option value="owner">Owner (Full Access)</option>
                                      <option value="admin">Admin</option>
                                      <option value="editor">Editor</option>
                                      <option value="marketplace_team">Marketplace Team</option>
                                      <option value="viewer">Viewer (Read-Only Demo)</option>
                                    </select>
                                  </td>
                                  <td className="py-3.5 px-5 text-xs text-secondary font-mono">
                                    {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="py-3.5 px-5 text-right">
                                    {member.role !== 'owner' && (
                                      <button 
                                        onClick={() => handleDeleteMember(member._id)} 
                                        title="Delete user"
                                        className="p-1.5 text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </GlassCard>
                )}

                {/* ── API KEYS ── */}
                {activeTab === 'api' && (
                  <GlassCard>
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8">
                      <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">API Keys & Webhooks</h2>
                      <p className="text-xs text-secondary">Manage your external API keys and integrations.</p>
                    </div>
                    <AiKeysManager />
                  </GlassCard>
                )}

                {/* ── SMTP ── */}
                {activeTab === 'smtp' && (
                  <GlassCard>
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8">
                      <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">SMTP Configurations</h2>
                      <p className="text-xs text-secondary">Configure system-wide outgoing email server.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">SMTP Host</label>
                          <input type="text" value={smtpSettings.host} onChange={(e) => { setSmtpSettings(prev => ({ ...prev, host: e.target.value })); triggerChange(); }} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl focus:border-[#6324FC] text-slate-900 dark:text-white font-medium text-xs focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Port</label>
                          <input type="number" value={smtpSettings.port} onChange={(e) => { setSmtpSettings(prev => ({ ...prev, port: parseInt(e.target.value) || 587 })); triggerChange(); }} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl focus:border-[#6324FC] text-slate-900 dark:text-white font-medium text-xs focus:outline-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Username / Email</label>
                          <input type="email" value={smtpSettings.user} onChange={(e) => { setSmtpSettings(prev => ({ ...prev, user: e.target.value })); triggerChange(); }} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl focus:border-[#6324FC] text-slate-900 dark:text-white font-medium text-xs focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">App Password</label>
                          <div className="relative">
                            <input type={showSmtpPass ? 'text' : 'password'} value={smtpSettings.pass} onChange={(e) => { setSmtpSettings(prev => ({ ...prev, pass: e.target.value })); triggerChange(); }} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl focus:border-[#6324FC] text-slate-900 dark:text-white font-mono text-xs focus:outline-none pr-10" />
                            <button type="button" onClick={() => setShowSmtpPass(!showSmtpPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary"><Eye size={14} /></button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-black/10 dark:border-white/10 flex justify-between items-center">
                        <p className="text-xs font-heading font-bold text-secondary">Run handshake test before saving.</p>
                        <button type="button" onClick={handleTestConnection} disabled={isTestingConnection} className="px-3.5 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white font-heading font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-black/10 dark:border-white/10">
                          {isTestingConnection ? <Activity size={13} className="animate-spin" /> : <Activity size={13} />} Test Connection
                        </button>
                      </div>
                      {testResult && (
                        <div className={`p-3 rounded-xl text-xs font-heading font-bold flex items-center gap-2 border ${testResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                          {testResult.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} {testResult.message}
                        </div>
                      )}
                    </div>
                  </GlassCard>
                )}

                {/* ── APPEARANCE ── */}
                {activeTab === 'appearance' && (
                  <GlassCard>
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8">
                      <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Appearance & Interface</h2>
                      <p className="text-xs text-secondary">Customize the look and feel of your workspace.</p>
                    </div>

                    <div className="space-y-8">
                      {/* Theme Selection */}
                      <div>
                        <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white mb-3">Theme Preference</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {THEMES.map(t => (
                            <button key={t.id} onClick={() => { setTheme(t.id); triggerChange(); }} className={`relative flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl border transition-all ${mounted && theme === t.id ? 'bg-[#6324FC]/10 border-[#6324FC] text-[#6324FC] dark:text-[#00E5FF]' : 'bg-slate-50 dark:bg-[#060608] border-black/10 dark:border-white/10 text-secondary hover:border-[#6324FC]/50'}`}>
                              <t.icon size={20} className={mounted && theme === t.id ? 'text-[#6324FC] dark:text-[#00E5FF]' : 'text-secondary'} />
                              <span className={`text-xs font-heading font-bold ${mounted && theme === t.id ? 'text-slate-900 dark:text-white' : 'text-secondary'}`}>{t.name}</span>
                              {mounted && theme === t.id && <div className="absolute top-3 right-3 text-[#6324FC] dark:text-[#00E5FF]"><CheckCircle2 size={14} /></div>}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Accent Color */}
                      <div>
                        <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white mb-3">Accent Color</h3>
                        <div className="flex flex-wrap items-center gap-3">
                          {[
                            { id: 'violet', color: '#6324FC', name: 'Obsidian Violet' },
                            { id: 'blue', color: '#00E5FF', name: 'Cyber Ice' },
                            { id: 'emerald', color: '#10B981', name: 'Emerald' },
                            { id: 'rose', color: '#E11D48', name: 'Rose' },
                            { id: 'amber', color: '#F59E0B', name: 'Amber' }
                          ].map(c => (
                            <button key={c.id} onClick={() => { setAccentColor(c.id as any); triggerChange(); }} className={`group flex flex-col items-center gap-2`} title={c.name}>
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${accentColor === c.id ? 'ring-2 ring-[#6324FC] dark:ring-[#00E5FF] ring-offset-2 ring-offset-white dark:ring-offset-[#0a0a0d]' : 'hover:scale-105'}`} style={{ backgroundColor: c.color }}>
                                {accentColor === c.id && <Check size={14} className="text-white" />}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sidebar Layout */}
                      <div>
                        <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white mb-3">Navigation & Sidebar Layout</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {[
                            { id: 'expanded', label: 'Expanded (Default)', icon: PanelLeft, desc: 'Full menu with labels & categories.' },
                            { id: 'collapsed', label: 'Collapsed Sidebar', icon: PanelLeftClose, desc: 'Compact icons only to save space.' },
                            { id: 'dock', label: '🍎 Apple Floating Dock', icon: PanelBottom, desc: 'macOS style bottom dock with magnification physics.' }
                          ].map(l => (
                            <button key={l.id} onClick={() => { setSidebarLayout(l.id as any); triggerChange(); }} className={`flex items-start text-left gap-3.5 p-4 rounded-2xl border transition-all ${sidebarLayout === l.id ? 'bg-[#6324FC]/10 border-[#6324FC] shadow-[0_0_20px_rgba(99,36,252,0.15)]' : 'bg-slate-50 dark:bg-[#060608] border-black/10 dark:border-white/10 hover:border-[#6324FC]/50'}`}>
                              <div className={`mt-0.5 ${sidebarLayout === l.id ? 'text-[#6324FC] dark:text-[#00E5FF]' : 'text-secondary'}`}>
                                <l.icon size={18} />
                              </div>
                              <div>
                                <h4 className={`font-heading font-bold text-xs mb-0.5 ${sidebarLayout === l.id ? 'text-slate-900 dark:text-white' : 'text-secondary'}`}>{l.label}</h4>
                                <p className="text-[11px] text-secondary leading-snug">{l.desc}</p>
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
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-6 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                      <div>
                        <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Audit Logs</h2>
                        <p className="text-xs text-secondary">Track system activities and security events.</p>
                      </div>
                      <div className="flex gap-2.5">
                        <button onClick={handleRefreshLogs} disabled={isRefreshingLogs} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0a0a0d] hover:bg-slate-100 dark:hover:bg-white/5 text-slate-900 dark:text-white text-xs font-heading font-bold transition-all border border-black/10 dark:border-white/10 disabled:opacity-50">
                          <RefreshCcw size={13} className={isRefreshingLogs ? 'animate-spin' : ''} /> Refresh
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6324FC]/10 hover:bg-[#6324FC]/20 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/20 text-xs font-heading font-bold transition-all">
                          <Download size={13} /> Export CSV
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10 bg-slate-50/50 dark:bg-[#060608]/50">
                      <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                        <thead>
                          <tr className="border-b border-black/5 dark:border-white/5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest bg-slate-50 dark:bg-[#060608]">
                            <th className="py-3 px-5">User / System</th>
                            <th className="py-3 px-5">Event Action</th>
                            <th className="py-3 px-5">IP Address</th>
                            <th className="py-3 px-5">Time</th>
                            <th className="py-3 px-5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.map(log => (
                            <tr key={log.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                              <td className="py-3 px-5 flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center shadow-xs">
                                  <User size={13} className="text-secondary" />
                                </div>
                                <span className="font-heading font-bold text-slate-900 dark:text-white">{log.user}</span>
                              </td>
                              <td className="py-3 px-5 text-xs text-slate-700 dark:text-slate-300">{log.action}</td>
                              <td className="py-3 px-5 text-[11px] text-secondary font-mono">{log.ip}</td>
                              <td className="py-3 px-5 text-[11px] text-secondary">{log.time}</td>
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
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Connected Apps</h2>
                        <p className="text-xs text-secondary">Integrate Injaazh ERP with your favorite tools.</p>
                      </div>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white text-xs font-heading font-bold transition-all border border-black/10 dark:border-white/10">
                        <ExternalLink size={14} /> App Marketplace
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {integrations.map(app => (
                        <div key={app.id} className="flex flex-col p-5 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 hover:border-[#6324FC]/40 transition-all group relative overflow-hidden">
                          {app.connected && <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" style={{ backgroundColor: `${app.color}20` }} />}
                          <div className="flex justify-between items-start mb-3 relative z-10">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs" style={{ backgroundColor: `${app.color}15`, color: app.color, border: `1px solid ${app.color}30` }}>
                              <app.icon size={20} />
                            </div>
                            {app.connected ? (
                              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-heading font-bold uppercase tracking-wider">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Connected
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-white/5 text-secondary text-[10px] font-heading font-bold uppercase tracking-wider">
                                Not Connected
                              </span>
                            )}
                          </div>
                          <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white mb-0.5 relative z-10">{app.name}</h3>
                          <p className="text-[11px] text-secondary font-medium leading-relaxed mb-4 flex-1 relative z-10">{app.description}</p>
                          <div className="pt-3 border-t border-black/5 dark:border-white/5 flex justify-between items-center relative z-10">
                            {app.connected ? (
                              <>
                                <button className="text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors">Configure</button>
                                <button onClick={() => { toast.success(`${app.name} disconnected`); if(masterSound) playSound('pop'); toggleIntegration(app.id); }} className="text-xs font-heading font-bold text-rose-500 hover:text-rose-400 transition-colors">Disconnect</button>
                              </>
                            ) : (
                              <button onClick={() => { toast.success(`${app.name} connected`); if(masterSound) playSound('success'); toggleIntegration(app.id); }} className="w-full py-1.5 bg-[#6324FC]/10 hover:bg-[#6324FC]/20 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/20 rounded-xl text-xs font-heading font-bold transition-all shadow-xs">
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
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                      <div>
                        <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Backup & Restore</h2>
                        <p className="text-xs text-secondary">Manage automated backups or create manual snapshots.</p>
                      </div>
                      <button 
                        onClick={handleCreateBackup} 
                        disabled={isBackingUp} 
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white text-xs font-heading font-bold transition-all shadow-[0_0_20px_rgba(99,36,252,0.3)] disabled:opacity-70"
                      >
                        {isBackingUp ? <Activity size={14} className="animate-spin" /> : <Database size={14} />}
                        {isBackingUp ? 'Creating Backup...' : 'Create Backup'}
                      </button>
                    </div>

                    {isBackingUp && (
                      <div className="mb-6 p-5 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-[#6324FC]/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#6324FC]/10 to-transparent animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }}></div>
                        <div className="relative z-10 flex flex-col items-center justify-center py-2">
                          <Database size={28} className="text-[#6324FC] dark:text-[#00E5FF] animate-pulse mb-3" />
                          <h4 className="font-heading font-bold text-xs text-slate-900 dark:text-white mb-0.5">Generating Database Snapshot</h4>
                          <p className="text-[11px] text-secondary">Compressing leads, deals, and configurations...</p>
                          <div className="w-full max-w-md h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mt-4 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#6324FC] to-[#00E5FF] rounded-full animate-[progress_2.5s_ease-in-out_forwards]" style={{ width: '0%' }}></div>
                          </div>
                        </div>
                        <style>{`
                          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                          @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
                        `}</style>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h3 className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest pl-1">Available Backups</h3>
                      {backups.length === 0 ? (
                        <div className="p-6 text-center bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-2xl">
                          <FileArchive size={28} className="text-secondary mx-auto mb-2 opacity-50" />
                          <h4 className="text-xs font-heading font-bold text-slate-900 dark:text-white mb-0.5">No backups found</h4>
                          <p className="text-[11px] text-secondary">Create a manual backup to get started.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2.5">
                          {backups.map(backup => (
                            <div key={backup.id} className="flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 hover:border-[#6324FC]/30 transition-all group">
                              <div className="flex items-center gap-3 mb-3 md:mb-0">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${backup.type === 'Manual' ? 'bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF]' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                  <FileArchive size={16} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <h4 className="text-xs font-heading font-bold text-slate-900 dark:text-white">{backup.date}</h4>
                                    <span className="text-[9px] font-heading font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white dark:bg-[#0a0a0d] text-secondary border border-black/10 dark:border-white/10">{backup.type}</span>
                                  </div>
                                  <p className="text-[11px] text-secondary flex items-center gap-1.5 font-mono">
                                    <HardDrive size={11} /> {backup.size} • 
                                    <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={11} /> {backup.status}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#0a0a0d] hover:bg-slate-100 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-all">
                                  <Download size={13} /> Download
                                </button>
                                <button onClick={() => { toast.success('Restore initiated!'); if(masterSound) playSound('pop'); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6324FC]/10 hover:bg-[#6324FC]/20 border border-[#6324FC]/20 rounded-xl text-xs font-heading font-bold text-[#6324FC] dark:text-[#00E5FF] transition-all">
                                  <RotateCcw size={13} /> Restore
                                </button>
                                <button onClick={() => handleDeleteBackup(backup.id)} className="p-1.5 text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all ml-1">
                                  <Trash2 size={14} />
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
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Roles & Permissions</h2>
                        <p className="text-xs text-secondary">Define what team members can see and do.</p>
                      </div>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6324FC]/10 hover:bg-[#6324FC]/20 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/20 text-xs font-heading font-bold transition-all">
                        <Plus size={14} /> Create Custom Role
                      </button>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Left: Role List */}
                      <div className="w-full lg:w-1/3 space-y-2.5">
                        <h3 className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-3">Available Roles</h3>
                        {rolesWithCounts.map(role => (
                          <button
                            key={role.id}
                            onClick={() => setSelectedRole(role.id)}
                            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1.5 ${
                              selectedRole === role.id 
                                ? 'bg-[#6324FC]/10 border-[#6324FC]/50 shadow-[0_0_15px_rgba(99,36,252,0.1)]' 
                                : 'bg-slate-50 dark:bg-[#060608] border-black/10 dark:border-white/10 hover:border-[#6324FC]/30'
                            }`}
                          >
                            <div className="flex justify-between items-start w-full">
                              <span className={`font-heading font-bold text-xs ${selectedRole === role.id ? 'text-slate-900 dark:text-white' : 'text-secondary'}`}>{role.name}</span>
                              <div className="flex gap-1.5 items-center">
                                {role.isSystem && <span className="text-[9px] font-heading font-bold uppercase tracking-widest bg-slate-200 dark:bg-white/10 text-secondary px-1.5 py-0.5 rounded">System</span>}
                                <span className="text-[11px] text-secondary font-mono">{role.users} Users</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-secondary leading-relaxed">{role.description}</p>
                          </button>
                        ))}
                      </div>

                      {/* Right: Permissions */}
                      <div className="flex-1 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-2xl p-5">
                        <div className="flex justify-between items-center mb-5">
                          <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ShieldCheck size={15} className="text-[#6324FC] dark:text-[#00E5FF]" />
                            {rolesWithCounts.find(r => r.id === selectedRole)?.name || 'Role'} Permissions
                          </h3>
                          {selectedRole === 'owner' && <span className="text-[10px] text-amber-500 font-heading font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">Full Access</span>}
                        </div>

                        <div className="space-y-5">
                          {PERMISSIONS.map(category => (
                            <div key={category.category}>
                              <h4 className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-2.5 pb-1.5 border-b border-black/5 dark:border-white/5">{category.category}</h4>
                              <div className="space-y-2">
                                {category.items.map(perm => {
                                  const isChecked = rolePerms[selectedRole]?.includes(perm.id) || false;
                                  const isDisabled = selectedRole === 'owner';
                                  
                                  return (
                                    <label key={perm.id} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${!isDisabled && 'cursor-pointer'} ${isChecked ? 'bg-white dark:bg-[#0a0a0d] border-[#6324FC]/30' : 'bg-transparent border-transparent hover:bg-white dark:bg-[#0a0a0d]'}`}>
                                      <span className={`text-xs font-heading font-bold ${isChecked ? 'text-slate-900 dark:text-white' : 'text-secondary'}`}>{perm.label}</span>
                                      <div className="relative">
                                        <input type="checkbox" className="sr-only" checked={isChecked} disabled={isDisabled} onChange={() => togglePermission(selectedRole, perm.id)} />
                                        <div className={`block w-8 h-4.5 rounded-full transition-colors ${isDisabled ? 'opacity-50' : ''} ${isChecked ? 'bg-[#6324FC]' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                                        <div className={`absolute left-0.5 top-0.5 bg-white w-3.5 h-3.5 rounded-full transition-transform ${isChecked ? 'transform translate-x-3.5' : ''}`}></div>
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
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8">
                      <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Usage & Billing</h2>
                      <p className="text-xs text-secondary">Manage your subscription plan and resource limits.</p>
                    </div>
                    
                    <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 dark:bg-[#060608] border border-[#6324FC]/30 relative overflow-hidden mb-8 shadow-xl">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-[#6324FC]/15 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                      <div className="relative z-10">
                        <span className="px-3 py-1 bg-[#6324FC]/20 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/30 rounded-full text-[10px] font-heading font-extrabold uppercase tracking-widest mb-4 inline-block">Enterprise Plan</span>
                        <h3 className="text-2xl font-heading font-extrabold text-white mb-1">Injaazh ERP Pro</h3>
                        <p className="text-xs font-medium text-slate-400 mb-6 font-mono">$99.00 / month, next billing on Aug 1, 2026</p>
                        <button className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 font-heading font-bold text-xs rounded-xl transition-all shadow-sm">Manage Subscription</button>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* ── DANGER ZONE ── */}
                {activeTab === 'danger' && (
                  <GlassCard className="border-rose-500/20">
                    <div className="border-b border-rose-500/20 pb-6 mb-8">
                      <h2 className="text-xl font-heading font-bold text-rose-500 mb-1">Danger Zone</h2>
                      <p className="text-xs text-rose-500/80">Destructive actions that cannot be undone.</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-rose-500/30">
                      <h4 className="font-heading font-bold text-rose-500 mb-1.5 text-sm">Factory Reset Database</h4>
                      <p className="text-xs text-rose-500/80 mb-5">Permanently delete all projects, marketplace records, transactions, and logs.</p>
                      <div className="flex gap-3">
                        <input type="text" value={dangerConfirm} onChange={(e) => setDangerConfirm(e.target.value)} placeholder="Type CONFIRM" className="flex-1 px-3.5 py-2 bg-white dark:bg-[#0a0a0d] border border-rose-500/30 rounded-xl focus:outline-none focus:border-rose-500/60 text-rose-500 font-mono font-bold text-xs placeholder-rose-900/40" />
                        <button disabled={dangerConfirm !== 'CONFIRM'} onClick={async () => { 
                          if(masterSound) playSound('error'); 
                          toast.loading('Resetting database...', { id: 'reset' });
                          const { factoryResetDatabase } = await import('@/app/actions/databaseActions');
                          const res = await factoryResetDatabase();
                          if (res.success) {
                            toast.success('Database factory reset successful!', { id: 'reset' });
                          } else {
                            toast.error(res.error || 'Failed to reset', { id: 'reset' });
                          }
                          setDangerConfirm(''); 
                        }} className={`px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-heading font-bold text-xs rounded-xl transition-all ${dangerConfirm === 'CONFIRM' ? '' : 'opacity-50 cursor-not-allowed'}`}>Reset</button>
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
              <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 shadow-xs">
                <h4 className="flex items-center gap-2 text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4">
                  <Activity size={14} className="text-emerald-500" /> System Status
                </h4>
                <div className="space-y-3 text-xs font-medium">
                  <div className="flex justify-between items-center text-secondary"><span>Version</span> <span className="font-heading font-bold text-slate-900 dark:text-white">v2.4.0-stable</span></div>
                  <div className="flex justify-between items-center text-secondary"><span>Services</span> <span className="text-emerald-500 font-heading font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Operational</span></div>
                  <div className="flex justify-between items-center text-secondary"><span>Last Updated</span> <span className="text-slate-900 dark:text-white font-mono text-[11px]">{systemTime}</span></div>
                </div>
              </div>

              <div className="bg-[#6324FC]/5 dark:bg-[#6324FC]/10 border border-[#6324FC]/20 rounded-3xl p-5 shadow-xs">
                <h4 className="flex items-center gap-2 text-xs font-heading font-bold text-[#6324FC] dark:text-[#00E5FF] uppercase tracking-widest mb-2">
                  <Lightbulb size={14} /> Quick Tip
                </h4>
                <p className="text-[11px] font-medium text-secondary leading-relaxed">
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
