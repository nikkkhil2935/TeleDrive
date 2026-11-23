import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  ShieldCheck,
  Smartphone,
  QrCode,
  Lock,
  Sparkles,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  Check,
  ArrowLeft,
  KeyRound,
  Send
} from 'lucide-react';
import { FramelyLogo } from './FramelyLogo';
import { useApp } from '../context/AppContext';
import {
  sendTelegramPhoneCode,
  verifyTelegramCodeAndSignIn,
  startTelegramQrLogin
} from '../services/tgClient';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, setSession } = useApp();

  const [authMethod, setAuthMethod] = useState<'credentials' | 'qr'>('credentials');
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [isCodeViaApp, setIsCodeViaApp] = useState(true);
  const [step, setStep] = useState<'creds' | 'code' | '2fa'>('creds');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keysFilled, setKeysFilled] = useState(false);

  // QR Login State
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrExpiresIn, setQrExpiresIn] = useState<number>(0);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const qrPasswordResolverRef = useRef<((pass: string) => void) | null>(null);
  const [qrNeeds2fa, setQrNeeds2fa] = useState(false);
  const [qrPassword, setQrPassword] = useState('');

  // Default official public test credentials option (Telegram Desktop API keys)
  const TELEGRAM_DESKTOP_API_ID = '2040';
  const TELEGRAM_DESKTOP_API_HASH = 'b18441a1ff607e10a989891a5462e627';

  // Fill default official API credentials if empty
  const useOfficialAppKeys = () => {
    setApiId(TELEGRAM_DESKTOP_API_ID);
    setApiHash(TELEGRAM_DESKTOP_API_HASH);
    setError(null);
    setKeysFilled(true);
    setTimeout(() => setKeysFilled(false), 2500);
  };

  // Reset states on modal close
  useEffect(() => {
    if (!isAuthModalOpen) {
      setError(null);
      setIsLoading(false);
      setQrDataUrl(null);
      setQrExpiresIn(0);
      setStep('creds');
      setCode('');
      setPassword('');
    }
  }, [isAuthModalOpen]);

  // QR countdown timer
  useEffect(() => {
    if (qrExpiresIn <= 0) return;
    const timer = setInterval(() => {
      setQrExpiresIn((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [qrExpiresIn]);

  // Handle Request Code via Real GramJS
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanApiId = parseInt(apiId.trim(), 10);
    const cleanApiHash = apiHash.trim();
    const cleanPhone = phone.trim();

    if (!cleanApiId || !cleanApiHash || !cleanPhone) {
      setError('Please provide API ID, API Hash, and Phone Number in international format (e.g. +15551234567).');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await sendTelegramPhoneCode(cleanApiId, cleanApiHash, cleanPhone);
      setPhoneCodeHash(res.phoneCodeHash);
      setIsCodeViaApp(res.isCodeViaApp);
      setStep('code');
    } catch (err: any) {
      console.error('sendCode error:', err);
      setError(err.message || 'Failed to send Telegram login code. Check your phone number and API credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Verify Code via Real GramJS
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the code sent to your Telegram app or SMS.');
      return;
    }

    if (step === '2fa' && !password.trim()) {
      setError('Please enter your 2FA Cloud Password.');
      return;
    }

    const cleanApiId = parseInt(apiId.trim(), 10);
    const cleanApiHash = apiHash.trim();

    setIsLoading(true);
    setError(null);

    try {
      const session = await verifyTelegramCodeAndSignIn(
        cleanApiId,
        cleanApiHash,
        phone.trim(),
        code.trim(),
        phoneCodeHash,
        password ? password.trim() : undefined
      );

      setSession(session);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('SignIn error:', err);
      if (err.message === '2FA_REQUIRED') {
        setStep('2fa');
        setError('Your Telegram account requires 2FA Cloud Password.');
      } else if (err.message && err.message.includes('PASSWORD_HASH_INVALID')) {
        setStep('2fa');
        setError('Incorrect 2FA Cloud Password. Please try again.');
      } else if (err.message && err.message.includes('PHONE_CODE_INVALID')) {
        setError('Invalid verification code. Please check the code received in Telegram.');
      } else if (err.message && err.message.includes('PHONE_CODE_EXPIRED')) {
        setError('Verification code has expired. Please go back and request a new code.');
      } else {
        setError(err.message || 'Verification failed. Please check the code.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Start Real Telegram QR Login
  const handleStartQrLogin = async () => {
    const cleanApiId = parseInt((apiId || TELEGRAM_DESKTOP_API_ID).trim(), 10);
    const cleanApiHash = (apiHash || TELEGRAM_DESKTOP_API_HASH).trim();

    setIsQrLoading(true);
    setError(null);
    setQrDataUrl(null);
    setQrNeeds2fa(false);

    try {
      startTelegramQrLogin(
        cleanApiId,
        cleanApiHash,
        async (qrUrl, expires) => {
          try {
            const dataUrl = await QRCode.toDataURL(qrUrl, {
              width: 240,
              margin: 1,
              color: {
                dark: '#07080B',
                light: '#ffffff',
              },
            });
            setQrDataUrl(dataUrl);
            setQrExpiresIn(Math.max(10, expires - Math.floor(Date.now() / 1000)));
            setIsQrLoading(false);
          } catch (e) {
            console.error('Failed to generate QR image:', e);
          }
        },
        async () => {
          // Password needed handler
          setQrNeeds2fa(true);
          return new Promise<string>((resolve) => {
            qrPasswordResolverRef.current = resolve;
          });
        }
      ).then((session) => {
        setSession(session);
        setIsAuthModalOpen(false);
      }).catch((err) => {
        console.error('QR login process failed:', err);
        setError(err.message || 'QR code expired or login cancelled.');
        setIsQrLoading(false);
      });
    } catch (err: any) {
      setError(err.message || 'Failed to start QR login.');
      setIsQrLoading(false);
    }
  };

  const handleQrPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qrPasswordResolverRef.current && qrPassword.trim()) {
      qrPasswordResolverRef.current(qrPassword.trim());
      setQrNeeds2fa(false);
    } else {
      setError('Please enter your Cloud Password.');
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-[#0F1015]/95 backdrop-blur-3xl border border-white/[0.08] text-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col relative transition-all duration-300">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            {/* Pure Framely Logo - No Enclosing Box */}
            <div className="shrink-0 hover:rotate-12 transition-transform duration-300">
              <FramelyLogo className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold tracking-tight text-white">Sign in with Telegram</h3>
              <p className="text-xs text-white/50">Direct client-to-datacenter MTProto • Zero knowledge</p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            aria-label="Close"
            className="text-white/40 hover:text-white p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4.5 overflow-y-auto max-h-[78vh] scrollbar-thin relative z-10">
          {/* Privacy Guarantee Card */}
          <div className="p-4 rounded-2xl bg-sky-500/[0.06] border border-sky-500/20 text-xs text-sky-200 space-y-1.5">
            <div className="font-semibold flex items-center gap-2 text-sky-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Direct Telegram MTProto Connection</span>
            </div>
            <p className="text-[11px] leading-relaxed text-sky-200/80">
              Your browser communicates directly with official Telegram servers over encrypted WSS. No middleman server ever receives your credentials, session keys, or media files.
            </p>
          </div>

          {/* Quick Keys Helper */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-xs">
            <div className="space-y-0.5 pr-2">
              <div className="font-medium text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Need quick Telegram API keys?</span>
              </div>
              <div className="text-[11px] text-white/40">
                You can auto-fill standard Telegram Desktop keys or use your own.
              </div>
            </div>
            <button
              type="button"
              onClick={useOfficialAppKeys}
              className={`text-xs font-medium px-3 py-1.5 rounded-xl transition-all shrink-0 active:scale-95 flex items-center gap-1.5 ${
                keysFilled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/[0.08] hover:bg-white/[0.14] text-white/90 border border-white/10'
              }`}
            >
              {keysFilled ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <KeyRound className="w-3.5 h-3.5 text-amber-400" />}
              <span>{keysFilled ? 'Keys Applied' : 'Fill API Keys'}</span>
            </button>
          </div>

          {/* Tab Selector: Phone / QR Code */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/[0.08] text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('credentials');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
                authMethod === 'credentials'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold shadow-md shadow-sky-500/25'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Phone Number</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('qr');
                setError(null);
                if (!qrDataUrl) handleStartQrLogin();
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
                authMethod === 'qr'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold shadow-md shadow-sky-500/25'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code (Official)</span>
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {authMethod === 'credentials' ? (
            step === 'creds' ? (
              <form onSubmit={handleRequestCode} className="space-y-4 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                      API ID
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 2040"
                      value={apiId}
                      onChange={(e) => setApiId(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-mono transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                      API Hash
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="e.g. b18441..."
                      value={apiHash}
                      onChange={(e) => setApiHash(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 font-mono focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="font-semibold uppercase tracking-wider text-white/50">
                      Phone Number (International format)
                    </label>
                    <span className="text-white/40 font-mono">e.g. +15551234567</span>
                  </div>
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="+1 555 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-mono transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-400 hover:via-sky-500 hover:to-blue-500 disabled:opacity-50 text-white font-medium text-xs sm:text-sm py-3 rounded-xl shadow-lg shadow-sky-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Requesting Code from Telegram...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Verification Code</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4 pt-1">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-medium text-white/80">
                      Telegram Login Code
                    </label>
                    <span className="text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                      {isCodeViaApp ? 'Telegram In-App Notification' : 'SMS Message'}
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus={step === 'code'}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    spellCheck={false}
                    placeholder="• • • • •"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-black/60 border border-sky-500/40 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-[0.4em] font-bold text-sky-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 transition-all placeholder-white/20"
                  />
                  <p className="text-[11px] text-white/40 text-center">
                    Check your other Telegram clients or messages for the login code.
                  </p>
                </div>

                {step === '2fa' && (
                  <div className="space-y-2 p-4 rounded-2xl bg-amber-500/[0.07] border border-amber-500/30 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
                      <label className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>2FA Cloud Password</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="text-amber-400 hover:underline flex items-center gap-1 font-normal text-[11px]"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showPassword ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      autoComplete="current-password"
                      placeholder="Enter your 2FA Cloud Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/50 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-400 text-white placeholder-white/30"
                    />
                    <p className="text-[11px] text-amber-200/70">
                      This password is encrypted client-side using SRP-6A before being verified by Telegram.
                    </p>
                  </div>
                )}

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (step === '2fa') {
                        setStep('code');
                      } else {
                        setStep('creds');
                      }
                      setError(null);
                    }}
                    className="w-1/3 bg-white/[0.06] hover:bg-white/[0.1] text-white/80 hover:text-white text-xs font-medium py-3 rounded-xl border border-white/[0.08] transition-all flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-2/3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white font-medium text-xs sm:text-sm py-3 rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>
                      {isLoading
                        ? 'Verifying with Telegram...'
                        : step === '2fa'
                        ? 'Verify Password & Sign In'
                        : 'Sign In'}
                    </span>
                  </button>
                </div>
              </form>
            )
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 text-center py-2">
              {isQrLoading ? (
                <div className="w-60 h-60 flex flex-col items-center justify-center border border-dashed border-white/20 rounded-3xl space-y-3 bg-white/[0.02]">
                  <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                  <span className="text-xs text-white/50">Connecting to Telegram MTProto...</span>
                </div>
              ) : qrDataUrl ? (
                <div className="flex flex-col items-center space-y-3.5">
                  <div className="p-3.5 bg-white rounded-3xl shadow-2xl border-4 border-white/10 ring-4 ring-sky-500/20">
                    <img src={qrDataUrl} alt="Telegram Login QR Code" className="w-52 h-52 object-contain rounded-xl" />
                  </div>

                  <div className="text-xs text-white/80 space-y-1.5 max-w-xs">
                    <p className="font-semibold text-white">Scan with your Telegram mobile app:</p>
                    <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/60">
                      Settings → Devices → <strong className="text-sky-400">Link Desktop Device</strong>
                    </div>
                  </div>

                  {qrExpiresIn > 0 ? (
                    <div className="text-[11px] text-white/50 flex items-center gap-1.5">
                      <span>Code expires in</span>
                      <span className="font-mono font-semibold text-sky-400 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
                        {qrExpiresIn}s
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-400 font-medium">
                      QR code expired. Please refresh.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleStartQrLogin}
                    className="text-xs text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1.5 font-medium py-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh QR Code</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStartQrLogin}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Generate Telegram QR Code</span>
                </button>
              )}

              {qrNeeds2fa && (
                <form onSubmit={handleQrPasswordSubmit} className="w-full max-w-xs space-y-2 pt-2 text-left">
                  <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>2FA Password Required</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter Cloud Password"
                    value={qrPassword}
                    onChange={(e) => setQrPassword(e.target.value)}
                    className="w-full bg-black/50 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-400 text-white placeholder-white/30"
                  />
                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs py-2.5 rounded-xl transition-all shadow-md"
                  >
                    Submit 2FA Password
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
