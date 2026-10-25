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
  MessageSquare, Video, Code2, FileText, ExternalLink, Database, RotateCcw, FileArchive, Search, PanelBottom,
  Sparkles, CheckCircle as CheckIcon, Shield, Radio, Server, Layers, Cpu
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
  { id: 'light', name: 'Light', icon: Sun, desc: 'Clean high-contrast daylight' },
  { id: 'dark', name: 'Dark', icon: Moon, desc: 'Executive obsidian night' },
  { id: 'system', name: 'System', icon: Monitor, desc: 'Auto-syncs with OS' }
];

const PERMISSIONS = [
  { category: 'CRM & Deals', items: [{ id: 'crm_read', label: 'View Leads & Deals' }, { id: 'crm_write', label: 'Edit Leads & Deals' }, { id: 'crm_delete', label: 'Delete Records' }] },
  { category: 'Finance & Accounts', items: [{ id: 'fin_read', label: 'View Revenue & Expenses' }, { id: 'fin_write', label: 'Manage Invoices & Billing' }] },
  { category: 'Settings & Administration', items: [{ id: 'set_team', label: 'Manage Workspace Team' }, { id: 'set_bill', label: 'Manage Company Billing' }] },
];

const DEFAULT_ROLE_PERMS: Record<string, string[]> = {
  owner: ['crm_read', 'crm_write', 'crm_delete', 'fin_read', 'fin_write', 'set_team', 'set_bill'],
  admin: ['crm_read', 'crm_write', 'crm_delete', 'fin_read', 'fin_write', 'set_team'],
  editor: ['crm_read', 'crm_write', 'fin_read'],
  viewer: ['crm_read', 'fin_read']
};

const INITIAL_INTEGRATIONS = [
  { id: 'slack', name: 'Slack', description: 'Send real-time alerts and notifications to dedicated Slack channels.', icon: MessageSquare, color: '#E11D48', connected: true },
  { id: 'stripe', name: 'Stripe', description: 'Process global customer payments, webhooks, and subscription lifecycles.', icon: CreditCard, color: '#6366F1', connected: true },
  { id: 'google', name: 'Google Workspace', description: 'Sync executive calendars, contacts, and client outreach directly.', icon: Mail, color: '#10B981', connected: false },
  { id: 'github', name: 'GitHub', description: 'Link git commits, issues, and pull requests directly to project milestones.', icon: Code2, color: '#8B5CF6', connected: false },
  { id: 'zoom', name: 'Zoom Video', description: 'Auto-generate meeting rooms and calendar invites for client deal calls.', icon: Video, color: '#3B82F6', connected: false },
  { id: 'notion', name: 'Notion Sync', description: 'Embed collaborative workspace documentation and briefs into projects.', icon: FileText, color: '#64748B', connected: false },
];

const INITIAL_BACKUPS = [
  { id: 'b1', date: 'Jul 10, 2026, 02:00 AM', size: '45.2 MB', type: 'Automatic', status: 'Completed' },
  { id: 'b2', date: 'Jul 09, 2026, 02:00 AM', size: '44.8 MB', type: 'Automatic', status: 'Completed' },
  { id: 'b3', date: 'Jul 08, 2026, 04:15 PM', size: '42.1 MB', type: 'Manual', status: 'Completed' },
];

const INITIAL_AUDIT_LOGS = [
  { id: 'log1', user: 'Mamun H.', action: 'Created Manual Snapshot', ip: '192.168.1.45', time: 'Just now', status: 'success' },
  { id: 'log2', user: 'Alex L.', action: 'Failed login challenge', ip: '10.0.0.12', time: '10 mins ago', status: 'danger' },
  { id: 'log3', user: 'System Worker', action: 'Automated Daily Maintenance', ip: '127.0.0.1', time: '1 hour ago', status: 'success' },
  { id: 'log4', user: 'Mamun H.', action: 'Updated Workspace Preferences', ip: '192.168.1.45', time: '2 hours ago', status: 'success' },
  { id: 'log5', user: 'Sarah J.', action: 'Archived Expense Record', ip: '172.16.0.4', time: 'Yesterday', status: 'warning' },
];

const CONTEXTUAL_TIPS: Record<string, { title: string; tip: string }> = {
  profile: { title: 'Personal Identity', tip: 'Use a unique password and upload a clear avatar so team members can recognize your activities.' },
  company: { title: 'Legal & Invoicing', tip: 'Company Tax ID and branding will be printed directly onto all generated client invoices and contracts.' },
  workspace: { title: 'Localization Sync', tip: 'Setting your timezone ensures accurate daily revenue calculations and scheduled task deadlines.' },
  team: { title: 'Access Control', tip: 'Grant Viewers (Demo) read-only access for audits without exposing sensitive write actions.' },
  roles: { title: 'Granular Scoping', tip: 'Roles allow granular scoping across CRM, Finance, Marketplace Deals, and System Settings.' },
  notifications: { title: 'Audio Executive', tip: 'Customize audio feedback chimes for financial and operational events to stay alerted while multitasking.' },
  appearance: { title: 'Executive Interface', tip: 'Choose between expanded menu, compact sidebar, or macOS-style floating bottom dock.' },
  security: { title: '2FA Fortification', tip: 'Require 2FA for all administrative accounts to protect financial records and employee data.' },
  api_keys: { title: 'AI Automation', tip: 'Configure Gemini, Claude, or OpenAI API keys to unlock auto-lead scoring and assistant insights.' },
  smtp: { title: 'Deliverability', tip: 'Always send a test handshake before broadcasting outreach campaigns or client billing reminders.' },
  integrations: { title: 'ERP Ecosystem', tip: 'Connect Slack or Stripe to streamline automated billing notifications and webhook pipelines.' },
  billing: { title: 'Subscription Tier', tip: 'Enterprise tier provides unlimited marketplace listings and dedicated database backup retention.' },
  backup: { title: 'Data Resilience', tip: 'Automated snapshots execute daily at 02:00 AM. Create manual snapshots before major updates.' },
  audit: { title: 'Compliance Trail', tip: 'Immutable audit logs record every sensitive mutation, permission grant, and authentication event.' },
  danger: { title: 'Destructive Reset', tip: 'Factory reset wipes all MongoDB collections and returns the workspace to clean bootstrap state.' }
};

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

const GlassCard = ({ 
  children, 
  className = '', 
  accentColor = '#6324FC', 
  glowColor = 'rgba(99,36,252,0.18)' 
}: { 
  children: React.ReactNode; 
  className?: string; 
  accentColor?: string; 
  glowColor?: string; 
}) => (
  <div className={`bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-6 lg:p-8 relative shadow-sm overflow-hidden group transition-all duration-300 ${className}`}>
    {/* Radial Blur Spotlight */}
    <div 
      className="absolute -top-12 -right-12 w-48 h-48 blur-[45px] rounded-full opacity-40 group-hover:opacity-80 group-hover:scale-125 transition-all duration-700 pointer-events-none" 
      style={{ backgroundColor: glowColor }} 
    />
    {/* Top Neon Accent Line */}
    <div 
      className="absolute top-0 left-1/2 -translate-x-1/2 w-20 group-hover:w-full h-[2.5px] transition-all duration-700 opacity-90 pointer-events-none" 
      style={{
        background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
        boxShadow: `0 0 12px ${accentColor}`
      }} 
    />
    {/* Subtle Glass Gradient Highlight */}
    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] dark:from-white/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    <div className="relative z-10">
      {children}
    </div>
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
    if (masterSound) playSound('pop');
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
      toast.success('Backup snapshot created successfully!');
      if (masterSound) playSound('success');
    }, 2500);
  };

  const handleDeleteBackup = (id: string) => {
    setBackups(prev => prev.filter(b => b.id !== id));
    toast.success('Backup deleted');
    if (masterSound) playSound('pop');
  };

  // Audit Logs States
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);

  const handleRefreshLogs = () => {
    setIsRefreshingLogs(true);
    if (masterSound) playSound('pop');
    setTimeout(() => {
      setIsRefreshingLogs(false);
      const newLog = {
        id: `log${Date.now()}`,
        user: 'Mamun H.',
        action: 'Viewed Audit Telemetry',
        ip: '192.168.1.45',
        time: 'Just now',
        status: 'success'
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }, 1200);
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
        toast.success('Password updated successfully!', { id: 'ch-pass' });
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
        toast.success('Team member added successfully!', { id: 'invite' });
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
        toast.success('Role updated successfully!', { id: 'role-update' });
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
    const isConfirmed = await confirm({ message: 'Are you sure you want to permanently remove this team member?', variant: 'danger' });
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
    toast.loading('Testing SMTP connection handshake...', { id: 'smtp-test' });
    try {
      const res = await testSmtpConnection(smtpSettings);
      if (res.success) {
        toast.success(res.message || 'SMTP Connection established!', { id: 'smtp-test' });
        setTestResult({ success: true, message: res.message || 'SMTP handshake succeeded. Server is ready.' });
        if (masterSound) playSound('success');
      } else {
        toast.error(res.error || 'SMTP Connection failed.', { id: 'smtp-test' });
        setTestResult({ success: false, message: res.error || 'Connection failed. Please check host, port, or app password.' });
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmailAddress)) return toast.error('Invalid email address');
    setIsSendingTestEmail(true);
    toast.loading('Saving settings & transmitting test email...', { id: 'test-email' });
    try {
      const saveRes = await saveSystemSettings('smtp', smtpSettings);
      if (!saveRes.success) throw new Error('Failed to save SMTP');
      const res = await sendTestEmail({ to: testEmailAddress });
      if (res.success) {
        toast.success('Test email transmitted successfully!', { id: 'test-email' });
        if (masterSound) playSound('success');
        setTestEmailAddress('');
      } else {
        toast.error(res.error || 'Failed to send test email', { id: 'test-email' });
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

  const currentTabObj = TABS.find(t => t.id === activeTab || (t.id === 'api_keys' && activeTab === 'api'));

  return (
    <div className="bg-slate-50 dark:bg-[#060608] min-h-screen text-slate-900 dark:text-white font-sans selection:bg-[#6324FC]/30 pb-32">
      
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6324FC]/10 border border-[#6324FC]/25 text-[#6324FC] dark:text-[#A78BFA] text-[10px] font-heading font-bold uppercase tracking-widest shadow-[0_0_12px_rgba(99,36,252,0.1)]">
                <Blocks size={13} className="text-[#6324FC] dark:text-[#A78BFA]" />
                <span>Executive Configuration</span>
              </div>
              {hasUnsavedChanges && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-heading font-bold uppercase tracking-wider animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Unsaved Changes
                </span>
              )}
            </div>
            
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white">
                Settings
              </h1>
              {currentTabObj && (
                <span className="text-secondary/70 font-mono text-sm sm:text-base font-semibold">
                  / {currentTabObj.label}
                </span>
              )}
            </div>
            <p className="text-xs text-secondary font-medium mt-1">
              Manage enterprise preferences, workspace security, AI models, and system integrations.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => {
                if (masterSound) playSound('pop');
                setHasUnsavedChanges(false);
                toast.success('Changes reset');
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-heading font-bold text-xs bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all shadow-xs"
            >
              <RefreshCcw size={14} className="text-secondary" /> Reset Changes
            </button>
            <AnimatePresence>
              {(hasUnsavedChanges || isSaving) && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.9, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 4 }}
                  onClick={handleSave} 
                  disabled={isSaving} 
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-heading font-bold text-xs transition-all shadow-[0_0_20px_rgba(99,36,252,0.4)] bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white disabled:opacity-70 cursor-pointer"
                >
                  {isSaving ? <Activity size={14} className="animate-spin" /> : <Save size={14} />} 
                  {isSaving ? 'Saving Configurations...' : 'Save Changes'}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── 3-Column Layout ──────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Sidebar Menu */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="sticky top-6 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-3.5 shadow-sm space-y-5 relative overflow-hidden group">
              {/* Radial Blur Spotlight */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#6324FC]/10 blur-[35px] rounded-full pointer-events-none" />
              
              {[
                { title: 'Personal', items: ['profile', 'appearance', 'notifications'] },
                { title: 'Workspace', items: ['company', 'workspace', 'team', 'roles'] },
                { title: 'Advanced & Developer', items: ['api_keys', 'smtp', 'integrations', 'security', 'billing', 'backup', 'audit', 'danger'] }
              ].map(group => {
                const groupTabs = tabsToRender.filter(t => group.items.includes(t.id));
                if (groupTabs.length === 0) return null;
                return (
                  <div key={group.title} className="flex flex-col gap-1 relative z-10">
                    <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest pl-3 mb-1">
                      {group.title}
                    </span>
                    {groupTabs.map(tab => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id || (tab.id === 'api_keys' && activeTab === 'api');
                      return (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveTab(tab.id); if (masterSound) playSound('pop'); }}
                          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 font-heading font-bold text-xs relative overflow-hidden text-left ${
                            isActive 
                              ? tab.danger 
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]' 
                                : 'bg-[#6324FC]/10 dark:bg-[#6324FC]/20 border border-[#6324FC]/40 text-[#6324FC] dark:text-[#A78BFA] shadow-[0_0_15px_rgba(99,36,252,0.15)]'
                              : 'text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04] border border-transparent'
                          }`}
                        >
                          {isActive && (
                            <span 
                              className={`w-1.5 h-1.5 rounded-full mr-0.5 animate-pulse ${tab.danger ? 'bg-rose-500 shadow-[0_0_8px_#F43F5E]' : 'bg-[#6324FC] dark:bg-[#A78BFA] shadow-[0_0_8px_#6324FC]'}`} 
                            />
                          )}
                          <Icon size={16} className={isActive ? (tab.danger ? 'text-rose-500' : 'text-[#6324FC] dark:text-[#A78BFA]') : 'text-secondary'} />
                          <span className="truncate">{tab.label}</span>
                          {tab.id === 'team' && teamMembers.length > 0 && (
                            <span className="ml-auto px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-[#6324FC]/15 text-[#6324FC] dark:text-[#A78BFA] border border-[#6324FC]/30">
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
                  <GlassCard accentColor="#6324FC" glowColor="rgba(99,36,252,0.18)">
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Profile Settings</h2>
                        <p className="text-xs text-secondary">Manage your personal identity, credentials, and executive profile photo.</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest bg-[#6324FC]/10 text-[#6324FC] dark:text-[#A78BFA] border border-[#6324FC]/30">
                        Active Account
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 mb-8">
                      <label className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 flex items-center justify-center cursor-pointer hover:border-[#6324FC]/50 transition-all group relative overflow-hidden shadow-inner">
                        {profileImage ? (
                          <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User size={30} className="text-secondary group-hover:scale-110 group-hover:text-[#6324FC] transition-all" />
                        )}
                        <div className="absolute inset-0 bg-white/70 dark:bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1 backdrop-blur-[2px]">
                          <Camera size={14} className="text-slate-900 dark:text-white" />
                          <span className="text-slate-900 dark:text-white text-[9px] font-heading font-bold uppercase tracking-widest">Change</span>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                      <div>
                        <h3 className="font-heading font-bold text-sm mb-0.5 text-slate-900 dark:text-white">Profile Avatar</h3>
                        <p className="text-xs text-secondary mb-3">JPG, GIF or PNG. Maximum allowable payload of 2MB.</p>
                        <button 
                          className="text-xs font-heading font-bold bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 shadow-xs px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer" 
                          onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                        >
                          Upload New Picture
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <div>
                        <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Full Legal Name</label>
                        <input 
                          type="text" 
                          value={profileName} 
                          onChange={(e) => { setProfileName(e.target.value); triggerChange(); }} 
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] focus:ring-2 focus:ring-[#6324FC]/20 font-medium text-xs transition-all shadow-xs" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                        <input 
                          type="email" 
                          value={profileEmail} 
                          onChange={(e) => { setProfileEmail(e.target.value); triggerChange(); }} 
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] focus:ring-2 focus:ring-[#6324FC]/20 font-medium text-xs transition-all shadow-xs" 
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-black/10 dark:border-white/10">
                      <div className="flex items-center gap-2 mb-4">
                        <Lock size={15} className="text-[#6324FC] dark:text-[#A78BFA]" />
                        <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">Change Password</h3>
                      </div>
                      <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Current Password</label>
                          <input 
                            type="password" 
                            placeholder="••••••••••••"
                            value={currentPassword} 
                            onChange={(e) => setCurrentPassword(e.target.value)} 
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] text-xs font-mono transition-all shadow-xs" 
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">New Password</label>
                            <input 
                              type="password" 
                              placeholder="••••••••••••"
                              value={newPassword} 
                              onChange={(e) => setNewPassword(e.target.value)} 
                              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] text-xs font-mono transition-all shadow-xs" 
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Confirm New Password</label>
                            <input 
                              type="password" 
                              placeholder="••••••••••••"
                              value={confirmNewPassword} 
                              onChange={(e) => setConfirmNewPassword(e.target.value)} 
                              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] text-xs font-mono transition-all shadow-xs" 
                            />
                          </div>
                        </div>
                        <button 
                          type="submit" 
                          disabled={isChangingPassword} 
                          className="px-5 py-2.5 bg-[#6324FC]/10 hover:bg-[#6324FC]/20 text-[#6324FC] dark:text-[#A78BFA] border border-[#6324FC]/30 font-heading font-bold rounded-xl transition-all text-xs disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                        </button>
                      </form>
                    </div>
                  </GlassCard>
                )}

                {/* ── COMPANY ── */}
                {activeTab === 'company' && (
                  <GlassCard accentColor="#3B82F6" glowColor="rgba(59,130,246,0.18)">
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Company Identity & Branding</h2>
                        <p className="text-xs text-secondary">Manage registered entity credentials, invoicing tax details, and primary branding.</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest bg-blue-500/10 text-blue-500 border border-blue-500/30">
                        Primary Entity
                      </span>
                    </div>
                    
                    <div className="space-y-5">
                      <div>
                        <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Official Company Name</label>
                        <input 
                          type="text" 
                          defaultValue="Injaazh Global FZ-LLC" 
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-blue-500 font-medium text-xs transition-all shadow-xs" 
                          onChange={triggerChange} 
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Tax / VAT Registration ID</label>
                          <input 
                            type="text" 
                            defaultValue="AE-100482910400003" 
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-blue-500 font-mono text-xs transition-all shadow-xs" 
                            onChange={triggerChange} 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Company Primary Website</label>
                          <input 
                            type="url" 
                            defaultValue="https://injaazh.com" 
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-blue-500 font-mono text-xs transition-all shadow-xs" 
                            onChange={triggerChange} 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Official Headquarters Address</label>
                        <input 
                          type="text" 
                          defaultValue="Level 14, Boulevard Plaza Tower 1, Downtown, Dubai, UAE" 
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-blue-500 font-medium text-xs transition-all shadow-xs" 
                          onChange={triggerChange} 
                        />
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* ── WORKSPACE ── */}
                {activeTab === 'workspace' && (
                  <GlassCard accentColor="#6324FC" glowColor="rgba(99,36,252,0.18)">
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Workspace Configuration</h2>
                        <p className="text-xs text-secondary">Set default timezones, functional currencies, date formats, and localization.</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest bg-[#6324FC]/10 text-[#6324FC] dark:text-[#A78BFA] border border-[#6324FC]/30">
                        Global Settings
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Operating Timezone</label>
                          <select className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] font-medium text-xs transition-all appearance-none cursor-pointer" onChange={triggerChange}>
                            <option>Asia/Dhaka (GMT+06:00)</option>
                            <option>Asia/Dubai (GMT+04:00)</option>
                            <option>UTC (GMT+00:00)</option>
                            <option>America/New_York (GMT-05:00)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Reporting Currency</label>
                          <select className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] font-medium text-xs transition-all appearance-none cursor-pointer" onChange={triggerChange}>
                            <option>BDT (৳ - Bangladeshi Taka)</option>
                            <option>USD ($ - US Dollar)</option>
                            <option>EUR (€ - Euro)</option>
                            <option>AED (د.إ - UAE Dirham)</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">System Date Presentation</label>
                          <select className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] font-medium text-xs transition-all appearance-none cursor-pointer" onChange={triggerChange}>
                            <option>YYYY-MM-DD (ISO Standard)</option>
                            <option>DD/MM/YYYY (European / BD)</option>
                            <option>MM/DD/YYYY (US Format)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">System Interface Language</label>
                          <select className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#6324FC] font-medium text-xs transition-all appearance-none cursor-pointer" onChange={triggerChange}>
                            <option>English (US - Enterprise)</option>
                            <option>Bengali (বাংলা - বাংলাদেশ)</option>
                            <option>Arabic (العربية)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* ── NOTIFICATIONS & SOUNDS ── */}
                {activeTab === 'notifications' && (
                  <GlassCard accentColor="#10B981" glowColor="rgba(16,185,129,0.18)">
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Notifications & Sound Studio</h2>
                        <p className="text-xs text-secondary">Tune real-time audio chimes, alerts, and operational event sounds.</p>
                      </div>
                      
                      <label className="flex items-center gap-3 cursor-pointer bg-slate-50 dark:bg-[#060608] px-4 py-2 rounded-2xl border border-black/10 dark:border-white/10 shadow-xs hover:border-[#10B981]/40 transition-colors">
                        <Volume2 size={16} className={masterSound ? 'text-emerald-500' : 'text-secondary'} />
                        <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-secondary">Master Sound</span>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only" 
                            checked={masterSound} 
                            onChange={() => { 
                              setMasterSound(!masterSound); 
                              if (!masterSound && (sounds as any)[soundVariants['paymentReceived']]) {
                                (sounds as any)[soundVariants['paymentReceived']]();
                              } 
                              triggerChange(); 
                            }} 
                          />
                          <div className={`block w-9 h-5 rounded-full transition-colors ${masterSound ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                          <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${masterSound ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                      </label>
                    </div>

                    <div className="space-y-3">
                      {[
                        { id: 'systemBoot', label: 'System Boot / Login', desc: 'Plays a welcoming executive harmonic chord upon successful authentication.', variants: [{val: 'login1', name: 'Classic Chord'}, {val: 'login2', name: 'Modern Ascending'}, {val: 'login3', name: 'Minimal Chime'}] },
                        { id: 'paymentReceived', label: 'Revenue & Income Logged', desc: 'Plays a distinct coin cascade when client deposits or invoices are booked.', variants: [{val: 'income1', name: 'Coin Drop'}, {val: 'income2', name: 'Synth Cash'}, {val: 'income3', name: 'Rich Chime'}] },
                        { id: 'expenseLogged', label: 'Operational Expense Burn', desc: 'Plays a controlled tactile thud when a daily expense record is saved.', variants: [{val: 'expense1', name: 'Low Thud'}, {val: 'expense2', name: 'Double Tap'}, {val: 'expense3', name: 'Deep Saw'}] },
                        { id: 'itemDeleted', label: 'Destructive / Delete Event', desc: 'Plays a deep pop and vibration feedback when records are deleted.', variants: [{val: 'delete1', name: 'Deep Pop'}, {val: 'delete2', name: 'Saw Snap'}, {val: 'delete3', name: 'Double Pluck'}] },
                        { id: 'emailSent', label: 'Email Outreach Dispatched', desc: 'Plays an airy aerodynamic swoosh when client emails are broadcast.', variants: [{val: 'mailSend1', name: 'Air Swoosh'}, {val: 'mailSend2', name: 'Digital Swoosh'}, {val: 'mailSend3', name: 'Long Swoosh'}] },
                        { id: 'errorAlert', label: 'Security & Error Alerts', desc: 'Plays a high-priority warning frequency when validation fails.', variants: [{val: 'error1', name: 'Harsh Buzz'}, {val: 'error2', name: 'Double Buzz'}, {val: 'error3', name: 'Discordant Chord'}] },
                      ].map(item => (
                        <div 
                          key={item.id} 
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${soundSettings[item.id as keyof typeof soundSettings] && masterSound ? 'bg-slate-50/70 dark:bg-[#060608]/70 border-[#10B981]/30 shadow-[0_0_15px_rgba(16,185,129,0.06)]' : 'bg-slate-50 dark:bg-[#060608] border-black/10 dark:border-white/10'}`}
                        >
                          <div className="flex items-center gap-3.5">
                            <button 
                              onClick={() => masterSound ? (sounds as any)[soundVariants[item.id]]?.() : toast.error("Master sound muted")} 
                              className="w-10 h-10 rounded-xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 flex items-center justify-center text-secondary hover:text-emerald-500 hover:border-emerald-500/30 transition-all shadow-xs cursor-pointer group/btn" 
                              title="Preview Sound"
                            >
                              <Play size={14} className="ml-0.5 group-hover/btn:scale-110 transition-transform" />
                            </button>
                            <div>
                              <h4 className="font-heading font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                                {item.label}
                              </h4>
                              <p className="text-[11px] text-secondary mt-0.5">{item.desc}</p>
                              
                              <div className="relative mt-2">
                                <button
                                  onClick={() => setOpenSoundDropdown(openSoundDropdown === item.id ? null : item.id)}
                                  className="flex items-center justify-between w-48 px-3 py-1.5 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white text-[11px] font-heading font-bold transition-all shadow-2xs"
                                >
                                  <span>{item.variants.find(v => v.val === soundVariants[item.id])?.name || 'Select Sound'}</span>
                                  <ChevronRight className={`w-3.5 h-3.5 text-secondary transition-transform ${openSoundDropdown === item.id ? 'rotate-90' : ''}`} />
                                </button>
                                
                                <AnimatePresence>
                                  {openSoundDropdown === item.id && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -5 }}
                                      className="absolute z-20 w-48 mt-1.5 bg-white dark:bg-[#0a0a0d] backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-xl shadow-xl overflow-hidden p-1"
                                    >
                                      {item.variants.map(v => (
                                        <button 
                                          key={v.val} 
                                          onClick={() => handleSoundVariantChange(item.id, v.val)} 
                                          className={`w-full text-left px-3 py-1.5 text-[11px] font-heading font-bold rounded-lg transition-colors ${soundVariants[item.id] === v.val ? 'bg-emerald-500/10 text-emerald-500' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300'}`}
                                        >
                                          {v.name}
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </div>

                          <label className="relative cursor-pointer ml-4">
                            <input 
                              type="checkbox" 
                              className="sr-only" 
                              disabled={!masterSound} 
                              checked={soundSettings[item.id as keyof typeof soundSettings]} 
                              onChange={() => handleSoundToggle(item.id as keyof typeof soundSettings)} 
                            />
                            <div className={`block w-9 h-5 rounded-full transition-colors ${!masterSound ? 'bg-slate-200 dark:bg-white/10 opacity-50' : soundSettings[item.id as keyof typeof soundSettings] ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                            <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${!masterSound ? 'opacity-50' : ''} ${soundSettings[item.id as keyof typeof soundSettings] ? 'transform translate-x-4' : ''}`}></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* ── SECURITY ── */}
                {activeTab === 'security' && (
                  <GlassCard accentColor="#10B981" glowColor="rgba(16,185,129,0.18)">
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Security & Access Fortification</h2>
                        <p className="text-xs text-secondary">Manage multi-factor authentication (2FA), active hardware sessions, and login security.</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                        Shield Protected
                      </span>
                    </div>
                    
                    <div className="mb-8 p-5 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-sm">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <h3 className="mb-0.5 text-slate-900 dark:text-white font-heading font-bold text-xs flex items-center gap-2">
                            Two-Factor Authentication (TOTP 2FA)
                            {is2FAEnabled && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-mono font-bold">
                                ACTIVE
                              </span>
                            )}
                          </h3>
                          <p className="text-[11px] font-medium text-secondary">
                            {is2FAEnabled ? 'Your account is secured with Google Authenticator or hardware keys.' : 'Add an additional layer of verification when logging into executive workspaces.'}
                          </p>
                        </div>
                      </div>

                      {is2FAEnabled ? (
                        <button 
                          onClick={() => { setIsDisabling2FA(true); setIs2FAModalOpen(true); }} 
                          className="px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 font-heading font-bold rounded-xl text-xs hover:bg-rose-500/20 transition-all cursor-pointer whitespace-nowrap"
                        >
                          Disable 2FA
                        </button>
                      ) : (
                        <button 
                          onClick={() => { setIsDisabling2FA(false); setIs2FAModalOpen(true); }} 
                          className="px-5 py-2 bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white font-heading font-bold rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(99,36,252,0.3)] cursor-pointer whitespace-nowrap"
                        >
                          Enable 2FA Protection
                        </button>
                      )}
                    </div>

                    <TwoFactorSetupModal 
                      isOpen={is2FAModalOpen} 
                      onClose={() => setIs2FAModalOpen(false)} 
                      isDisabling={isDisabling2FA} 
                      onSuccess={() => setIs2FAEnabled(!isDisabling2FA)} 
                    />

                    <h3 className="mb-3 flex items-center gap-2 font-heading font-bold text-xs uppercase tracking-widest text-secondary">
                      <MonitorSmartphone size={14} className="text-[#6324FC] dark:text-[#A78BFA]" /> Active Hardware Sessions
                    </h3>

                    <div className="space-y-2.5">
                      {isLoadingSessions ? (
                        <div className="p-8 text-center flex justify-center"><Activity className="animate-spin text-[#6324FC]" /></div>
                      ) : activeSessions.length === 0 ? (
                        <div className="p-5 text-center text-xs font-heading font-bold text-secondary">No active sessions found.</div>
                      ) : activeSessions.map((session) => (
                        <div key={session._id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 flex items-center justify-center shadow-xs">
                              <MonitorSmartphone size={18} className="text-secondary" />
                            </div>
                            <div>
                              <h4 className="flex items-center gap-2 text-slate-900 dark:text-white font-heading font-bold text-xs mb-0.5">
                                {session.device} 
                                {session.isCurrent && (
                                  <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-heading font-bold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Current Device
                                  </span>
                                )}
                              </h4>
                              <p className="text-[11px] font-medium text-secondary">{session.browser} • {session.os} • {session.location}</p>
                            </div>
                          </div>
                          {!session.isCurrent && (
                            <button 
                              onClick={async () => {
                                const res = await revokeSession(session.sessionId);
                                if (res.success) { 
                                  toast.success('Session revoked'); 
                                  setActiveSessions(prev => prev.filter(s => s._id !== session._id)); 
                                } else {
                                  toast.error('Failed to revoke session');
                                }
                              }}
                              className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-heading font-bold rounded-xl text-xs transition-colors border border-rose-500/20 cursor-pointer"
                            >
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
                  <GlassCard accentColor="#6324FC" glowColor="rgba(99,36,252,0.18)">
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Team & User Directory</h2>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#6324FC]/15 text-[#6324FC] dark:text-[#A78BFA] border border-[#6324FC]/30">
                            {teamMembers.length} Accounts
                          </span>
                        </div>
                        <p className="text-xs text-secondary">Manage workspace members, assign security roles, and provision new credentials.</p>
                      </div>
                    </div>

                    {/* KPI Telemetry Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
                      {/* Total Users */}
                      <div className="group rounded-2xl p-4 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#6324FC]/50 hover:shadow-[0_12px_28px_rgba(99,36,252,0.18)]">
                        <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#6324FC]/20 blur-[30px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 pointer-events-none" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#6324FC]" />
                        <div className="flex items-center justify-between mb-2 relative z-10">
                          <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Total Users</span>
                          <div className="w-8 h-8 rounded-xl bg-[#6324FC]/10 border border-[#6324FC]/20 flex items-center justify-center text-[#6324FC] dark:text-[#A78BFA] group-hover:scale-110 transition-transform">
                            <Users size={15} />
                          </div>
                        </div>
                        <div className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white relative z-10">
                          {teamMembers.length}
                        </div>
                        <div className="text-[10px] text-secondary font-mono mt-0.5 relative z-10">Active in system</div>
                      </div>

                      {/* Admins & Owners */}
                      <div className="group rounded-2xl p-4 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#8B5CF6]/50 hover:shadow-[0_12px_28px_rgba(139,92,246,0.18)]">
                        <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#8B5CF6]/20 blur-[30px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 pointer-events-none" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#8B5CF6]" />
                        <div className="flex items-center justify-between mb-2 relative z-10">
                          <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Admins & Owners</span>
                          <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6] group-hover:scale-110 transition-transform">
                            <ShieldCheck size={15} />
                          </div>
                        </div>
                        <div className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white relative z-10">
                          {teamMembers.filter(m => m.role === 'owner' || m.role === 'admin').length}
                        </div>
                        <div className="text-[10px] text-secondary font-mono mt-0.5 relative z-10">Full system access</div>
                      </div>

                      {/* Editors & Staff */}
                      <div className="group rounded-2xl p-4 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-[0_12px_28px_rgba(16,185,129,0.18)]">
                        <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/20 blur-[30px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 pointer-events-none" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#10B981]" />
                        <div className="flex items-center justify-between mb-2 relative z-10">
                          <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Editors & Staff</span>
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                            <Briefcase size={15} />
                          </div>
                        </div>
                        <div className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white relative z-10">
                          {teamMembers.filter(m => m.role === 'editor' || m.role === 'marketplace_team').length}
                        </div>
                        <div className="text-[10px] text-secondary font-mono mt-0.5 relative z-10">Operational staff</div>
                      </div>

                      {/* Viewers (Demo) */}
                      <div className="group rounded-2xl p-4 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-[0_12px_28px_rgba(245,158,11,0.18)]">
                        <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/20 blur-[30px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 pointer-events-none" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#F59E0B]" />
                        <div className="flex items-center justify-between mb-2 relative z-10">
                          <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Viewers (Demo)</span>
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                            <Eye size={15} />
                          </div>
                        </div>
                        <div className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white relative z-10">
                          {teamMembers.filter(m => m.role === 'viewer').length}
                        </div>
                        <div className="text-[10px] text-secondary font-mono mt-0.5 relative z-10">Read-only accounts</div>
                      </div>
                    </div>

                    {/* Invite / Create User Form */}
                    <div className="mb-8 p-5 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10">
                      <h3 className="text-xs font-heading font-bold uppercase tracking-widest text-secondary mb-4 flex items-center gap-2">
                        <Plus size={14} className="text-[#6324FC] dark:text-[#A78BFA]" /> Provision New Team Member
                      </h3>
                      <form onSubmit={handleInviteMember} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Tariq Ahmed" 
                            required 
                            value={inviteName} 
                            onChange={(e) => setInviteName(e.target.value)} 
                            className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white text-xs font-medium transition-all shadow-xs" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                          <input 
                            type="email" 
                            placeholder="tariq@injaazh.com" 
                            required 
                            value={inviteEmail} 
                            onChange={(e) => setInviteEmail(e.target.value)} 
                            className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white text-xs font-medium transition-all shadow-xs" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Initial Password</label>
                          <input 
                            type="password" 
                            placeholder="••••••••••••" 
                            required 
                            value={invitePassword} 
                            onChange={(e) => setInvitePassword(e.target.value)} 
                            className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white text-xs font-mono transition-all shadow-xs" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Role Permission</label>
                          <select 
                            value={inviteRole} 
                            onChange={(e) => setInviteRole(e.target.value)} 
                            className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white text-xs font-heading font-bold transition-all appearance-none cursor-pointer shadow-xs"
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="marketplace_team">Marketplace Team</option>
                            <option value="viewer">Viewer (Demo / Read-Only)</option>
                          </select>
                        </div>
                        <button 
                          type="submit" 
                          disabled={isInviting} 
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white font-heading font-bold rounded-xl transition-all text-xs h-[42px] shadow-[0_0_15px_rgba(99,36,252,0.3)] disabled:opacity-50 cursor-pointer"
                        >
                          {isInviting ? 'Creating...' : '+ Create Account'}
                        </button>
                      </form>
                    </div>

                    {/* Member Directory List */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-xs uppercase tracking-widest text-secondary">Registered Team Accounts</h3>
                        <span className="text-xs text-secondary font-mono">({filteredTeamMembers.length})</span>
                      </div>
                      <div className="relative w-full sm:w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={teamSearchQuery}
                          onChange={(e) => setTeamSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#6324FC] transition-all shadow-xs"
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
                                No team members found matching your search.
                              </td>
                            </tr>
                          ) : (
                            filteredTeamMembers.map(member => {
                              const roleColor = member.role === 'owner' 
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                                : member.role === 'admin'
                                ? 'bg-[#6324FC]/10 text-[#6324FC] dark:text-[#A78BFA] border-[#6324FC]/30'
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
                                      className="px-2.5 py-1.5 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white text-xs font-heading font-bold appearance-none cursor-pointer disabled:opacity-50 shadow-2xs"
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
                                        className="p-1.5 text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
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
                {(activeTab === 'api' || activeTab === 'api_keys') && (
                  <GlassCard accentColor="#00E5FF" glowColor="rgba(0,229,255,0.18)">
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">AI Models & API Vault</h2>
                        <p className="text-xs text-secondary">Manage LLM API credentials for Gemini, OpenAI, Claude, Groq, and DeepSeek.</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
                        Multi-Provider AI
                      </span>
                    </div>
                    <AiKeysManager />
                  </GlassCard>
                )}

                {/* ── SMTP ── */}
                {activeTab === 'smtp' && (
                  <GlassCard accentColor="#6324FC" glowColor="rgba(99,36,252,0.18)">
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">SMTP Email Gateway</h2>
                        <p className="text-xs text-secondary">Configure system-wide outgoing mail servers for client receipts and notifications.</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest bg-[#6324FC]/10 text-[#6324FC] dark:text-[#A78BFA] border border-[#6324FC]/30">
                        Mail Transport
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">SMTP Host</label>
                          <input 
                            type="text" 
                            placeholder="smtp.gmail.com"
                            value={smtpSettings.host} 
                            onChange={(e) => { setSmtpSettings(prev => ({ ...prev, host: e.target.value })); triggerChange(); }} 
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl focus:border-[#6324FC] text-slate-900 dark:text-white font-mono text-xs focus:outline-none shadow-xs" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Port</label>
                          <input 
                            type="number" 
                            value={smtpSettings.port} 
                            onChange={(e) => { setSmtpSettings(prev => ({ ...prev, port: parseInt(e.target.value) || 587 })); triggerChange(); }} 
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl focus:border-[#6324FC] text-slate-900 dark:text-white font-mono text-xs focus:outline-none shadow-xs" 
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Username / Authenticated Email</label>
                          <input 
                            type="email" 
                            placeholder="billing@injaazh.com"
                            value={smtpSettings.user} 
                            onChange={(e) => { setSmtpSettings(prev => ({ ...prev, user: e.target.value })); triggerChange(); }} 
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl focus:border-[#6324FC] text-slate-900 dark:text-white font-medium text-xs focus:outline-none shadow-xs" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">App Password / Secret</label>
                          <div className="relative">
                            <input 
                              type={showSmtpPass ? 'text' : 'password'} 
                              placeholder="••••••••••••••••"
                              value={smtpSettings.pass} 
                              onChange={(e) => { setSmtpSettings(prev => ({ ...prev, pass: e.target.value })); triggerChange(); }} 
                              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl focus:border-[#6324FC] text-slate-900 dark:text-white font-mono text-xs focus:outline-none pr-10 shadow-xs" 
                            />
                            <button type="button" onClick={() => setShowSmtpPass(!showSmtpPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary cursor-pointer">
                              {showSmtpPass ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-black/10 dark:border-white/10 flex justify-between items-center">
                        <p className="text-xs font-heading font-bold text-secondary">Verify socket handshake with remote mail server.</p>
                        <button 
                          type="button" 
                          onClick={handleTestConnection} 
                          disabled={isTestingConnection} 
                          className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white font-heading font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-black/10 dark:border-white/10 cursor-pointer"
                        >
                          {isTestingConnection ? <Activity size={13} className="animate-spin" /> : <Activity size={13} />} Test Handshake
                        </button>
                      </div>

                      {testResult && (
                        <div className={`p-3.5 rounded-xl text-xs font-heading font-bold flex items-center gap-2 border ${testResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                          {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {testResult.message}
                        </div>
                      )}

                      {/* Send Live Test Email Section */}
                      <div className="pt-6 border-t border-black/10 dark:border-white/10">
                        <h3 className="font-heading font-bold text-xs uppercase tracking-widest text-secondary mb-3 flex items-center gap-2">
                          <Send size={14} className="text-[#6324FC] dark:text-[#A78BFA]" /> Transmit Test Verification Message
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input 
                            type="email" 
                            placeholder="recipient@example.com" 
                            value={testEmailAddress} 
                            onChange={(e) => setTestEmailAddress(e.target.value)} 
                            className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl focus:border-[#6324FC] text-slate-900 dark:text-white text-xs font-medium focus:outline-none shadow-xs" 
                          />
                          <button 
                            type="button" 
                            onClick={handleSendTestEmail} 
                            disabled={isSendingTestEmail || !testEmailAddress} 
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-heading font-bold text-xs bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white shadow-[0_0_15px_rgba(99,36,252,0.3)] disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
                          >
                            {isSendingTestEmail ? <Activity size={14} className="animate-spin" /> : <Send size={14} />}
                            {isSendingTestEmail ? 'Sending...' : 'Send Live Test'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* ── APPEARANCE ── */}
                {activeTab === 'appearance' && (
                  <GlassCard accentColor="#EC4899" glowColor="rgba(236,72,153,0.18)">
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Appearance & UI Framework</h2>
                        <p className="text-xs text-secondary">Customize dark/light theme dynamics, accent neon tints, and navigation style.</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest bg-pink-500/10 text-pink-500 border border-pink-500/30">
                        Design System
                      </span>
                    </div>

                    <div className="space-y-8">
                      {/* Theme Selection */}
                      <div>
                        <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">
                          Theme Preference
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                          {THEMES.map(t => (
                            <button 
                              key={t.id} 
                              onClick={() => { setTheme(t.id); triggerChange(); }} 
                              className={`relative flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl border transition-all cursor-pointer ${mounted && theme === t.id ? 'bg-[#6324FC]/10 border-[#6324FC] text-[#6324FC] dark:text-[#A78BFA] shadow-[0_0_20px_rgba(99,36,252,0.15)]' : 'bg-slate-50 dark:bg-[#060608] border-black/10 dark:border-white/10 text-secondary hover:border-[#6324FC]/50'}`}
                            >
                              <t.icon size={22} className={mounted && theme === t.id ? 'text-[#6324FC] dark:text-[#A78BFA]' : 'text-secondary'} />
                              <div className="text-center">
                                <span className={`text-xs font-heading font-bold block ${mounted && theme === t.id ? 'text-slate-900 dark:text-white' : 'text-secondary'}`}>{t.name}</span>
                                <span className="text-[10px] text-secondary font-medium">{t.desc}</span>
                              </div>
                              {mounted && theme === t.id && (
                                <div className="absolute top-3 right-3 text-[#6324FC] dark:text-[#A78BFA]">
                                  <CheckCircle2 size={16} />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Accent Color */}
                      <div>
                        <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">
                          Executive Neon Accent
                        </h3>
                        <div className="flex flex-wrap items-center gap-3.5">
                          {[
                            { id: 'violet', color: '#6324FC', name: 'Obsidian Violet' },
                            { id: 'blue', color: '#00E5FF', name: 'Cyber Ice' },
                            { id: 'emerald', color: '#10B981', name: 'Emerald' },
                            { id: 'rose', color: '#E11D48', name: 'Rose' },
                            { id: 'amber', color: '#F59E0B', name: 'Amber' }
                          ].map(c => (
                            <button 
                              key={c.id} 
                              onClick={() => { setAccentColor(c.id as any); triggerChange(); }} 
                              className={`group flex flex-col items-center gap-2 cursor-pointer`} 
                              title={c.name}
                            >
                              <div 
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${accentColor === c.id ? 'ring-2 ring-[#6324FC] dark:ring-[#00E5FF] ring-offset-2 ring-offset-white dark:ring-offset-[#0a0a0d] shadow-lg scale-105' : 'hover:scale-105'}`} 
                                style={{ backgroundColor: c.color }}
                              >
                                {accentColor === c.id && <Check size={16} className="text-white drop-shadow" />}
                              </div>
                              <span className="text-[10px] font-heading font-bold text-secondary">{c.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sidebar Layout */}
                      <div>
                        <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">
                          Navigation & Sidebar Philosophy
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                          {[
                            { id: 'expanded', label: 'Expanded (Default)', icon: PanelLeft, desc: 'Full sidebar menu with categories and text labels.' },
                            { id: 'collapsed', label: 'Collapsed Sidebar', icon: PanelLeftClose, desc: 'Compact vertical icons only to maximize screen estate.' },
                            { id: 'dock', label: 'Floating Bottom Dock', icon: PanelBottom, desc: 'macOS inspired floating physics dock with micro-zoom.' }
                          ].map(l => (
                            <button 
                              key={l.id} 
                              onClick={() => { setSidebarLayout(l.id as any); triggerChange(); }} 
                              className={`flex items-start text-left gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${sidebarLayout === l.id ? 'bg-[#6324FC]/10 border-[#6324FC] shadow-[0_0_20px_rgba(99,36,252,0.15)]' : 'bg-slate-50 dark:bg-[#060608] border-black/10 dark:border-white/10 hover:border-[#6324FC]/50'}`}
                            >
                              <div className={`mt-0.5 ${sidebarLayout === l.id ? 'text-[#6324FC] dark:text-[#A78BFA]' : 'text-secondary'}`}>
                                <l.icon size={20} />
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
                  <GlassCard accentColor="#64748B" glowColor="rgba(100,116,139,0.18)">
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-6 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                      <div>
                        <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Audit & Compliance Trail</h2>
                        <p className="text-xs text-secondary">Immutable ledger recording administrative events, mutations, and telemetry.</p>
                      </div>
                      <div className="flex gap-2.5">
                        <button 
                          onClick={handleRefreshLogs} 
                          disabled={isRefreshingLogs} 
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0a0a0d] hover:bg-slate-100 dark:hover:bg-white/5 text-slate-900 dark:text-white text-xs font-heading font-bold transition-all border border-black/10 dark:border-white/10 disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          <RefreshCcw size={13} className={isRefreshingLogs ? 'animate-spin' : ''} /> Refresh Ledger
                        </button>
                        <button 
                          onClick={() => {
                            toast.success('Exporting audit trail to CSV...');
                            if (masterSound) playSound('pop');
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#6324FC]/10 hover:bg-[#6324FC]/20 text-[#6324FC] dark:text-[#A78BFA] border border-[#6324FC]/30 text-xs font-heading font-bold transition-all cursor-pointer shadow-xs"
                        >
                          <Download size={13} /> Export CSV
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10 bg-slate-50/50 dark:bg-[#060608]/50">
                      <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                        <thead>
                          <tr className="border-b border-black/5 dark:border-white/5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest bg-slate-50 dark:bg-[#060608]">
                            <th className="py-3 px-5">User / System Agent</th>
                            <th className="py-3 px-5">Event Action</th>
                            <th className="py-3 px-5">Origin IP</th>
                            <th className="py-3 px-5">Timestamp</th>
                            <th className="py-3 px-5 text-right">Result Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.map(log => (
                            <tr key={log.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                              <td className="py-3.5 px-5 flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 flex items-center justify-center shadow-xs">
                                  <User size={13} className="text-secondary" />
                                </div>
                                <span className="font-heading font-bold text-slate-900 dark:text-white">{log.user}</span>
                              </td>
                              <td className="py-3.5 px-5 text-xs text-slate-700 dark:text-slate-300 font-medium">{log.action}</td>
                              <td className="py-3.5 px-5 text-[11px] text-secondary font-mono">{log.ip}</td>
                              <td className="py-3.5 px-5 text-[11px] text-secondary font-medium">{log.time}</td>
                              <td className="py-3.5 px-5 text-right">
                                {log.status === 'success' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 text-[10px] font-bold uppercase tracking-wider"><CheckCircle2 size={12} /> Success</span>}
                                {log.status === 'warning' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 text-[10px] font-bold uppercase tracking-wider"><AlertTriangle size={12} /> Warning</span>}
                                {log.status === 'danger' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-bold uppercase tracking-wider"><AlertTriangle size={12} /> Failed</span>}
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
                  <GlassCard accentColor="#8B5CF6" glowColor="rgba(139,92,246,0.18)">
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Connected Applications & APIs</h2>
                        <p className="text-xs text-secondary">Seamlessly connect Injaazh ERP with external communication, payment, and git services.</p>
                      </div>
                      <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white text-xs font-heading font-bold transition-all border border-black/10 dark:border-white/10 cursor-pointer shadow-xs">
                        <ExternalLink size={14} /> App Store
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {integrations.map(app => (
                        <div key={app.id} className="flex flex-col p-5 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 hover:border-[#6324FC]/40 transition-all group relative overflow-hidden">
                          {app.connected && <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ backgroundColor: `${app.color}25` }} />}
                          <div className="flex justify-between items-start mb-3 relative z-10">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs" style={{ backgroundColor: `${app.color}15`, color: app.color, border: `1px solid ${app.color}30` }}>
                              <app.icon size={20} />
                            </div>
                            {app.connected ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-heading font-bold uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-white/5 text-secondary text-[10px] font-heading font-bold uppercase tracking-wider">
                                Not Connected
                              </span>
                            )}
                          </div>
                          <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white mb-0.5 relative z-10">{app.name}</h3>
                          <p className="text-[11px] text-secondary font-medium leading-relaxed mb-4 flex-1 relative z-10">{app.description}</p>
                          <div className="pt-3 border-t border-black/5 dark:border-white/5 flex justify-between items-center relative z-10">
                            {app.connected ? (
                              <>
                                <button className="text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">Configure Scope</button>
                                <button onClick={() => { toast.success(`${app.name} disconnected`); if(masterSound) playSound('pop'); toggleIntegration(app.id); }} className="text-xs font-heading font-bold text-rose-500 hover:text-rose-400 transition-colors cursor-pointer">Disconnect</button>
                              </>
                            ) : (
                              <button onClick={() => { toast.success(`${app.name} connected successfully!`); if(masterSound) playSound('success'); toggleIntegration(app.id); }} className="w-full py-2 bg-[#6324FC]/10 hover:bg-[#6324FC]/20 text-[#6324FC] dark:text-[#A78BFA] border border-[#6324FC]/25 rounded-xl text-xs font-heading font-bold transition-all shadow-xs cursor-pointer">
                                Connect Application
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
                  <GlassCard accentColor="#3B82F6" glowColor="rgba(59,130,246,0.18)">
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                      <div>
                        <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Database Snapshot & Resilience</h2>
                        <p className="text-xs text-secondary">Manage automated daily cold backups or execute point-in-time manual snapshots.</p>
                      </div>
                      <button 
                        onClick={handleCreateBackup} 
                        disabled={isBackingUp} 
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white text-xs font-heading font-bold transition-all shadow-[0_0_20px_rgba(99,36,252,0.3)] disabled:opacity-70 cursor-pointer"
                      >
                        {isBackingUp ? <Activity size={14} className="animate-spin" /> : <Database size={14} />}
                        {isBackingUp ? 'Creating Snapshot...' : 'Create Snapshot Now'}
                      </button>
                    </div>

                    {isBackingUp && (
                      <div className="mb-6 p-5 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-[#6324FC]/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#6324FC]/10 to-transparent animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }}></div>
                        <div className="relative z-10 flex flex-col items-center justify-center py-2">
                          <Database size={28} className="text-[#6324FC] dark:text-[#A78BFA] animate-pulse mb-3" />
                          <h4 className="font-heading font-bold text-xs text-slate-900 dark:text-white mb-0.5">Generating Database Snapshot</h4>
                          <p className="text-[11px] text-secondary">Compressing MongoDB leads, deals, daily expenses, and configurations...</p>
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
                      <h3 className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest pl-1">Preserved System Backups</h3>
                      {backups.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-2xl">
                          <FileArchive size={28} className="text-secondary mx-auto mb-2 opacity-50" />
                          <h4 className="text-xs font-heading font-bold text-slate-900 dark:text-white mb-0.5">No snapshots found</h4>
                          <p className="text-[11px] text-secondary">Create a manual snapshot to establish an initial disaster-recovery point.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2.5">
                          {backups.map(backup => (
                            <div key={backup.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 hover:border-[#6324FC]/30 transition-all group">
                              <div className="flex items-center gap-3.5 mb-3 md:mb-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${backup.type === 'Manual' ? 'bg-[#6324FC]/10 text-[#6324FC] dark:text-[#A78BFA] border border-[#6324FC]/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                  <FileArchive size={18} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <h4 className="text-xs font-heading font-bold text-slate-900 dark:text-white">{backup.date}</h4>
                                    <span className="text-[9px] font-heading font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white dark:bg-[#0a0a0d] text-secondary border border-black/10 dark:border-white/10">{backup.type}</span>
                                  </div>
                                  <p className="text-[11px] text-secondary flex items-center gap-1.5 font-mono">
                                    <HardDrive size={11} /> {backup.size} • 
                                    <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={11} /> {backup.status}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#0a0a0d] hover:bg-slate-100 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs">
                                  <Download size={13} /> Download
                                </button>
                                <button onClick={() => { toast.success('Restore sequence initiated!'); if(masterSound) playSound('pop'); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6324FC]/10 hover:bg-[#6324FC]/20 border border-[#6324FC]/25 rounded-xl text-xs font-heading font-bold text-[#6324FC] dark:text-[#A78BFA] transition-all cursor-pointer shadow-2xs">
                                  <RotateCcw size={13} /> Restore
                                </button>
                                <button onClick={() => handleDeleteBackup(backup.id)} className="p-1.5 text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all ml-1 cursor-pointer">
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
                  <GlassCard accentColor="#8B5CF6" glowColor="rgba(139,92,246,0.18)">
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Security Roles & Permissions</h2>
                        <p className="text-xs text-secondary">Define granular operational scope across CRM, Finance, Marketplace, and System Settings.</p>
                      </div>
                      <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#6324FC]/10 hover:bg-[#6324FC]/20 text-[#6324FC] dark:text-[#A78BFA] border border-[#6324FC]/30 text-xs font-heading font-bold transition-all cursor-pointer shadow-xs">
                        <Plus size={14} /> Add Custom Role
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
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-1.5 cursor-pointer ${
                              selectedRole === role.id 
                                ? 'bg-[#6324FC]/10 border-[#6324FC]/50 shadow-[0_0_15px_rgba(99,36,252,0.12)]' 
                                : 'bg-slate-50 dark:bg-[#060608] border-black/10 dark:border-white/10 hover:border-[#6324FC]/30'
                            }`}
                          >
                            <div className="flex justify-between items-start w-full">
                              <span className={`font-heading font-bold text-xs ${selectedRole === role.id ? 'text-[#6324FC] dark:text-[#A78BFA]' : 'text-slate-900 dark:text-white'}`}>{role.name}</span>
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
                      <div className="flex-1 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ShieldCheck size={16} className="text-[#6324FC] dark:text-[#A78BFA]" />
                            {rolesWithCounts.find(r => r.id === selectedRole)?.name || 'Role'} Permissions Matrix
                          </h3>
                          {selectedRole === 'owner' && <span className="text-[10px] text-amber-500 font-heading font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">Owner Full Bypass</span>}
                        </div>

                        <div className="space-y-6">
                          {PERMISSIONS.map(category => (
                            <div key={category.category}>
                              <h4 className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-3 pb-2 border-b border-black/5 dark:border-white/5">{category.category}</h4>
                              <div className="space-y-2">
                                {category.items.map(perm => {
                                  const isChecked = rolePerms[selectedRole]?.includes(perm.id) || false;
                                  const isDisabled = selectedRole === 'owner';
                                  
                                  return (
                                    <label key={perm.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${!isDisabled && 'cursor-pointer'} ${isChecked ? 'bg-white dark:bg-[#0a0a0d] border-[#6324FC]/30 shadow-2xs' : 'bg-transparent border-transparent hover:bg-white dark:bg-[#0a0a0d]'}`}>
                                      <span className={`text-xs font-heading font-bold ${isChecked ? 'text-slate-900 dark:text-white' : 'text-secondary'}`}>{perm.label}</span>
                                      <div className="relative">
                                        <input type="checkbox" className="sr-only" checked={isChecked} disabled={isDisabled} onChange={() => togglePermission(selectedRole, perm.id)} />
                                        <div className={`block w-9 h-5 rounded-full transition-colors ${isDisabled ? 'opacity-50' : ''} ${isChecked ? 'bg-[#6324FC] shadow-[0_0_10px_rgba(99,36,252,0.5)]' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                                        <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${isChecked ? 'transform translate-x-4' : ''}`}></div>
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
                  <GlassCard accentColor="#F59E0B" glowColor="rgba(245,158,11,0.18)">
                    <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-heading font-bold mb-1 text-slate-900 dark:text-white">Enterprise Subscription & Usage</h2>
                        <p className="text-xs text-secondary">Manage license seats, enterprise limits, payment gateways, and invoice billing.</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/30">
                        Active License
                      </span>
                    </div>
                    
                    <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 dark:bg-[#060608] border border-[#6324FC]/30 relative overflow-hidden mb-8 shadow-xl">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-[#6324FC]/15 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                      <div className="relative z-10">
                        <span className="px-3 py-1 bg-[#6324FC]/20 text-[#6324FC] dark:text-[#A78BFA] border border-[#6324FC]/30 rounded-full text-[10px] font-heading font-extrabold uppercase tracking-widest mb-4 inline-block">Enterprise Tier</span>
                        <h3 className="text-2xl font-heading font-extrabold text-white mb-1">Injaazh ERP Professional</h3>
                        <p className="text-xs font-medium text-slate-400 mb-6 font-mono">$99.00 / month • Next billing cycle renews on Aug 1, 2026</p>
                        <div className="flex flex-wrap gap-3">
                          <button className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 font-heading font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer">
                            Manage Stripe Subscription
                          </button>
                          <button className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-heading font-bold text-xs rounded-xl transition-all border border-white/20 cursor-pointer">
                            Download Past Invoices
                          </button>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* ── DANGER ZONE ── */}
                {activeTab === 'danger' && (
                  <GlassCard accentColor="#F43F5E" glowColor="rgba(244,63,94,0.18)" className="border-rose-500/20">
                    <div className="border-b border-rose-500/20 pb-6 mb-8 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-heading font-bold text-rose-500 mb-1 flex items-center gap-2">
                          <AlertTriangle size={20} /> Danger Zone
                        </h2>
                        <p className="text-xs text-rose-500/80">Permanent and destructive administrative actions that cannot be reversed.</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/30">
                        Critical Warning
                      </span>
                    </div>

                    <div className="p-6 rounded-2xl bg-rose-500/[0.03] dark:bg-rose-950/10 border border-rose-500/30 space-y-4">
                      <div>
                        <h4 className="font-heading font-bold text-rose-500 mb-1 text-sm">Factory Reset Entire Database</h4>
                        <p className="text-xs text-rose-500/80 leading-relaxed">
                          Permanently delete all projects, marketplace records, transactions, audit logs, and team members. 
                          The system will return to clean initial setup. This cannot be undone.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <input 
                          type="text" 
                          value={dangerConfirm} 
                          onChange={(e) => setDangerConfirm(e.target.value)} 
                          placeholder="Type CONFIRM to authorize" 
                          className="flex-1 px-3.5 py-2.5 bg-white dark:bg-[#0a0a0d] border border-rose-500/30 rounded-xl focus:outline-none focus:border-rose-500 text-rose-500 font-mono font-bold text-xs placeholder:text-rose-900/40 shadow-xs" 
                        />
                        <button 
                          disabled={dangerConfirm !== 'CONFIRM'} 
                          onClick={async () => { 
                            if(masterSound) playSound('error'); 
                            toast.loading('Executing database factory reset...', { id: 'reset' });
                            const { factoryResetDatabase } = await import('@/app/actions/databaseActions');
                            const res = await factoryResetDatabase();
                            if (res.success) {
                              toast.success('Database factory reset executed successfully!', { id: 'reset' });
                            } else {
                              toast.error(res.error || 'Failed to reset', { id: 'reset' });
                            }
                            setDangerConfirm(''); 
                          }} 
                          className={`px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-heading font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)] whitespace-nowrap ${dangerConfirm === 'CONFIRM' ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                        >
                          Execute Factory Reset
                        </button>
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
              
              {/* System Health Card */}
              <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#10B981]" />
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 blur-[25px] rounded-full pointer-events-none" />

                <h4 className="flex items-center gap-2 text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4 relative z-10">
                  <Activity size={14} className="text-emerald-500" /> System Telemetry
                </h4>
                <div className="space-y-3 text-xs font-medium relative z-10">
                  <div className="flex justify-between items-center text-secondary">
                    <span>Injaazh Core</span> 
                    <span className="font-heading font-bold text-slate-900 dark:text-white font-mono">v2.5.0-exec</span>
                  </div>
                  <div className="flex justify-between items-center text-secondary">
                    <span>Database</span> 
                    <span className="text-emerald-500 font-heading font-bold flex items-center gap-1.5 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> MongoDB Atlas
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-secondary">
                    <span>Telemetry Clock</span> 
                    <span className="text-slate-900 dark:text-white font-mono text-[11px]">{systemTime}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Contextual Tip Card */}
              <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#6324FC]" />
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#6324FC]/10 blur-[25px] rounded-full pointer-events-none" />

                <h4 className="flex items-center gap-2 text-xs font-heading font-bold text-[#6324FC] dark:text-[#A78BFA] uppercase tracking-widest mb-2 relative z-10">
                  <Lightbulb size={14} /> {CONTEXTUAL_TIPS[activeTab]?.title || 'System Guide'}
                </h4>
                <p className="text-[11px] font-medium text-secondary leading-relaxed relative z-10">
                  {CONTEXTUAL_TIPS[activeTab]?.tip || 'Manage system preferences, enterprise accounts, and operational safeguards.'}
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
