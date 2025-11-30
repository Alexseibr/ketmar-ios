import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Package, Heart, MapPin, Loader2 } from 'lucide-react';
import ScreenLayout from '@/components/layout/ScreenLayout';
import { useGeo } from '@/utils/geo';
import { useUserStore, useIsFavorite } from '@/store/useUserStore';
import http from '@/api/http';
import { AdPreview } from '@/types';
import { NO_PHOTO_PLACEHOLDER, getThumbnailUrl } from '@/constants/placeholders';

interface SecondHandAd extends AdPreview {
  distanceKm?: number;
}

interface SecondHandResponse {
  items: SecondHandAd[];
  total: number;
  hasMore: boolean;
}

const SUBCATEGORY_FILTERS = [
  { id: 'all', name: 'Все', keywords: [] },
  { id: 'tech', name: 'Техника', keywords: ['elektronika', 'telefony', 'noutbuki'] },
  { id: 'furniture', name: 'Мебель', keywords: ['mebel'] },
  { id: 'clothes', name: 'Одежда', keywords: ['odezhda', 'obuv'] },
  { id: 'kids', name: 'Детям', keywords: ['detskie-tovary'] },
  { id: 'home', name: 'Для дома', keywords: ['dlya-doma', 'bytovaya-tekhnika'] },
  { id: 'auto', name: 'Авто', keywords: ['avto', 'transport'] },
];

const LIMIT = 20;

function formatDistanceText(distanceKm?: number): string {
  if (distanceKm == null || isNaN(distanceKm)) return '';
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} м`;
  }
  return `${distanceKm.toFixed(1)} км`;
}

interface AdCardProps {
  ad: SecondHandAd;
  onClick: () => void;
}

function AdCard({ ad, onClick }: AdCardProps) {
  const toggleFavorite = useUserStore((state) => state.toggleFavorite);
  const isFavorite = useIsFavorite(ad._id);
  const [pending, setPending] = useState(false);
  
  const photo = ad.photos && ad.photos.length > 0 
    ? getThumbnailUrl(ad.photos[0]) 
    : NO_PHOTO_PLACEHOLDER;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    try {
      await toggleFavorite(ad._id);
    } finally {
      setPending(false);
    }
  };

  const formatPrice = (price: number, currency?: string) => {
    const curr = currency || 'BYN';
    return `${price.toLocaleString('ru-RU')} ${curr}`;
  };

  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      data-testid={`second-hand-card-${ad._id}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div 
        style={{
          position: 'relative',
          aspectRatio: '1',
          background: '#F5F6F8',
          overflow: 'hidden',
        }}
      >
        <img
          src={photo}
          alt={ad.title}
          loading="lazy"
          decoding="async"
          data-testid={`second-hand-image-${ad._id}`}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
          }}
        />
        
        <div
          data-testid={`second-hand-badge-${ad._id}`}
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: '#F59E0B',
            color: '#FFFFFF',
            padding: '4px 10px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            zIndex: 10,
          }}
        >
          Б/У
        </div>
        
        <button
          onClick={handleFavoriteClick}
          disabled={pending}
          data-testid={`button-favorite-${ad._id}`}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
            width: 32,
            height: 32,
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '50%',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: pending ? 'wait' : 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Heart
            size={18}
            fill={isFavorite ? '#EF4444' : 'none'}
            color={isFavorite ? '#EF4444' : '#9CA3AF'}
            strokeWidth={2}
          />
        </button>

        {ad.distanceKm != null && (
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              background: 'rgba(0, 0, 0, 0.6)',
              color: '#FFFFFF',
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <MapPin size={10} />
            {formatDistanceText(ad.distanceKm)}
          </div>
        )}
      </div>

      <div style={{ padding: 12 }}>
        <h3
          data-testid={`second-hand-title-${ad._id}`}
          style={{
            margin: '0 0 6px',
            fontSize: 14,
            fontWeight: 500,
            color: '#1F2937',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {ad.title}
        </h3>

        <p
          data-testid={`second-hand-price-${ad._id}`}
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: '#F59E0B',
          }}
        >
          {formatPrice(ad.price, ad.currency)}
        </p>
      </div>
    </article>
  );
}

export default function SecondHandFeedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { coords, status: geoStatus } = useGeo();
  
  const [ads, setAds] = useState<SecondHandAd[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const initialQuery = searchParams.get('q') || '';

  const loadAds = useCallback(async (filterKeywords: string[], currentOffset: number, append: boolean = false) => {
    try {
      if (!append) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(currentOffset),
        type: 'second_hand',
      });
      
      if (coords?.lat && coords?.lng) {
        params.append('lat', String(coords.lat));
        params.append('lng', String(coords.lng));
        params.append('radiusKm', '30');
      }
      
      if (filterKeywords.length > 0) {
        params.append('categories', filterKeywords.join(','));
      }
      
      const response = await http.get<SecondHandResponse>(`/api/ads/second-hand?${params.toString()}`);
      const data = response.data;
      
      if (append) {
        setAds(prev => [...prev, ...data.items]);
      } else {
        setAds(data.items);
      }
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('[SecondHandFeedPage] Failed to load ads:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [coords]);

  useEffect(() => {
    const filter = SUBCATEGORY_FILTERS.find(f => f.id === activeFilter);
    loadAds(filter?.keywords || [], 0);
  }, [activeFilter, coords, loadAds]);

  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId);
    setOffset(0);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      const newOffset = offset + LIMIT;
      setOffset(newOffset);
      const filter = SUBCATEGORY_FILTERS.find(f => f.id === activeFilter);
      loadAds(filter?.keywords || [], newOffset, true);
    }
  };

  const handleCardClick = (adId: string) => {
    navigate(`/ads/${adId}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const isRequestingLocation = !coords && (geoStatus === 'loading' || geoStatus === 'idle');

  const headerContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
        }}
      >
        <button
          onClick={handleBack}
          data-testid="button-back"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: 'none',
            background: '#F5F6F8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={20} color="#1F2937" />
        </button>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={20} color="#F59E0B" />
            <h1
              data-testid="text-page-title"
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: '#1F2937',
              }}
            >
              Из рук в руки
            </h1>
          </div>
          <p
            data-testid="text-ad-count"
            style={{
              margin: '2px 0 0',
              fontSize: 13,
              color: '#6B7280',
            }}
          >
            {total} объявлений
          </p>
        </div>
      </div>
    </div>
  );

  if (isRequestingLocation) {
    return (
      <ScreenLayout header={headerContent} showBottomNav={true}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <Loader2
            size={48}
            color="#F59E0B"
            style={{ animation: 'spin 1s linear infinite' }}
          />
          <p style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>
            Определяем местоположение...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout header={headerContent} showBottomNav={true}>
      <div
        data-testid="second-hand-feed-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          background: '#F5F6F8',
        }}
      >
        <div
          data-testid="subcategory-tabs"
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 16px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            background: '#FFFFFF',
          }}
        >
          {SUBCATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterChange(filter.id)}
              data-testid={`tab-${filter.id}`}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: 'none',
                background: activeFilter === filter.id ? '#F59E0B' : '#F3F4F6',
                color: activeFilter === filter.id ? '#FFFFFF' : '#6B7280',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
            >
              {filter.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <Loader2
              size={48}
              color="#F59E0B"
              style={{ animation: 'spin 1s linear infinite' }}
            />
            <p style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>
              Загружаем объявления...
            </p>
          </div>
        ) : ads.length === 0 ? (
          <div
            data-testid="empty-state"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <Package size={36} color="#F59E0B" />
            </div>
            
            <p
              style={{
                margin: '0 0 24px',
                fontSize: 16,
                color: '#6B7280',
                textAlign: 'center',
              }}
            >
              Пока нет объявлений в этой категории
            </p>
            
            <button
              onClick={() => navigate('/create')}
              data-testid="button-create-ad-empty"
              style={{
                padding: '14px 28px',
                background: '#F59E0B',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Создать объявление
            </button>
          </div>
        ) : (
          <>
            <div
              data-testid="ads-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                padding: '12px 16px',
              }}
            >
              {ads.map((ad) => (
                <AdCard
                  key={ad._id}
                  ad={ad}
                  onClick={() => handleCardClick(ad._id)}
                />
              ))}
            </div>

            {hasMore && (
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  data-testid="button-load-more"
                  style={{
                    padding: '12px 24px',
                    background: '#FFFFFF',
                    color: '#F59E0B',
                    border: '1px solid #F59E0B',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: isLoadingMore ? 'wait' : 'pointer',
                    opacity: isLoadingMore ? 0.6 : 1,
                  }}
                >
                  {isLoadingMore ? 'Загрузка...' : 'Показать ещё'}
                </button>
              </div>
            )}
          </>
        )}

        <div style={{ height: 24 }} />
      </div>
    </ScreenLayout>
  );
}
