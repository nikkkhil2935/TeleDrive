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
  EyeOff
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

  // Step 5: Recovery Kit
  const [hasSavedRecoveryKit, setHasSavedRecoveryKit] = useState(false);

  // Temporary authenticated session holding until passphrase is set
  const [tempSession, setTempSession] = useState<any>(null);

  // Default official keys helper
  const OFFICIAL_API_ID = '2040';
  const OFFICIAL_API_HASH = 'b18441a1ff607e10a989891a5462e627';

  useEffect(() => {
    // Calculate passphrase strength
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
      setQrExpiresIn(prev => (prev <= 1 ? 0 : prev - 1));
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
      setStep(4); // Move to passphrase step
    } catch (err: any) {
      if (err.message === '2FA_REQUIRED' || (err.message && err.message.includes('2FA'))) {
        setNeedsTwoFa(true);
        setAuthError('Your Telegram account requires 2FA Cloud Password.');
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
      ).then((session) => {
        setTempSession(session);
        setStep(4);
      }).catch((err) => {
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

SECURITY WARNING:
Framely is a zero-knowledge local client. We run zero servers
and store none of your keys. Only your device holds this passphrase.

Your Configured Passphrase:
-----------------------------------------------------
${passphrase || '(Skipped Passphrase - Plain Local Storage)'}
-----------------------------------------------------

To restore your library on any new device:
1. Open Framely (https://localhost:3000 or your hosted domain)
2. Sign in to your Telegram account
3. Enter your vault passphrase
4. Click 'Rebuild Library Index' to reconstruct all metadata
   directly from your Telegram channel captions in seconds.
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

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="t-modal-content bg-[#FFFFFF] dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/60 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors">
        {/* Progress Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-sky-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold">Welcome to Framely</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  Step {step} of {totalSteps}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {step === 1 && 'Your private photos, in your own Telegram'}
                {step === 2 && 'Connect Telegram API credentials'}
                {step === 3 && 'Sign in to your Telegram account'}
                {step === 4 && 'Create your zero-knowledge passphrase'}
                {step === 5 && 'Download your recovery emergency kit'}
                {step === 6 && 'Bring your photos and videos'}
                {step === 7 && 'Ready! Guided tour of your library'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOnboardingOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
          <div
            className="bg-sky-500 h-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[70vh]">
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="space-y-6 text-center py-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-xl shadow-sky-500/25 text-white">
                <Layers className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Your photos, in your own Telegram.
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Private, fast, and free forever. Framely gives you a fluid Google Photos-style library backed by your unlimited Telegram cloud storage.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-lg mx-auto">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <ShieldCheck className="w-5 h-5 text-sky-500 mb-2" />
                  <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">Zero Middlemen</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Direct MTProto WSS from browser to Telegram DCs.</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <Lock className="w-5 h-5 text-indigo-500 mb-2" />
                  <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">Zero Knowledge</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">AES-256-GCM vault encryption protects sessions & keys.</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <Sparkles className="w-5 h-5 text-amber-500 mb-2" />
                  <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">Original Quality</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Stored as uncompressed documents with full EXIF data.</div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-sm shadow-md shadow-sky-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Get Started (3 min)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('framely_onboarding_completed', 'true');
                    setIsOnboardingOpen(false);
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
                >
                  I already have a library
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CONNECT TELEGRAM KEYS */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-700 dark:text-sky-300 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Why do I need Telegram API keys?</span>
                  <p className="mt-1 leading-relaxed text-[11px]">
                    Telegram requires every MTProto application to identify with an <code>api_id</code> and <code>api_hash</code>. You can generate your own personal keys in 60 seconds from Telegram, or use official standard keys below.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Quick options:</span>
                <button
                  onClick={handleFillOfficialKeys}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-medium"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Standard Keys Applied!' : 'Use Standard Desktop Keys'}</span>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    API ID (numeric)
                  </label>
                  <input
                    type="text"
                    value={apiId}
                    onChange={(e) => setApiId(e.target.value)}
                    placeholder="e.g. 2040"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    API HASH (32 hex characters)
                  </label>
                  <input
                    type="text"
                    value={apiHash}
                    onChange={(e) => setApiHash(e.target.value)}
                    placeholder="e.g. b18441a1ff607e10a989891a5462e627"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Want your own personal keys?</span>
                <a
                  href="https://my.telegram.org"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1 hover:underline"
                >
                  <span>Open my.telegram.org</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* STEP 3: LOGIN (PHONE OR QR) */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                <button
                  onClick={() => setLoginMethod('phone')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    loginMethod === 'phone'
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> Phone Number
                </button>
                <button
                  onClick={() => {
                    setLoginMethod('qr');
                    handleStartQr();
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    loginMethod === 'qr'
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <QrCode className="w-4 h-4" /> QR Code (Official)
                </button>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {loginMethod === 'phone' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number (international with country code)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 555 123 4567"
                        className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                      <button
                        onClick={handleSendPhoneCode}
                        disabled={isAuthLoading || !phone}
                        className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-xs font-semibold transition-all shrink-0"
                      >
                        {isAuthLoading ? 'Sending...' : phoneCodeHash ? 'Resend' : 'Send Code'}
                      </button>
                    </div>
                  </div>

                  {phoneCodeHash && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Telegram Verification Code (sent to your Telegram app)
                      </label>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="5-digit code"
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono tracking-widest text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  )}

                  {needsTwoFa && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        2FA Cloud Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={twoFaPassword}
                          onChange={(e) => setTwoFaPassword(e.target.value)}
                          placeholder="Your 2FA Password"
                          className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 pr-9 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-3 text-center space-y-3">
                  {qrDataUrl ? (
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                        <img src={qrDataUrl} alt="Telegram QR Login" className="w-48 h-48 rounded-lg" />
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Scan from Telegram Mobile: <b>Settings → Devices → Link Desktop Device</b>
                      </div>
                      {qrExpiresIn > 0 && (
                        <div className="text-[11px] text-amber-500 font-medium mt-1">
                          Expires in {qrExpiresIn}s
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
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
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300">
                <span className="font-bold flex items-center gap-1.5 mb-1">
                  <Lock className="w-4 h-4" /> Client-Side Zero Knowledge Encryption
                </span>
                Your passphrase encrypts your Telegram session on this browser with AES-256-GCM. Even if someone inspects this computer, your library cannot be decrypted without this key.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Create Master Passphrase
                </label>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="At least 8 characters..."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  <span>Passphrase Strength</span>
                  <span className="font-semibold">
                    {passStrength <= 25 && 'Weak'}
                    {passStrength === 50 && 'Fair'}
                    {passStrength === 70 && 'Good'}
                    {passStrength >= 75 && 'Strong'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Passphrase
                </label>
                <input
                  type="password"
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="Repeat passphrase..."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          {/* STEP 5: RECOVERY KIT */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <KeyRound className="w-4 h-4 text-sky-500" />
                  <span>Framely Emergency Recovery Kit</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Because Framely has zero access to your master keys, no one can reset your password if forgotten. Save this one-page sheet to keep your memories secure.
                </p>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleDownloadRecoveryKit}
                    className="flex-1 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download (.txt)
                  </button>
                  <button
                    onClick={handlePrintRecoveryKit}
                    className="flex-1 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSavedRecoveryKit}
                  onChange={(e) => setHasSavedRecoveryKit(e.target.checked)}
                  className="rounded text-sky-500 mt-0.5"
                />
                <span className="text-xs text-sky-800 dark:text-sky-200 font-medium">
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
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-8 hover:border-sky-500 dark:hover:border-sky-400 bg-slate-50/50 dark:bg-slate-800/20 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Drag and drop your photos here
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Or select from your files · High quality original uncompressed storage
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
                  className="mt-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs cursor-pointer shadow-sm transition-all"
                >
                  Browse Files
                </label>
              </div>

              <div className="text-xs text-slate-400">
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  You're all set!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Your Framely library is fully initialized and backed by your private Telegram cloud.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 text-left max-w-md mx-auto">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center shrink-0">1</div>
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <b>Fast date scrubber:</b> Use the vertical bar on the right to jump smoothly across years.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</div>
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <b>Command Palette:</b> Press <code>Ctrl + K</code> or <code>Cmd + K</code> anytime to search or trigger actions.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center shrink-0">3</div>
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <b>Lock at anytime:</b> Press <code>Ctrl + L</code> to zeroize keys from memory when leaving your desk.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              onClick={() => {
                if (step === 2) {
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
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all"
            >
              <span>{step === 3 && loginMethod === 'phone' && !phoneCodeHash ? 'Next: Send Code' : 'Continue'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleCompleteOnboarding}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-sky-500/25 transition-all"
            >
              <span>Open My Photos</span>
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
