'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Save, Check, Plus, Trash2, Cpu, 
  Layers, CheckSquare, ShieldAlert, Sparkles, User, 
  FileCode2, Loader2, Clock, Eye, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import CustomSelect, { CustomSelectOption } from '@/components/ui/CustomSelect';

const SPEC_PRIORITY_OPTIONS: CustomSelectOption[] = [
  { value: 'Must Have', label: 'Must Have', color: '#EC4899' },
  { value: 'Should Have', label: 'Should Have', color: '#F59E0B' },
  { value: 'Nice to Have', label: 'Nice to Have', color: '#10B981' },
];

const SPEC_STATUS_OPTIONS: CustomSelectOption[] = [
  { value: 'Included', label: 'Included', color: '#10B981' },
  { value: 'Future Scope', label: 'Future Scope', color: '#8B5CF6' },
  { value: 'Optional Add-on', label: 'Optional', color: '#00E5FF' },
];
import { createRequirement, updateRequirement } from '@/app/actions/requirementActions';

interface RequirementBuilderClientProps {
  initialData?: any;
}

export default function RequirementBuilderClient({ initialData }: RequirementBuilderClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    docNumber: initialData?.docNumber || '',
    version: initialData?.version || 'v1.0',
    executiveSummary: initialData?.executiveSummary || '',
    timelineEstimate: initialData?.timelineEstimate || '6 Sprints • 8 Weeks Total',
    clientName: initialData?.clientName || '',
    clientCompany: initialData?.clientCompany || '',
    clientEmail: initialData?.clientEmail || '',
    clientPhone: initialData?.clientPhone || '',
    status: initialData?.status || 'Draft',
  });

  // Tech Stack State
  const [techStack, setTechStack] = useState<string[]>(
    initialData?.techStack?.length > 0 
      ? initialData.techStack 
      : ['Next.js 15', 'TypeScript', 'Node.js', 'MongoDB', 'TailwindCSS']
  );
  const [newTechInput, setNewTechInput] = useState('');

  // Modules State
  const [modules, setModules] = useState<any[]>(
    initialData?.modules?.length > 0
      ? initialData.modules
      : [
          {
            name: 'User Authentication & Role-Based Access Control',
            description: 'Secure enterprise multi-tenant access with strict role delegation and session management.',
            features: [
              {
                title: 'Email & Password Login with Encrypted Sessions',
                description: 'Robust password hashing, HTTP-only JWT cookies, and rate limiting against brute force.',
                priority: 'Must Have',
                status: 'Included',
              },
              {
                title: 'Two-Factor Authentication (2FA / TOTP)',
                description: 'Authenticator app integration for enterprise admin safety.',
                priority: 'Should Have',
                status: 'Included',
              },
            ],
          },
          {
            name: 'Core Application & Business Logic Engine',
            description: 'Central operational dashboard, real-time metrics, and automated pipeline execution.',
            features: [
              {
                title: 'High-Level Telemetry Dashboard & Interactive Charts',
                description: 'Visual KPIs, financial summaries, and activity audit trails.',
                priority: 'Must Have',
                status: 'Included',
              },
            ],
          },
        ]
  );

  // Client Prerequisites State
  const [clientPrerequisites, setClientPrerequisites] = useState<any[]>(
    initialData?.clientPrerequisites?.length > 0
      ? initialData.clientPrerequisites
      : [
          { title: 'Corporate Logo & Brand Assets (SVG / High-Res PNG)', provided: true, notes: 'Vector format preferred' },
          { title: 'Custom Domain DNS Provider Credentials (Cloudflare / Namecheap)', provided: false, notes: 'Needed for SSL & deployment' },
          { title: 'Payment Gateway API Keys (Stripe / PayPal)', provided: false, notes: 'Production secret & publishable keys' },
        ]
  );

  // Out of Scope State
  const [outOfScope, setOutOfScope] = useState<string[]>(
    initialData?.outOfScope?.length > 0
      ? initialData.outOfScope
      : [
          'Native iOS & Android mobile application builds (PWA only for this phase)',
          'Legacy database schema migrations older than 5 years',
          'Third-party paid software license fees and hosting server costs',
        ]
  );
  const [newOutOfScopeInput, setNewOutOfScopeInput] = useState('');

  // --- Handlers: Tech Stack ---
  const addTechTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTechInput.trim()) return;
    if (!techStack.includes(newTechInput.trim())) {
      setTechStack([...techStack, newTechInput.trim()]);
    }
    setNewTechInput('');
  };

  const removeTechTag = (tag: string) => {
    setTechStack(techStack.filter((t) => t !== tag));
  };

  // --- Handlers: Modules ---
  const addModule = () => {
    setModules([
      ...modules,
      {
        name: `New Module ${modules.length + 1}`,
        description: '',
        features: [
          {
            title: 'Initial Feature Specification',
            description: '',
            priority: 'Must Have',
            status: 'Included',
          },
        ],
      },
    ]);
  };

  const removeModule = (mIdx: number) => {
    if (modules.length === 1) {
      toast.error('You need at least one module in the project scope');
      return;
    }
    setModules(modules.filter((_, idx) => idx !== mIdx));
  };

  const updateModuleField = (mIdx: number, field: string, value: string) => {
    const updated = [...modules];
    updated[mIdx][field] = value;
    setModules(updated);
  };

  const addFeature = (mIdx: number) => {
    const updated = [...modules];
    updated[mIdx].features.push({
      title: '',
      description: '',
      priority: 'Must Have',
      status: 'Included',
    });
    setModules(updated);
  };

  const removeFeature = (mIdx: number, fIdx: number) => {
    const updated = [...modules];
    updated[mIdx].features = updated[mIdx].features.filter((_: any, idx: number) => idx !== fIdx);
    setModules(updated);
  };

  const updateFeatureField = (mIdx: number, fIdx: number, field: string, value: string) => {
    const updated = [...modules];
    updated[mIdx].features[fIdx][field] = value;
    setModules(updated);
  };

  // --- Handlers: Prerequisites ---
  const addPrerequisite = () => {
    setClientPrerequisites([
      ...clientPrerequisites,
      { title: '', provided: false, notes: '' },
    ]);
  };

  const removePrerequisite = (pIdx: number) => {
    setClientPrerequisites(clientPrerequisites.filter((_, idx) => idx !== pIdx));
  };

  const updatePrerequisiteField = (pIdx: number, field: string, value: any) => {
    const updated = [...clientPrerequisites];
    updated[pIdx][field] = value;
    setClientPrerequisites(updated);
  };

  // --- Handlers: Out of Scope ---
  const addOutOfScopeItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newOutOfScopeInput.trim()) return;
    setOutOfScope([...outOfScope, newOutOfScopeInput.trim()]);
    setNewOutOfScopeInput('');
  };

  const removeOutOfScopeItem = (idx: number) => {
    setOutOfScope(outOfScope.filter((_, i) => i !== idx));
  };

  // --- Submit Handler ---
  const handleSubmit = async (overrideStatus?: string) => {
    if (!formData.title.trim()) {
      toast.error('Project Title is required');
      return;
    }
    if (!formData.clientName.trim()) {
      toast.error('Client Contact Name is required');
      return;
    }
    if (!formData.clientEmail.trim()) {
      toast.error('Client Email is required');
      return;
    }

    // Filter empty modules & features
    const validModules = modules
      .filter((m) => m.name && m.name.trim() !== '')
      .map((m) => ({
        name: m.name.trim(),
        description: m.description || '',
        features: m.features
          .filter((f: any) => f.title && f.title.trim() !== '')
          .map((f: any) => ({
            title: f.title.trim(),
            description: f.description || '',
            priority: f.priority || 'Must Have',
            status: f.status || 'Included',
          })),
      }));

    if (validModules.length === 0) {
      toast.error('Please specify at least one valid functional module');
      return;
    }

    const validPrerequisites = clientPrerequisites
      .filter((p) => p.title && p.title.trim() !== '')
      .map((p) => ({
        title: p.title.trim(),
        provided: !!p.provided,
        notes: p.notes || '',
      }));

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        techStack,
        modules: validModules,
        clientPrerequisites: validPrerequisites,
        outOfScope,
        status: overrideStatus || formData.status,
      };

      if (initialData?._id) {
        const res = await updateRequirement(initialData._id, payload);
        if (res.success) {
          toast.success('Project requirements updated successfully');
          router.push('/requirements');
        } else {
          toast.error(res.error || 'Failed to update requirement document');
        }
      } else {
        const res = await createRequirement(payload);
        if (res.success) {
          toast.success('Project requirements document created successfully');
          router.push('/requirements');
        } else {
          toast.error(res.error || 'Failed to create requirement document');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#6324FC] transition-all placeholder:text-secondary';
  const labelClass =
    'block text-[11px] font-heading font-bold text-secondary uppercase tracking-wider mb-1.5';

  const totalSpecsCount = modules.reduce((acc, m) => acc + (m.features?.length || 0), 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-24">
      
      {/* Top Header Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3">
          <Link
            href="/requirements"
            className="w-10 h-10 rounded-xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 flex items-center justify-center text-secondary hover:text-slate-900 dark:hover:text-white transition-all shadow-xs"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-heading font-black text-slate-900 dark:text-white tracking-tight">
              {initialData ? 'Edit Project Requirements & PRD' : 'Author Project Requirements Document'}
            </h1>
            <p className="text-xs text-secondary">
              Define functional scope, module architectures, tech stacks, and client prerequisites.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {initialData?.slug && (
            <Link
              href={`/requirements/${initialData.slug}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 text-secondary hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Eye size={14} />
              <span>Preview Public View</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => handleSubmit('Draft')}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit('Sent')}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#8042FF] text-white text-xs font-bold hover:shadow-[0_4px_16px_rgba(99,36,252,0.3)] transition-all flex items-center gap-1.5 active:scale-95"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            <span>{initialData ? 'Update & Publish' : 'Create & Publish Scope'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Overview, Client & Boundaries (5 Cols) */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* 1. Project Overview & Reference */}
          <div className="bg-white dark:bg-[#0a0a0d] p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm space-y-4">
            <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCode2 size={16} className="text-[#6324FC]" /> Document &amp; Scope Overview
            </h3>

            <div>
              <label className={labelClass}>Project Title *</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. Modern Full-Stack ERP Solution"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Document Number</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Auto-generated (REQ-XXXX-XXX)"
                  value={formData.docNumber}
                  onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Version Tag</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. v1.0"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Estimated Timeline &amp; Sprints</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. 6 Sprints • 8 Weeks Total"
                value={formData.timelineEstimate}
                onChange={(e) => setFormData({ ...formData, timelineEstimate: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>Executive Scope Summary</label>
              <textarea
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="High-level project goals, business problem, and technical solution overview..."
                value={formData.executiveSummary}
                onChange={(e) => setFormData({ ...formData, executiveSummary: e.target.value })}
              />
            </div>
          </div>

          {/* 2. Client Contact Information */}
          <div className="bg-white dark:bg-[#0a0a0d] p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm space-y-4">
            <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User size={16} className="text-[#00E5FF]" /> Client Contact Information
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Client Contact Name *</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Alex Morgan"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Client Company</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Apex Global Ltd"
                  value={formData.clientCompany}
                  onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Client Email *</label>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="client@company.com"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Client Phone (Optional)</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="+1 (555) 000-0000"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 3. Tech Stack Chips */}
          <div className="bg-white dark:bg-[#0a0a0d] p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu size={16} className="text-[#6324FC]" /> Tech Stack Frameworks
              </h3>
              <span className="text-xs font-mono text-secondary">{techStack.length} Technologies</span>
            </div>

            {/* Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add technology (e.g. Redis, Next.js, Stripe)..."
                value={newTechInput}
                onChange={(e) => setNewTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTechTag();
                  }
                }}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => addTechTag()}
                className="px-3.5 py-2.5 rounded-xl bg-[#6324FC] text-white text-xs font-bold shrink-0 hover:bg-[#521bd6] transition-colors"
              >
                Add
              </button>
            </div>

            {/* Tag List */}
            <div className="flex flex-wrap gap-2 pt-1">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                >
                  <span>{tech}</span>
                  <button
                    type="button"
                    onClick={() => removeTechTag(tech)}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 4. Client Prerequisites Checklist */}
          <div className="bg-white dark:bg-[#0a0a0d] p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare size={16} className="text-emerald-500" /> Client Prerequisite Checklist
              </h3>
              <button
                type="button"
                onClick={addPrerequisite}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Add Asset
              </button>
            </div>

            <div className="space-y-3">
              {clientPrerequisites.map((p, pIdx) => (
                <div
                  key={pIdx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      className="font-bold text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none flex-1"
                      placeholder="Asset title (e.g. Domain DNS Access)"
                      value={p.title}
                      onChange={(e) => updatePrerequisiteField(pIdx, 'title', e.target.value)}
                    />
                    <label className="flex items-center gap-1.5 text-[11px] font-mono text-secondary cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={p.provided}
                        onChange={(e) => updatePrerequisiteField(pIdx, 'provided', e.target.checked)}
                        className="rounded accent-[#10B981]"
                      />
                      <span>Provided</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removePrerequisite(pIdx)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <input
                    type="text"
                    className="w-full text-xs bg-transparent text-secondary focus:outline-none placeholder:text-secondary/60"
                    placeholder="Instructions or notes for client (e.g. Provide Cloudflare admin invite)..."
                    value={p.notes}
                    onChange={(e) => updatePrerequisiteField(pIdx, 'notes', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 5. Out of Scope Boundaries */}
          <div className="bg-white dark:bg-[#0a0a0d] p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm space-y-4">
            <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert size={16} className="text-amber-500" /> Out of Scope Boundaries
            </h3>
            <p className="text-xs text-secondary">
              List features explicitly not included to prevent scope creep:
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. Native iOS mobile app (Web responsive only)..."
                value={newOutOfScopeInput}
                onChange={(e) => setNewOutOfScopeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOutOfScopeItem();
                  }
                }}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => addOutOfScopeItem()}
                className="px-3.5 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold shrink-0 hover:bg-amber-600 transition-colors"
              >
                Add
              </button>
            </div>

            <ul className="space-y-1.5 pt-1">
              {outOfScope.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-xs text-secondary"
                >
                  <span className="truncate">{item}</span>
                  <button
                    type="button"
                    onClick={() => removeOutOfScopeItem(idx)}
                    className="text-slate-400 hover:text-rose-500 shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* RIGHT COLUMN: Functional Modules Matrix (7 Cols) */}
        <div className="xl:col-span-7 space-y-6">
          
          <div className="bg-white dark:bg-[#0a0a0d] p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5">
              <div>
                <h3 className="text-base font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers size={18} className="text-[#6324FC]" /> Functional Modules &amp; Specification Matrix
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  Organize software architecture into modules and specify user stories.
                </p>
              </div>

              <button
                type="button"
                onClick={addModule}
                className="px-4 py-2 rounded-xl bg-[#6324FC] hover:bg-[#521bd6] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(99,36,252,0.3)]"
              >
                <Plus size={14} /> Add Module
              </button>
            </div>

            {/* Modules List */}
            <div className="space-y-6">
              {modules.map((m, mIdx) => (
                <div
                  key={mIdx}
                  className="p-5 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-black/10 dark:border-white/10 space-y-4 relative group"
                >
                  {/* Module Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#6324FC]/15 text-[#6324FC] text-xs font-mono font-bold flex items-center justify-center">
                          {mIdx + 1}
                        </span>
                        <input
                          type="text"
                          required
                          className="font-heading font-bold text-sm bg-transparent text-slate-900 dark:text-white focus:outline-none flex-1 border-b border-transparent focus:border-[#6324FC]"
                          placeholder="Module Name (e.g. Client Billing & Invoice Gateway)"
                          value={m.name}
                          onChange={(e) => updateModuleField(mIdx, 'name', e.target.value)}
                        />
                      </div>
                      <input
                        type="text"
                        className="w-full text-xs bg-transparent text-secondary focus:outline-none placeholder:text-secondary/60"
                        placeholder="Module summary / architectural purpose..."
                        value={m.description}
                        onChange={(e) => updateModuleField(mIdx, 'description', e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => addFeature(mIdx)}
                        className="px-2.5 py-1 rounded-lg bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] text-xs font-bold hover:bg-[#6324FC]/20 transition-colors flex items-center gap-1"
                      >
                        <Plus size={12} /> Add Spec
                      </button>
                      <button
                        type="button"
                        onClick={() => removeModule(mIdx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete Module"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Features / User Stories */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider block">
                      Specifications &amp; Deliverables ({m.features?.length || 0})
                    </span>

                    {m.features?.map((f: any, fIdx: number) => (
                      <div
                        key={fIdx}
                        className="p-3.5 rounded-xl bg-white dark:bg-[#0a0a0d] border border-black/5 dark:border-white/10 space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <input
                            type="text"
                            required
                            className="font-heading font-semibold text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none flex-1"
                            placeholder="Deliverable / Feature title (e.g. Automated PDF receipt generation)"
                            value={f.title}
                            onChange={(e) => updateFeatureField(mIdx, fIdx, 'title', e.target.value)}
                          />

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Priority Select */}
                            <CustomSelect
                              value={f.priority}
                              onChange={(val) => updateFeatureField(mIdx, fIdx, 'priority', val)}
                              options={SPEC_PRIORITY_OPTIONS}
                              size="sm"
                              minWidth={115}
                            />

                            {/* Status Select */}
                            <CustomSelect
                              value={f.status}
                              onChange={(val) => updateFeatureField(mIdx, fIdx, 'status', val)}
                              options={SPEC_STATUS_OPTIONS}
                              size="sm"
                              minWidth={115}
                            />

                            <button
                              type="button"
                              onClick={() => removeFeature(mIdx, fIdx)}
                              className="text-slate-400 hover:text-rose-500 p-1"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <textarea
                          rows={2}
                          className="w-full text-xs bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5 rounded-lg p-2 text-secondary focus:outline-none resize-none placeholder:text-secondary/60"
                          placeholder="Detailed acceptance criteria or implementation notes..."
                          value={f.description}
                          onChange={(e) => updateFeatureField(mIdx, fIdx, 'description', e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Quick Scope Health Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#6324FC]/10 to-[#00E5FF]/10 border border-[#6324FC]/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#0a0a0d] text-[#6324FC] dark:text-[#00E5FF] flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                  Total Project Scope Health
                </p>
                <p className="text-[11px] text-secondary">
                  {modules.length} Functional Modules • {totalSpecsCount} Specifications • {clientPrerequisites.length} Client Prerequisites
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-[#6324FC] hover:bg-[#521bd6] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)]"
            >
              {isSubmitting ? 'Saving...' : 'Save & Publish'}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

