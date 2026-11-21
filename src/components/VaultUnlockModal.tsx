import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const VaultUnlockModal: React.FC = () => {
  const { isVaultLocked, unlockVault, panicWipe } = useApp();
  const [passphrase, setPassphrase] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  if (!isVaultLocked) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) return;

    setError(null);
    setIsUnlocking(true);

    try {
      await unlockVault(passphrase);
      setPassphrase('');
    } catch (err: any) {
      setError(err?.message || 'Incorrect passphrase. Failed to decrypt vault.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handlePanicWipe = () => {
    if (confirm('DANGER: Panic Wipe will instantly destroy all local database records, session keys, and cache. Proceed?')) {
      panicWipe();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-slate-100 flex flex-col p-6 space-y-6">
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Security Vault Locked</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Your Telegram MTProto session is encrypted at rest using AES-256-GCM. Enter your vault passphrase to unlock.
            </p>
          </div>
        </div>

        {/* Anti-Phishing Security Badge */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-xs">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Zero-Knowledge Client Encryption</span>
          </div>
          <p>Keys are derived client-side via PBKDF2 (100,000 iterations). No plaintext keys are ever transmitted.</p>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Vault Passphrase</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPass ? 'text' : 'password'}
                autoFocus
                value={passphrase}
                onChange={(e) => {
                  setPassphrase(e.target.value);
                  setError(null);
                }}
                placeholder="Enter your passphrase..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!passphrase.trim() || isUnlocking}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white font-medium text-xs shadow-lg shadow-sky-500/20 transition-all active:scale-[0.98]"
          >
            {isUnlocking ? 'Decrypting Session...' : 'Unlock Vault'}
          </button>
        </form>

        {/* Emergency Actions Footer */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">Forgot passphrase?</span>
          <button
            type="button"
            onClick={handlePanicWipe}
            className="text-rose-400 hover:text-rose-300 font-medium hover:underline text-[11px]"
          >
            Nuclear Panic Wipe
          </button>
        </div>
      </div>
    </div>
  );
};
