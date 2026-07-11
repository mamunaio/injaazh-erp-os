const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/(auth)/login/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace import statement to add useEffect and useRef
content = content.replace(
  "import React, { useState } from 'react';",
  "import React, { useState, useEffect, useRef } from 'react';"
);

// Add OTP and Timer state logic in the component body
const stateLogicReplacement = `
  const [code2FA, setCode2FA] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (requires2FA && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [requires2FA, resendTimer]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    
    const newOtp = code2FA.split('');
    newOtp[index] = value.slice(-1);
    const newCode = newOtp.join('');
    setCode2FA(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code2FA[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      setCode2FA(pastedData);
      const nextFocusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextFocusIndex]?.focus();
    }
  };

  const handleResendOTP = () => {
    if (resendTimer === 0) {
      setResendTimer(30);
      toast.success('A new code has been sent to your device.');
    }
  };
`;

content = content.replace(
  /const \[code2FA, setCode2FA\] = useState\(''\);\s*const \[showPassword, setShowPassword\] = useState\(false\);/,
  stateLogicReplacement
);

// Replace requires2FA JSX
const old2FAJSX = `            {requires2FA ? (
              <div className="space-y-4">
                <input 
                  type="text" 
                  maxLength={6}
                  value={code2FA}
                  onChange={(e) => setCode2FA(e.target.value.replace(/\\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center text-3xl tracking-[0.5em] font-mono py-4 bg-[#09090B] border border-[#232734] rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                  autoFocus
                />
              </div>
            )`;

const new2FAJSX = `            {requires2FA ? (
              <div className="space-y-6">
                <div className="flex justify-between gap-2 sm:gap-3">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      maxLength={1}
                      value={code2FA[index] || ''}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-[#09090B] border border-[#232734] rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <p className="text-xs text-slate-400 font-medium">
                    Didn't receive the code?
                  </p>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendTimer > 0}
                    className={\`text-xs font-bold transition-colors \${resendTimer > 0 ? 'text-slate-600 cursor-not-allowed' : 'text-indigo-400 hover:text-indigo-300'}\`}
                  >
                    {resendTimer > 0 ? \`Resend in \${resendTimer}s\` : 'Resend Code'}
                  </button>
                </div>
              </div>
            )`;

content = content.replace(old2FAJSX, new2FAJSX);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed OTP Verification UX');
