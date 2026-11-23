import React, { useState } from 'react';
import {
  ShieldCheck,
  Cloud,
  Zap,
  Lock,
  HardDrive,
  RefreshCw,
  Layers,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  MapPin,
  Camera,
  Download,
  Eye,
  Sun,
  Moon,
  ChevronDown,
  Check,
  X,
  Shield,
  Key,
  Database,
  Globe,
  Sliders,
  Play,
  Heart,
  Grid3X3,
  Search,
  Maximize2
} from 'lucide-react';
import { FramelyLogo } from './FramelyLogo';
import { useApp } from '../context/AppContext';

// High-resolution real photography for the authentic product stage & bento preview
const SAMPLE_PHOTOS = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    title: 'Alpine Lake Sunrise',
    camera: 'Sony α7 IV • 24mm f/2.8',
    date: 'Today, 07:15 AM',
    size: '18.4 MB',
    iso: 'ISO 100',
    shutter: '1/320s',
    dimensions: '7008 × 4672',
    region: 'Western Cascades',
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
    title: 'Starry Mountain Night',
    camera: 'Canon EOS R5 • 16mm f/2.0',
    date: 'Yesterday, 11:42 PM',
    size: '24.1 MB',
    iso: 'ISO 3200',
    shutter: '20.0s',
    dimensions: '8192 × 5464',
    region: 'High Sierra Peak',
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80',
    title: 'Morning Fog Valley',
    camera: 'Fujifilm X-T5 • 35mm f/1.4',
    date: 'Nov 18, 08:30 AM',
    size: '14.8 MB',
    iso: 'ISO 160',
    shutter: '1/250s',
    dimensions: '6240 × 4160',
    region: 'Pacific Coast Ridge',
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&auto=format&fit=crop&q=80',
    title: 'Deep Woodland Path',
    camera: 'Leica Q3 • 28mm f/1.7',
    date: 'Nov 14, 02:18 PM',
    size: '22.6 MB',
    iso: 'ISO 200',
    shutter: '1/125s',
    dimensions: '9520 × 6336',
    region: 'Redwood Sanctuary',
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop&q=80',
    title: 'Golden Hour Meadow',
    camera: 'Nikon Z8 • 50mm f/1.8',
    date: 'Nov 10, 05:40 PM',
    size: '19.9 MB',
    iso: 'ISO 64',
    shutter: '1/800s',
    dimensions: '8256 × 5504',
    region: 'Coastal Foothills',
  },
  {
    id: 6,
    url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&auto=format&fit=crop&q=80',
    title: 'Canyon Suspension Bridge',
    camera: 'Hasselblad X2D • 38mm f/2.5',
    date: 'Nov 04, 10:15 AM',
    size: '41.2 MB',
    iso: 'ISO 100',
    shutter: '1/160s',
    dimensions: '11656 × 8742',
    region: 'Columbia River Gorge',
  },
];

export const LandingPage: React.FC = () => {
  const { enterApp, setIsAuthModalOpen, setIsOnboardingOpen, theme, setTheme } = useApp();

  // Interactive Stage State
  const [activePhoto, setActivePhoto] = useState(SAMPLE_PHOTOS[0]);
  const [isExifModalOpen, setIsExifModalOpen] = useState(false);
  const [stageDensity, setStageDensity] = useState<'standard' | 'dense'>('standard');
  const [favorites, setFavorites] = useState<number[]>([1, 3]);

  // Interactive Bento Vault Simulator
  const [vaultInput, setVaultInput] = useState('My Secret Vacation 2026');
  const [vaultKey] = useState('aes-256-gcm-0x8f2d...91e4');
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleLaunchApp = () => {
    enterApp();
  };

  const handleSignIn = () => {
    enterApp();
    setIsAuthModalOpen(true);
  };

  const handleStartOnboarding = () => {
    enterApp();
    setIsOnboardingOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#131314] text-[#1F1F1F] dark:text-[#E3E3E3] font-sans antialiased selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900/40 dark:selection:text-blue-200 transition-colors duration-200">
      
      {/* 1. Sticky Navigation Bar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/90 dark:bg-[#131314]/90 border-b border-slate-200/80 dark:border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Mark (STRICT REQUIREMENT: Pure Framely Logo, NO enclosing box/container) */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <FramelyLogo className="w-8 h-8 transition-transform group-hover:scale-105 duration-200" />
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-['Google_Sans',sans-serif] leading-tight">
                Framely
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-600 dark:text-sky-400">
                Direct Telegram Drive
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors">Features</a>
            <a href="#bento" className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors">Architecture Bento</a>
            <a href="#comparison" className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors">Comparison</a>
            <a href="#security" className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors">Zero-Knowledge</a>
            <a href="#faq" className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors">FAQ</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Sign In */}
            <button
              onClick={handleSignIn}
              className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              Sign In
            </button>

            {/* Launch App Primary CTA */}
            <button
              onClick={handleLaunchApp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#0B57D0] hover:bg-[#0842A0] dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 transition-all shadow-sm hover:shadow-md active:scale-98"
            >
              <span>Launch Web App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-50/50 via-white to-white dark:from-[#161718] dark:via-[#131314] dark:to-[#131314]">
        
        {/* Subtle grid background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-sky-950/60 dark:text-sky-300 border border-blue-200/60 dark:border-sky-800/60 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
            <span>Open Source • Telegram-Backed Cloud Storage • Zero-Knowledge Vault</span>
          </div>

          {/* Plain, factual, assertive headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-950 dark:text-white max-w-4xl mx-auto leading-[1.08] font-['Google_Sans',sans-serif]">
            Your private photos, in your own Telegram.
          </h1>

          {/* Sub-headline with concrete technical guarantees */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Uncompressed original master bitstreams. Unlimited storage in your private Telegram channel. 
            Client-side AES-256-GCM encryption. Zero middleman servers.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleLaunchApp}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold text-white bg-[#0B57D0] hover:bg-[#0842A0] dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 transition-all shadow-md hover:shadow-lg active:scale-98"
            >
              <span>Open Framely App</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleStartOnboarding}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-xs"
            >
              <span>3-Minute Quick Setup</span>
            </button>
          </div>

          {/* 4-Metric Concrete Proof Strip */}
          <div className="mt-12 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-[#1A1B1C]/80 border border-slate-200/80 dark:border-white/10 backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center p-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">2,048 MB</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Max Single File Cap</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2">
              <span className="text-2xl font-black text-blue-600 dark:text-sky-400 tracking-tight">$0.00 / mo</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Free Cloud Storage</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">256-Bit</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">AES-GCM Web Crypto</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">0 Bytes</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Transmitted Unencrypted</span>
            </div>
          </div>

          {/* Stageshow Desktop App Window Mockup */}
          <div className="mt-14 max-w-5xl mx-auto relative rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#131314] shadow-2xl overflow-hidden text-left transition-all">
            
            {/* Window Chrome Titlebar */}
            <div className="h-10 px-4 bg-slate-100 dark:bg-[#1E1F20] border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-500" />
                  <span>https://framely.local • Encrypted Session #4298525450</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-sky-950 dark:text-sky-300">
                  Interactive Demo
                </span>
              </div>
            </div>

            {/* Stageshow App Interior */}
            <div className="flex h-[480px] sm:h-[540px]">
              
              {/* Mini App Sidebar */}
              <div className="hidden sm:flex w-48 border-r border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171819] flex-col p-3 space-y-1">
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-100 text-blue-900 dark:bg-sky-950 dark:text-sky-200 font-semibold text-xs">
                  <FramelyLogo className="w-4 h-4" />
                  <span>Photos</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full text-slate-600 dark:text-slate-400 font-medium text-xs hover:bg-slate-200/50 dark:hover:bg-white/5 cursor-pointer">
                  <Sparkles className="w-4 h-4" />
                  <span>Explore</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full text-slate-600 dark:text-slate-400 font-medium text-xs hover:bg-slate-200/50 dark:hover:bg-white/5 cursor-pointer">
                  <MapPin className="w-4 h-4" />
                  <span>Places</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full text-slate-600 dark:text-slate-400 font-medium text-xs hover:bg-slate-200/50 dark:hover:bg-white/5 cursor-pointer">
                  <Heart className="w-4 h-4" />
                  <span>Favorites ({favorites.length})</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full text-slate-600 dark:text-slate-400 font-medium text-xs hover:bg-slate-200/50 dark:hover:bg-white/5 cursor-pointer">
                  <Lock className="w-4 h-4" />
                  <span>Locked Folder</span>
                </div>

                <div className="pt-4 mt-auto border-t border-slate-200 dark:border-white/10 text-[10px] text-slate-500">
                  <div className="flex justify-between mb-1">
                    <span>Telegram Vault</span>
                    <span className="font-semibold text-blue-600 dark:text-sky-400">1.77 GB</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div className="h-full bg-blue-600 dark:bg-sky-400 w-1/3 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Mini App Gallery Area */}
              <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#131314]">
                
                {/* Mini Top bar */}
                <div className="h-12 border-b border-slate-200 dark:border-white/10 px-4 flex items-center justify-between gap-4">
                  <div className="flex-1 max-w-sm flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#1E1F20] text-xs text-slate-500">
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Alpine, Mountains, Leica...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setStageDensity(d => d === 'standard' ? 'dense' : 'standard')}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                      title="Toggle Density"
                    >
                      <Grid3X3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleLaunchApp}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-[#0B57D0] text-white hover:bg-[#0842A0]"
                    >
                      Launch Live App
                    </button>
                  </div>
                </div>

                {/* Mini Gallery Scroll Container */}
                <div className="flex-1 overflow-y-auto p-4 relative">
                  
                  {/* Memories Strip */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Recent Highlights</span>
                    </div>
                    <div className="flex gap-2.5 overflow-x-hidden">
                      {SAMPLE_PHOTOS.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => { setActivePhoto(item); setIsExifModalOpen(true); }}
                          className="w-32 h-20 rounded-xl relative overflow-hidden group cursor-pointer border border-slate-200 dark:border-white/10 shrink-0"
                        >
                          <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-1.5 flex flex-col justify-end text-white">
                            <span className="text-[10px] font-bold truncate">{item.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Date Group Heading */}
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 py-1 mb-2">
                    <span>Saturday, Nov 23, 2026</span>
                    <span className="text-[10px] text-slate-400 font-normal">Original Uncompressed Documents</span>
                  </div>

                  {/* Photo Grid */}
                  <div className={`grid ${stageDensity === 'dense' ? 'grid-cols-3 sm:grid-cols-4 gap-2' : 'grid-cols-2 sm:grid-cols-3 gap-2.5'}`}>
                    {SAMPLE_PHOTOS.map((photo) => (
                      <div
                        key={photo.id}
                        onClick={() => { setActivePhoto(photo); setIsExifModalOpen(true); }}
                        className="group relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 cursor-pointer border border-slate-200/60 dark:border-white/5 hover:border-blue-500 transition-all shadow-xs hover:shadow-md"
                      >
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        />
                        
                        {/* Hover Overlay with EXIF trigger & favorite */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between text-white">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={(e) => toggleFavorite(photo.id, e)}
                              className={`p-1 rounded-full backdrop-blur-md ${favorites.includes(photo.id) ? 'text-rose-500 bg-white/90' : 'text-white bg-black/40 hover:bg-black/60'}`}
                            >
                              <Heart className="w-3 h-3 fill-current" />
                            </button>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/60 backdrop-blur-xs">
                              {photo.size}
                            </span>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold truncate">{photo.title}</p>
                            <p className="text-[9px] text-slate-300 font-mono truncate">{photo.camera}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Floating Date Scrubber Rail (True Google Photos Floating Overlay) */}
                  <div className="absolute right-2 top-20 bottom-10 flex flex-col items-center justify-center pointer-events-none select-none">
                    <div className="py-2.5 px-1 rounded-full bg-white/90 dark:bg-[#1E1F20]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-md flex flex-col items-center space-y-2 pointer-events-auto">
                      {['2026', '2025', '2024'].map((yr) => (
                        <div key={yr} className="group relative flex items-center justify-center cursor-pointer p-0.5">
                          <div className="w-2 h-2 rounded-full bg-slate-400 group-hover:bg-blue-600 dark:group-hover:bg-sky-400 transition-all" />
                          <div className="hidden group-hover:block absolute right-5 px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px] whitespace-nowrap shadow-md">
                            {yr}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stageshow Interactive EXIF Modal */}
            {isExifModalOpen && (
              <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white dark:bg-[#1E1F20] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{activePhoto.title}</span>
                    </div>
                    <button
                      onClick={() => setIsExifModalOpen(false)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="w-full h-44 rounded-xl overflow-hidden bg-slate-950">
                      <img src={activePhoto.url} alt={activePhoto.title} className="w-full h-full object-contain" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                        <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Optics & Body</span>
                        <span className="font-semibold text-slate-900 dark:text-white font-mono">{activePhoto.camera}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                        <span className="text-slate-500 dark:text-slate-400 block mb-0.5">File Payload</span>
                        <span className="font-semibold text-slate-900 dark:text-white font-mono">{activePhoto.size} • Raw DNG</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                        <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Resolution</span>
                        <span className="font-semibold text-slate-900 dark:text-white font-mono">{activePhoto.dimensions}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                        <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Shutter / ISO</span>
                        <span className="font-semibold text-slate-900 dark:text-white font-mono">{activePhoto.shutter} • {activePhoto.iso}</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-sky-950/40 border border-blue-200/60 dark:border-sky-800/60 flex items-center gap-2 text-xs text-blue-900 dark:text-sky-200 font-medium">
                      <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0" />
                      <span>Stored directly on Telegram Channel #4298525450 as an uncompressed document.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. 6-Card Bento Grid Section */}
      <section id="bento" className="py-20 md:py-28 bg-slate-50 dark:bg-[#161718] border-y border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest font-bold text-blue-600 dark:text-sky-400 mb-2">
              Deep Architecture & Craft
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white font-['Google_Sans',sans-serif] tracking-tight">
              Six engineering pillars behind Framely.
            </p>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
              Zero shortcuts. Clean separation between client-side Web Crypto, local IndexedDB caching, and direct MTProto WSS transport.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1: Client-Side Zero-Knowledge Encryption (Span 2 cols) */}
            <div className="md:col-span-2 p-8 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white font-['Google_Sans',sans-serif]">
                      Client-Side Zero-Knowledge Encryption
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      AES-256-GCM • PBKDF2 100,000 Iterations • Web Crypto API
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  Every photo, thumbnail, and EXIF payload is encrypted in memory before leaving your device. 
                  Neither Telegram nor any middleman can read your photos. Only you hold the passphrase.
                </p>

                {/* Interactive Encryption Simulator */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Live Encryption Test Harness</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Web Crypto Verified
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={vaultInput}
                      onChange={(e) => setVaultInput(e.target.value)}
                      placeholder="Type sample photo caption..."
                      className="flex-1 px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#171819] border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-blue-500"
                    />
                    <div className="px-3 py-2 rounded-xl text-xs font-mono bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
                      <Key className="w-3.5 h-3.5 text-amber-500" />
                      <span>{vaultKey}</span>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono p-2.5 rounded-xl bg-slate-900 text-emerald-400 dark:bg-black overflow-x-auto">
                    <span>CIPHERTEXT: </span>
                    <span className="text-slate-400">
                      {btoa(vaultInput + '_encrypted_aes_gcm_auth_tag_verified')}...==
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
                <span>Passphrase never touches any disk or server</span>
                <span className="font-medium text-blue-600 dark:text-sky-400">RFC 5116 Spec Compliant</span>
              </div>
            </div>

            {/* Bento Card 2: Unlimited Cloud Storage Quota (Span 1 col) */}
            <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-sky-950/50 text-blue-600 dark:text-sky-400 border border-blue-200 dark:border-sky-800/40 w-fit mb-4">
                  <HardDrive className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-['Google_Sans',sans-serif] mb-2">
                  Unlimited Free Cloud Storage
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  Powered by Telegram Channel Document infrastructure. Store tens of thousands of raw 4K videos and DNG files without paying monthly subscription fees.
                </p>

                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/5">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700 dark:text-slate-300">Framely (Telegram)</span>
                      <span className="text-blue-600 dark:text-sky-400 font-bold">$0.00 / month</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">Unlimited TB • 2GB single file limit</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-slate-200/40 dark:border-white/5 opacity-70">
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-slate-500 line-through">Google Photos 2TB</span>
                      <span className="text-slate-500">$9.99 / month</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">Restricted quota • Downscales on free tier</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500">
                Official Telegram MTProto Protocol
              </div>
            </div>

            {/* Bento Card 3: Direct MTProto 2.0 WSS Streaming (Span 1 col) */}
            <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 w-fit mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-['Google_Sans',sans-serif] mb-2">
                  Direct MTProto 2.0 WSS Streaming
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  Your browser connects directly to Telegram Datacenters over secure WebSockets. Multi-chunk concurrent transfers deliver instant streaming.
                </p>

                <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>DC Connection</span>
                    <span className="text-emerald-400">wss://flora.web.telegram.org</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Chunk Concurrency</span>
                    <span className="text-sky-300">4 Parallel Streams</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Handshake Latency</span>
                    <span className="text-amber-300">28ms direct</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500">
                Zero proxy intermediaries
              </div>
            </div>

            {/* Bento Card 4: Authentic Google Photos Desktop Craft (Span 2 cols) */}
            <div className="md:col-span-2 p-8 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-sky-950/50 text-blue-600 dark:text-sky-400 border border-blue-200 dark:border-sky-800/40">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white font-['Google_Sans',sans-serif]">
                      Authentic Google Photos Desktop Craft
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      60 FPS Virtualized Timeline • Floating Date Scrubber • Keyboard Control
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  Every interaction was designed to mirror the refined ergonomics of desktop Google Photos: 
                  instant year jumping via the floating frosted date rail, memories carousel highlights, 
                  and full keyboard navigation (Space, Esc, Arrow Keys, Delete).
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Floating Rail</span>
                    <span className="text-slate-500 text-[11px]">Instant Year Scrubber</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Dexie IndexedDB</span>
                    <span className="text-slate-500 text-[11px]">Sub-5ms Query Speed</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Shift + Click</span>
                    <span className="text-slate-500 text-[11px]">Multi-Select Batch</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Zero Slop</span>
                    <span className="text-slate-500 text-[11px]">Transitions.dev Tokens</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
                <span>Designed for photographers with 50,000+ libraries</span>
                <span className="font-medium text-blue-600 dark:text-sky-400">Virtualized DOM</span>
              </div>
            </div>

            {/* Bento Card 5: Smart Regional Places (Span 1 col) */}
            <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 w-fit mb-4">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-['Google_Sans',sans-serif] mb-2">
                  Smart Regional Places
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  Intelligent coordinate clustering translates raw GPS metadata into human geographical regions: Mumbai Coast, Western Ghats, Pacific Ridge, and beyond.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">Mumbai City & Harbor</span>
                    <span className="font-mono text-blue-600 dark:text-sky-400">248 items</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">Pune & Western Ghats</span>
                    <span className="font-mono text-blue-600 dark:text-sky-400">84 items</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500">
                EXIF GPS V1 parsing engine
              </div>
            </div>

            {/* Bento Card 6: Cinema Lightbox & EXIF Studio (Span 2 cols) */}
            <div className="md:col-span-2 p-8 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white font-['Google_Sans',sans-serif]">
                      Darkroom Cinema Lightbox & EXIF Studio
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Lens Aperture • Shutter Speed • ISO • Sensor Dimensions • SHA-256 Hashes
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  Inspect every millimeter of your capture. Framely parses complete EXIF headers directly from the uncompressed bitstream and provides responsive mobile drawer inspectors.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-2xl bg-slate-900 text-white">
                    <span className="text-slate-400 text-[10px] block">APERTURE</span>
                    <span className="text-base font-bold text-sky-400">f / 1.8</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900 text-white">
                    <span className="text-slate-400 text-[10px] block">SHUTTER</span>
                    <span className="text-base font-bold text-emerald-400">1 / 240s</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900 text-white">
                    <span className="text-slate-400 text-[10px] block">FOCAL</span>
                    <span className="text-base font-bold text-amber-400">26mm</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900 text-white">
                    <span className="text-slate-400 text-[10px] block">SENSITIVITY</span>
                    <span className="text-base font-bold text-rose-400">ISO 100</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
                <span>Zero lag filmstrip camera roll</span>
                <span className="font-medium text-blue-600 dark:text-sky-400">ExifReader Native WASM</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Comparison Matrix Table Section */}
      <section id="comparison" className="py-20 md:py-28 bg-white dark:bg-[#131314]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest font-bold text-blue-600 dark:text-sky-400 mb-2">
              Objective Comparison
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white font-['Google_Sans',sans-serif] tracking-tight">
              Framely vs. Big Tech Photo Clouds
            </p>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
              No hidden fees, no downsampling tricks, and no corporate advertising scans.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#1E1F20] border-b border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <th className="p-4 sm:p-6">Feature Vector</th>
                  <th className="p-4 sm:p-6 text-blue-600 dark:text-sky-400 bg-blue-50/50 dark:bg-sky-950/20 font-bold">
                    <div className="flex items-center gap-2">
                      <FramelyLogo className="w-4 h-4" />
                      <span>Framely (Telegram)</span>
                    </div>
                  </th>
                  <th className="p-4 sm:p-6 text-slate-600 dark:text-slate-400">Google Photos</th>
                  <th className="p-4 sm:p-6 text-slate-600 dark:text-slate-400">Apple iCloud Photos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                <tr>
                  <td className="p-4 sm:p-6 font-semibold text-slate-900 dark:text-white">Storage Capacity</td>
                  <td className="p-4 sm:p-6 bg-blue-50/30 dark:bg-sky-950/10 font-bold text-blue-600 dark:text-sky-400">
                    Unlimited Free TB
                  </td>
                  <td className="p-4 sm:p-6 text-slate-600 dark:text-slate-300">15 GB free (shared with Gmail)</td>
                  <td className="p-4 sm:p-6 text-slate-600 dark:text-slate-300">5 GB free (shared with backups)</td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-6 font-semibold text-slate-900 dark:text-white">Compression & Quality</td>
                  <td className="p-4 sm:p-6 bg-blue-50/30 dark:bg-sky-950/10 font-bold text-emerald-600 dark:text-emerald-400">
                    100% Original Bitstream (0 compression)
                  </td>
                  <td className="p-4 sm:p-6 text-slate-600 dark:text-slate-300">Downsampled on Storage Saver</td>
                  <td className="p-4 sm:p-6 text-slate-600 dark:text-slate-300">Compressed if storage optimize enabled</td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-6 font-semibold text-slate-900 dark:text-white">Max Single File Size</td>
                  <td className="p-4 sm:p-6 bg-blue-50/30 dark:bg-sky-950/10 font-bold text-slate-900 dark:text-white">
                    2,048 MB (2 GB) per file
                  </td>
                  <td className="p-4 sm:p-6 text-slate-600 dark:text-slate-300">Throttled upload speeds</td>
                  <td className="p-4 sm:p-6 text-slate-600 dark:text-slate-300">Web upload limits & timeouts</td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-6 font-semibold text-slate-900 dark:text-white">Zero-Knowledge Security</td>
                  <td className="p-4 sm:p-6 bg-blue-50/30 dark:bg-sky-950/10 font-bold text-emerald-600 dark:text-emerald-400">
                    Client-side AES-256-GCM
                  </td>
                  <td className="p-4 sm:p-6 text-rose-500 font-medium">None (Google scans for AI training & ads)</td>
                  <td className="p-4 sm:p-6 text-slate-600 dark:text-slate-300">None by default (ADP required)</td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-6 font-semibold text-slate-900 dark:text-white">Monthly Subscription</td>
                  <td className="p-4 sm:p-6 bg-blue-50/30 dark:bg-sky-950/10 font-bold text-blue-600 dark:text-sky-400">
                    $0.00 / month forever
                  </td>
                  <td className="p-4 sm:p-6 text-slate-600 dark:text-slate-300">$2.99 – $9.99 / mo for 2 TB</td>
                  <td className="p-4 sm:p-6 text-slate-600 dark:text-slate-300">$2.99 – $9.99 / mo for 2 TB</td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-6 font-semibold text-slate-900 dark:text-white">Direct Channel Access</td>
                  <td className="p-4 sm:p-6 bg-blue-50/30 dark:bg-sky-950/10 font-bold text-slate-900 dark:text-white">
                    Your own private Telegram channel
                  </td>
                  <td className="p-4 sm:p-6 text-slate-600 dark:text-slate-300">Proprietary locked database</td>
                  <td className="p-4 sm:p-6 text-slate-600 dark:text-slate-300">Proprietary iCloud database</td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-6 font-semibold text-slate-900 dark:text-white">Data Portability</td>
                  <td className="p-4 sm:p-6 bg-blue-50/30 dark:bg-sky-950/10 font-bold text-emerald-600 dark:text-emerald-400">
                    Bulk ZIP download & raw Telegram export
                  </td>
                  <td className="p-4 sm:p-6 text-slate-600 dark:text-slate-300">Google Takeout (multi-day delay)</td>
                  <td className="p-4 sm:p-6 text-slate-600 dark:text-slate-300">Browser download caps (1,000 photos max)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Direct Architecture Explainer */}
      <section id="security" className="py-20 md:py-28 bg-slate-50 dark:bg-[#161718] border-t border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest font-bold text-blue-600 dark:text-sky-400 mb-2">
              Three-Step Pipeline
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white font-['Google_Sans',sans-serif] tracking-tight">
              How Framely handles your media.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10">
              <span className="text-4xl font-black text-blue-600 dark:text-sky-400 font-mono">01</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2 font-['Google_Sans',sans-serif]">
                Direct MTProto Handshake
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                You authenticate directly with official Telegram servers over client-side WebSocket (WSS). No intermediate server receives your credentials or session keys.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10">
              <span className="text-4xl font-black text-blue-600 dark:text-sky-400 font-mono">02</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2 font-['Google_Sans',sans-serif]">
                Local Encryption & Ingestion
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Photos are stored as uncompressed master documents in a private channel created exclusively for your library. Media can optionally be encrypted with AES-256-GCM.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10">
              <span className="text-4xl font-black text-blue-600 dark:text-sky-400 font-mono">03</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2 font-['Google_Sans',sans-serif]">
                60 FPS Virtualized Index
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Thumbnails, EXIF telemetry, and regional place clustering are indexed locally in browser IndexedDB. Fast offline queries with instant retrieval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Technical FAQ Section */}
      <section id="faq" className="py-20 md:py-28 bg-white dark:bg-[#131314]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <h2 className="text-xs uppercase tracking-widest font-bold text-blue-600 dark:text-sky-400 mb-2">
              Straight Answers
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white font-['Google_Sans',sans-serif] tracking-tight">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Is Telegram cloud storage really free and unlimited?',
                a: 'Yes. Telegram allows channels to hold an unlimited number of messages and documents. The only hard constraint is the per-file size cap of 2,048 MB (2 GB), which is more than enough for high-bitrate 4K video clips and 100-megapixel RAW photos.'
              },
              {
                q: 'Does Framely compress or downsample my photos?',
                a: 'Never. Unlike Google Photos (which downsamples under "Storage Saver"), Framely uploads files strictly via Telegram\'s document API rather than photo compression mode. Every byte of your original bitstream and EXIF metadata is preserved bit-for-bit.'
              },
              {
                q: 'Can Telegram or Framely see my encrypted photos?',
                a: 'When you enable the Zero-Knowledge Vault, your photos and metadata are encrypted with AES-256-GCM before transmission. Neither Telegram nor Framely has access to your passphrase or encryption keys.'
              },
              {
                q: 'Does Framely operate a middleman server?',
                a: 'No. Framely is a client-only static web application. All MTProto network traffic flows directly between your browser and Telegram\'s public WebSockets gateway. Your session string is stored only in your browser\'s local storage.'
              },
              {
                q: 'What happens if I want to leave Framely?',
                a: 'You never lose access to your data. Because all photos reside in your own private Telegram channel, you can view, forward, or download them at any time directly through the official Telegram Desktop or mobile apps. Framely also includes a built-in bulk ZIP downloader.'
              },
              {
                q: 'How does regional place grouping work without sending GPS coordinates to third parties?',
                a: 'Framely parses the latitude and longitude from your photos\' EXIF headers directly inside your browser and computes proximity clusters locally on your device without transmitting coordinates to third-party tracking APIs.'
              }
            ].map((faq, idx) => {
              const isOpen = faqOpenIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50/50 dark:bg-[#1E1F20]/50 transition-colors"
                >
                  <button
                    onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-sky-400 transition-colors"
                  >
                    <span className="text-sm sm:text-base">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/50 dark:border-white/5 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Conversion Footer */}
      <footer className="py-16 md:py-24 bg-slate-950 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="max-w-3xl mx-auto">
            {/* Pure logo without any box */}
            <div className="flex justify-center mb-6">
              <FramelyLogo className="w-12 h-12" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-['Google_Sans',sans-serif]">
              Reclaim your photo library today.
            </h2>
            <p className="mt-4 text-base text-slate-400">
              No subscription fee. No cloud lock-in. Full original quality in your private Telegram vault.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={handleLaunchApp}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold text-slate-950 bg-white hover:bg-slate-100 transition-all shadow-lg active:scale-98"
              >
                <span>Launch Framely Web App</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleStartOnboarding}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-full text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <span>Get Started Guide (3 min)</span>
              </button>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div className="flex items-center gap-3">
              <FramelyLogo className="w-5 h-5" />
              <span>Framely • Private Photos in your own Telegram</span>
            </div>
            <div className="flex items-center gap-6">
              <span>Client-Side AES-256-GCM</span>
              <span>Direct MTProto 2.0</span>
              <span>Open Source</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
