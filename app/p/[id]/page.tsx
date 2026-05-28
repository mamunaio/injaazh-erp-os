'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { notFound, useParams } from 'next/navigation';
import { CheckCircle, Loader2, Sparkles, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getProposalById, acceptProposal } from '@/app/actions/proposalActions';

interface Phase {
  id: string;
  title: string;
  description: string;
  deliverables: string[];
}

interface InvestmentItem {
  id: string;
  description: string;
  cost: number;
}

interface Proposal {
  _id: string;
  title: string;
  clientName: string;
  value: number;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected';
  content: string;
  introduction: string;
  phases: Phase[];
  investment: InvestmentItem[];
  dateSent?: string;
  dateAccepted?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PublicProposalView() {
  const params = useParams();
  const id = params?.id as string;
  
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const result = await getProposalById(id);
        
        if (!result.success || !result.data) {
          setError('Proposal not found');
          setLoading(false);
          return;
        }

        // Protect draft proposals
        if (result.data.status === 'Draft') {
          setError('This proposal is not yet available');
          setLoading(false);
          return;
        }

        setProposal(result.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching proposal:', err);
        setError('Failed to load proposal');
        setLoading(false);
      }
    };

    if (id) {
      fetchProposal();
    }
  }, [id]);

  const handleAccept = async () => {
    if (!proposal || proposal.status === 'Accepted') return;

    setAccepting(true);
    try {
      const result = await acceptProposal(proposal._id);

      if (result.success && result.data) {
        setProposal(result.data);
        
        // Trigger confetti animation
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min: number, max: number) {
          return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
          });
        }, 250);
      } else {
        alert('Failed to accept proposal. Please try again.');
      }
    } catch (error) {
      console.error('Error accepting proposal:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            {error || 'Proposal Not Found'}
          </h1>
          <p className="text-slate-600 dark:text-gray-400">
            This proposal may have been removed or is not yet available.
          </p>
        </div>
      </div>
    );
  }

  const isAccepted = proposal.status === 'Accepted';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-950">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="max-w-4xl mx-auto px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{proposal.title}</h1>
            <p className="text-xl text-indigo-100 mb-6">Prepared for {proposal.clientName}</p>
            <div className="flex items-center gap-6 text-indigo-100">
              <div className="flex items-center gap-2">
                <DollarSign size={20} />
                <span className="text-2xl font-bold text-white">{formatCurrency(proposal.value)}</span>
              </div>
              {isAccepted && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-300/30 rounded-full">
                  <CheckCircle size={18} className="text-green-300" />
                  <span className="text-green-100 font-semibold">Accepted</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-12"
        >
          {/* Introduction */}
          {proposal.introduction && (
            <div className="bg-white/80 dark:bg-purple-950/30 backdrop-blur-xl border border-slate-200 dark:border-purple-500/20 rounded-3xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Introduction</h2>
              <div
                className="prose dark:prose-invert prose-lg max-w-none text-slate-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: proposal.introduction }}
              />
            </div>
          )}

          {/* Phases */}
          {proposal.phases && proposal.phases.length > 0 && (
            <div className="bg-white/80 dark:bg-purple-950/30 backdrop-blur-xl border border-slate-200 dark:border-purple-500/20 rounded-3xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Scope of Work</h2>
              <div className="space-y-6">
                {proposal.phases.map((phase, index) => (
                  <div
                    key={phase.id}
                    className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-6"
                  >
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      Phase {index + 1}: {phase.title}
                    </h3>
                    {phase.description && (
                      <p className="text-slate-600 dark:text-gray-400 mb-4">{phase.description}</p>
                    )}
                    {phase.deliverables.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                          Deliverables:
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-gray-400">
                          {phase.deliverables.map((deliverable, idx) => (
                            <li key={idx}>{deliverable}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Investment Breakdown */}
          {proposal.investment && proposal.investment.length > 0 && (
            <div className="bg-white/80 dark:bg-purple-950/30 backdrop-blur-xl border border-slate-200 dark:border-purple-500/20 rounded-3xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Investment</h2>
              <div className="space-y-3">
                {proposal.investment.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-white/10 last:border-0"
                  >
                    <span className="text-slate-700 dark:text-gray-300">{item.description}</span>
                    <span className="text-lg font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(item.cost)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-4 border-t-2 border-slate-300 dark:border-white/20">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">Total Investment</span>
                  <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(proposal.value)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* CTA Button */}
          {!isAccepted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-center shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-3">Ready to Get Started?</h3>
              <p className="text-indigo-100 mb-6">
                Accept this proposal to begin your project journey with us.
              </p>
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-indigo-600 font-bold text-lg rounded-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {accepting ? (
                  <>
                    <Loader2 size={24} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Sparkles size={24} /> Sign & Accept Proposal
                  </>
                )}
              </button>
            </motion.div>
          )}

          {isAccepted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-8 text-center shadow-2xl"
            >
              <CheckCircle size={64} className="text-white mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-white mb-3">Proposal Accepted!</h3>
              <p className="text-green-100 text-lg">
                Thank you for accepting this proposal. We'll be in touch shortly to begin the project.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <p className="text-slate-600 dark:text-gray-400">
            © 2026 Injaazh Global. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
