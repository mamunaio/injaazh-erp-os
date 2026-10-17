'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  PlusCircle,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Edit2,
  Check,
  Building,
} from 'lucide-react';
import { Client, SystemSettings, TimeLog } from '@/types/leadGen';

interface ClientsViewProps {
  clients: Client[];
  timeLogs: TimeLog[];
  settings: SystemSettings;
  onAddClient: (client: Omit<Client, 'id'>) => Promise<void>;
  onUpdateClient: (id: string, client: Partial<Client>) => Promise<void>;
}

export default function ClientsView({
  clients,
  timeLogs,
  settings,
  onAddClient,
  onUpdateClient,
}: ClientsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Add client form state
  const [formName, setFormName] = useState('');
  const [formRetainer, setFormRetainer] = useState(1000);
  const [formServices, setFormServices] = useState('GBP Optimization, Local City Pages, Monthly AI Visibility Report');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<'Active' | 'Paused' | 'Churned'>('Active');
  const [formNotes, setFormNotes] = useState('');

  const hourlyFloor = settings.hourlyFloorRate || 25;
  const activeClients = clients.filter((c) => c.status === 'Active');
  const currentMrr = activeClients.reduce((acc, c) => acc + (Number(c.monthlyRetainer) || 0), 0);
  const avgRetainer = activeClients.length > 0 ? currentMrr / activeClients.length : 0;

  // Calculate actual hours logged for each client
  const getClientHours = (clientName: string, fallbackHours?: number) => {
    const logged = timeLogs
      .filter((t) => t.client.toLowerCase() === clientName.toLowerCase())
      .reduce((acc, t) => acc + (Number(t.hours) || 0), 0);
    return logged > 0 ? logged : fallbackHours || 0;
  };

  const totalActiveHours = activeClients.reduce(
    (acc, c) => acc + getClientHours(c.name, c.hoursReportMonth),
    0
  );
  const blendedHourly = totalActiveHours > 0 ? currentMrr / totalActiveHours : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      await onUpdateClient(editingClient.id, {
        name: formName,
        monthlyRetainer: Number(formRetainer),
        services: formServices,
        startDate: formStartDate,
        status: formStatus,
        notes: formNotes,
      });
      setEditingClient(null);
    } else {
      await onAddClient({
        name: formName,
        monthlyRetainer: Number(formRetainer),
        services: formServices,
        startDate: formStartDate,
        status: formStatus,
        notes: formNotes,
        hoursReportMonth: 0,
      });
      setShowAddModal(false);
    }
    // Reset
    setFormName('');
    setFormRetainer(1000);
    setFormServices('GBP Optimization, Local City Pages, Monthly AI Visibility Report');
    setFormNotes('');
  };

  const handleStartEdit = (c: Client) => {
    setEditingClient(c);
    setFormName(c.name);
    setFormRetainer(c.monthlyRetainer);
    setFormServices(c.services);
    setFormStartDate(c.startDate);
    setFormStatus(c.status === 'Example' ? 'Active' : c.status);
    setFormNotes(c.notes || '');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 lg:p-7 backdrop-blur-xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <Briefcase className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Clients &amp; MRR Retainers</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track active client retainers, services, fulfilled hours, and enforce hourly rate yields (&ge;${hourlyFloor}/hr).
          </p>
        </div>

        <button
          onClick={() => {
            setEditingClient(null);
            setFormName('');
            setFormRetainer(1000);
            setShowAddModal(true);
          }}
          className="flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Current MRR */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Current MRR</span>
            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">${currentMrr.toLocaleString()}/mo</p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">{activeClients.length} Active Paying Retainers</span>
        </div>

        {/* Average Retainer */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Average Retainer</span>
            <TrendingUp className="h-5 w-5 text-[#6324FC] dark:text-[#00E5FF]" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            ${Math.round(avgRetainer).toLocaleString()}/mo
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Average fee per client</span>
        </div>

        {/* Total Hours this Month */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Active Client Hours</span>
            <Clock className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{totalActiveHours.toFixed(1)} hrs</p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Auto-calculated from Time Log</span>
        </div>

        {/* Blended $/hour */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Blended $/Hour Yield</span>
            <CheckCircle2 className="h-5 w-5 text-teal-500" />
          </div>
          <p
            className={`text-3xl font-black mt-2 ${
              blendedHourly >= hourlyFloor ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            ${blendedHourly.toFixed(1)}/hr
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            Hourly Floor Safety Limit: ${hourlyFloor}/hr
          </span>
        </div>
      </div>

      {/* Clients Table */}
      <div className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c0d14]/80 shadow-sm backdrop-blur-xl">
        <div className="border-b border-slate-200 dark:border-white/10 px-5 py-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Client Directory &amp; Hourly Rate Yield Analysis
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-4 pl-5 pr-3">Client Name</th>
                <th className="px-3 py-4">Start Date</th>
                <th className="px-3 py-4">Monthly Retainer ($)</th>
                <th className="px-3 py-4">Contracted Services</th>
                <th className="px-3 py-4">Hours Fulfilled</th>
                <th className="px-3 py-4">Effective Yield ($/hr)</th>
                <th className="px-3 py-4">Floor Check</th>
                <th className="px-3 py-4">Status</th>
                <th className="py-4 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {clients.map((client) => {
                const hours = getClientHours(client.name, client.hoursReportMonth);
                const effectiveRate = hours > 0 ? client.monthlyRetainer / hours : client.monthlyRetainer;
                const isUnderFloor = hours > 0 && effectiveRate < hourlyFloor;

                return (
                  <tr key={client.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pl-5 pr-3 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center space-x-2.5">
                        <Building className="h-4 w-4 text-[#6324FC] dark:text-[#00E5FF]" />
                        <span className="text-sm font-bold">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs">{client.startDate}</td>
                    <td className="px-3 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                      ${client.monthlyRetainer.toLocaleString()}/mo
                    </td>
                    <td className="px-3 py-3.5 max-w-xs text-slate-600 dark:text-slate-300 truncate text-xs sm:text-sm" title={client.services}>
                      {client.services}
                    </td>
                    <td className="px-3 py-3.5 font-mono font-semibold text-slate-800 dark:text-slate-200">{hours} hrs</td>
                    <td className="px-3 py-3.5 font-bold text-sm">
                      <span className={isUnderFloor ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        ${effectiveRate.toFixed(1)}/hr
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      {isUnderFloor ? (
                        <span className="flex items-center space-x-1 text-rose-600 dark:text-rose-400 text-xs font-bold">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>LOW (&lt;${hourlyFloor})</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                          <Check className="h-3.5 w-3.5" />
                          <span>OK (&ge;${hourlyFloor})</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                          client.status === 'Active'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {client.status}
                      </span>
                    </td>
                    <td className="py-3.5 pl-3 pr-5 text-right">
                      <button
                        onClick={() => handleStartEdit(client)}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-[#6324FC] dark:hover:text-[#00E5FF] transition"
                        title="Edit Client"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Client Modal */}
      {(showAddModal || editingClient) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c0d14] p-6 lg:p-8 shadow-2xl text-slate-900 dark:text-white">
            <h3 className="text-lg font-bold mb-5">
              {editingClient ? 'Edit Client Details' : 'Add New Client Retainer'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Client Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Acme Heating & Air"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Monthly Retainer ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formRetainer}
                    onChange={(e) => setFormRetainer(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Services Contracted</label>
                <input
                  type="text"
                  value={formServices}
                  onChange={(e) => setFormServices(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'Active' | 'Paused' | 'Churned')}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Churned">Churned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Notes</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3.5 pt-5 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingClient(null);
                  }}
                  className="rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:opacity-95 transition"
                >
                  {editingClient ? 'Update Client' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
