'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Key, Copy, Check, QrCode } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateTwoFactorSecret, verifyAndEnableTwoFactor, disableTwoFactor } from '@/app/actions/twoFactorActions';
import { useScrollLock } from '@/lib/useScrollLock';

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDisabling?: boolean;
  onSuccess: () => void;
}

export default function TwoFactorSetupModal({ isOpen, onClose, isDisabling = false, onSuccess }: TwoFactorSetupModalProps) {
  useScrollLock(isOpen);

  const [step, setStep] = useState<1 | 2>(isDisabling ? 2 : 1);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && !isDisabling) {
      setStep(1);
      setToken('');
      fetchSecret();
    } else if (isOpen && isDisabling) {
      setStep(2);
      setToken('');
    }
  }, [isOpen, isDisabling]);

  const fetchSecret = async () => {
    setIsLoading(true);
    const result = await generateTwoFactorSecret();
    if (result.success && result.data) {
      setQrCodeUrl(result.data.qrCodeUrl);
      setSecretKey(result.data.secret);
    } else {
      toast.error(result.message || 'Failed to generate 2FA secret');
      onClose();
    }
    setIsLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    let result;
    
    if (isDisabling) {
      result = await disableTwoFactor(token);
    } else {
      result = await verifyAndEnableTwoFactor(token);
    }

    if (result.success) {
      toast.success(result.message);
      onSuccess();
      onClose();
    } else {
      toast.error(result.message || 'Verification failed. Please check the code.');
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain"
      >
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-xl" 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full max-w-md my-auto bg-white dark:bg-[#0a0a0d] rounded-3xl shadow-2xl overflow-hidden border border-black/10 dark:border-white/15 z-10 overscroll-contain"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-black/5 dark:border-white/10 flex justify-between items-center bg-black/[0.01] dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isDisabling ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30' : 'bg-[#6324FC]/15 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/30'}`}>
                <Shield size={18} />
              </div>
              <div>
                <h2 className="text-base font-heading font-extrabold text-slate-900 dark:text-white">
                  {isDisabling ? 'Disable 2FA' : 'Enable Two-Factor (2FA)'}
                </h2>
                <p className="text-xs text-secondary">
                  {isDisabling ? 'Remove extra security layer' : 'Secure your workspace account'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-secondary hover:text-rose-500 dark:hover:text-rose-400 bg-slate-100 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {!isDisabling && step === 1 && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1">
                  <h3 className="font-heading font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Step 1: Scan QR Code</h3>
                  <p className="text-xs text-secondary">
                    Open Google Authenticator or 1Password and scan this QR code.
                  </p>
                </div>

                <div className="flex justify-center p-4 bg-white rounded-2xl border border-black/10 shadow-sm w-48 h-48 mx-auto">
                  {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-8 h-8 border-3 border-[#6324FC] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-xl">
                      <QrCode size={36} className="text-slate-400" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest text-center">Or Enter Key Manually</p>
                  <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-[#060608] rounded-xl border border-black/10 dark:border-white/10">
                    <Key size={14} className="text-secondary shrink-0" />
                    <code className="flex-1 text-xs font-mono text-slate-800 dark:text-slate-200 break-all select-all">
                      {secretKey}
                    </code>
                    <button 
                      onClick={handleCopy}
                      className="p-1.5 text-secondary hover:text-[#6324FC] dark:hover:text-[#00E5FF] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => setStep(2)}
                  disabled={!secretKey}
                  className="w-full py-2.5 bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white font-heading font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)] disabled:opacity-50"
                >
                  Continue to Verification
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1">
                  <h3 className="font-heading font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    {isDisabling ? 'Confirm Deactivation' : 'Step 2: Verify 6-Digit Code'}
                  </h3>
                  <p className="text-xs text-secondary">
                    Enter the 6-digit verification code from your authenticator app.
                  </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                  <div>
                    <input 
                      type="text" 
                      maxLength={6}
                      value={token}
                      onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full text-center text-2xl tracking-[0.8em] font-mono py-3 bg-slate-50 dark:bg-[#060608] border border-black/15 dark:border-white/15 focus:border-[#6324FC] rounded-xl outline-none transition-colors text-slate-900 dark:text-white"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-2">
                    {!isDisabling && (
                      <button 
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 py-2.5 bg-slate-100 dark:bg-white/5 text-secondary hover:text-slate-900 dark:hover:text-white font-heading font-bold text-xs rounded-xl transition-colors"
                      >
                        Back
                      </button>
                    )}
                    <button 
                      type="submit"
                      disabled={token.length !== 6 || isLoading}
                      className={`flex-[2] py-2.5 text-white font-heading font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-md ${
                        isDisabling ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20' : 'bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 shadow-[0_0_15px_rgba(99,36,252,0.4)]'
                      }`}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        isDisabling ? 'Disable 2FA' : 'Verify & Enable'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
