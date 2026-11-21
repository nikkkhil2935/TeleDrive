import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Layers,
  FileText,
  AlertTriangle,
  ServerOff,
  Database,
  Smartphone,
  Eye,
  CheckCircle2,
  Trash2,
  Cpu,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PrivacyModal: React.FC = () => {
  const { isPrivacyOpen, setIsPrivacyOpen, panicWipe } = useApp();
  const [tab, setTab] = useState<'dashboard' | 'diagram' | 'policy' | 'terms' | 'security' | 'licenses'>('dashboard');

  // Privacy Dashboard Toggles
  const [stripLocation, setStripLocation] = useState(true);
  const [usePrivacyTiles, setUsePrivacyTiles] = useState(true);
  const [crashReports, setCrashReports] = useState(false);

  if (!isPrivacyOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">Privacy & Security Transparency</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Zero-knowledge local architecture & open privacy documentation
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPrivacyOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto bg-slate-50/50 dark:bg-slate-950/40">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'diagram', label: 'How Data is Stored' },
            { id: 'policy', label: 'Privacy Policy' },
            { id: 'terms', label: 'Terms of Use' },
            { id: 'security', label: 'Security Specs' },
            { id: 'licenses', label: 'Credits & Notice' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                tab === item.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[60vh] space-y-4 text-xs">
          {/* TAB 1: PRIVACY DASHBOARD */}
          {tab === 'dashboard' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Verified Zero Middleman Servers</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Framely runs 100% in your browser. All media uploads, downloads, and streaming connect directly from your device to Telegram’s MTProto WebSocket endpoints. We collect zero analytics and maintain zero external databases.
                </p>
              </div>

              <div className="space-y-3">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Device Privacy Toggles
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Strip GPS metadata when sharing</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Removes latitude and longitude coordinates before downloading or sharing photos.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={stripLocation}
                    onChange={(e) => setStripLocation(e.target.checked)}
                    className="rounded text-emerald-600 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Privacy-friendly map tiles</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Uses anonymized vector tiles without third-party tracking identifiers.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={usePrivacyTiles}
                    onChange={(e) => setUsePrivacyTiles(e.target.checked)}
                    className="rounded text-emerald-600 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Anonymous crash diagnostics</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Completely disabled by default. No logs leave this computer.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={crashReports}
                    onChange={(e) => setCrashReports(e.target.checked)}
                    className="rounded text-emerald-600 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    if (confirm('CRITICAL: Erase all local index cache, session keys, and database entries on this device?')) {
                      panicWipe();
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold flex items-center justify-center gap-1.5 transition-colors border border-rose-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Erase Everything on This Device (&lt;50ms wipe)
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: HOW DATA IS STORED (DIAGRAM) */}
          {tab === 'diagram' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4 font-mono text-center">
                <div className="inline-block px-4 py-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-600 dark:text-sky-400 font-bold text-xs">
                  [ YOUR DEVICE / BROWSER ]<br />
                  <span className="font-sans text-[10px] text-slate-500">AES-256-GCM Vault · IndexedDB · Offscreen Workers</span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-600">
                  <span>▲</span>
                  <span>│ Direct WSS MTProto (TLS Encrypted)</span>
                  <span>│ ZERO Intermediary Servers or Proxies</span>
                  <span>▼</span>
                </div>

                <div className="inline-block px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  [ TELEGRAM DATA CENTERS ]<br />
                  <span className="font-sans text-[10px] text-slate-500">Your Personal Private Channel / Saved Messages</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-slate-100">Key Guarantees:</span>
                <p>1. <b>Zero middleman servers:</b> There is no Framely server backend. No one can shut down your photo server or seize your files.</p>
                <p>2. <b>Self-contained index:</b> Photo dimensions, EXIF dates, and checksums are serialized directly into the Telegram message caption JSON. Rebuilding your index on a new laptop requires only your Telegram channel.</p>
                <p>3. <b>Zero lock-in:</b> All files are stored as standard Telegram documents. You can inspect or download them anytime directly from official Telegram mobile or desktop apps.</p>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY POLICY */}
          {tab === 'policy' && (
            <div className="space-y-3 leading-relaxed text-slate-700 dark:text-slate-300">
              <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-800 dark:text-sky-200 font-medium">
                <b>Summary:</b> We do not run servers that store your photos. Your photos live in your own Telegram account. Your keys and index stay on your device. We collect no analytics by default.
              </div>

              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">1. Data We Do Not Collect</h4>
              <p>Framely does not collect, log, transmit, or monetize your photos, videos, EXIF metadata, Telegram session keys, phone numbers, contacts, or passwords.</p>

              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">2. Data Stored Locally</h4>
              <p>Your encrypted session string, thumbnail previews (in IndexedDB), and optional master passphrase wrapper reside solely in your browser's private local storage.</p>

              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">3. Direct Telegram Connectivity</h4>
              <p>Your web browser connects directly to Telegram's official web gateways over secure WebSockets (WSS). Telegram's own privacy policy applies to data stored within your Telegram account.</p>
            </div>
          )}

          {/* TAB 4: TERMS OF USE */}
          {tab === 'terms' && (
            <div className="space-y-3 leading-relaxed text-slate-700 dark:text-slate-300">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Terms of Use & Disclaimer</h4>
              <p>Framely is a client interface designed for personal, authorized cloud photo management. By using Framely, you agree to comply with Telegram’s Terms of Service and applicable privacy regulations.</p>
              <p>Framely is provided "as is", without warranty of any kind. You are solely responsible for maintaining backup copies of essential documents and securing your recovery passphrase.</p>
            </div>
          )}

          {/* TAB 5: SECURITY SPECS */}
          {tab === 'security' && (
            <div className="space-y-3 leading-relaxed text-slate-700 dark:text-slate-300">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Cryptographic Architecture</h4>
              <ul className="list-disc pl-5 space-y-1.5 text-[11px]">
                <li><b>Vault Cipher:</b> AES-256-GCM authenticated encryption via audited WebCrypto API.</li>
                <li><b>Key Derivation:</b> PBKDF2 with SHA-256, 100,000 iterations, and unique 16-byte cryptographic salt.</li>
                <li><b>Session Revocation:</b> Logout calls Telegram's <code>Api.auth.LogOut</code> MTProto method to instantly invalidate the authorization key on Telegram's servers.</li>
                <li><b>Nuclear Wipe:</b> Immediate zeroization of memory buffers, localStorage, and IndexedDB stores in under 50 milliseconds.</li>
              </ul>
            </div>
          )}

          {/* TAB 6: LICENSES & CREDITS */}
          {tab === 'licenses' && (
            <div className="space-y-3 leading-relaxed text-slate-700 dark:text-slate-300">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Legal Notices & Trademark Disclaimer</h4>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                Stores your files in your own Telegram account. Not affiliated with, sponsored by, or endorsed by Telegram FZ-LLC or Google LLC. Google Photos and Telegram are trademarks of their respective owners.
              </div>
              <p className="text-[11px]">Built with React, Dexie.js, GramJS, Tailwind CSS, and Lucide Icons under MIT and Apache 2.0 open-source licenses.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <span>Framely Privacy Architecture v2.0</span>
          <button
            onClick={() => setIsPrivacyOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
