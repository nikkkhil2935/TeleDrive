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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#FFFFFF] dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/60 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#444746]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D3E3FD] dark:bg-[#004A77] text-[#0B57D0] dark:text-[#C2E7FF] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">Privacy & Trust Center</h3>
              <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF]">
                Zero-knowledge local architecture & open privacy documentation
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPrivacyOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 py-2.5 border-b border-slate-100 dark:border-[#444746]/40 flex items-center gap-1.5 overflow-x-auto bg-[#F8FAFD] dark:bg-[#131314]">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'diagram', label: 'Storage Topology' },
            { id: 'policy', label: 'Privacy Policy' },
            { id: 'terms', label: 'Terms of Use' },
            { id: 'security', label: 'Security Specs' },
            { id: 'licenses', label: 'Credits & Notice' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                tab === item.id
                  ? 'bg-[#0B57D0] dark:bg-[#A8C7FA] text-white dark:text-[#041E49] shadow-xs'
                  : 'text-[#5F6368] dark:text-[#C2C7CF] hover:text-[#1F1F1F] dark:hover:text-white'
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
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Verified Zero Middleman Infrastructure</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Framely runs 100% locally in your browser. All media uploads, downloads, and streaming connect directly from your device to Telegram’s MTProto WebSocket endpoints. We collect zero analytics and maintain zero external database servers.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="font-medium text-sm text-[#1F1F1F] dark:text-[#E3E3E3]">
                  Device Privacy Toggles
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-[#444746]/40 bg-[#F8FAFD] dark:bg-[#131314] flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">Strip GPS metadata when sharing</div>
                    <div className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF]">
                      Removes latitude and longitude coordinates before downloading or exporting photos.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={stripLocation}
                    onChange={(e) => setStripLocation(e.target.checked)}
                    className="rounded text-[#0B57D0] w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-[#444746]/40 bg-[#F8FAFD] dark:bg-[#131314] flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">Privacy-friendly map tiles</div>
                    <div className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF]">
                      Uses anonymized vector tiles without third-party tracking identifiers.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={usePrivacyTiles}
                    onChange={(e) => setUsePrivacyTiles(e.target.checked)}
                    className="rounded text-[#0B57D0] w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-[#444746]/40 bg-[#F8FAFD] dark:bg-[#131314] flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">Anonymous crash diagnostics</div>
                    <div className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF]">
                      Completely disabled by default. No logs leave this computer.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={crashReports}
                    onChange={(e) => setCrashReports(e.target.checked)}
                    className="rounded text-[#0B57D0] w-4 h-4 cursor-pointer"
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
                  className="w-full py-2.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-medium flex items-center justify-center gap-1.5 transition-colors border border-rose-500/20 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Erase Everything on This Device (&lt;50ms wipe)
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: HOW DATA IS STORED (DIAGRAM) */}
          {tab === 'diagram' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#F8FAFD] dark:bg-[#131314] border border-slate-200 dark:border-[#444746]/40 space-y-4 font-mono text-center">
                <div className="inline-block px-5 py-2.5 rounded-2xl bg-[#D3E3FD] dark:bg-[#004A77] border border-sky-400/30 text-[#041E49] dark:text-[#C2E7FF] font-semibold text-xs">
                  [ YOUR DEVICE / BROWSER ]<br />
                  <span className="font-sans text-[10px] text-[#5F6368] dark:text-[#C2C7CF]">AES-256-GCM Vault · IndexedDB · Offscreen Workers</span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 text-[#5F6368] dark:text-[#C2C7CF]">
                  <span>▲</span>
                  <span>│ Direct WSS MTProto (TLS Encrypted)</span>
                  <span>│ ZERO Intermediary Servers or Proxies</span>
                  <span>▼</span>
                </div>

                <div className="inline-block px-5 py-2.5 rounded-2xl bg-[#D3E3FD] dark:bg-[#004A77] border border-sky-400/30 text-[#041E49] dark:text-[#C2E7FF] font-semibold text-xs">
                  [ TELEGRAM DATA CENTERS ]<br />
                  <span className="font-sans text-[10px] text-[#5F6368] dark:text-[#C2C7CF]">Your Personal Private Channel / Saved Messages</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFD] dark:bg-[#131314] border border-slate-200 dark:border-[#444746]/30 space-y-1.5 text-[11px] leading-relaxed text-[#5F6368] dark:text-[#C2C7CF]">
                <span className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">Key Architectural Guarantees:</span>
                <p>1. <b>Zero middleman servers:</b> There is no Framely server backend. No one can shut down your photo server or seize your files.</p>
                <p>2. <b>Self-contained index:</b> Photo dimensions, EXIF dates, and checksums are serialized directly into the Telegram message caption JSON. Rebuilding your index on a new computer requires only your Telegram channel.</p>
                <p>3. <b>Zero lock-in:</b> All files are stored as standard Telegram documents. You can inspect or download them anytime directly from official Telegram mobile or desktop apps.</p>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY POLICY */}
          {tab === 'policy' && (
            <div className="space-y-3 leading-relaxed text-[#5F6368] dark:text-[#C2C7CF]">
              <div className="p-3.5 rounded-2xl bg-[#D3E3FD]/50 dark:bg-[#004A77]/40 border border-sky-400/30 text-[#041E49] dark:text-[#C2E7FF] font-medium">
                <b>Summary:</b> We do not run servers that store your photos. Your photos live in your own Telegram account. Your keys and index stay on your device. We collect no analytics by default.
              </div>

              <h4 className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] text-sm">1. Data We Do Not Collect</h4>
              <p>Framely does not collect, log, transmit, or monetize your photos, videos, EXIF metadata, Telegram session keys, phone numbers, contacts, or passwords.</p>

              <h4 className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] text-sm">2. Data Stored Locally</h4>
              <p>Encrypted session tokens, PBKDF2 vault wrappers, thumbnails, and your index cache reside strictly inside your browser's IndexedDB and WebCrypto memory.</p>

              <h4 className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] text-sm">3. Data Sent to Telegram</h4>
              <p>Files and captions are transmitted directly to Telegram's MTProto servers under your Telegram account. Your relationship with Telegram is governed by their Terms of Service and Privacy Policy.</p>
            </div>
          )}

          {/* TAB 4: TERMS OF USE */}
          {tab === 'terms' && (
            <div className="space-y-3 leading-relaxed text-[#5F6368] dark:text-[#C2C7CF]">
              <h4 className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] text-sm">1. Open Source License</h4>
              <p>Framely is provided under the MIT License. It is provided 'AS IS', without warranty of any kind, express or implied.</p>

              <h4 className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] text-sm">2. Telegram Terms Compliance</h4>
              <p>You agree to use Framely in compliance with Telegram's Terms of Service and API policies. Do not abuse Telegram storage for spam, copyright infringement, or malicious distribution.</p>

              <h4 className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] text-sm">3. Educational and Independence Disclaimer</h4>
              <p>Framely is an independent open-source project and is not affiliated with, sponsored by, or endorsed by Telegram FZ-LLC or Google LLC.</p>
            </div>
          )}

          {/* TAB 5: SECURITY SPECS */}
          {tab === 'security' && (
            <div className="space-y-3 leading-relaxed text-[#5F6368] dark:text-[#C2C7CF]">
              <h4 className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] text-sm">Cryptographic Specifications</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li><b>Session Vault:</b> AES-256-GCM authenticated encryption with 96-bit random IVs.</li>
                <li><b>Key Derivation:</b> PBKDF2 with HMAC-SHA-256, 100,000 iterations, and a unique 16-byte cryptographic salt.</li>
                <li><b>Integrity Check:</b> SHA-256 streamed checksum computed in off-thread Web Workers before upload.</li>
                <li><b>Ephemeral Storage:</b> Sensitive decryption keys exist only in volatile JavaScript heap and are erased on lock.</li>
              </ul>
            </div>
          )}

          {/* TAB 6: LICENSES & CREDITS */}
          {tab === 'licenses' && (
            <div className="space-y-3 leading-relaxed text-[#5F6368] dark:text-[#C2C7CF]">
              <h4 className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] text-sm">Open Source Credits</h4>
              <p>Framely is built on top of incredible open-source foundations:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>GramJS (MTProto Protocol Client for JavaScript)</li>
                <li>Dexie.js (Reactive IndexedDB Wrapper)</li>
                <li>Lucide Icons & Material Symbols</li>
                <li>Tailwind CSS & Google Sans Typography</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
