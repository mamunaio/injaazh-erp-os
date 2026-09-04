'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2, Minus, Trash2, ArrowUpRight, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: Date;
}

const quickPromptCategories = [
  { label: '📊 Overview', prompt: 'Provide a brief executive summary of our leads, revenue, and active projects.' },
  { label: '✉️ Cold Email', prompt: 'Draft a high-converting cold outreach email for a modern SaaS company looking for custom web development.' },
  { label: '💼 Projects', prompt: 'What projects are currently in flight and what are their statuses?' },
  { label: '💡 Growth Strategy', prompt: 'Suggest 3 strategic actions to increase monthly revenue and close pending proposals.' },
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: 'Hello! I am your **AI Business Copilot**. Ask me anything about your leads, revenue, active projects, or email drafts.',
      createdAt: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    const handleOpenAiChat = () => {
      setIsOpen(true);
      setIsMinimized(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    };

    window.addEventListener('open-ai-chat', handleOpenAiChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenAiChat);
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      chatHistory.push({ role: 'user', content: userMessage.content });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.text || 'I apologize, but I could not generate a response.',
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: '⚠️ I encountered an error. Please check your Gemini API key in Settings or try again.',
        createdAt: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'ai',
        content: 'Chat cleared! How can I assist you with your business today?',
        createdAt: new Date(),
      }
    ]);
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[999] w-13 h-13 rounded-2xl bg-gradient-to-tr from-primary-600 via-indigo-600 to-purple-600 shadow-xl shadow-primary-500/25 flex items-center justify-center text-white border border-white/20 group"
          >
            <Bot size={22} className="group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#09090B]" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : '620px',
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`fixed bottom-6 right-6 z-[999] w-[400px] max-w-[calc(100vw-2rem)] flex flex-col rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl backdrop-blur-2xl bg-white/95 dark:bg-[#0E1017]/95 ${isMinimized ? '' : 'max-h-[calc(100vh-5rem)]'}`}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-primary-500/15 via-indigo-500/10 to-transparent border-b border-slate-100 dark:border-white/[0.06] cursor-pointer select-none" 
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">AI Business Copilot</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-500 font-semibold tracking-wide">Gemini 2.5 Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); clearChat(); }}
                  title="Clear conversation"
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Minus size={15} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-slate-50/50 dark:bg-black/20">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex gap-3 max-w-[94%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <div className={`shrink-0 w-7 h-7 rounded-xl flex items-center justify-center text-xs shadow-sm ${
                        msg.role === 'user' ? 'bg-primary-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white'
                      }`}>
                        {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                      </div>
                      <div className={`group relative p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-primary-600 text-white rounded-tr-xs shadow-sm' 
                          : 'bg-white dark:bg-[#151824] text-slate-800 dark:text-slate-200 rounded-tl-xs border border-slate-200/80 dark:border-white/[0.06] shadow-sm'
                      }`}>
                        <div className="prose prose-xs dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-100 dark:prose-pre:bg-black/40 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-white/10">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                        <div className={`flex items-center justify-between mt-2 pt-1 border-t border-slate-100/50 dark:border-white/[0.04] text-[9px] opacity-60 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.role === 'ai' && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(msg.content);
                                toast.success('Copied to clipboard');
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                              title="Copy response"
                            >
                              <Copy size={11} /> Copy
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-3 max-w-[90%]">
                      <div className="shrink-0 w-7 h-7 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-white">
                        <Bot size={13} />
                      </div>
                      <div className="p-3 rounded-2xl bg-white dark:bg-[#151824] text-slate-500 rounded-tl-xs border border-slate-200/80 dark:border-white/[0.06] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts Chips */}
                {messages.length <= 3 && (
                  <div className="px-3 py-2 bg-slate-100/60 dark:bg-black/40 border-t border-slate-200/60 dark:border-white/[0.04] flex flex-wrap gap-1.5">
                    {quickPromptCategories.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(item.prompt)}
                        disabled={isLoading}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:border-primary-500 hover:text-primary-500 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1"
                      >
                        {item.label}
                        <ArrowUpRight size={10} className="opacity-50" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Input Area */}
                <div className="p-3 bg-white dark:bg-[#0E1017] border-t border-slate-100 dark:border-white/[0.06]">
                  <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-black/30 rounded-2xl border border-slate-200 dark:border-white/10 focus-within:border-primary-500/50 transition-all p-1.5">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask copilot about leads, stats, or email drafts..."
                      className="flex-1 max-h-28 min-h-[36px] bg-transparent resize-none py-1 px-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none custom-scrollbar"
                      rows={1}
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!input.trim() || isLoading}
                      className="p-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:hover:bg-primary-600 transition-all shrink-0"
                    >
                      {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
