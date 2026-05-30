'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Mail, Search, Send, Plus, Filter, User, Building2, Globe, Phone, Calendar, MessageSquare, CheckCircle, Clock, XCircle, AlertCircle, Sparkles, Paperclip, Image, FileText, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateOutreachEmailDraft } from '@/app/actions/aiActions';
import { toast } from 'react-hot-toast';

interface OutreachClientProps {
  initialLeads: any[];
}

export default function OutreachClient({ initialLeads }: OutreachClientProps) {
  const router = useRouter();
  const [leads] = useState(initialLeads);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showComposer, setShowComposer] = useState(false);

  // Email composer state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  // AI Assistant state
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiHistory, setAiHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; data: string; mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch = 
        lead.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.contact_person && lead.contact_person.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'All' || lead.outreach_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, statusFilter]);

  // Get status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'New':
        return { 
          color: 'blue', 
          icon: <AlertCircle size={16} />,
          bg: 'bg-blue-100 dark:bg-blue-900/20',
          text: 'text-blue-700 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-800'
        };
      case 'Contacted':
        return { 
          color: 'amber', 
          icon: <Clock size={16} />,
          bg: 'bg-amber-100 dark:bg-amber-900/20',
          text: 'text-amber-700 dark:text-amber-400',
          border: 'border-amber-200 dark:border-amber-800'
        };
      case 'Replied':
        return { 
          color: 'purple', 
          icon: <MessageSquare size={16} />,
          bg: 'bg-purple-100 dark:bg-purple-900/20',
          text: 'text-purple-700 dark:text-purple-400',
          border: 'border-purple-200 dark:border-purple-800'
        };
      case 'Meeting Booked':
        return { 
          color: 'green', 
          icon: <Calendar size={16} />,
          bg: 'bg-green-100 dark:bg-green-900/20',
          text: 'text-green-700 dark:text-green-400',
          border: 'border-green-200 dark:border-green-800'
        };
      case 'Closed':
        return { 
          color: 'teal', 
          icon: <CheckCircle size={16} />,
          bg: 'bg-teal-100 dark:bg-teal-900/20',
          text: 'text-teal-700 dark:text-teal-400',
          border: 'border-teal-200 dark:border-teal-800'
        };
      case 'Not Interested':
        return { 
          color: 'red', 
          icon: <XCircle size={16} />,
          bg: 'bg-red-100 dark:bg-red-900/20',
          text: 'text-red-700 dark:text-red-400',
          border: 'border-red-200 dark:border-red-800'
        };
      default:
        return { 
          color: 'gray', 
          icon: <AlertCircle size={16} />,
          bg: 'bg-gray-100 dark:bg-gray-900/20',
          text: 'text-gray-700 dark:text-gray-400',
          border: 'border-gray-200 dark:border-gray-800'
        };
    }
  };

  // Generate avatar gradient
  const getAvatarGradient = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h1 = Math.abs(hash % 360);
    const h2 = (h1 + 45) % 360;
    return `linear-gradient(135deg, hsl(${h1}, 70%, 55%) 0%, hsl(${h2}, 80%, 45%) 100%)`;
  };

  // Handle compose email
  const handleCompose = (lead: any) => {
    setSelectedLead(lead);
    setSubject(`Proposal for ${lead.company_name}`);
    setBody(`Hi ${lead.contact_person || 'there'},\n\nI hope this email finds you well.\n\nI was recently reviewing ${lead.company_name} and was impressed by your business.\n\nBest regards,\nInjaazh Global`);
    setShowComposer(true);
    setShowAIPanel(false);
    setAiHistory([]);
    setAttachedFile(null);
  };

  // Handle file attachment
  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only images (JPEG, PNG, GIF, WEBP), PDF, and text files are supported');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setAttachedFile({
        name: file.name,
        data: base64,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle AI generation
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim() || !selectedLead) return;

    setIsGenerating(true);

    try {
      const result = await generateOutreachEmailDraft(
        selectedLead._id,
        aiPrompt,
        aiHistory,
        attachedFile ? { data: attachedFile.data, mimeType: attachedFile.mimeType } : undefined
      );

      if (result.success && result.text) {
        // Add to history
        setAiHistory([
          ...aiHistory,
          { role: 'user', text: aiPrompt },
          { role: 'model', text: result.text }
        ]);

        // Parse subject and body from AI response
        const lines = result.text.split('\n');
        let subjectLine = '';
        let bodyText = '';
        let foundSubject = false;

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('Subject:')) {
            subjectLine = lines[i].replace('Subject:', '').trim();
            foundSubject = true;
            // Body starts after subject and empty line
            bodyText = lines.slice(i + 2).join('\n').trim();
            break;
          }
        }

        if (foundSubject) {
          setSubject(subjectLine);
          setBody(bodyText);
        } else {
          // If no subject found, use entire response as body
          setBody(result.text);
        }

        setAiPrompt('');
      } else {
        // Check for rate limit error
        const isRateLimited = 
          result.error?.includes('429') ||
          result.error?.includes('quota') ||
          result.error?.includes('RESOURCE_EXHAUSTED');
        
        if (isRateLimited) {
          toast.error(
            '⚠️ AI Service Temporarily Unavailable\n\nThe AI assistant has reached its daily usage limit. Please try again in a few minutes or tomorrow when the quota resets.',
            { duration: 6000 }
          );
        } else {
          toast.error(result.error || 'Failed to generate email');
        }
      }
    } catch (error: any) {
      // Check for rate limit error in exception
      const isRateLimited = 
        error.message?.includes('429') ||
        error.message?.includes('quota') ||
        error.message?.includes('RESOURCE_EXHAUSTED');
      
      if (isRateLimited) {
        toast.error(
          '⚠️ AI Service Temporarily Unavailable\n\nThe AI assistant has reached its daily usage limit. Please try again in a few minutes or tomorrow when the quota resets.',
          { duration: 6000 }
        );
      } else {
        toast.error(error.message || 'An error occurred');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle send email
  const handleSend = async () => {
    if (!selectedLead || !subject || !body) return;
    
    setIsSending(true);
    
    // Simulate sending (replace with actual API call)
    setTimeout(() => {
      setIsSending(false);
      setShowComposer(false);
      toast.success('Email sent successfully! 📧');
      router.refresh();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0B0E1A] dark:via-[#0F1220] dark:to-[#0B0E1A] p-4 md:p-8 text-slate-800 dark:text-slate-200">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 
          className="text-6xl md:text-7xl font-jakarta font-black tracking-tight leading-none mb-3"
          style={{
            background: 'linear-gradient(to right, #6366f1, #a855f7, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
            filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))',
          }}
        >
          Email Outreach
        </h1>
        <p className="text-[15px] font-inter leading-relaxed tracking-wide text-slate-600 dark:text-gray-400">
          Manage your email campaigns and connect with leads
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)]">
        
        {/* LEFT PANEL: LEADS LIST */}
        <div className="w-full lg:w-[400px] flex flex-col bg-white/80 dark:bg-[#151B2E]/80 backdrop-blur-xl border-2 border-purple-200/40 dark:border-purple-500/20 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] overflow-hidden flex-shrink-0">
          
          {/* Search & Filter */}
          <div className="p-6 border-b-2 border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-jakarta font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
                <Mail size={20} className="text-indigo-600 dark:text-indigo-400" />
                Leads Pipeline
              </h2>
              <span className="text-xs font-jakarta font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {filteredLeads.length} leads
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads..."
                className="w-full pl-11 pr-4 py-3 text-[15px] font-inter bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-all"
              />
            </div>

            <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 gap-1">
              {['All', 'New', 'Contacted', 'Replied'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`flex-1 py-2 rounded-lg text-xs font-jakarta font-bold transition-all ${
                    statusFilter === filter
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Leads List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Mail size={48} className="opacity-20 mb-4" />
                <span className="text-sm font-bold">No matching leads</span>
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const status = getStatusConfig(lead.outreach_status);
                const initials = lead.company_name
                  .split(' ')
                  .slice(0, 2)
                  .map((w: string) => w[0])
                  .join('')
                  .toUpperCase();

                const isSelected = selectedLead?._id === lead._id;

                return (
                  <div
                    key={lead._id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer group hover:shadow-lg ${
                      isSelected
                        ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/25 dark:bg-indigo-950/30 shadow-md shadow-indigo-500/5'
                        : 'border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/20'
                    }`}
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        style={{ background: getAvatarGradient(lead.company_name) }}
                        className="h-12 w-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg flex-shrink-0"
                      >
                        {initials}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate mb-1">
                          {lead.company_name}
                        </h3>
                        
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 truncate">
                          {lead.contact_person || 'No contact'}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md border flex items-center gap-1 ${status.bg} ${status.text} ${status.border}`}>
                            {status.icon}
                            {lead.outreach_status}
                          </span>
                          
                          {lead.email && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompose(lead);
                              }}
                              className="text-[10px] font-bold px-2 py-1 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 transition-colors flex items-center gap-1"
                            >
                              <Send size={10} />
                              Email
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: LEAD DETAILS / EMAIL COMPOSER */}
        <div className="flex-1 flex flex-col bg-white/80 dark:bg-[#151B2E]/80 backdrop-blur-xl border-2 border-purple-200/40 dark:border-purple-500/20 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] overflow-hidden">
          
          {!selectedLead ? (
            /* EMPTY STATE */
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 dark:shadow-indigo-500/50 mb-6 transform hover:scale-105 transition-transform">
                <Mail size={48} />
              </div>
              
              <h3 className="text-3xl font-jakarta font-black text-slate-800 dark:text-white mb-3">
                Select a Lead
              </h3>
              
              <p className="text-[15px] font-inter leading-relaxed tracking-wide text-slate-600 dark:text-slate-400 max-w-md">
                Choose a lead from the list to view details and send personalized outreach emails.
              </p>
            </div>
          ) : showComposer ? (
            /* EMAIL COMPOSER */
            <div className="flex-1 flex flex-col lg:flex-row gap-4">
              {/* Main Composer */}
              <div className="flex-1 flex flex-col">
                {/* Composer Header */}
                <div className="px-6 py-4 border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-purple-900/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-jakarta font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
                        <Send size={20} className="text-indigo-600 dark:text-indigo-400" />
                        Compose Email
                      </h3>
                      <p className="text-[15px] font-inter text-slate-600 dark:text-slate-400 mt-1">
                        To: {selectedLead.email}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAIPanel(!showAIPanel)}
                        className={`px-6 py-3 text-sm font-jakarta font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg ${
                          showAIPanel
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-500/30 dark:shadow-purple-500/50'
                            : 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 hover:shadow-purple-500/20'
                        }`}
                      >
                        <Sparkles size={16} />
                        AI Assistant
                      </button>
                      
                      <button
                        onClick={() => setShowComposer(false)}
                        className="px-6 py-3 text-sm font-jakarta font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>

                {/* Composer Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div>
                    <label className="text-sm font-jakarta font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2 block">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-[15px] font-inter"
                      placeholder="Email subject..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-jakarta font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2 block">
                      Message
                    </label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={12}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-[15px] font-inter leading-relaxed resize-none"
                      placeholder="Write your message..."
                    />
                  </div>
                </div>

                {/* Composer Footer */}
                <div className="px-6 py-4 border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <button
                    onClick={handleSend}
                    disabled={isSending || !subject || !body}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-jakarta font-bold text-sm rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] dark:hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Send Email
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* AI Assistant Panel */}
              {showAIPanel && (
                <div className="w-full lg:w-[400px] flex flex-col bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-2 border-purple-300 dark:border-purple-700 rounded-2xl overflow-hidden flex-shrink-0">
                  {/* AI Panel Header */}
                  <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={20} />
                        <h3 className="text-lg font-bold">Gemini AI Assistant</h3>
                      </div>
                      <button
                        onClick={() => setShowAIPanel(false)}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <p className="text-xs text-purple-100 mt-1">
                      Generate emails with custom commands & file attachments
                    </p>
                  </div>

                  {/* AI Chat History */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {aiHistory.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-bold">Start a conversation</p>
                        <p className="text-xs mt-1">Ask AI to generate or refine your email</p>
                        
                        <div className="mt-6 space-y-2 text-left">
                          <p className="text-xs font-bold text-purple-600 dark:text-purple-400">Quick Commands:</p>
                          <button
                            onClick={() => setAiPrompt('Write a cold email pitch')}
                            className="w-full text-left px-3 py-2 bg-white dark:bg-slate-800 rounded-lg text-xs hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                          >
                            💡 Write a cold email pitch
                          </button>
                          <button
                            onClick={() => setAiPrompt('Write a follow-up email')}
                            className="w-full text-left px-3 py-2 bg-white dark:bg-slate-800 rounded-lg text-xs hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                          >
                            📧 Write a follow-up email
                          </button>
                          <button
                            onClick={() => setAiPrompt('Make it shorter and more direct')}
                            className="w-full text-left px-3 py-2 bg-white dark:bg-slate-800 rounded-lg text-xs hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                          >
                            ✂️ Make it shorter
                          </button>
                          <button
                            onClick={() => setAiPrompt('Write in Bengali')}
                            className="w-full text-left px-3 py-2 bg-white dark:bg-slate-800 rounded-lg text-xs hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                          >
                            🇧🇩 Write in Bengali
                          </button>
                        </div>
                      </div>
                    ) : (
                      aiHistory.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl text-sm ${
                            msg.role === 'user'
                              ? 'bg-purple-600 text-white ml-8'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 mr-8'
                          }`}
                        >
                          <div className="font-bold text-xs mb-1 opacity-70">
                            {msg.role === 'user' ? 'You' : 'Gemini AI'}
                          </div>
                          <div className="whitespace-pre-wrap text-xs leading-relaxed">
                            {msg.text}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* File Attachment Display */}
                  {attachedFile && (
                    <div className="px-4 py-2 bg-white dark:bg-slate-800 border-t-2 border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        {attachedFile.mimeType.startsWith('image/') ? (
                          <Image size={16} className="text-purple-600 dark:text-purple-400" />
                        ) : (
                          <FileText size={16} className="text-purple-600 dark:text-purple-400" />
                        )}
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex-1 truncate">
                          {attachedFile.name}
                        </span>
                        <button
                          onClick={() => setAttachedFile(null)}
                          className="p-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AI Input */}
                  <div className="p-4 bg-white dark:bg-slate-800 border-t-2 border-purple-200 dark:border-purple-800">
                    <div className="flex gap-2 mb-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf,.txt"
                        onChange={handleFileAttach}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                        title="Attach file (Image, PDF, Text)"
                      >
                        <Paperclip size={18} />
                      </button>
                      
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleAIGenerate()}
                        placeholder="Ask AI to generate or refine..."
                        className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                        disabled={isGenerating}
                      />
                      
                      <button
                        onClick={handleAIGenerate}
                        disabled={isGenerating || !aiPrompt.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isGenerating ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Sparkles size={16} />
                        )}
                      </button>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      💡 Attach images, PDFs, or text files for AI analysis
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* LEAD DETAILS */
            <div className="flex-1 overflow-y-auto">
              {/* Lead Header */}
              <div className="px-6 py-6 border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-purple-900/20">
                <div className="flex items-start gap-4">
                  <div 
                    style={{ background: getAvatarGradient(selectedLead.company_name) }}
                    className="h-16 w-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-xl flex-shrink-0"
                  >
                    {selectedLead.company_name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                      {selectedLead.company_name}
                    </h2>
                    
                    {(() => {
                      const status = getStatusConfig(selectedLead.outreach_status);
                      return (
                        <span className={`inline-flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-lg border ${status.bg} ${status.text} ${status.border}`}>
                          {status.icon}
                          {selectedLead.outreach_status}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Lead Info */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedLead.contact_person && (
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <User size={20} className="text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Contact Person</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-white">{selectedLead.contact_person}</div>
                      </div>
                    </div>
                  )}

                  {selectedLead.email && (
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <Mail size={20} className="text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Email</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-white">{selectedLead.email}</div>
                      </div>
                    </div>
                  )}

                  {selectedLead.phone && (
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <Phone size={20} className="text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Phone</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-white">{selectedLead.phone}</div>
                      </div>
                    </div>
                  )}

                  {selectedLead.website_url && (
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <Globe size={20} className="text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Website</div>
                        <a href={selectedLead.website_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                          Visit Site
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {selectedLead.targetService && (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-800">
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mb-1">Target Service</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-white">{selectedLead.targetService}</div>
                  </div>
                )}

                {selectedLead.email && (
                  <button
                    onClick={() => handleCompose(selectedLead)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                  >
                    <Send size={18} />
                    Compose Email
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
