import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import useGeoStore from '../store/useGeoStore';
import { 
  Search, MapPin, Locate, ArrowLeft,
  Sparkles, X, AlertCircle, Loader2,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { getThumbnailUrl, NO_PHOTO_PLACEHOLDER } from '@/constants/placeholders';
import { useFormatPrice } from '@/hooks/useFormatPrice';

const RADIUS_OPTIONS = [
  { value: 0.3, label: '300м' },
  { value: 1, label: '1км' },
  { value: 3, label: '3км' },
  { value: 5, label: '5км' },
  { value: 10, label: '10км' },
  { value: 20, label: '20км' },
];

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


const formatDistance = (km?: number) => {
  if (!km) return '';
  if (km < 1) return `${Math.round(km * 1000)} м`;
  return `${km.toFixed(1)} км`;
};

const LazyMap = lazy(() => import('../components/GeoMap'));

function MapFallback() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 style={{ width: 32, height: 32, color: '#3A7BFF', margin: '0 auto 8px', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 14, color: '#6B7280' }}>Загрузка карты...</p>
      </div>
    </div>
  );
}

export default function GeoFeedScreen() {
  const navigate = useNavigate();
  const { formatCard } = useFormatPrice();
  const { 
    coords, radiusKm, setRadius, requestLocation, 
    smartRadiusEnabled, toggleSmartRadius,
    calculateSmartRadius, status: geoStatus
  } = useGeoStore();
  
  const lat = coords?.lat;
  const lng = coords?.lng;
  
  const [feed, setFeed] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [smartRadiusMessage, setSmartRadiusMessage] = useState<string | null>(null);
  const [selectedAds, setSelectedAds] = useState<Ad[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController | null>(null);
  
  // Debounce search query (400ms delay)
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]);

  const fetchNearbyAds = useCallback(async (centerLat: number, centerLng: number, radius: number, query?: string) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    
    setLoading(true);
    
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
      }
    } finally {
      setLoading(false);
    }
  }, [smartRadiusEnabled, setRadius, calculateSmartRadius]);

  // Fetch ads when location, radius or debounced search query changes
  useEffect(() => {
    if (lat && lng) {
      fetchNearbyAds(lat, lng, radiusKm, debouncedQuery);
    }
  }, [lat, lng, radiusKm, debouncedQuery]);

  // Immediate search on Enter (skip debounce)
  const handleSearch = useCallback(() => {
    if (lat && lng) {
      setDebouncedQuery(searchQuery); // Sync immediately
      fetchNearbyAds(lat, lng, radiusKm, searchQuery);
    }
  }, [lat, lng, radiusKm, searchQuery, fetchNearbyAds]);
  
  // Clear search and refetch all ads
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    if (lat && lng) {
      fetchNearbyAds(lat, lng, radiusKm, '');
    }
  }, [lat, lng, radiusKm, fetchNearbyAds]);

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

  const handleZoneClick = useCallback((ads: Ad[]) => {
    setSelectedAds(ads);
    setCarouselIndex(0);
    // Scroll carousel to start
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, []);

  const handleCloseCard = useCallback(() => {
    setSelectedAds([]);
    setCarouselIndex(0);
  }, []);

  const handleMapClick = useCallback(() => {
    setSelectedAds([]);
    setCarouselIndex(0);
  }, []);

  const handleViewDetails = useCallback((ad: Ad) => {
    navigate(`/ads/${ad._id}`);
  }, [navigate]);

  const handleCarouselPrev = useCallback(() => {
    if (carouselIndex > 0) {
      setCarouselIndex(carouselIndex - 1);
      if (carouselRef.current) {
        const cardWidth = 280 + 12; // card width + gap
        carouselRef.current.scrollTo({ left: (carouselIndex - 1) * cardWidth, behavior: 'smooth' });
      }
    }
  }, [carouselIndex]);

  const handleCarouselNext = useCallback(() => {
    if (carouselIndex < selectedAds.length - 1) {
      setCarouselIndex(carouselIndex + 1);
      if (carouselRef.current) {
        const cardWidth = 280 + 12; // card width + gap
        carouselRef.current.scrollTo({ left: (carouselIndex + 1) * cardWidth, behavior: 'smooth' });
      }
    }
  }, [carouselIndex, selectedAds.length]);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0,
      display: 'flex', 
      flexDirection: 'column',
      background: '#FFFFFF',
    }}>
      {/* FIXED HEADER - position: fixed, top: 0, z-index: 1000 */}
      <header 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        {/* Row 1: Back + Title + Locate */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '12px 16px 8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: 'none',
                background: '#F0F2F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              data-testid="button-back"
            >
              <ArrowLeft style={{ width: 20, height: 20, color: '#1F2937' }} />
            </button>
            <h1 style={{ 
              fontSize: 17, 
              fontWeight: 600, 
              color: '#1F2937',
              margin: 0,
            }}>
              Карта объявлений
            </h1>
          </div>
          
          {/* Locate Button in Header */}
          <button
            onClick={handleLocate}
            disabled={isLocating}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #4A8CFF 0%, #3A7BFF 100%)',
              boxShadow: '0 2px 8px rgba(58, 123, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: isLocating ? 0.7 : 1,
            }}
            data-testid="button-locate"
          >
            <Locate style={{ 
              width: 18, 
              height: 18, 
              color: '#FFFFFF',
              animation: isLocating ? 'pulse 1.5s infinite' : 'none',
            }} />
          </button>
        </div>

        {/* Row 2: Search Input */}
        <div style={{ padding: '0 16px 8px' }}>
          <div style={{ position: 'relative' }}>
            <Search 
              style={{ 
                position: 'absolute', 
                left: 14, 
                top: '50%', 
                transform: 'translateY(-50%)',
                width: 20, 
                height: 20, 
                color: '#9CA3AF',
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
                borderRadius: 12,
                background: '#F5F6F8',
                border: '1px solid transparent',
                fontSize: 16,
                color: '#1F2937',
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
                onClick={handleClearSearch}
                data-testid="button-clear-search"
              >
                <X style={{ width: 16, height: 16, color: '#6B7280' }} />
              </button>
            )}
          </div>
        </div>
        
        {/* Row 3: Radius Chips */}
        <div style={{ padding: '0 16px 12px', overflowX: 'auto', position: 'relative', zIndex: 1001 }}>
          <div style={{ display: 'flex', gap: 8, position: 'relative', pointerEvents: 'auto' }}>
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
                    border: isActive ? '2px solid #3A7BFF' : '2px solid transparent',
                    background: isActive ? '#E8F0FF' : '#F0F2F5',
                    color: isActive ? '#3A7BFF' : '#6B7280',
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
                background: smartRadiusEnabled ? '#F3E8FF' : '#F0F2F5',
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

      {/* MAP CONTAINER - Full screen from header to bottom tabs */}
      <div 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          paddingTop: 'calc(env(safe-area-inset-top) + 156px)', // Header height
          paddingBottom: 'calc(72px + env(safe-area-inset-bottom))', // Bottom tabs height
        }}
      >
        {(lat && lng) ? (
          <Suspense fallback={<MapFallback />}>
            <LazyMap 
              lat={lat} 
              lng={lng} 
              radiusKm={radiusKm}
              feed={feed}
              selectedAdId={selectedAds[carouselIndex]?._id || null}
              onZoneClick={handleZoneClick}
              onMapClick={handleMapClick}
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
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: '#F3F4F6',
          }}>
            <div style={{ textAlign: 'center', padding: 24 }}>
              {geoStatus === 'loading' || isLocating ? (
                <>
                  <div style={{
                    width: 48,
                    height: 48,
                    margin: '0 auto 12px',
                    borderRadius: '50%',
                    border: '4px solid #3A7BFF',
                    borderTopColor: 'transparent',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <p style={{ color: '#4B5563', fontWeight: 500 }}>Определяем местоположение...</p>
                </>
              ) : geoStatus === 'error' ? (
                <>
                  <AlertCircle style={{ width: 48, height: 48, margin: '0 auto 12px', color: '#F97316' }} />
                  <p style={{ color: '#374151', fontWeight: 500 }}>Не удалось определить местоположение</p>
                  <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>Разрешите доступ к геолокации</p>
                  <button
                    style={{
                      marginTop: 16,
                      padding: '10px 20px',
                      borderRadius: 12,
                      border: 'none',
                      background: '#3A7BFF',
                      color: '#FFFFFF',
                      fontWeight: 500,
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                    onClick={handleLocate}
                    data-testid="button-retry-location"
                  >
                    Попробовать снова
                  </button>
                </>
              ) : (
                <>
                  <MapPin style={{ width: 48, height: 48, margin: '0 auto 12px', color: '#9CA3AF' }} />
                  <p style={{ color: '#4B5563', fontWeight: 500 }}>Загрузка карты...</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Loading indicator overlay */}
        {loading && lat && lng && (
          <div style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            borderRadius: 20,
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 50,
          }}>
            <Loader2 style={{ width: 16, height: 16, color: '#3A7BFF', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13, color: '#4B5563' }}>Загрузка...</span>
          </div>
        )}
      </div>

      {/* AD CAROUSEL - Bottom sheet for selected zone */}
      {selectedAds.length > 0 && (
        <div 
          style={{
            position: 'fixed',
            bottom: 'calc(72px + env(safe-area-inset-bottom) + 16px)',
            left: 0,
            right: 0,
            zIndex: 500,
            animation: 'slideUp 0.3s ease-out',
          }}
          data-testid="carousel-selected-ads"
        >
          {/* Close button */}
          <button
            onClick={handleCloseCard}
            style={{
              position: 'absolute',
              top: -40,
              right: 16,
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
            }}
            data-testid="button-close-carousel"
          >
            <X style={{ width: 18, height: 18, color: '#6B7280' }} />
          </button>

          {/* Counter badge */}
          {selectedAds.length > 1 && (
            <div style={{
              position: 'absolute',
              top: -40,
              left: 16,
              padding: '6px 12px',
              borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
              fontSize: 13,
              fontWeight: 600,
              color: '#374151',
            }}>
              {carouselIndex + 1} / {selectedAds.length}
            </div>
          )}

          {/* Navigation arrows for multiple ads */}
          {selectedAds.length > 1 && (
            <>
              {carouselIndex > 0 && (
                <button
                  onClick={handleCarouselPrev}
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 20,
                  }}
                  data-testid="button-carousel-prev"
                >
                  <ChevronLeft style={{ width: 20, height: 20, color: '#374151' }} />
                </button>
              )}
              {carouselIndex < selectedAds.length - 1 && (
                <button
                  onClick={handleCarouselNext}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 20,
                  }}
                  data-testid="button-carousel-next"
                >
                  <ChevronRight style={{ width: 20, height: 20, color: '#374151' }} />
                </button>
              )}
            </>
          )}

          {/* Carousel container */}
          <div 
            ref={carouselRef}
            style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth',
              padding: '0 16px',
              WebkitOverflowScrolling: 'touch',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
            onScroll={(e) => {
              const target = e.target as HTMLDivElement;
              const cardWidth = 280 + 12;
              const newIndex = Math.round(target.scrollLeft / cardWidth);
              if (newIndex !== carouselIndex && newIndex >= 0 && newIndex < selectedAds.length) {
                setCarouselIndex(newIndex);
              }
            }}
          >
            {selectedAds.map((ad, index) => (
              <div
                key={ad._id}
                style={{
                  flexShrink: 0,
                  width: 280,
                  background: '#FFFFFF',
                  borderRadius: 16,
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
                  scrollSnapAlign: 'start',
                  border: index === carouselIndex ? '2px solid #3A7BFF' : '2px solid transparent',
                  transition: 'border-color 0.2s',
                }}
                data-testid={`card-ad-${ad._id}`}
              >
                <div style={{ display: 'flex', gap: 12, padding: 12 }}>
                  {/* Photo */}
                  <div 
                    style={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: 10, 
                      overflow: 'hidden',
                      flexShrink: 0,
                      background: '#F3F4F6',
                    }}
                  >
                    <img 
                      src={ad.photos?.[0] ? getThumbnailUrl(ad.photos[0]) : NO_PHOTO_PLACEHOLDER}
                      alt={ad.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ 
                      fontSize: 16, 
                      fontWeight: 700, 
                      color: '#3A7BFF',
                      margin: '0 0 2px',
                    }}>
                      {formatCard(ad.price, ad.price === 0)}
                    </p>
                    <h3 style={{ 
                      fontSize: 13, 
                      fontWeight: 500, 
                      color: '#1F2937',
                      margin: '0 0 4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.3,
                    }}>
                      {ad.title}
                    </h3>
                    
                    {ad.distanceKm && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 3,
                        fontSize: 11,
                        color: '#6B7280',
                      }}>
                        <MapPin style={{ width: 12, height: 12, color: '#3A7BFF' }} />
                        <span>{formatDistance(ad.distanceKm)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* View Details Button */}
                <div style={{ padding: '0 12px 12px' }}>
                  <button
                    onClick={() => handleViewDetails(ad)}
                    style={{
                      width: '100%',
                      height: 38,
                      borderRadius: 10,
                      border: 'none',
                      background: 'linear-gradient(135deg, #4A8CFF 0%, #3A7BFF 100%)',
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(58, 123, 255, 0.3)',
                    }}
                    data-testid={`button-view-details-${ad._id}`}
                  >
                    Подробнее
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
