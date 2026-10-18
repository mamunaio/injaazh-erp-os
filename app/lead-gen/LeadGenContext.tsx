'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notify } from '@/lib/notify';
import {
  DatabaseState,
  Prospect,
  ProspectStatus,
  ReplyTag,
  DailyLog,
  Client,
  TimeLog,
  TeamTask,
  DeliveryItem,
  Invoice,
  Expense,
  SystemSettings,
} from '@/types/leadGen';

interface LeadGenContextType {
  data: DatabaseState | null;
  loading: boolean;
  refreshing: boolean;
  fetchState: (isSilent?: boolean) => Promise<void>;

  // Modals state
  isLeadModalOpen: boolean;
  editingProspect: Prospect | null;
  openNewLead: () => void;
  openEditLead: (prospect: Prospect) => void;
  closeLeadModal: () => void;
  handleSaveLead: (formData: Partial<Prospect>) => Promise<void>;

  isImportModalOpen: boolean;
  openImportModal: () => void;
  closeImportModal: () => void;

  // CRUD Handlers
  handleDeleteProspect: (id: string) => Promise<void>;
  handleUpdateStatus: (id: string, newStatus: ProspectStatus) => Promise<void>;
  handleUpdateReplyTag: (id: string, newTag: ReplyTag) => Promise<void>;

  handleAddDailyLog: (logData: Omit<DailyLog, 'id'>) => Promise<void>;
  handleUpdateDailyLog: (id: string, patch: Partial<DailyLog>) => Promise<void>;
  handleDeleteDailyLog: (id: string) => Promise<void>;

  handleAddClient: (clientData: Omit<Client, 'id'>) => Promise<void>;
  handleUpdateClient: (id: string, patch: Partial<Client>) => Promise<void>;
  handleDeleteClient: (id: string) => Promise<void>;

  handleAddTimeLog: (logData: Omit<TimeLog, 'id'>) => Promise<void>;
  handleUpdateTimeLog: (id: string, patch: Partial<TimeLog>) => Promise<void>;
  handleDeleteTimeLog: (id: string) => Promise<void>;

  handleAddTask: (taskData: Omit<TeamTask, 'id'>) => Promise<void>;
  handleUpdateTask: (id: string, patch: Partial<TeamTask>) => Promise<void>;
  handleDeleteTask: (id: string) => Promise<void>;

  handleAddDeliveryItem: (itemData: Omit<DeliveryItem, 'id'>) => Promise<void>;
  handleUpdateDeliveryItem: (id: string, patch: Partial<DeliveryItem>) => Promise<void>;
  handleDeleteDeliveryItem: (id: string) => Promise<void>;

  handleAddInvoice: (invData: Omit<Invoice, 'id'>) => Promise<void>;
  handleUpdateInvoice: (id: string, patch: Partial<Invoice>) => Promise<void>;
  handleDeleteInvoice: (id: string) => Promise<void>;

  handleAddExpense: (expData: Omit<Expense, 'id'>) => Promise<void>;
  handleUpdateExpense: (id: string, patch: Partial<Expense>) => Promise<void>;
  handleDeleteExpense: (id: string) => Promise<void>;

  handleUpdateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  handleExportExcel: () => void;
  handleResetDatabase: () => Promise<void>;
}

const LeadGenContext = createContext<LeadGenContextType | null>(null);

export function LeadGenProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DatabaseState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fetchState = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch('/api/lead-gen/full-state');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load lead gen state:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Lead Modal Handlers
  const openNewLead = () => {
    setEditingProspect(null);
    setIsLeadModalOpen(true);
  };

  const openEditLead = (prospect: Prospect) => {
    setEditingProspect(prospect);
    setIsLeadModalOpen(true);
  };

  const closeLeadModal = () => {
    setIsLeadModalOpen(false);
    setEditingProspect(null);
  };

  const handleSaveLead = async (formData: Partial<Prospect>) => {
    setIsLeadModalOpen(false);
    if (editingProspect) {
      notify.edit('Prospect updated successfully');
      const res = await fetch(`/api/lead-gen/prospects/${editingProspect.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const updated = await res.json();
        setData((prev) =>
          prev
            ? {
                ...prev,
                prospects: prev.prospects.map((p) => (p.id === updated.id ? updated : p)),
              }
            : null
        );
      }
    } else {
      // 🚀 0ms Instant Feedback
      notify.instant({
        type: 'lead',
        sound: 'edit',
        message: `New prospect added: ${formData.company || 'HVAC Lead'}`,
        link: '/lead-gen/prospects'
      });

      const res = await fetch('/api/lead-gen/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const created = await res.json();
        setData((prev) =>
          prev
            ? {
                ...prev,
                prospects: [created, ...prev.prospects],
              }
            : null
        );
      }
    }
  };

  const handleDeleteProspect = async (id: string) => {
    notify.delete('Prospect deleted');
    setData((prev) =>
      prev
        ? {
            ...prev,
            prospects: prev.prospects.filter((p) => p.id !== id),
          }
        : null
    );

    await fetch(`/api/lead-gen/prospects/${id}`, {
      method: 'DELETE',
    });
  };

  const handleUpdateStatus = async (id: string, newStatus: ProspectStatus) => {
    // 1. Optimistic instant state update
    setData((prev) =>
      prev
        ? {
            ...prev,
            prospects: prev.prospects.map((p) => (p.id === id ? { ...p, status: newStatus } : p)),
          }
        : null
    );

    // 2. Instant 0ms sound & notification
    if (newStatus === 'Won') {
      const p = data?.prospects.find(x => x.id === id);
      notify.instant({
        type: 'payment',
        sound: 'income',
        message: `🎉 Deal Closed! ${p?.company || 'Prospect'} marked as Won!`,
        link: '/lead-gen/clients'
      });
    } else {
      notify.edit(`Status changed to ${newStatus}`);
    }

    // 3. Background server update
    await fetch(`/api/lead-gen/prospects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
  };

  const handleUpdateReplyTag = async (id: string, newTag: ReplyTag) => {
    notify.edit(`Tag updated: ${newTag}`);
    setData((prev) =>
      prev
        ? {
            ...prev,
            prospects: prev.prospects.map((p) => (p.id === id ? { ...p, replyTag: newTag } : p)),
          }
        : null
    );

    await fetch(`/api/lead-gen/prospects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ replyTag: newTag }),
    });
  };

  // Daily Log Handlers
  const handleAddDailyLog = async (logData: Omit<DailyLog, 'id'>) => {
    notify.success('Daily outreach activity logged');
    const res = await fetch('/api/lead-gen/daily-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    });
    if (res.ok) {
      const created = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              dailyLogs: [created, ...prev.dailyLogs],
            }
          : null
      );
    }
  };

  const handleUpdateDailyLog = async (id: string, patch: Partial<DailyLog>) => {
    notify.edit('Daily outreach log updated');
    setData((prev) =>
      prev
        ? {
            ...prev,
            dailyLogs: prev.dailyLogs.map((d) => (d.id === id ? { ...d, ...patch } : d)),
          }
        : null
    );
    await fetch(`/api/lead-gen/daily-log/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  };

  const handleDeleteDailyLog = async (id: string) => {
    notify.delete('Daily outreach log deleted');
    setData((prev) =>
      prev
        ? {
            ...prev,
            dailyLogs: prev.dailyLogs.filter((d) => d.id !== id),
          }
        : null
    );
    await fetch(`/api/lead-gen/daily-log/${id}`, {
      method: 'DELETE',
    });
  };

  // Client Handlers
  const handleAddClient = async (clientData: Omit<Client, 'id'>) => {
    notify.instant({
      type: 'lead',
      sound: 'success',
      message: `New client onboarded: ${clientData.name} ($${clientData.monthlyRetainer || 0}/mo)`,
      link: '/lead-gen/clients'
    });

    const res = await fetch('/api/lead-gen/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData),
    });
    if (res.ok) {
      const created = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              clients: [created, ...prev.clients],
            }
          : null
      );
    }
  };

  const handleUpdateClient = async (id: string, patch: Partial<Client>) => {
    notify.edit('Client details updated');
    setData((prev) =>
      prev
        ? {
            ...prev,
            clients: prev.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          }
        : null
    );

    await fetch(`/api/lead-gen/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  };

  const handleDeleteClient = async (id: string) => {
    notify.delete('Client removed');
    setData((prev) =>
      prev
        ? {
            ...prev,
            clients: prev.clients.filter((c) => c.id !== id),
          }
        : null
    );
    await fetch(`/api/lead-gen/clients/${id}`, {
      method: 'DELETE',
    });
  };

  // Time Log Handlers
  const handleAddTimeLog = async (logData: Omit<TimeLog, 'id'>) => {
    notify.success('Time log entry recorded');
    const res = await fetch('/api/lead-gen/time-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    });
    if (res.ok) {
      const created = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              timeLogs: [created, ...prev.timeLogs],
            }
          : null
      );
    }
  };

  const handleUpdateTimeLog = async (id: string, patch: Partial<TimeLog>) => {
    notify.edit('Time log entry updated');
    setData((prev) =>
      prev
        ? {
            ...prev,
            timeLogs: prev.timeLogs.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          }
        : null
    );
    await fetch(`/api/lead-gen/time-log/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  };

  const handleDeleteTimeLog = async (id: string) => {
    notify.delete('Time log entry deleted');
    setData((prev) =>
      prev
        ? {
            ...prev,
            timeLogs: prev.timeLogs.filter((t) => t.id !== id),
          }
        : null
    );
    await fetch(`/api/lead-gen/time-log/${id}`, {
      method: 'DELETE',
    });
  };

  // Team Task Handlers
  const handleAddTask = async (taskData: Omit<TeamTask, 'id'>) => {
    notify.success('New team task created');
    const res = await fetch('/api/lead-gen/team-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    if (res.ok) {
      const created = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              teamTasks: [created, ...prev.teamTasks],
            }
          : null
      );
    }
  };

  const handleUpdateTask = async (id: string, patch: Partial<TeamTask>) => {
    notify.edit('Task status updated');
    setData((prev) =>
      prev
        ? {
            ...prev,
            teamTasks: prev.teamTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          }
        : null
    );

    await fetch(`/api/lead-gen/team-tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  };

  const handleDeleteTask = async (id: string) => {
    notify.delete('Task removed');
    setData((prev) =>
      prev
        ? {
            ...prev,
            teamTasks: prev.teamTasks.filter((t) => t.id !== id),
          }
        : null
    );
    await fetch(`/api/lead-gen/team-tasks/${id}`, {
      method: 'DELETE',
    });
  };

  // Delivery Calendar Handlers
  const handleAddDeliveryItem = async (itemData: Omit<DeliveryItem, 'id'>) => {
    notify.success('Delivery milestone added');
    const res = await fetch('/api/lead-gen/delivery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    if (res.ok) {
      const created = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              deliveryCalendar: [created, ...prev.deliveryCalendar],
            }
          : null
      );
    }
  };

  const handleUpdateDeliveryItem = async (id: string, patch: Partial<DeliveryItem>) => {
    notify.edit('Milestone updated');
    setData((prev) =>
      prev
        ? {
            ...prev,
            deliveryCalendar: prev.deliveryCalendar.map((d) => (d.id === id ? { ...d, ...patch } : d)),
          }
        : null
    );

    await fetch(`/api/lead-gen/delivery/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  };

  const handleDeleteDeliveryItem = async (id: string) => {
    notify.delete('Deliverable removed');
    setData((prev) =>
      prev
        ? {
            ...prev,
            deliveryCalendar: prev.deliveryCalendar.filter((d) => d.id !== id),
          }
        : null
    );
    await fetch(`/api/lead-gen/delivery/${id}`, {
      method: 'DELETE',
    });
  };

  // Financials Handlers
  const handleAddInvoice = async (invData: Omit<Invoice, 'id'>) => {
    // 🚀 0ms Instant Feedback
    notify.instant({
      type: 'payment',
      sound: 'income',
      message: `Invoice generated: #${invData.invoiceNumber || 'INV'} for $${invData.amount || 0}`,
      link: '/lead-gen/financials'
    });

    const res = await fetch('/api/lead-gen/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invData),
    });
    if (res.ok) {
      const created = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              invoices: [created, ...prev.invoices],
            }
          : null
      );
    }
  };

  const handleUpdateInvoice = async (id: string, patch: Partial<Invoice>) => {
    notify.income('Invoice updated');
    setData((prev) =>
      prev
        ? {
            ...prev,
            invoices: prev.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)),
          }
        : null
    );

    await fetch(`/api/lead-gen/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  };

  const handleDeleteInvoice = async (id: string) => {
    notify.delete('Invoice removed');
    setData((prev) =>
      prev
        ? {
            ...prev,
            invoices: prev.invoices.filter((i) => i.id !== id),
          }
        : null
    );
    await fetch(`/api/lead-gen/invoices/${id}`, {
      method: 'DELETE',
    });
  };

  const handleAddExpense = async (expData: Omit<Expense, 'id'>) => {
    // 🚀 0ms Instant Feedback
    notify.instant({
      type: 'system',
      sound: 'expense',
      message: `Expense of $${expData.amount} recorded under ${expData.category}`,
      link: '/lead-gen/financials'
    });

    const res = await fetch('/api/lead-gen/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expData),
    });
    if (res.ok) {
      const created = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              expenses: [created, ...prev.expenses],
            }
          : null
      );
    }
  };

  const handleUpdateExpense = async (id: string, patch: Partial<Expense>) => {
    notify.edit('Expense updated');
    setData((prev) =>
      prev
        ? {
            ...prev,
            expenses: prev.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          }
        : null
    );
    await fetch(`/api/lead-gen/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  };

  const handleDeleteExpense = async (id: string) => {
    notify.delete('Expense entry deleted');
    setData((prev) =>
      prev
        ? {
            ...prev,
            expenses: prev.expenses.filter((e) => e.id !== id),
          }
        : null
    );
    await fetch(`/api/lead-gen/expenses/${id}`, {
      method: 'DELETE',
    });
  };

  // Settings Handlers
  const handleUpdateSettings = async (newSettings: Partial<SystemSettings>) => {
    const res = await fetch('/api/lead-gen/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    if (res.ok) {
      const updated = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              settings: updated,
            }
          : null
      );
      notify.success('Settings updated');
    }
  };

  const handleExportExcel = () => {
    window.location.href = '/api/lead-gen/export-excel';
  };

  const handleResetDatabase = async () => {
    const res = await fetch('/api/lead-gen/seed', { method: 'POST' });
    if (res.ok) {
      fetchState(true);
      notify.delete('Database reset to defaults');
      notify.triggerRefresh();
    }
  };

  const openImportModal = () => setIsImportModalOpen(true);
  const closeImportModal = () => setIsImportModalOpen(false);

  return (
    <LeadGenContext.Provider
      value={{
        data,
        loading,
        refreshing,
        fetchState,
        isLeadModalOpen,
        editingProspect,
        openNewLead,
        openEditLead,
        closeLeadModal,
        handleSaveLead,
        isImportModalOpen,
        openImportModal,
        closeImportModal,
        handleDeleteProspect,
        handleUpdateStatus,
        handleUpdateReplyTag,
        handleAddDailyLog,
        handleUpdateDailyLog,
        handleDeleteDailyLog,
        handleAddClient,
        handleUpdateClient,
        handleDeleteClient,
        handleAddTimeLog,
        handleUpdateTimeLog,
        handleDeleteTimeLog,
        handleAddTask,
        handleUpdateTask,
        handleDeleteTask,
        handleAddDeliveryItem,
        handleUpdateDeliveryItem,
        handleDeleteDeliveryItem,
        handleAddInvoice,
        handleUpdateInvoice,
        handleDeleteInvoice,
        handleAddExpense,
        handleUpdateExpense,
        handleDeleteExpense,
        handleUpdateSettings,
        handleExportExcel,
        handleResetDatabase,
      }}
    >
      {children}
    </LeadGenContext.Provider>
  );
}

export function useLeadGen() {
  const context = useContext(LeadGenContext);
  if (!context) {
    throw new Error('useLeadGen must be used within a LeadGenProvider');
  }
  return context;
}
