'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, User, Loader2 } from 'lucide-react';
import { askAssistant } from '@/app/actions/aiActions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your Injaazh ERP AI Assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const result = await askAssistant(userMessage.content);
      
      let botContent = '';
      
      if (result.success && 'text' in result && result.text) {
        botContent = result.text;
      } else if ('error' in result && result.error) {
        // Check for rate limit error
        if (result.error.includes('quota') || result.error.includes('RESOURCE_EXHAUSTED') || result.error.includes('429')) {
          botContent = `⚠️ **AI Service Temporarily Unavailable**\n\nThe AI assistant has reached its daily usage limit. Please try again:\n• In a few minutes, or\n• Tomorrow when the quota resets\n\nThank you for your patience! 🙏`;
        } else if (result.error.includes('Invalid API Key') || result.error.includes('Unauthorized')) {
          botContent = `⚠️ **API Key Issue**\n\nThere's a problem with the AI API configuration. The system tried multiple keys but all failed.\n\nPlease contact your administrator to check the API keys.`;
        } else {
          botContent = `❌ **Error**: ${result.error}`;
        }
      } else {
        botContent = '❌ Failed to get response from AI assistant.';
      }
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: botContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ **Connection Error**\n\nSorry, I encountered an unexpected error while connecting to the server. Please try again later.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageContent = (content: string) => {
    // Basic Markdown to HTML parsing
    let htmlContent = content
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Bullets (star followed by space at start of line)
      .replace(/(^|\n)\* /g, '$1• ')
      // Newlines
      .replace(/\n/g, '<br />');

    return { __html: htmlContent };
  };

  return (
    <>
      {/* Floating Action Button */}
      <div 
        className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-in-out ${isOpen ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}
      >
        <div className="relative group">
          {/* Glowing background effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-40 group-hover:opacity-70 transition duration-500 animate-pulse"></div>
          
          <button
            onClick={() => setIsOpen(true)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-full shadow-2xl hover:shadow-purple-500/50 hover:scale-110 transition-all duration-300"
          >
            <Sparkles size={24} className={`text-white transition-all duration-300 ${isHovered ? 'rotate-12 scale-110' : ''}`} />
          </button>
        </div>
      </div>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[550px] max-h-[calc(100vh-6rem)] flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-2 border-purple-200/50 dark:border-purple-500/20 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 pointer-events-none translate-y-10'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-md text-white border-b border-white/10 relative overflow-hidden">
          {/* Subtle animated background overlay */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-inner backdrop-blur-sm">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Injaazh AI</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                <p className="text-xs text-white/80 font-medium">Online & Ready</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="relative z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50 scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-800">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}
            >
              <div className={`flex max-w-[85%] gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className="flex-shrink-0 mt-auto mb-1">
                  {message.role === 'user' ? (
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                      <User size={12} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Sparkles size={12} className="text-white" />
                    </div>
                  )}
                </div>
                
                {/* Message Bubble */}
                <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-sm' 
                        : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-sm'
                    }`}
                  >
                    <div 
                      className="whitespace-pre-wrap leading-relaxed space-y-1" 
                      dangerouslySetInnerHTML={renderMessageContent(message.content)} 
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start animate-in slide-in-from-bottom-2 fade-in duration-300">
              <div className="flex max-w-[85%] gap-2 flex-row">
                <div className="flex-shrink-0 mt-auto mb-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles size={12} className="text-white" />
                  </div>
                </div>
                <div className="flex flex-col items-start">
                  <div className="px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-sm shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything about your ERP..."
              disabled={isLoading}
              className="w-full pl-4 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-purple-500/50 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 disabled:opacity-50 shadow-inner"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 p-2 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-500/30 disabled:opacity-50 disabled:hover:bg-purple-100 transition-colors"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} className="translate-x-0.5" />
              )}
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[9px] text-slate-400 font-medium">
              Powered by {process.env.NEXT_PUBLIC_AI_PROVIDER || 'Saomir'} AI
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
