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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-[#FFFFFF] dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/60 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-[#1F1F1F] dark:text-[#E3E3E3] flex flex-col p-6 sm:p-7 space-y-6">
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-[#D3E3FD] dark:bg-[#004A77] text-[#0B57D0] dark:text-[#C2E7FF] flex items-center justify-center shadow-xs">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-medium tracking-tight text-[#1F1F1F] dark:text-[#E3E3E3]">Security Vault Locked</h2>
            <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF] mt-1 max-w-xs leading-relaxed">
              Your Telegram MTProto session is encrypted at rest using AES-256-GCM. Enter your vault passphrase to unlock.
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="p-3.5 rounded-2xl bg-[#F8FAFD] dark:bg-[#131314] border border-slate-200 dark:border-[#444746]/40 text-[11px] text-[#5F6368] dark:text-[#C2C7CF] space-y-1">
          <div className="flex items-center gap-1.5 text-[#0B57D0] dark:text-[#A8C7FA] font-medium text-xs">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Zero-Knowledge Client Encryption</span>
          </div>
          <p>Keys are derived client-side via PBKDF2 (100,000 iterations). Plaintext keys are never stored on disk.</p>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">Vault Passphrase</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPass ? 'text' : 'password'}
                autoFocus
                value={passphrase}
                onChange={(e) => {
                  setPassphrase(e.target.value);
                  setError(null);
                }}
                placeholder="Enter your passphrase..."
                className="w-full bg-slate-50 dark:bg-[#131314] border border-slate-300 dark:border-[#444746] rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#1F1F1F] dark:text-[#E3E3E3] placeholder:text-slate-400 focus:outline-none focus:border-[#0B57D0] dark:focus:border-[#A8C7FA]"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!passphrase.trim() || isUnlocking}
            className="w-full gp-btn-primary py-2.5 rounded-full disabled:opacity-50 cursor-pointer text-xs"
          >
            {isUnlocking ? 'Decrypting Session...' : 'Unlock Vault'}
          </button>
        </form>

        {/* Emergency Actions Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-[#444746]/40 flex items-center justify-between text-xs">
          <span className="text-[#5F6368] dark:text-[#C2C7CF] text-[11px]">Forgot passphrase?</span>
          <button
            type="button"
            onClick={handlePanicWipe}
            className="text-rose-500 hover:underline font-medium text-[11px] cursor-pointer"
          >
            Nuclear Panic Wipe
          </button>
        </div>
      </div>
    </div>
  );
};
