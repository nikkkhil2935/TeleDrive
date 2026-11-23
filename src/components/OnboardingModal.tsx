import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Sparkles,
  ShieldCheck,
  KeyRound,
  QrCode,
  Smartphone,
  Download,
  Printer,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  ExternalLink,
  Lock,
  Layers,
  HelpCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Flame,
  Shield,
  FileText,
  Search,
  Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  sendTelegramPhoneCode,
  verifyTelegramCodeAndSignIn,
  startTelegramQrLogin
} from '../services/tgClient';

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, setSession, uploadFiles } = useApp();

  const [step, setStep] = useState<number>(1);
  const totalSteps = 7;

  // Step 2: API Keys
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Step 3: Login
  const [loginMethod, setLoginMethod] = useState<'phone' | 'qr'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [twoFaPassword, setTwoFaPassword] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [needsTwoFa, setNeedsTwoFa] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // QR Login
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrExpiresIn, setQrExpiresIn] = useState<number>(0);
  const qrPasswordResolverRef = useRef<((pass: string) => void) | null>(null);

  // Step 4: Passphrase
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [passStrength, setPassStrength] = useState<number>(0);
  const [showPassphrase, setShowPassphrase] = useState(false);

  // Step 5: Recovery Kit
  const [hasSavedRecoveryKit, setHasSavedRecoveryKit] = useState(false);

  // Temporary authenticated session holding until passphrase is set
  const [tempSession, setTempSession] = useState<any>(null);

  // Default official keys helper
  const OFFICIAL_API_ID = '2040';
  const OFFICIAL_API_HASH = 'b18441a1ff607e10a989891a5462e627';

  useEffect(() => {
    let score = 0;
    if (passphrase.length >= 8) score += 25;
    if (passphrase.length >= 12) score += 25;
    if (/[A-Z]/.test(passphrase) && /[a-z]/.test(passphrase)) score += 25;
    if (/[0-9]/.test(passphrase) || /[^A-Za-z0-9]/.test(passphrase)) score += 25;
    setPassStrength(score);
  }, [passphrase]);

  // QR timer
  useEffect(() => {
    if (qrExpiresIn <= 0) return;
    const timer = setInterval(() => {
      setQrExpiresIn((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [qrExpiresIn]);

  if (!isOnboardingOpen) return null;

  const handleFillOfficialKeys = () => {
    setApiId(OFFICIAL_API_ID);
    setApiHash(OFFICIAL_API_HASH);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSendPhoneCode = async () => {
    const cleanId = parseInt(apiId.trim() || OFFICIAL_API_ID, 10);
    const cleanHash = apiHash.trim() || OFFICIAL_API_HASH;
    const cleanPhone = phone.trim();

    if (!cleanPhone) {
      setAuthError('Please enter your phone number with country code (e.g. +1234567890)');
      return;
    }

    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const res = await sendTelegramPhoneCode(cleanId, cleanHash, cleanPhone);
      setPhoneCodeHash(res.phoneCodeHash);
      setAuthError(null);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to send verification code. Check phone format.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    const cleanId = parseInt(apiId.trim() || OFFICIAL_API_ID, 10);
    const cleanHash = apiHash.trim() || OFFICIAL_API_HASH;

    if (!code.trim()) {
      setAuthError('Please enter the verification code sent to your Telegram app.');
      return;
    }

    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const session = await verifyTelegramCodeAndSignIn(
        cleanId,
        cleanHash,
        phone.trim(),
        code.trim(),
        phoneCodeHash,
        twoFaPassword ? twoFaPassword.trim() : undefined
      );
      setTempSession(session);
      setStep(4);
    } catch (err: any) {
      if (err.message === '2FA_REQUIRED' || (err.message && err.message.includes('2FA'))) {
        setNeedsTwoFa(true);
        setAuthError('Your Telegram account requires your 2FA Cloud Password.');
      } else {
        setAuthError(err.message || 'Verification failed. Please re-check code.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleStartQr = async () => {
    const cleanId = parseInt(apiId.trim() || OFFICIAL_API_ID, 10);
    const cleanHash = apiHash.trim() || OFFICIAL_API_HASH;

    setIsAuthLoading(true);
    setAuthError(null);

    try {
      startTelegramQrLogin(
        cleanId,
        cleanHash,
        async (qrUrl, expires) => {
          try {
            const dataUrl = await QRCode.toDataURL(qrUrl, {
              width: 220,
              margin: 1,
              color: { dark: '#0f172a', light: '#ffffff' }
            });
            setQrDataUrl(dataUrl);
            setQrExpiresIn(Math.max(10, expires - Math.floor(Date.now() / 1000)));
            setIsAuthLoading(false);
          } catch (e) {
            console.error('QR code render error:', e);
          }
        },
        async () => {
          setNeedsTwoFa(true);
          return new Promise<string>((resolve) => {
            qrPasswordResolverRef.current = resolve;
          });
        }
      )
        .then((session) => {
          setTempSession(session);
          setStep(4);
        })
        .catch((err) => {
          setAuthError(err.message || 'QR code expired or cancelled.');
          setIsAuthLoading(false);
        });
    } catch (err: any) {
      setAuthError(err.message || 'Failed to start QR login.');
      setIsAuthLoading(false);
    }
  };

  const handleDownloadRecoveryKit = () => {
    const recoveryText = `=====================================================
FRAMELY EMERGENCY RECOVERY KIT & SECURITY SHEET
Stores your files in your own Telegram account.
Not affiliated with Telegram or Google.
=====================================================

Date Created: ${new Date().toUTCString()}
Library Target: Telegram Channel ${tempSession?.channelId || 'Private Cloud'}
Vault Encryption: AES-256-GCM (100,000 PBKDF2 Iterations)

SECURITY GUARANTEE:
Framely is a zero-knowledge local client. We run zero servers
and store none of your keys. Only your device holds this passphrase.

Your Configured Passphrase:
-----------------------------------------------------
${passphrase || '(Skipped Passphrase - Plain Local Storage)'}
-----------------------------------------------------

To restore your library on any device:
1. Open Framely (https://telegram-drive-three.vercel.app or local instance)
2. Sign in to your Telegram account
3. Enter your vault passphrase
4. Click 'Rebuild Library Index' to reconstruct all metadata
   directly from your Telegram channel in seconds.
=====================================================`;

    const blob = new Blob([recoveryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `framely-recovery-kit-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setHasSavedRecoveryKit(true);
  };

  const handlePrintRecoveryKit = () => {
    window.print();
    setHasSavedRecoveryKit(true);
  };

  const handleCompleteOnboarding = () => {
    localStorage.setItem('framely_onboarding_completed', 'true');
    if (tempSession) {
      setSession(tempSession, passphrase ? passphrase.trim() : undefined);
    }
    setIsOnboardingOpen(false);
  };

  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(Array.from(e.dataTransfer.files));
      setStep(7);
    }
  };

  const stepTitles = [
    'Welcome',
    'Telegram API Keys',
    'Sign In',
    'Vault Passphrase',
    'Recovery Kit',
    'Upload Media',
    'Ready'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150">
      <div className="t-modal-content bg-white dark:bg-[#1E1F20] dark:midnight:bg-[#0A0A0A] border border-slate-200/90 dark:border-white/[0.08] rounded-[28px] max-w-2xl w-full overflow-hidden shadow-[0_25px_65px_-12px_rgba(0,0,0,0.5)] flex flex-col text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors">
        
        {/* Progress Header */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/10 dark:from-blue-500/25 dark:to-indigo-500/15 border border-blue-500/20 text-[#0B57D0] dark:text-[#A8C7FA] flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#1F1F1F] dark:text-[#F1F3F4]">
                  Welcome to Framely
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 dark:bg-blue-400/15 text-[#0B57D0] dark:text-[#A8C7FA]">
                  Step {step} of {totalSteps}
                </span>
              </div>
              <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6] mt-0.5">
                {step === 1 && 'Your private photos, in your own Telegram'}
                {step === 2 && 'Connect Telegram MTProto API credentials'}
                {step === 3 && 'Sign in to your Telegram account'}
                {step === 4 && 'Create your zero-knowledge master passphrase'}
                {step === 5 && 'Download emergency disaster recovery sheet'}
                {step === 6 && 'Import your high-resolution photos and videos'}
                {step === 7 && 'Ready! Guided quick tour of your new library'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOnboardingOpen(false)}
            aria-label="Close onboarding"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tactile Step Progress Track */}
        <div className="px-5 sm:px-7 pt-2.5 pb-2 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#131314]/80">
          <div className="grid grid-cols-7 gap-1.5 items-center">
            {stepTitles.map((title, idx) => {
              const stepNum = idx + 1;
              const isPast = stepNum < step;
              const isCurrent = stepNum === step;
              return (
                <div key={title} className="flex flex-col gap-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isPast
                        ? 'bg-[#0B57D0] dark:bg-[#A8C7FA]'
                        : isCurrent
                        ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                        : 'bg-slate-200 dark:bg-white/[0.08]'
                    }`}
                  />
                  <span
                    className={`text-[9px] font-medium truncate hidden sm:block ${
                      isCurrent
                        ? 'text-[#0B57D0] dark:text-[#A8C7FA] font-bold'
                        : isPast
                        ? 'text-[#5F6368] dark:text-[#9AA0A6]'
                        : 'text-slate-400 dark:text-white/20'
                    }`}
                  >
                    {title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-7 overflow-y-auto max-h-[66vh] text-xs">
          
          {/* STEP 1: WELCOME & PROPOSITION */}
          {step === 1 && (
            <div className="space-y-6 text-center py-2">
              
              {/* Stageshow Floating Product Mark */}
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-3xl bg-blue-500/20 blur-xl animate-pulse" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 via-sky-500 to-indigo-600 p-0.5 shadow-xl shadow-blue-500/25 flex items-center justify-center">
                  <svg viewBox="0 0 48 48" className="w-11 h-11 drop-shadow-md">
                    <defs>
                      <linearGradient id="onboardSparkGrad" x1="30" y1="8" x2="40" y2="18" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FDD663" />
                        <stop offset="1" stopColor="#F9AB00" />
                      </linearGradient>
                    </defs>
                    <rect x="8" y="8" width="32" height="32" rx="8" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.95" fill="none" />
                    <path
                      d="M10 32L17 23C17.5 22.3 18.5 22.3 19 23L23 28L26.5 24C27 23.4 28 23.4 28.5 24L34 32"
                      stroke="#FFFFFF"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <circle cx="29" cy="18" r="3" fill="url(#onboardSparkGrad)" />
                  </svg>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-2 max-w-lg mx-auto">
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1F1F] dark:text-[#F1F3F4]">
                  Your photos, in your own Telegram.
                </h3>
                <p className="text-xs sm:text-sm text-[#5F6368] dark:text-[#9AA0A6] leading-relaxed">
                  Private, fast, and free forever. Framely gives you a fluid Google Photos-style library backed directly by your unlimited Telegram cloud storage.
                </p>
              </div>

              {/* 3 Value Proposition Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-xl mx-auto pt-1">
                <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#161718] border border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/20 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-2.5">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div className="font-semibold text-xs text-[#1F1F1F] dark:text-[#F1F3F4]">Zero Middlemen</div>
                  <p className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6] mt-1 leading-relaxed">
                    Direct MTProto WSS from your browser to Telegram DCs. No intermediate proxies.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#161718] border border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/20 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-2.5">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <div className="font-semibold text-xs text-[#1F1F1F] dark:text-[#F1F3F4]">Zero Knowledge</div>
                  <p className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6] mt-1 leading-relaxed">
                    Client-side AES-256-GCM hardware encryption protects your session keys at rest.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#161718] border border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/20 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2.5">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                  <div className="font-semibold text-xs text-[#1F1F1F] dark:text-[#F1F3F4]">Original Quality</div>
                  <p className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6] mt-1 leading-relaxed">
                    Stored as uncompressed documents with full EXIF, timestamps & GPS coordinates.
                  </p>
                </div>
              </div>

              {/* Informational reassurance */}
              <div className="pt-2 text-[11px] text-[#5F6368] dark:text-[#9AA0A6]">
                Takes approximately 3 minutes · No credit card required · Open-source local client
              </div>
            </div>
          )}

          {/* STEP 2: CONNECT TELEGRAM KEYS */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-[#0B57D0] dark:text-[#A8C7FA] flex items-start gap-3">
                <HelpCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Why do I need Telegram API credentials?</span>
                  <p className="mt-1 leading-relaxed text-[11px] text-[#5F6368] dark:text-[#C2C7CF]">
                    Telegram MTProto requires every client application to identify with an <code>api_id</code> and <code>api_hash</code>. You can generate personal keys in 60 seconds, or click below to use the standard desktop developer credentials.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5F6368] dark:text-[#9AA0A6]">Quick options:</span>
                <button
                  type="button"
                  onClick={handleFillOfficialKeys}
                  className="text-xs text-[#0B57D0] dark:text-[#A8C7FA] hover:underline flex items-center gap-1.5 font-semibold cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Standard Keys Applied!' : 'Use Standard Desktop Keys'}</span>
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] mb-1.5">
                    API ID (numeric)
                  </label>
                  <input
                    type="text"
                    value={apiId}
                    onChange={(e) => setApiId(e.target.value)}
                    placeholder="e.g. 2040"
                    className="w-full bg-slate-50 dark:bg-[#161718] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#1F1F1F] dark:text-white focus:outline-none focus:border-[#0B57D0] dark:focus:border-[#A8C7FA]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] mb-1.5">
                    API HASH (32 hex characters)
                  </label>
                  <input
                    type="text"
                    value={apiHash}
                    onChange={(e) => setApiHash(e.target.value)}
                    placeholder="e.g. b18441a1ff607e10a989891a5462e627"
                    className="w-full bg-slate-50 dark:bg-[#161718] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#1F1F1F] dark:text-white focus:outline-none focus:border-[#0B57D0] dark:focus:border-[#A8C7FA]"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#161718] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between">
                <span className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">Generate your own keys in Telegram:</span>
                <a
                  href="https://my.telegram.org"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#0B57D0] dark:text-[#A8C7FA] flex items-center gap-1 hover:underline"
                >
                  <span>Open my.telegram.org</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* STEP 3: LOGIN (PHONE OR QR) */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="p-1 bg-slate-100 dark:bg-[#161718] rounded-2xl border border-slate-200/60 dark:border-white/[0.06] grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setLoginMethod('phone')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    loginMethod === 'phone'
                      ? 'bg-white dark:bg-[#282A2C] text-[#0B57D0] dark:text-[#A8C7FA] shadow-xs'
                      : 'text-[#5F6368] dark:text-[#9AA0A6]'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Phone Number</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('qr');
                    handleStartQr();
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    loginMethod === 'qr'
                      ? 'bg-white dark:bg-[#282A2C] text-[#0B57D0] dark:text-[#A8C7FA] shadow-xs'
                      : 'text-[#5F6368] dark:text-[#9AA0A6]'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Official QR Code</span>
                </button>
              </div>

              {authError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {loginMethod === 'phone' ? (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] mb-1.5">
                      Phone Number (international with country code)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 555 123 4567"
                        className="flex-1 bg-slate-50 dark:bg-[#161718] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-[#1F1F1F] dark:text-white focus:outline-none focus:border-[#0B57D0] dark:focus:border-[#A8C7FA]"
                      />
                      <button
                        type="button"
                        onClick={handleSendPhoneCode}
                        disabled={isAuthLoading || !phone}
                        className="px-4 py-2 rounded-xl bg-[#0B57D0] dark:bg-[#A8C7FA] hover:opacity-90 disabled:opacity-50 text-white dark:text-[#041E49] text-xs font-semibold transition-all shrink-0 cursor-pointer"
                      >
                        {isAuthLoading ? 'Sending...' : phoneCodeHash ? 'Resend' : 'Send Code'}
                      </button>
                    </div>
                  </div>

                  {phoneCodeHash && (
                    <div className="animate-in fade-in duration-150">
                      <label className="block text-xs font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] mb-1.5">
                        Verification Code (sent to your Telegram app)
                      </label>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="5-digit code"
                        className="w-full bg-slate-50 dark:bg-[#161718] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs font-mono tracking-widest text-[#1F1F1F] dark:text-white focus:outline-none focus:border-[#0B57D0] dark:focus:border-[#A8C7FA]"
                      />
                    </div>
                  )}

                  {needsTwoFa && (
                    <div className="animate-in fade-in duration-150">
                      <label className="block text-xs font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] mb-1.5">
                        2FA Cloud Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={twoFaPassword}
                          onChange={(e) => setTwoFaPassword(e.target.value)}
                          placeholder="Your 2FA Password"
                          className="w-full bg-slate-50 dark:bg-[#161718] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 pr-10 text-xs text-[#1F1F1F] dark:text-white focus:outline-none focus:border-[#0B57D0] dark:focus:border-[#A8C7FA]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2 text-center space-y-3">
                  {qrDataUrl ? (
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                        <img src={qrDataUrl} alt="Telegram QR Login" className="w-48 h-48 rounded-xl" />
                      </div>
                      <div className="text-xs text-[#5F6368] dark:text-[#9AA0A6] mt-3">
                        Scan from Telegram Mobile: <b>Settings → Devices → Link Desktop Device</b>
                      </div>
                      {qrExpiresIn > 0 && (
                        <div className="text-[11px] text-amber-500 font-semibold mt-1">
                          Expires in {qrExpiresIn}s
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-xs text-[#5F6368] dark:text-[#9AA0A6] flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#0B57D0] border-t-transparent rounded-full animate-spin" />
                      <span>Generating Telegram QR Code...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: PASSPHRASE */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Lock className="w-4 h-4" /> Client-Side Zero Knowledge Encryption
                </span>
                <p className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF] leading-relaxed">
                  Your master passphrase encrypts your Telegram session keys locally with AES-256-GCM (100,000 PBKDF2 iterations). Even if someone inspects this computer, your library cannot be decrypted without this passphrase.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] mb-1.5">
                  Create Master Passphrase
                </label>
                <div className="relative">
                  <input
                    type={showPassphrase ? 'text' : 'password'}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="At least 8 characters..."
                    className="w-full bg-slate-50 dark:bg-[#161718] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 pr-10 text-xs text-[#1F1F1F] dark:text-white focus:outline-none focus:border-[#0B57D0] dark:focus:border-[#A8C7FA]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-[#5F6368] dark:text-[#9AA0A6] mb-1">
                  <span>Passphrase Strength</span>
                  <span className="font-bold">
                    {passStrength <= 25 && 'Weak'}
                    {passStrength === 50 && 'Fair'}
                    {passStrength === 75 && 'Good'}
                    {passStrength === 100 && 'Strong'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/[0.08] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passStrength <= 25
                        ? 'bg-rose-500'
                        : passStrength <= 50
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${passStrength}%` }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] mb-1.5">
                  Confirm Master Passphrase
                </label>
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="Repeat passphrase..."
                  className="w-full bg-slate-50 dark:bg-[#161718] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-[#1F1F1F] dark:text-white focus:outline-none focus:border-[#0B57D0] dark:focus:border-[#A8C7FA]"
                />
              </div>
            </div>
          )}

          {/* STEP 5: RECOVERY KIT */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161718] border border-slate-200/80 dark:border-white/[0.06] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1F1F1F] dark:text-[#F1F3F4]">
                  <KeyRound className="w-4 h-4 text-[#0B57D0] dark:text-[#A8C7FA]" />
                  <span>Framely Emergency Recovery Kit</span>
                </div>
                <p className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6] leading-relaxed">
                  Because Framely has zero access to your master keys, no one can reset your password if forgotten. Save or print this one-page sheet to keep your memories secure.
                </p>

                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadRecoveryKit}
                    className="flex-1 py-2 rounded-xl bg-slate-200/80 dark:bg-white/[0.08] hover:bg-slate-300 dark:hover:bg-white/[0.12] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download (.txt)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintRecoveryKit}
                    className="flex-1 py-2 rounded-xl bg-slate-200/80 dark:bg-white/[0.08] hover:bg-slate-300 dark:hover:bg-white/[0.12] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSavedRecoveryKit}
                  onChange={(e) => setHasSavedRecoveryKit(e.target.checked)}
                  className="rounded text-[#0B57D0] mt-0.5"
                />
                <span className="text-xs text-[#0B57D0] dark:text-[#A8C7FA] font-medium leading-relaxed">
                  I have saved my Recovery Kit safely. I understand that Framely cannot recover my photos without my passphrase.
                </span>
              </label>
            </div>
          )}

          {/* STEP 6: BRING YOUR PHOTOS */}
          {step === 6 && (
            <div className="space-y-4 text-center">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropFiles}
                className="border-2 border-dashed border-slate-300 dark:border-white/[0.15] rounded-3xl p-8 hover:border-[#0B57D0] dark:hover:border-[#A8C7FA] bg-slate-50/50 dark:bg-white/[0.02] transition-all flex flex-col items-center justify-center gap-3 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-[#0B57D0] dark:text-[#A8C7FA] flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#1F1F1F] dark:text-[#F1F3F4]">
                    Drag and drop your photos here
                  </div>
                  <div className="text-xs text-[#5F6368] dark:text-[#9AA0A6] mt-0.5">
                    Original uncompressed storage · High throughput MTProto
                  </div>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      uploadFiles(Array.from(e.target.files));
                      setStep(7);
                    }
                  }}
                  className="hidden"
                  id="onboarding-upload-input"
                />
                <label
                  htmlFor="onboarding-upload-input"
                  className="mt-2 px-5 py-2.5 rounded-full bg-[#0B57D0] dark:bg-[#A8C7FA] text-white dark:text-[#041E49] font-semibold text-xs cursor-pointer shadow-xs hover:opacity-90 transition-all"
                >
                  Browse Files
                </label>
              </div>

              <div className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                You can also import later from Google Takeout or Telegram Saved Messages.
              </div>
            </div>
          )}

          {/* STEP 7: READY & COACH MARKS */}
          {step === 7 && (
            <div className="space-y-5 py-2 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#1F1F1F] dark:text-[#F1F3F4]">
                  You're all set!
                </h3>
                <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6] max-w-sm mx-auto">
                  Your Framely library is fully initialized and backed by your private Telegram cloud.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 text-left max-w-md mx-auto">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161718] border border-slate-200/80 dark:border-white/[0.06] flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0">1</div>
                  <div className="text-xs text-[#1F1F1F] dark:text-[#E3E3E3]">
                    <b>Vertical Date Scrubber:</b> Drag the rail on the right to smoothly jump across years.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161718] border border-slate-200/80 dark:border-white/[0.06] flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</div>
                  <div className="text-xs text-[#1F1F1F] dark:text-[#E3E3E3]">
                    <b>Command Palette:</b> Press <code>Ctrl + K</code> or <code>Cmd + K</code> anytime to jump to filters or albums.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161718] border border-slate-200/80 dark:border-white/[0.06] flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0">3</div>
                  <div className="text-xs text-[#1F1F1F] dark:text-[#E3E3E3]">
                    <b>Instant Security Lock:</b> Press <code>Ctrl + L</code> anytime to zeroize keys from active memory.
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 sm:px-7 py-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between bg-slate-50/70 dark:bg-[#131314]/80">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#1F1F1F] dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('framely_onboarding_completed', 'true');
                setIsOnboardingOpen(false);
              }}
              className="text-xs font-semibold text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#1F1F1F] dark:hover:text-white px-3 py-2 rounded-xl hover:bg-slate-200/40 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              I already have a library
            </button>
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1) {
                  setStep(2);
                } else if (step === 2) {
                  setStep(3);
                } else if (step === 3) {
                  if (loginMethod === 'phone') {
                    if (!phoneCodeHash) handleSendPhoneCode();
                    else handleVerifyPhoneCode();
                  }
                } else if (step === 4) {
                  if (passphrase && passphrase !== confirmPassphrase) {
                    alert('Passphrases do not match.');
                    return;
                  }
                  setStep(5);
                } else if (step === 5) {
                  setStep(6);
                } else if (step === 6) {
                  setStep(7);
                }
              }}
              disabled={
                isAuthLoading ||
                (step === 5 && !hasSavedRecoveryKit) ||
                (step === 4 && passphrase.length > 0 && passphrase !== confirmPassphrase)
              }
              className="gp-btn-primary py-2 px-5 text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>
                {step === 1
                  ? 'Get Started (3 min)'
                  : step === 3 && loginMethod === 'phone' && !phoneCodeHash
                  ? 'Send Verification Code'
                  : 'Continue'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteOnboarding}
              className="gp-btn-primary py-2 px-6 text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Open My Photos</span>
              <Check className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
