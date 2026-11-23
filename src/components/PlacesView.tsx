import React, { useState, useMemo } from 'react';
import {
  MapPin,
  ArrowLeft,
  ExternalLink,
  Play,
  Heart,
  Navigation,
  Compass,
  Search,
  Globe2,
  Sparkles
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../context/AppContext';
import { db } from '../db';
import type { MediaItem } from '../types';

interface PlaceGroup {
  name: string;
  subtitle?: string;
  lat?: number;
  lon?: number;
  items: MediaItem[];
  coverUrl?: string;
}

/**
 * Smart Geographical Cluster Naming
 * Transforms technical GPS coordinates into elegant human-readable regional names
 */
function resolveGeographicalName(lat: number, lon: number): { name: string; subtitle: string } {
  // Mumbai Central & South
  if (lat >= 18.85 && lat <= 19.10 && lon >= 72.78 && lon <= 72.95) {
    return { name: 'Mumbai City & Harbor', subtitle: 'Maharashtra, India' };
  }
  // Mumbai Western Suburbs (Bandra, Juhu, Andheri, Borivali)
  if (lat > 19.10 && lat <= 19.32 && lon >= 72.78 && lon <= 72.95) {
    return { name: 'Mumbai Western Suburbs', subtitle: 'Bandra to Borivali' };
  }
  // Vasai-Virar & Arnala Coast
  if (lat > 19.32 && lat <= 19.50 && lon >= 72.72 && lon <= 72.92) {
    return { name: 'Vasai & Virar Coast', subtitle: 'Northern Konkan Shores' };
  }
  // Palghar, Kelva Beach & Dahanu
  if (lat > 19.50 && lat <= 20.00 && lon >= 72.60 && lon <= 72.90) {
    return { name: 'Palghar & Coastal Beaches', subtitle: 'Maharashtra, India' };
  }
  // Thane, Kalyan, Dombivli & Titwala
  if (lat >= 19.15 && lat <= 19.60 && lon > 72.95 && lon <= 73.30) {
    return { name: 'Thane & Kalyan Valley', subtitle: 'Western Ghats Foothills' };
  }
  // Pune, Lonavala, Khandala & Jejuri
  if (lat >= 18.20 && lat <= 18.85 && lon >= 73.35 && lon <= 74.30) {
    return { name: 'Pune & Western Ghats', subtitle: 'Highlands & Heritage' };
  }
  // Goa & Konkan Coastal Belt
  if (lat >= 15.00 && lat <= 15.90 && lon >= 73.65 && lon <= 74.30) {
    return { name: 'Goa Coastal Shores', subtitle: 'Arabian Sea Coast' };
  }
  // Delhi NCR
  if (lat >= 28.35 && lat <= 28.90 && lon >= 76.90 && lon <= 77.50) {
    return { name: 'Delhi NCR & Capital Region', subtitle: 'National Capital Territory' };
  }
  // Bengaluru
  if (lat >= 12.80 && lat <= 13.20 && lon >= 77.40 && lon <= 77.80) {
    return { name: 'Bengaluru & Silicon Valley', subtitle: 'Karnataka, India' };
  }

  // Fallback for other coordinates
  return {
    name: `Scenic Horizon (${lat.toFixed(1)}°N, ${lon.toFixed(1)}°E)`,
    subtitle: 'Geotagged Trip'
  };
}

export const PlacesView: React.FC = () => {
  const { session, setSelectedMedia } = useApp();
  const [selectedPlace, setSelectedPlace] = useState<PlaceGroup | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const activeScope = session?.channelId || session?.userId || 'me';

  const allMedia = useLiveQuery(
    async () => {
      if (!session) return [];
      const items = await db.media.where('libraryId').equals(activeScope).toArray();
      return items.filter(m => !m.trashedAt && !m.isArchived);
    },
    [session?.channelId, session?.userId],
    []
  );

  // Group media into distinct, beautifully titled places
  const placeGroups = useMemo(() => {
    if (!allMedia || allMedia.length === 0) return [];
    const map = new Map<string, PlaceGroup>();

    for (const item of allMedia) {
      let placeName = item.placeName;
      let placeSubtitle = 'Saved Location';

      if (placeName) {
        placeSubtitle = 'Custom Geotag';
      } else if (item.latitude && item.longitude) {
        const resolved = resolveGeographicalName(item.latitude, item.longitude);
        placeName = resolved.name;
        placeSubtitle = resolved.subtitle;
      } else if (/sunset|sun|dusk|dawn/i.test(item.filename)) {
        placeName = 'Sunsets & Horizons';
        placeSubtitle = 'Golden Hour Captures';
      } else if (/mountain|alps|hill|trek/i.test(item.filename)) {
        placeName = 'Mountains & Highlands';
        placeSubtitle = 'Scenic Landscapes';
      } else if (/beach|coast|sea|water|lake/i.test(item.filename)) {
        placeName = 'Coastlines & Waters';
        placeSubtitle = 'Beaches & Shores';
      } else if (/city|street|urban|road|drive/i.test(item.filename)) {
        placeName = 'Cityscapes & Road Trips';
        placeSubtitle = 'Urban & Travel';
      } else {
        placeName = 'Framely Private Vault';
        placeSubtitle = 'Uncategorized Locations';
      }

      if (!map.has(placeName)) {
        map.set(placeName, {
          name: placeName,
          subtitle: placeSubtitle,
          lat: item.latitude,
          lon: item.longitude,
          items: [],
          coverUrl: item.thumbnailDataUrl,
        });
      }
      map.get(placeName)!.items.push(item);
    }

    return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
  }, [allMedia]);

  const filteredPlaces = useMemo(() => {
    if (!searchFilter.trim()) return placeGroups;
    const query = searchFilter.toLowerCase();
    return placeGroups.filter(
      p => p.name.toLowerCase().includes(query) || (p.subtitle && p.subtitle.toLowerCase().includes(query))
    );
  }, [placeGroups, searchFilter]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFD] dark:bg-[#131314] select-none transition-colors">
      {selectedPlace ? (
        // Place Detail View
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Bar */}
          <div className="p-4 sm:px-8 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-white/80 dark:bg-[#1E1F20]/80 backdrop-blur-xl">
            <div className="flex items-center gap-3.5">
              <button
                onClick={() => setSelectedPlace(null)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.08] text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors"
                title="Back to all places"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                  <span>{selectedPlace.name}</span>
                </h2>
                <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF]">
                  {selectedPlace.subtitle} • {selectedPlace.items.length} {selectedPlace.items.length === 1 ? 'photo' : 'photos'}
                </p>
              </div>
            </div>

            {selectedPlace.lat && selectedPlace.lon && (
              <a
                href={`https://www.google.com/maps?q=${selectedPlace.lat},${selectedPlace.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium transition-all border border-emerald-500/20"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
              </a>
            )}
          </div>

          {/* Photos Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5 sm:gap-2">
              {selectedPlace.items.map((item) => (
                <div
                  key={item.messageId}
                  onClick={() => setSelectedMedia(item)}
                  className="photo-card relative aspect-square bg-slate-200 dark:bg-[#1E1F20] overflow-hidden cursor-pointer select-none rounded-xl group"
                >
                  <img
                    src={item.thumbnailDataUrl}
                    alt={item.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {item.kind === 'video' && (
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 fill-white" />
                    </div>
                  )}
                  {item.isFavorite && (
                    <div className="absolute top-1.5 left-1.5 p-1 rounded-full bg-black/40 text-amber-400">
                      <Heart className="w-3 h-3 fill-amber-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Places Overview Grid
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1F1F1F] dark:text-[#E3E3E3] tracking-tight flex items-center gap-2.5">
                <Compass className="w-6 h-6 text-emerald-500" />
                <span>Places</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#5F6368] dark:text-[#C2C7CF] mt-1">
                Explore your photos and memories grouped by geographical destinations.
              </p>
            </div>

            {/* Places Search Bar */}
            {placeGroups.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter places..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/[0.08] rounded-full pl-9 pr-4 py-1.5 text-xs text-[#1F1F1F] dark:text-[#E3E3E3] focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            )}
          </div>

          {filteredPlaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredPlaces.map((place) => (
                <div
                  key={place.name}
                  onClick={() => setSelectedPlace(place)}
                  className="group relative rounded-3xl overflow-hidden bg-white dark:bg-[#1E1F20] border border-slate-200/90 dark:border-white/[0.08] shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                >
                  {/* Place Image Cover */}
                  <div className="aspect-[16/10] w-full bg-slate-200 dark:bg-[#282A2C] overflow-hidden relative">
                    {place.coverUrl ? (
                      <img
                        src={place.coverUrl}
                        alt={place.name}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <MapPin className="w-8 h-8" />
                      </div>
                    )}
                    
                    {/* Dark gradient overlay for contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                    {/* Top Chips */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <div className="p-1.5 rounded-full bg-black/40 backdrop-blur-md text-emerald-400 border border-white/10">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-medium border border-white/10">
                        {place.items.length} {place.items.length === 1 ? 'photo' : 'photos'}
                      </span>
                    </div>

                    {/* Bottom Title & Subtitle */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-semibold text-sm sm:text-base drop-shadow-md truncate tracking-tight">
                        {place.name}
                      </h3>
                      <p className="text-[11px] text-white/70 truncate mt-0.5 font-medium">
                        {place.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div className="px-4 py-3 flex items-center justify-between text-xs text-[#5F6368] dark:text-[#C2C7CF] bg-white dark:bg-[#1E1F20]">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Explore album</span>
                    </span>
                    <span className="text-sky-600 dark:text-sky-400 font-semibold group-hover:translate-x-0.5 transition-transform text-xs">
                      View →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 border border-emerald-500/20">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">
                {searchFilter ? 'No matching places found' : 'No places detected yet'}
              </h3>
              <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF] max-w-sm mt-1">
                {searchFilter
                  ? `No destination matched "${searchFilter}". Try another search term.`
                  : 'Photos with GPS location metadata or location tags will automatically appear here.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
