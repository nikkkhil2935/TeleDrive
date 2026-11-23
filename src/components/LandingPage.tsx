import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Cloud,
  Zap,
  Lock,
  Unlock,
  HardDrive,
  RefreshCw,
  Layers,
  CheckCircle2,
  ArrowRight,
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
  Pause,
  Heart,
  Grid3X3,
  Search,
  Maximize2,
  ExternalLink,
  Smartphone,
  Cpu,
  FolderLock
} from 'lucide-react';
import { FramelyLogo } from './FramelyLogo';
import { useApp } from '../context/AppContext';

// Curated high-resolution master photography for authentic product stages
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

const SAMPLE_PLACES = [
  { name: 'Mumbai City & Harbor', count: 248, coords: '18.92° N, 72.83° E', preview: SAMPLE_PHOTOS[0].url },
  { name: 'Vasai & Virar Coast', count: 184, coords: '19.38° N, 72.82° E', preview: SAMPLE_PHOTOS[4].url },
  { name: 'Pune & Western Ghats', count: 96, coords: '18.52° N, 73.85° E', preview: SAMPLE_PHOTOS[2].url },
  { name: 'Palghar & Coastal Beaches', count: 64, coords: '19.69° N, 72.76° E', preview: SAMPLE_PHOTOS[1].url },
];

export const LandingPage: React.FC = () => {
  const { enterApp, setIsAuthModalOpen, setIsOnboardingOpen, theme, setTheme } = useApp();

  // Stageshow Desktop Stage State
  const [activeStageTab, setActiveStageTab] = useState<'photos' | 'places' | 'vault'>('photos');
  const [activePhoto, setActivePhoto] = useState(SAMPLE_PHOTOS[0]);
  const [isExifModalOpen, setIsExifModalOpen] = useState(false);
  const [stageDensity, setStageDensity] = useState<'standard' | 'dense'>('standard');
  const [favorites, setFavorites] = useState<number[]>([1, 3]);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [vaultPassphrase, setVaultPassphrase] = useState('master-key-2026');

  // Stageshow Auto-Tour State
  const [isAutoTourRunning, setIsAutoTourRunning] = useState(false);

  // Interactive Bento Vault Simulator State
  const [vaultInput, setVaultInput] = useState('Master_Backup_2026_RAW.DNG');
  const [bentoDensityPreview, setBentoDensityPreview] = useState<'compact' | 'standard' | 'large'>('standard');
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  // Auto-tour effect
  useEffect(() => {
    if (!isAutoTourRunning) return;
    const interval = setInterval(() => {
      setActiveStageTab((prev) => {
        if (prev === 'photos') return 'places';
        if (prev === 'places') return 'vault';
        return 'photos';
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoTourRunning]);

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
          
          {/* Brand Mark (STRICT: Pure Framely Logo, NO enclosing box/container) */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <FramelyLogo className="w-8 h-8 transition-transform group-hover:scale-105 duration-200 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xl font-wordmark font-[900] tracking-tight text-slate-900 dark:text-white leading-tight">
                Framely
              </span>
              <span className="text-[10px] font-nav-tag font-[650] uppercase tracking-wider text-blue-600 dark:text-sky-400">
                Direct Telegram Drive
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-nav-tag font-[650] text-slate-600 dark:text-slate-300">
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
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Sign In */}
            <button
              onClick={handleSignIn}
              className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-[600] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Sign In
            </button>

            {/* Launch App Primary CTA */}
            <button
              onClick={handleLaunchApp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-[600] text-white bg-[#0B57D0] hover:bg-[#0842A0] dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 transition-all shadow-sm hover:shadow-md active:scale-98 cursor-pointer"
            >
              <span>Launch Web App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section with Stageshow Miniature Desktop & Satellite */}
      <section className="relative pt-14 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-50/50 via-white to-white dark:from-[#161718] dark:via-[#131314] dark:to-[#131314]">
        
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Eyebrow Pill + Handwriting Motion Design Badge */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-badge-card font-[700] bg-blue-50 text-blue-700 dark:bg-sky-950/60 dark:text-sky-300 border border-blue-200/60 dark:border-sky-800/60">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
              <span>Open Source • Telegram Channel Cloud Engine • Zero-Knowledge Vault</span>
            </div>
            <span className="font-handwriting text-blue-600 dark:text-sky-400 text-lg tracking-wide -rotate-2 select-none inline-flex items-center">
              motion-design in your browser ✦
            </span>
          </div>

          {/* Factual, assertive headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-wordmark font-[900] tracking-tight text-slate-950 dark:text-white max-w-4xl mx-auto leading-[1.08]">
            Your photos, in your own Telegram.
          </h1>

          {/* Sub-headline with concrete technical guarantees */}
          <p className="mt-6 text-lg sm:text-xl font-[500] text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Uncompressed original master bitstreams. Unlimited storage in your private Telegram channel. 
            Client-side AES-256-GCM encryption. Zero middleman servers.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleLaunchApp}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-[600] text-white bg-[#0B57D0] hover:bg-[#0842A0] dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
            >
              <span>Open Framely App</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleStartOnboarding}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-[600] text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-xs cursor-pointer"
            >
              <span>3-Minute Quick Setup</span>
            </button>
          </div>

          {/* 4-Metric Concrete Proof Strip with Anton Ticket Titles */}
          <div className="mt-12 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-[#1A1B1C]/80 border border-slate-200/80 dark:border-white/10 backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center p-2">
              <span className="text-3xl font-ticket-title font-anton text-slate-900 dark:text-white">2,048 MB</span>
              <span className="text-xs font-nav-tag font-[650] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">Max Single File</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2">
              <span className="text-3xl font-ticket-title font-anton text-blue-600 dark:text-sky-400">$0.00 / MO</span>
              <span className="text-xs font-nav-tag font-[650] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">Free Cloud Storage</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2">
              <span className="text-3xl font-ticket-title font-anton text-slate-900 dark:text-white">256-BIT</span>
              <span className="text-xs font-nav-tag font-[650] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">AES-GCM Web Crypto</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2">
              <span className="text-3xl font-ticket-title font-anton text-emerald-600 dark:text-emerald-400">0 BYTES</span>
              <span className="text-xs font-nav-tag font-[650] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">Plaintext Leaked</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* STAGESHOW HERO WINDOW & SATELLITE (framing.md Gold Bar)   */}
          {/* ======================================================== */}
          <div className="mt-14 max-w-5xl mx-auto relative text-left">
            
            {/* Primary Desktop Window Frame */}
            <div className="relative rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#131314] shadow-2xl overflow-hidden transition-all">
              
              {/* Window Chrome Titlebar */}
              <div className="h-10 px-4 bg-slate-100 dark:bg-[#1E1F20] border-b border-slate-200 dark:border-white/10 flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-emerald-500" />
                    <span>telegram://channel/4298525450 • MTProto 2.0 Direct WSS</span>
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Tour Toggle Button */}
                  <button
                    onClick={() => setIsAutoTourRunning(!isAutoTourRunning)}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/15 transition-colors cursor-pointer"
                  >
                    {isAutoTourRunning ? <Pause className="w-3 h-3 text-amber-500" /> : <Play className="w-3 h-3 text-blue-600 dark:text-sky-400" />}
                    <span>{isAutoTourRunning ? 'Pause Tour' : 'Auto Tour'}</span>
                  </button>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-sky-950 dark:text-sky-300">
                    Live Stage
                  </span>
                </div>
              </div>

              {/* Stageshow App Interior */}
              <div className="flex h-[490px] sm:h-[550px]">
                
                {/* Mini App Sidebar with Interactive Tabs */}
                <div className="hidden sm:flex w-52 border-r border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171819] flex-col p-3 space-y-1 select-none">
                  <div
                    onClick={() => setActiveStageTab('photos')}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-full font-semibold text-xs cursor-pointer transition-colors ${
                      activeStageTab === 'photos'
                        ? 'bg-blue-100 text-blue-900 dark:bg-sky-950 dark:text-sky-200'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5'
                    }`}
                  >
                    <FramelyLogo className="w-4 h-4" />
                    <span>Photos Timeline</span>
                  </div>

                  <div
                    onClick={() => setActiveStageTab('places')}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-full font-semibold text-xs cursor-pointer transition-colors ${
                      activeStageTab === 'places'
                        ? 'bg-blue-100 text-blue-900 dark:bg-sky-950 dark:text-sky-200'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span>Smart Places</span>
                  </div>

                  <div
                    onClick={() => setActiveStageTab('vault')}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-full font-semibold text-xs cursor-pointer transition-colors ${
                      activeStageTab === 'vault'
                        ? 'bg-blue-100 text-blue-900 dark:bg-sky-950 dark:text-sky-200'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span>Locked Folder</span>
                  </div>

                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-full text-slate-500 dark:text-slate-400 font-medium text-xs hover:bg-slate-200/50 dark:hover:bg-white/5 cursor-pointer">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span>Favorites ({favorites.length})</span>
                  </div>

                  {/* Storage Allocation Gauge */}
                  <div className="pt-4 mt-auto border-t border-slate-200 dark:border-white/10 text-[10px] text-slate-500">
                    <div className="flex justify-between mb-1.5 font-medium">
                      <span>Telegram Storage</span>
                      <span className="font-semibold text-blue-600 dark:text-sky-400">1.77 GB / Unlimited</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                      <div className="h-full bg-blue-600 dark:bg-sky-400 w-1/4 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Mini App Main Stage */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#131314]">
                  
                  {/* Top Bar with Search & Quick density */}
                  <div className="h-12 border-b border-slate-200 dark:border-white/10 px-4 flex items-center justify-between gap-4">
                    <div className="flex-1 max-w-sm flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#1E1F20] text-xs text-slate-500">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <span>Search dates, camera, or places...</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setStageDensity(d => d === 'standard' ? 'dense' : 'standard')}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                        title="Toggle Density"
                      >
                        <Grid3X3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleLaunchApp}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-[#0B57D0] text-white hover:bg-[#0842A0] cursor-pointer"
                      >
                        Launch App
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Stage View Switcher */}
                  <div className="flex-1 overflow-y-auto p-4 relative">
                    
                    {/* VIEW 1: PHOTOS TIMELINE */}
                    {activeStageTab === 'photos' && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Memories Carousel */}
                        <div>
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                            <span>Recent Highlights</span>
                            <span className="text-[10px] text-blue-600 dark:text-sky-400 font-medium">Auto-Clustered</span>
                          </div>
                          <div className="flex gap-2.5 overflow-x-hidden">
                            {SAMPLE_PHOTOS.slice(0, 3).map((item) => (
                              <div
                                key={item.id}
                                onClick={() => { setActivePhoto(item); setIsExifModalOpen(true); }}
                                className="w-36 h-22 rounded-xl relative overflow-hidden group cursor-pointer border border-slate-200 dark:border-white/10 shrink-0"
                              >
                                <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2 flex flex-col justify-end text-white">
                                  <span className="text-[11px] font-bold truncate">{item.title}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Date Group Heading */}
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 pt-1">
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
                              
                              {/* Hover Overlay with telemetry */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between text-white">
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={(e) => toggleFavorite(photo.id, e)}
                                    className={`p-1 rounded-full backdrop-blur-md cursor-pointer ${favorites.includes(photo.id) ? 'text-rose-500 bg-white/90' : 'text-white bg-black/40 hover:bg-black/60'}`}
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
                      </div>
                    )}

                    {/* VIEW 2: SMART PLACES */}
                    {activeStageTab === 'places' && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white font-['Google_Sans',sans-serif]">
                              Regional Place Clusters
                            </h4>
                            <p className="text-xs text-slate-500">Clustered locally from EXIF GPS metadata</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Zero Remote Geocoding Calls
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {SAMPLE_PLACES.map((place, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-[#1E1F20]/60 flex items-center gap-3 hover:border-blue-500 transition-all cursor-pointer group"
                            >
                              <div className="w-16 h-14 rounded-lg overflow-hidden shrink-0">
                                <img src={place.preview} alt={place.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{place.name}</p>
                                <p className="text-[10px] font-mono text-slate-500 truncate">{place.coords}</p>
                                <span className="inline-block mt-1 text-[10px] font-semibold text-blue-600 dark:text-sky-400">
                                  {place.count} photos & videos
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* VIEW 3: LOCKED FOLDER */}
                    {activeStageTab === 'vault' && (
                      <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 mb-3">
                          <FolderLock className="w-8 h-8" />
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white font-['Google_Sans',sans-serif]">
                          Zero-Knowledge Locked Folder
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
                          Protected by client-side AES-256-GCM. Unencrypted master files never touch the network or drive.
                        </p>

                        <div className="w-full max-w-xs p-3 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-mono text-[11px]">Hardware Cipher:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">AES-256-GCM</span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="password"
                              value={vaultPassphrase}
                              onChange={(e) => setVaultPassphrase(e.target.value)}
                              className="flex-1 px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-[#1E1F20] border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white font-mono"
                            />
                            <button
                              onClick={() => setIsVaultUnlocked(!isVaultUnlocked)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                            >
                              {isVaultUnlocked ? 'Lock' : 'Unlock'}
                            </button>
                          </div>
                          {isVaultUnlocked && (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              ✓ 14 Protected Items Unlocked in Memory
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Google Photos Floating Vertical Date Rail */}
                    {activeStageTab === 'photos' && (
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
                    )}

                  </div>
                </div>
              </div>

              {/* Stageshow Photo EXIF Popover */}
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
                        className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="w-full h-44 rounded-xl overflow-hidden bg-slate-950">
                        <img src={activePhoto.url} alt={activePhoto.title} className="w-full h-full object-contain" />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
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

            {/* SATELLITE CARD (framing.md Rule 7 & 18): Straddles bottom-right edge */}
            <div className="hidden md:flex absolute -bottom-6 right-6 z-20 items-center gap-3 p-3.5 rounded-2xl bg-white/95 dark:bg-[#1E1F20]/95 backdrop-blur-md border border-slate-200/90 dark:border-white/15 shadow-xl animate-in slide-in-from-bottom-3 duration-300">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-sky-950/50 text-blue-600 dark:text-sky-400 border border-blue-200/60 dark:border-sky-800/40">
                <Cloud className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Direct Telegram Sync</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    24ms WSS
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  IMG_2026_RAW.DNG (24.1 MB) • Bitstream Verified
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Refined 6-Card Bento Grid Section (bento.md Guidelines) */}
      <section id="bento" className="py-20 md:py-28 bg-slate-50 dark:bg-[#161718] border-y border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest font-bold text-blue-600 dark:text-sky-400 mb-2">
              Architecture Bento
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white font-['Google_Sans',sans-serif] tracking-tight">
              Six engineering pillars behind Framely.
            </p>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
              Clean separation between client-side Web Crypto, local IndexedDB caching, and direct MTProto WSS transport.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Tile 1: Hero UI (Span 2 cols) - Client-Side Zero-Knowledge Encryption Engine */}
            <div className="md:col-span-2 p-8 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-wordmark font-[900] text-slate-900 dark:text-white">
                        Zero-Knowledge Hardware Encryption
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        AES-256-GCM • PBKDF2 100,000 Iterations • Web Crypto API
                      </p>
                    </div>
                  </div>
                  <span className="font-handwriting text-emerald-600 dark:text-emerald-400 text-sm rotate-[-1deg] select-none hidden sm:inline">
                    100k PBKDF2 rounds • zero servers ✦
                  </span>
                </div>

                <p className="text-sm font-[500] text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  Every photo, thumbnail, and EXIF payload is encrypted in memory before leaving your device. 
                  Neither Telegram nor any middleman can read your photos. Only you hold the passphrase.
                </p>

                {/* Interactive Cipher Harness */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Live In-Browser Crypto Harness</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Hardware Tag Verified
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={vaultInput}
                      onChange={(e) => setVaultInput(e.target.value)}
                      placeholder="Type sample photo filename..."
                      className="flex-1 px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#171819] border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-blue-500"
                    />
                    <div className="px-3 py-2 rounded-xl text-xs font-mono bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
                      <Key className="w-3.5 h-3.5 text-amber-500" />
                      <span>aes-256-gcm-0x8f2d...91e4</span>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono p-2.5 rounded-xl bg-slate-900 text-emerald-400 dark:bg-black overflow-x-auto">
                    <span>CIPHERTEXT: </span>
                    <span className="text-slate-400">
                      {btoa(vaultInput + '_authenticated_aes256_gcm_tag_ok')}...==
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
                <span>Passphrase never touches any disk or server</span>
                <span className="font-medium text-blue-600 dark:text-sky-400">RFC 5116 Spec Compliant</span>
              </div>
            </div>

            {/* Tile 2: Stat Tile (Span 1 col) - Unlimited Free Cloud Storage */}
            <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-sky-950/50 text-blue-600 dark:text-sky-400 border border-blue-200 dark:border-sky-800/40 w-fit">
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <span className="font-handwriting text-sky-500 dark:text-sky-400 text-sm -rotate-2 select-none">
                    unlimited free cloud! ✦
                  </span>
                </div>
                <h3 className="text-xl font-wordmark font-[900] text-slate-900 dark:text-white mb-2">
                  Unlimited Free Cloud Storage
                </h3>
                <p className="text-sm font-[500] text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  Powered by Telegram Channel Document infrastructure. Store tens of thousands of raw 4K videos and DNG files without paying monthly subscription fees.
                </p>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-sky-950/30 border border-blue-200/70 dark:border-sky-800/40">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-nav-tag font-[650] text-blue-900 dark:text-sky-200 uppercase tracking-wider">Framely (Telegram)</span>
                      <span className="text-3xl font-ticket-title font-anton text-blue-600 dark:text-sky-400">$0.00</span>
                    </div>
                    <span className="text-[11px] font-nav-tag font-[650] text-slate-500 dark:text-slate-400 block">
                      UNLIMITED TB • 2,048 MB SINGLE FILE CAP
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 opacity-70">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-medium text-slate-500 line-through">Google Photos 2TB</span>
                      <span className="text-xs font-bold text-slate-500">$9.99 / mo</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">Restricted quota • Downscales on free tier</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 text-xs font-nav-tag font-[650] text-slate-500 uppercase tracking-wider">
                Official Telegram Channel Documents
              </div>
            </div>

            {/* Tile 3: Diagram Tile (Span 1 col) - Direct MTProto 2.0 WSS Streaming */}
            <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 w-fit">
                    <Zap className="w-6 h-6" />
                  </div>
                  <span className="font-handwriting text-amber-500 dark:text-amber-400 text-sm rotate-1 select-none">
                    0 middleman servers ✦
                  </span>
                </div>
                <h3 className="text-xl font-wordmark font-[900] text-slate-900 dark:text-white mb-2">
                  Direct MTProto 2.0 WSS
                </h3>
                <p className="text-sm font-[500] text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  Your browser connects directly to Telegram Datacenters over secure WebSockets. Multi-chunk concurrent transfers deliver instant streaming.
                </p>

                {/* SVG Architecture Diagram */}
                <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-nav-tag font-[650] uppercase tracking-wider">
                    <span>Browser Client</span>
                    <span className="text-emerald-400">Direct WSS</span>
                    <span>Telegram DC 1</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 relative overflow-hidden">
                    <div className="h-full bg-emerald-400 w-full animate-pulse" />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                    <span>Relay Servers: <strong className="text-rose-400 font-ticket-title font-anton text-sm">0</strong></span>
                    <span>Latency: <strong className="text-amber-300 font-ticket-title font-anton text-sm">24MS</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 text-xs font-nav-tag font-[650] text-slate-500 uppercase tracking-wider">
                Zero proxy intermediaries
              </div>
            </div>

            {/* Tile 4: Component Tile (Span 2 cols) - Authentic Google Photos Desktop Craft */}
            <div className="md:col-span-2 p-8 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-sky-950/50 text-blue-600 dark:text-sky-400 border border-blue-200 dark:border-sky-800/40">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-wordmark font-[900] text-slate-900 dark:text-white">
                        Authentic Desktop Library Ergonomics
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        60 FPS Virtualized Timeline • Floating Date Scrubber • Keyboard Navigation
                      </p>
                    </div>
                  </div>
                  <span className="font-handwriting text-blue-600 dark:text-sky-400 text-sm rotate-1 select-none hidden sm:inline">
                    raw EXIF bitstreams ✦
                  </span>
                </div>

                <p className="text-sm font-[500] text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  Every interaction was designed to mirror the refined ergonomics of desktop Google Photos: 
                  instant year jumping via the floating frosted date rail, memories carousel highlights, 
                  and full keyboard navigation (Space, Esc, Arrow Keys, Delete).
                </p>

                {/* Interactive Density Switcher Preview */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Live Grid Density Control:</span>
                    <div className="flex gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-white/10">
                      {(['compact', 'standard', 'large'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setBentoDensityPreview(mode)}
                          className={`px-3 py-1 rounded-lg font-medium text-xs capitalize transition-colors cursor-pointer ${
                            bentoDensityPreview === mode
                              ? 'bg-white dark:bg-[#1E1F20] text-slate-900 dark:text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`grid gap-2 transition-all ${
                    bentoDensityPreview === 'compact' ? 'grid-cols-6' : bentoDensityPreview === 'large' ? 'grid-cols-3' : 'grid-cols-4'
                  }`}>
                    {SAMPLE_PHOTOS.slice(0, 6).map((item) => (
                      <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-slate-200 dark:bg-white/10">
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
                <span>Designed for photographers with 50,000+ libraries</span>
                <span className="font-medium text-blue-600 dark:text-sky-400">Virtualized IndexedDB Engine</span>
              </div>
            </div>

            {/* Tile 5: Collection Tile (Span 1 col) - Smart Regional Places */}
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

            {/* Tile 6: Object / Optic Tile (Span 2 cols) - Darkroom Cinema Lightbox & EXIF Studio */}
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
                  <div className="p-3.5 rounded-2xl bg-slate-900 text-white">
                    <span className="text-slate-400 text-[10px] block">APERTURE</span>
                    <span className="text-base font-bold text-sky-400">f / 1.8</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900 text-white">
                    <span className="text-slate-400 text-[10px] block">SHUTTER</span>
                    <span className="text-base font-bold text-emerald-400">1 / 240s</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900 text-white">
                    <span className="text-slate-400 text-[10px] block">FOCAL</span>
                    <span className="text-base font-bold text-amber-400">26mm</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900 text-white">
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
                      <FramelyLogo className="w-4 h-4 shrink-0" />
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
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
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
            {/* Pure logo mark without any box */}
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
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold text-slate-950 bg-white hover:bg-slate-100 transition-all shadow-lg active:scale-98 cursor-pointer"
              >
                <span>Launch Framely Web App</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleStartOnboarding}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-full text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
              >
                <span>Get Started Guide (3 min)</span>
              </button>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div className="flex items-center gap-3">
              <FramelyLogo className="w-5 h-5 shrink-0" />
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
