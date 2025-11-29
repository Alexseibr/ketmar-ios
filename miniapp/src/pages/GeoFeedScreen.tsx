import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import useGeoStore from '../store/useGeoStore';
import { 
  Search, MapPin, Locate, Package, 
  ChevronUp, ChevronDown, Sparkles, X, AlertCircle, RefreshCw,
  Leaf, Store, User, Loader2
} from 'lucide-react';
import { getThumbnailUrl, NO_PHOTO_PLACEHOLDER } from '@/constants/placeholders';

const RADIUS_OPTIONS = [
  { value: 0.3, label: '300м' },
  { value: 1, label: '1км' },
  { value: 3, label: '3км' },
  { value: 5, label: '5км' },
  { value: 10, label: '10км' },
  { value: 20, label: '20км' },
];

type SellerType = 'farmer' | 'store' | 'private';

interface Ad {
  _id: string;
  title: string;
  price: number;
  currency?: string;
  photos?: string[];
  distanceKm?: number;
  categoryId?: string;
  createdAt?: string;
  isFarmerAd?: boolean;
  sellerName?: string;
  location?: { lat: number; lng: number };
}

const getSellerType = (ad: Ad): SellerType => {
  if (ad.isFarmerAd) return 'farmer';
  if (ad.categoryId?.includes('store') || ad.categoryId?.includes('shop')) return 'store';
  return 'private';
};

const getSellerTypeLabel = (type: SellerType) => {
  switch (type) {
    case 'farmer': return 'Фермер';
    case 'store': return 'Магазин';
    default: return 'Частное лицо';
  }
};

const formatPrice = (price: number) => {
  return `${price.toLocaleString()} руб.`;
};

const LazyMap = lazy(() => import('../components/GeoMap'));

function MapFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
        <p className="text-sm text-gray-500">Загрузка карты...</p>
      </div>
    </div>
  );
}

export default function GeoFeedScreen() {
  const navigate = useNavigate();
  const { 
    coords, radiusKm, setRadius, cityName, requestLocation, 
    smartRadiusEnabled, toggleSmartRadius, sheetHeight, setSheetHeight,
    calculateSmartRadius, status: geoStatus
  } = useGeoStore();
  
  const lat = coords?.lat;
  const lng = coords?.lng;
  
  const [feed, setFeed] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [smartRadiusMessage, setSmartRadiusMessage] = useState<string | null>(null);
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
  
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController | null>(null);
  const dragStartY = useRef(0);

  const fetchNearbyAds = useCallback(async (centerLat: number, centerLng: number, radius: number, query?: string) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        lat: String(centerLat),
        lng: String(centerLng),
        radiusKm: String(radius),
      });
      
      if (query) {
        params.append('q', query);
      }
      
      const response = await fetch(`/api/ads/nearby?${params}`, {
        signal: abortRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки');
      }
      
      const data = await response.json();
      const ads = data.items || data.data?.ads || data.data || [];
      setFeed(ads);
      
      if (smartRadiusEnabled && ads.length === 0 && radius < 20) {
        const nextRadius = RADIUS_OPTIONS.find(r => r.value > radius)?.value || 20;
        setSmartRadiusMessage(`Увеличили радиус до ${nextRadius < 1 ? `${nextRadius * 1000}м` : `${nextRadius}км`}`);
        setRadius(nextRadius);
      } else {
        calculateSmartRadius(ads.length);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to fetch nearby ads:', err);
        setError('Не удалось загрузить объявления');
      }
    } finally {
      setLoading(false);
    }
  }, [smartRadiusEnabled, setRadius, calculateSmartRadius]);

  useEffect(() => {
    if (lat && lng) {
      fetchNearbyAds(lat, lng, radiusKm, searchQuery);
    }
  }, [lat, lng, radiusKm]);

  useEffect(() => {
    if (!lat || !lng) {
      requestLocation();
    }
  }, []);

  const handleSearch = useCallback(() => {
    if (lat && lng) {
      fetchNearbyAds(lat, lng, radiusKm, searchQuery);
    }
  }, [lat, lng, radiusKm, searchQuery, fetchNearbyAds]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleLocate = async () => {
    setIsLocating(true);
    try {
      await requestLocation();
    } finally {
      setIsLocating(false);
    }
  };

  const handleRadiusChange = (newRadius: number) => {
    if (smartRadiusEnabled) {
      toggleSmartRadius();
    }
    setSmartRadiusMessage(null);
    setRadius(newRadius);
  };

  const handleSmartToggle = () => {
    toggleSmartRadius();
    setSmartRadiusMessage(null);
  };

  const handleAdClick = useCallback((adId: string) => {
    navigate(`/ads/${adId}`);
  }, [navigate]);

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartY.current = clientY;
  };

  const handleDragEnd = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    const diff = dragStartY.current - clientY;
    
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setSheetHeight(sheetHeight === 'collapsed' ? 'half' : 'full');
      } else {
        setSheetHeight(sheetHeight === 'full' ? 'half' : 'collapsed');
      }
    }
  };

  const handleIncreaseRadius = () => {
    const currentIndex = RADIUS_OPTIONS.findIndex(r => r.value === radiusKm);
    if (currentIndex < RADIUS_OPTIONS.length - 1) {
      setRadius(RADIUS_OPTIONS[currentIndex + 1].value);
    }
  };

  const handleRetry = () => {
    if (lat && lng) {
      fetchNearbyAds(lat, lng, radiusKm, searchQuery);
    }
  };

  const sheetHeightValue = useMemo(() => ({
    collapsed: 15,
    half: 45,
    full: 75
  }[sheetHeight]), [sheetHeight]);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: 'var(--bg-base, #FFFFFF)' }}>
      {/* STICKY HEADER - Never moves during scroll */}
      <header 
        className="flex-shrink-0 z-50"
        style={{ 
          position: 'sticky',
          top: 0,
          background: 'var(--bg-base, #FFFFFF)',
          boxShadow: 'var(--shadow-card, 0 2px 8px rgba(0,0,0,0.08))',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        {/* Search Input */}
        <div style={{ padding: '12px 16px 8px' }}>
          <div style={{ position: 'relative' }}>
            <Search 
              style={{ 
                position: 'absolute', 
                left: 14, 
                top: '50%', 
                transform: 'translateY(-50%)',
                width: 20, 
                height: 20, 
                color: 'var(--text-tertiary, #9CA3AF)' 
              }} 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Поиск товаров рядом..."
              style={{
                width: '100%',
                height: 44,
                paddingLeft: 44,
                paddingRight: 40,
                borderRadius: 'var(--radius-md, 12px)',
                background: 'var(--bg-input, #F5F6F8)',
                border: '1px solid transparent',
                fontSize: 16,
                color: 'var(--text-primary, #1F2937)',
                outline: 'none',
              }}
              data-testid="input-search"
            />
            {searchQuery && (
              <button
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: 6,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
                onClick={() => { setSearchQuery(''); handleSearch(); }}
                data-testid="button-clear-search"
              >
                <X style={{ width: 16, height: 16, color: 'var(--text-secondary, #6B7280)' }} />
              </button>
            )}
          </div>
        </div>
        
        {/* Radius Chips */}
        <div style={{ padding: '0 16px 12px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {RADIUS_OPTIONS.map((r) => {
              const isActive = radiusKm === r.value && !smartRadiusEnabled;
              return (
                <button
                  key={r.value}
                  style={{
                    flexShrink: 0,
                    height: 32,
                    padding: '0 14px',
                    borderRadius: 16,
                    fontSize: 13,
                    fontWeight: 500,
                    border: isActive ? '2px solid var(--blue-primary, #3A7BFF)' : '2px solid transparent',
                    background: isActive ? 'var(--blue-light, #E8F0FF)' : 'var(--bg-tertiary, #F0F2F5)',
                    color: isActive ? 'var(--blue-primary, #3A7BFF)' : 'var(--text-secondary, #6B7280)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => handleRadiusChange(r.value)}
                  data-testid={`button-radius-${r.value}`}
                >
                  {r.label}
                </button>
              );
            })}
            <button
              style={{
                flexShrink: 0,
                height: 32,
                padding: '0 14px',
                borderRadius: 16,
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                border: smartRadiusEnabled ? '2px solid #8B5CF6' : '2px solid transparent',
                background: smartRadiusEnabled ? '#F3E8FF' : 'var(--bg-tertiary, #F0F2F5)',
                color: '#8B5CF6',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={handleSmartToggle}
              data-testid="button-smart-radius"
            >
              <Sparkles style={{ width: 14, height: 14 }} />
              Smart
            </button>
          </div>
        </div>
        
        {/* Smart radius message */}
        {smartRadiusMessage && (
          <div style={{ padding: '0 16px 12px' }}>
            <div style={{
              padding: '8px 12px',
              borderRadius: 12,
              background: '#F3E8FF',
              border: '1px solid #E9D5FF',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: '#7C3AED',
            }}>
              <Sparkles style={{ width: 16, height: 16 }} />
              <span>{smartRadiusMessage}</span>
            </div>
          </div>
        )}
      </header>

      {/* MAP + BOTTOM SHEET CONTAINER */}
      <div 
        className="flex-1 relative min-h-0"
        style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom))' }}
      >
        {/* Map View */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {(lat && lng) ? (
            <Suspense fallback={<MapFallback />}>
              <LazyMap 
                lat={lat} 
                lng={lng} 
                radiusKm={radiusKm}
                feed={feed}
                selectedAdId={selectedAdId}
                onMarkerClick={(adId: string) => {
                  setSelectedAdId(adId);
                  setSheetHeight('half');
                }}
                onMapMove={(centerLat: number, centerLng: number) => {
                  if (debounceRef.current) {
                    clearTimeout(debounceRef.current);
                  }
                  debounceRef.current = setTimeout(() => {
                    fetchNearbyAds(centerLat, centerLng, radiusKm, searchQuery);
                  }, 400);
                }}
              />
            </Suspense>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center p-6">
                {geoStatus === 'loading' || isLocating ? (
                  <>
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                    <p className="text-gray-600 font-medium">Определяем местоположение...</p>
                  </>
                ) : geoStatus === 'error' ? (
                  <>
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-orange-500" />
                    <p className="text-gray-700 font-medium">Не удалось определить местоположение</p>
                    <p className="text-sm text-gray-500 mt-1">Разрешите доступ к геолокации</p>
                    <button
                      className="mt-4 px-4 py-2.5 rounded-xl bg-blue-500 text-white font-medium text-sm active:scale-95 transition-transform"
                      onClick={handleLocate}
                      data-testid="button-retry-location"
                    >
                      Попробовать снова
                    </button>
                  </>
                ) : (
                  <>
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600 font-medium">Загрузка карты...</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Floating Locate Button */}
        {lat && lng && (
          <button
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md, 12px)',
              border: 'none',
              background: 'var(--gradient-blue, linear-gradient(135deg, #4A8CFF 0%, #3A7BFF 100%))',
              boxShadow: 'var(--shadow-blue, 0 4px 14px rgba(58, 123, 255, 0.35))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 30,
              transition: 'transform 0.2s',
            }}
            onClick={handleLocate}
            disabled={isLocating}
            data-testid="button-locate"
          >
            <Locate style={{ 
              width: 20, 
              height: 20, 
              color: '#FFFFFF',
              animation: isLocating ? 'pulse 1.5s infinite' : 'none',
            }} />
          </button>
        )}

        {/* BOTTOM SHEET - Fixed at bottom */}
        <div 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${sheetHeightValue}%`,
            maxHeight: 'calc(100% - 60px)',
            background: 'var(--bg-base, #FFFFFF)',
            borderRadius: '24px 24px 0 0',
            boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'height 0.3s ease-out',
            zIndex: 40,
          }}
        >
          {/* Sheet Handle */}
          <div 
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '12px 0',
              cursor: 'pointer',
              touchAction: 'none',
              userSelect: 'none',
            }}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
          >
            <div style={{ width: 40, height: 4, background: 'var(--border-default, #E5E7EB)', borderRadius: 2 }} />
          </div>
          
          {/* Sheet Header */}
          <div style={{
            flexShrink: 0,
            padding: '0 16px 12px',
            borderBottom: '1px solid var(--border-default, #F3F4F6)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ 
                  fontSize: 18, 
                  fontWeight: 700, 
                  color: 'var(--text-primary, #1F2937)',
                  margin: 0,
                }}>
                  Рядом с вами
                </h2>
                {cityName && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 4, 
                    marginTop: 2, 
                    fontSize: 13, 
                    color: 'var(--text-secondary, #6B7280)',
                  }}>
                    <MapPin style={{ width: 14, height: 14, color: 'var(--blue-primary, #3A7BFF)' }} />
                    <span>{cityName}</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span 
                  style={{
                    fontSize: 13,
                    color: 'var(--text-secondary, #6B7280)',
                    background: 'var(--bg-tertiary, #F0F2F5)',
                    padding: '4px 10px',
                    borderRadius: 12,
                  }}
                  data-testid="text-ads-count"
                >
                  {feed.length} объявл.
                </span>
                <button
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'var(--bg-tertiary, #F0F2F5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setSheetHeight(sheetHeight === 'full' ? 'collapsed' : 'full')}
                  data-testid="button-expand-sheet"
                >
                  {sheetHeight === 'full' ? (
                    <ChevronDown style={{ width: 20, height: 20, color: 'var(--text-secondary, #6B7280)' }} />
                  ) : (
                    <ChevronUp style={{ width: 20, height: 20, color: 'var(--text-secondary, #6B7280)' }} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sheet Content - Scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
            {error ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '48px 16px',
              }}>
                <AlertCircle style={{ width: 56, height: 56, color: '#F87171', marginBottom: 12 }} />
                <p style={{ color: 'var(--text-primary, #1F2937)', fontWeight: 500, textAlign: 'center' }}>{error}</p>
                <button
                  style={{
                    marginTop: 16,
                    padding: '10px 20px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'var(--blue-primary, #3A7BFF)',
                    color: '#FFFFFF',
                    fontWeight: 500,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                  }}
                  onClick={handleRetry}
                  data-testid="button-retry"
                >
                  <RefreshCw style={{ width: 16, height: 16 }} />
                  Повторить
                </button>
              </div>
            ) : loading ? (
              <div style={{ padding: 16 }}>
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    gap: 12, 
                    padding: 12, 
                    borderRadius: 16, 
                    background: 'var(--bg-secondary, #F9FAFB)', 
                    marginBottom: 12,
                  }}>
                    <div style={{ width: 80, height: 80, borderRadius: 12, background: 'var(--bg-tertiary, #E5E7EB)' }} />
                    <div style={{ flex: 1, paddingTop: 4 }}>
                      <div style={{ height: 16, width: '75%', background: 'var(--bg-tertiary, #E5E7EB)', borderRadius: 8, marginBottom: 8 }} />
                      <div style={{ height: 20, width: '33%', background: 'var(--bg-tertiary, #E5E7EB)', borderRadius: 8, marginBottom: 8 }} />
                      <div style={{ height: 12, width: '25%', background: 'var(--bg-tertiary, #E5E7EB)', borderRadius: 8 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : feed.length > 0 ? (
              <div className="p-4 space-y-3 pb-6">
                {feed.map((ad) => {
                  const sellerType = getSellerType(ad);
                  const TypeIcon = sellerType === 'farmer' ? Leaf : sellerType === 'store' ? Store : User;
                  const typeColor = sellerType === 'farmer' ? 'text-green-600 bg-green-50' : sellerType === 'store' ? 'text-purple-600 bg-purple-50' : 'text-blue-600 bg-blue-50';
                  
                  return (
                    <div 
                      key={ad._id}
                      className={`flex gap-3 p-3 rounded-2xl bg-white border-2 cursor-pointer active:scale-[0.98] transition-all ${
                        ad._id === selectedAdId ? 'border-blue-400 shadow-md' : 'border-gray-100 hover:border-gray-200'
                      }`}
                      onClick={() => handleAdClick(ad._id)}
                      data-testid={`card-ad-${ad._id}`}
                    >
                      <div className="flex-shrink-0 relative">
                        {ad.photos?.[0] ? (
                          <img 
                            src={getThumbnailUrl(ad.photos[0])} 
                            alt={ad.title}
                            className="w-20 h-20 rounded-xl object-cover bg-gray-200"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-20 h-20 rounded-xl bg-gray-100 items-center justify-center"
                          style={{ display: ad.photos?.[0] ? 'none' : 'flex' }}
                        >
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 py-0.5">
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{ad.title}</h4>
                        <p className="text-lg font-bold text-blue-600 mt-1">
                          {formatPrice(ad.price)}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${typeColor}`}>
                            <TypeIcon className="w-3 h-3" />
                            {getSellerTypeLabel(sellerType)}
                          </span>
                          {ad.distanceKm !== undefined && (
                            <span className="text-xs text-gray-500">
                              {ad.distanceKm < 0.1 ? '< 100 м' : ad.distanceKm < 1 ? `${Math.round(ad.distanceKm * 100) * 10} м` : `${ad.distanceKm.toFixed(1)} км`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <MapPin className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-700 font-medium text-center">Нет объявлений рядом</p>
                <p className="text-sm text-gray-500 mt-1 text-center">Попробуйте увеличить радиус поиска</p>
                {radiusKm < 20 && (
                  <button 
                    className="mt-4 px-5 py-2.5 rounded-xl bg-blue-500 text-white font-medium text-sm flex items-center gap-2 active:scale-95 transition-transform"
                    onClick={handleIncreaseRadius}
                    data-testid="button-increase-radius"
                  >
                    <ChevronUp className="w-4 h-4" />
                    Увеличить радиус
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
