import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GeoMap, GeoFeedSheet, GeoTips } from '../components/geo-map';
import useGeoStore from '../store/useGeoStore';
import { ArrowLeft, Search, X, MapPin, SlidersHorizontal, Navigation2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClusterData {
  geoHash: string;
  lat: number;
  lng: number;
  count: number;
  avgPrice?: number;
  isCluster: boolean;
  adId?: string;
  sampleAd?: {
    id?: string;
    title: string;
    price: number;
  };
}

export default function GeoMapPage() {
  const navigate = useNavigate();
  const { coords, cityName, radiusKm, requestLocation } = useGeoStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [adsCount, setAdsCount] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const handleMarkerClick = useCallback((cluster: ClusterData) => {
    if (!cluster.isCluster) {
      const adId = cluster.adId || cluster.sampleAd?.id;
      if (adId) {
        navigate(`/ads/${adId}`);
      } else {
        setSheetOpen(true);
      }
    } else {
      setSheetOpen(true);
    }
  }, [navigate]);
  
  const handleAdClick = useCallback((adId: string) => {
    navigate(`/ads/${adId}`);
  }, [navigate]);
  
  const handleTipAction = useCallback((action: string) => {
    if (action === 'create_ad') {
      navigate('/ads/create');
    } else if (action === 'view_feed') {
      setSheetOpen(true);
    }
  }, [navigate]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  }, [searchQuery, navigate]);

  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      await requestLocation();
    } finally {
      setIsLocating(false);
    }
  };

  const handleClustersUpdate = useCallback((count: number) => {
    setAdsCount(count);
    setShowEmptyState(count === 0);
  }, []);
  
  return (
    <div className="h-screen w-full flex flex-col bg-white">
      {/* Yandex Go Style Header */}
      <div 
        className="bg-white"
        style={{ 
          zIndex: 1001,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}
      >
        {/* Top Bar */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
            onClick={() => navigate(-1)}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-gray-900 truncate">
                {cityName || 'Выберите местоположение'}
              </span>
            </div>
            {coords && (
              <div className="text-xs text-gray-500">
                Радиус {radiusKm < 1 ? `${radiusKm * 1000} м` : `${radiusKm} км`}
                {adsCount !== null && (
                  <span className="ml-2 text-blue-500">
                    {adsCount} {adsCount === 1 ? 'объявление' : adsCount < 5 ? 'объявления' : 'объявлений'}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <button
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
            onClick={() => setSheetOpen(true)}
            data-testid="button-filter"
          >
            <SlidersHorizontal className="w-5 h-5 text-gray-700" />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div 
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl transition-all ${
              isSearchFocused 
                ? 'bg-white ring-2 ring-blue-500 shadow-lg' 
                : 'bg-gray-100'
            }`}
          >
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Поиск на карте..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400"
              data-testid="input-map-search"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full hover:bg-gray-200"
                data-testid="button-clear-search"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="flex-1 relative" style={{ minHeight: '400px' }}>
        <GeoMap
          onMarkerClick={handleMarkerClick}
          categoryId={selectedCategoryId}
          onClustersUpdate={handleClustersUpdate}
        />
        
        {/* Geo Tips Overlay */}
        {coords && !sheetOpen && (
          <div className="absolute top-4 left-4 right-20" style={{ zIndex: 999 }}>
            <GeoTips
              role="buyer"
              onActionClick={handleTipAction}
            />
          </div>
        )}

        {/* Floating Locate Button (Yandex Go Style) */}
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          className="absolute bottom-28 right-4 w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          style={{ zIndex: 1000 }}
          data-testid="button-locate-me"
        >
          <Navigation2 
            className={`w-6 h-6 ${isLocating ? 'animate-pulse text-blue-500' : 'text-gray-700'}`}
            style={{ transform: 'rotate(45deg)' }}
          />
        </button>

        {/* Empty State Overlay */}
        <AnimatePresence>
          {showEmptyState && !sheetOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-32 left-4 right-4"
              style={{ zIndex: 999 }}
            >
              <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Нет объявлений</p>
                  <p className="text-sm text-gray-500">Увеличьте радиус или переместите карту</p>
                </div>
                <button
                  onClick={() => setSheetOpen(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium active:scale-95 transition-transform"
                  data-testid="button-change-radius"
                >
                  Радиус
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Feed Sheet */}
      <GeoFeedSheet
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
        categoryId={selectedCategoryId}
        onAdClick={handleAdClick}
      />
    </div>
  );
}
