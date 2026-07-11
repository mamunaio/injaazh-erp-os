'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Key, Copy, Check, QrCode } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateTwoFactorSecret, verifyAndEnableTwoFactor, disableTwoFactor } from '@/app/actions/twoFactorActions';

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDisabling?: boolean;
  onSuccess: () => void;
}

export default function TwoFactorSetupModal({ isOpen, onClose, isDisabling = false, onSuccess }: TwoFactorSetupModalProps) {
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isDisabling ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'} dark:bg-opacity-20`}>
                <Shield size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {isDisabling ? 'Disable 2FA' : 'Enable 2FA'}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            {!isDisabling && step === 1 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Step 1: Scan QR Code</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Open your authenticator app (e.g. Google Authenticator) and scan this QR code.
                  </p>
                </div>

                <div className="flex justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  {isLoading ? (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                  ) : qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 bg-slate-100 flex items-center justify-center rounded-xl">
                      <QrCode size={40} className="text-slate-700 dark:text-slate-300" />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Or enter manually</p>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Key size={16} className="text-slate-500 dark:text-slate-400 flex-shrink-0" />
                    <code className="flex-1 text-sm font-mono text-slate-700 dark:text-slate-300 break-all">
                      {secretKey}
                    </code>
                    <button 
                      onClick={handleCopy}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => setStep(2)}
                  disabled={!secretKey}
                  className="w-full py-3 bg-indigo-600 text-slate-900 dark:text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Continue to Verification
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                    {isDisabling ? 'Confirm Deactivation' : 'Step 2: Verify Code'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Enter the 6-digit code from your authenticator app to {isDisabling ? 'disable' : 'verify and enable'} 2FA.
                  </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                  <div>
                    <input 
                      type="text" 
                      maxLength={6}
                      value={token}
                      onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full text-center text-3xl tracking-[1em] font-mono py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-colors dark:text-white"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3">
                    {!isDisabling && (
                      <button 
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Back
                      </button>
                    )}
                    <button 
                      type="submit"
                      disabled={token.length !== 6 || isLoading}
                      className={`flex-[2] py-3 text-slate-900 dark:text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2 ${
                        isDisabling ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
