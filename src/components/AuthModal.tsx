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
  CheckCircle2
} from 'lucide-react';
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
  };

  // Reset states on modal close
  useEffect(() => {
    if (!isAuthModalOpen) {
      setError(null);
      setIsLoading(false);
      setQrDataUrl(null);
      setQrExpiresIn(0);
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
                dark: '#0f172a',
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

  const handleUseDemoAccount = () => {
    const demoSession = {
      apiId: 2040,
      apiHash: 'b18441a1ff607e10a989891a5462e627',
      sessionString: '1BVtsDemoSessionKey983712398127391823...',
      channelId: '2093810291',
      channelTitle: 'Demo Cloud Library',
      phone: '+1 555-0199',
    };
    setSession(demoSession);
    setIsAuthModalOpen(false);
  };

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-500 dark:text-sky-400 flex items-center justify-center font-bold text-sm">
              TG
            </div>
            <div>
              <h3 className="text-base font-semibold">Sign in with Telegram</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Connects directly via client MTProto WebSocket</p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[78vh]">
          {/* Privacy Guarantee Banner */}
          <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-500/30 text-xs text-sky-900 dark:text-sky-200 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Direct Telegram MTProto Connection</span>
            </div>
            <p className="text-[11px] leading-relaxed text-sky-800/80 dark:text-sky-300/80">
              Your browser communicates directly with Telegram servers over WSS. No middleman server ever receives your credentials, session keys, or media files.
            </p>
          </div>

          {/* Quick Keys Option */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs">
            <div className="space-y-0.5">
              <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Need quick Telegram API keys?</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                You can auto-fill standard Telegram Desktop keys or use your own.
              </div>
            </div>
            <button
              type="button"
              onClick={useOfficialAppKeys}
              className="text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
            >
              Fill API Keys
            </button>
          </div>

          {/* Tab Selector: Phone / QR Code */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('credentials');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                authMethod === 'credentials'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
              className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                authMethod === 'qr'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code (Official)</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {authMethod === 'credentials' ? (
            step === 'creds' ? (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">API ID</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 2040"
                      value={apiId}
                      onChange={(e) => setApiId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">API Hash</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. b18441..."
                      value={apiHash}
                      onChange={(e) => setApiHash(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <label>Phone Number (International format)</label>
                    <span className="text-[11px] text-slate-400 font-normal">e.g. +15551234567</span>
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="+1 555 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-medium text-xs py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isLoading ? 'Requesting Code from Telegram...' : 'Send Verification Code'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Verification Code ({isCodeViaApp ? 'Sent via Telegram App' : 'Sent via SMS'})
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus={step === 'code'}
                    placeholder="Enter 5-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-center text-lg font-mono tracking-widest focus:outline-none focus:border-sky-500"
                  />
                </div>

                {step === '2fa' && (
                  <div className="space-y-2 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
                      <label className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>2FA Cloud Password</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-normal text-[11px]"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showPassword ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      placeholder="Enter your 2FA Cloud Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-600/50 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-slate-900 dark:text-slate-100"
                    />
                    <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                      This password is encrypted client-side using SRP-6A before being verified by Telegram.
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
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
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs py-2.5 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-2/3 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-medium text-xs py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>
                      {isLoading
                        ? 'Verifying with Telegram...'
                        : step === '2fa'
                        ? 'Verify Cloud Password & Sign In'
                        : 'Sign In'}
                    </span>
                  </button>
                </div>
              </form>
            )
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 text-center py-2">
              {isQrLoading ? (
                <div className="w-60 h-60 flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl space-y-3">
                  <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Connecting to Telegram MTProto...</span>
                </div>
              ) : qrDataUrl ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="p-3 bg-white rounded-2xl shadow-lg border border-slate-200">
                    <img src={qrDataUrl} alt="Telegram Login QR Code" className="w-52 h-52 object-contain" />
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p className="font-semibold">Scan with your Telegram mobile app:</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Settings → Devices → <strong>Link Desktop Device</strong>
                    </p>
                  </div>
                  {qrExpiresIn > 0 ? (
                    <div className="text-[11px] text-slate-400">
                      Code expires in <span className="font-mono font-semibold text-sky-500">{qrExpiresIn}s</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-500 font-medium">
                      QR code expired. Please refresh.
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleStartQrLogin}
                    className="text-xs text-sky-500 hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh QR Code
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStartQrLogin}
                  className="bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors"
                >
                  Generate Telegram QR Code
                </button>
              )}

              {qrNeeds2fa && (
                <form onSubmit={handleQrPasswordSubmit} className="w-full max-w-xs space-y-2 pt-2 text-left">
                  <label className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> 2FA Password Required
                  </label>
                  <input
                    type="password"
                    placeholder="Enter Cloud Password"
                    value={qrPassword}
                    onChange={(e) => setQrPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold py-2 rounded-lg"
                  >
                    Submit 2FA Password
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Demo Fallback Option */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Want to test the UI offline?</span>
            <button
              type="button"
              onClick={handleUseDemoAccount}
              className="text-sky-500 hover:underline font-medium"
            >
              Launch Demo Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
