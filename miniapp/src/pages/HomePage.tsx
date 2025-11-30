import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Search, MapPin, ChevronRight, Gift, Tractor, Flame, Tag, Sparkles, Navigation, Play, Map, Bug } from 'lucide-react';
import GeoOnboarding from '@/components/GeoOnboarding';
import LocationSettingsModal from '@/components/LocationSettingsModal';
import { useGeo, getLocationDisplayText } from '@/utils/geo';
import { AdPreview } from '@/types';
import FavoriteButton from '@/components/FavoriteButton';
import { useUserStore } from '@/store/useUserStore';
import { StoryCarousel } from '@/components/stories';
import { getThumbnailUrl, NO_PHOTO_PLACEHOLDER } from '@/constants/placeholders';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { t } from '@/lib/i18n';
import { BlockRenderer, ZoneType } from '@/components/blocks/BlockRenderer';
import GradientCategoryGrid from '@/components/GradientCategoryGrid';
import 'swiper/css';
import 'swiper/css/pagination';

interface HomeFeedBlock {
  type: 'banners' | 'horizontal_list';
  id?: string;
  title?: string;
  subtitle?: string;
  icon?: string;
  link?: string;
  accentColor?: string;
  items: any[];
}

interface HomeFeedResponse {
  success: boolean;
  location: string;
  blocks: HomeFeedBlock[];
}

interface HomeConfigResponse {
  success: boolean;
  zone: ZoneType;
  location: string;
  confidence: number;
  blocks: HomeFeedBlock[];
  uiConfig: {
    buttonSize: 'large' | 'medium' | 'small';
    cardStyle: 'simple' | 'standard' | 'fancy';
    animations: boolean;
    colorAccent: string;
    categoryGridCols?: number;
  };
  meta: {
    generatedAt: string;
    location: { lat: number; lng: number };
    radiusKm: number;
    diagnostics?: any;
  };
}

// Type for new ads in horizontal carousel
interface NewAdItem {
  _id: string;
  title: string;
  price: number;
  photos?: string[];
  photo?: string;
  distanceKm?: number;
  isFreeGiveaway?: boolean;
  priceHistory?: Array<{ oldPrice: number; date: string }>;
}

const SECTION_ICONS: Record<string, typeof Flame> = {
  fire: Flame,
  gift: Gift,
  tractor: Tractor,
  tag: Tag,
  sparkles: Sparkles,
};

const DEBUG_ZONE_BLOCKS: Record<ZoneType, string[]> = {
  village: [
    'darom',
    'farmer_goods',
    'garden_help',
    'machinery_spare',
    'tractor_services',
  ],
  suburb: [
    'darom',
    'village_offers',
    'lawn_mowing',
    'repair_house',
    'local_shops',
    'cleaning_house',
  ],
  city_center: [
    'darom',
    'trending',
    'services',
    'author_brands',
    'beauty',
    'handmade',
    'demand',
  ],
};

const DEBUG_UI_CONFIG: Record<ZoneType, HomeConfigResponse['uiConfig']> = {
  village: {
    buttonSize: 'large',
    cardStyle: 'simple',
    animations: false,
    colorAccent: '#059669',
    categoryGridCols: 3,
  },
  suburb: {
    buttonSize: 'medium',
    cardStyle: 'standard',
    animations: true,
    colorAccent: '#3A7BFF',
    categoryGridCols: 4,
  },
  city_center: {
    buttonSize: 'small',
    cardStyle: 'fancy',
    animations: true,
    colorAccent: '#8B5CF6',
    categoryGridCols: 4,
  },
};

const ZONE_LABELS: Record<ZoneType, string> = {
  village: 'Деревня',
  suburb: 'Окраина',
  city_center: 'Центр города',
};

const BLOCK_CONFIG: Record<string, { title: string; subtitle: string; icon: string; accentColor: string; link?: string }> = {
  darom: { title: 'Даром', subtitle: 'Бесплатные вещи рядом', icon: 'gift', accentColor: '#EC4899', link: '/category/darom' },
  farmer_goods: { title: 'Фермерские товары', subtitle: 'Свежие продукты от фермеров', icon: 'tractor', accentColor: '#059669', link: '/category/farmer-market' },
  garden_help: { title: 'Помощь в огороде', subtitle: 'Услуги для дачи и сада', icon: 'shovel', accentColor: '#16A34A', link: '/category/uslugi' },
  machinery_spare: { title: 'Запчасти', subtitle: 'Для сельхозтехники', icon: 'wrench', accentColor: '#D97706', link: '/category/selhoztekhnika' },
  tractor_services: { title: 'Услуги трактора', subtitle: 'Вспашка, уборка, перевозка', icon: 'tractor', accentColor: '#7C3AED', link: '/category/uslugi' },
  village_offers: { title: 'Предложения рядом', subtitle: 'Товары в вашем районе', icon: 'tag', accentColor: '#3B82F6', link: '/search' },
  lawn_mowing: { title: 'Покос травы', subtitle: 'Уход за участком', icon: 'grass', accentColor: '#22C55E', link: '/category/uslugi' },
  repair_house: { title: 'Ремонт дома', subtitle: 'Строительство и ремонт', icon: 'hammer', accentColor: '#F59E0B', link: '/category/uslugi' },
  local_shops: { title: 'Местные магазины', subtitle: 'Продавцы рядом с вами', icon: 'store', accentColor: '#6366F1', link: '/shops' },
  cleaning_house: { title: 'Уборка дома', subtitle: 'Клининг и уборка', icon: 'sparkles', accentColor: '#14B8A6', link: '/category/uslugi' },
  snow_cleaning: { title: 'Уборка снега', subtitle: 'Очистка территории', icon: 'snowflake', accentColor: '#0EA5E9', link: '/category/uslugi' },
  trending: { title: 'Популярное', subtitle: 'Самые просматриваемые', icon: 'fire', accentColor: '#EF4444', link: '/trending' },
  services: { title: 'Услуги', subtitle: 'Мастера и специалисты', icon: 'wrench', accentColor: '#8B5CF6', link: '/category/uslugi' },
  author_brands: { title: 'Авторские бренды', subtitle: 'Уникальные товары', icon: 'palette', accentColor: '#F43F5E', link: '/shops?role=BLOGGER' },
  beauty: { title: 'Красота', subtitle: 'Косметика и уход', icon: 'lipstick', accentColor: '#EC4899', link: '/category/krasota' },
  handmade: { title: 'Handmade', subtitle: 'Ручная работа', icon: 'palette', accentColor: '#A855F7', link: '/shops?role=ARTISAN' },
  demand: { title: 'Ищут сейчас', subtitle: 'Популярные запросы', icon: 'search', accentColor: '#3B82F6', link: '/demand' },
  seasonal_fairs: { title: 'Сезонные ярмарки', subtitle: 'Тематические распродажи', icon: 'calendar', accentColor: '#14B8A6', link: '/fairs' },
};

function getBlockTitle(blockId: string): string {
  return BLOCK_CONFIG[blockId]?.title || blockId;
}

function getBlockSubtitle(blockId: string): string {
  return BLOCK_CONFIG[blockId]?.subtitle || '';
}

function getBlockIcon(blockId: string): string {
  return BLOCK_CONFIG[blockId]?.icon || 'sparkles';
}

function getBlockAccentColor(blockId: string): string {
  return BLOCK_CONFIG[blockId]?.accentColor || '#6366F1';
}

function getBlockLink(blockId: string): string | undefined {
  return BLOCK_CONFIG[blockId]?.link;
}

export default function HomePage() {
  console.log('[HomePage] Starting render...');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  console.log('[HomePage] Hooks initialized');
  
  const user = useUserStore((state) => state.user);
  const { 
    coords, 
    cityName,
    radiusKm,
    setRadius,
    requestLocation,
    hasCompletedOnboarding,
  } = useGeo(false);

  const debugZone = useMemo(() => {
    const zone = searchParams.get('debugZone');
    if (zone && ['village', 'suburb', 'city_center'].includes(zone)) {
      return zone as ZoneType;
    }
    return null;
  }, [searchParams]);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLocationSettings, setShowLocationSettings] = useState(false);
  const [feedData, setFeedData] = useState<HomeFeedResponse | null>(null);
  const [homeConfig, setHomeConfig] = useState<HomeConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState(() => t('location.your_area'));
  const [useZoneBased, setUseZoneBased] = useState(true);
  const [newAds, setNewAds] = useState<NewAdItem[]>([]);

  useEffect(() => {
    if (!hasCompletedOnboarding && !coords && !debugZone) {
      setShowOnboarding(true);
    }
  }, [hasCompletedOnboarding, coords, debugZone]);

  const fetchHomeFeed = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (coords) {
        params.set('lat', coords.lat.toString());
        params.set('lng', coords.lng.toString());
      }
      params.set('radiusKm', (radiusKm || 10).toString());
      if (user?.telegramId) {
        params.set('userId', user.telegramId.toString());
      }
      
      if (debugZone) {
        params.set('zone', debugZone);
      }
      
      if (useZoneBased && (coords || debugZone)) {
        try {
          const configResponse = await fetch(`/api/home/config?${params.toString()}`);
          if (configResponse.ok) {
            const configData: HomeConfigResponse = await configResponse.json();
            if (configData.success) {
              if (debugZone) {
                configData.zone = debugZone;
                configData.location = `${ZONE_LABELS[debugZone]} (DEBUG)`;
                configData.uiConfig = DEBUG_UI_CONFIG[debugZone];
              }
              setHomeConfig(configData);
              setFeedData(null);
              setLocationName(configData.location || cityName || t('location.your_area'));
              return;
            }
          }
        } catch (err) {
          console.warn('Zone-based home config failed, falling back to legacy:', err);
        }
      }
      
      const response = await fetch(`/api/home-feed?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFeedData(data);
          setHomeConfig(null);
          setLocationName(data.location || cityName || t('location.your_area'));
        }
      }
    } catch (error) {
      console.error('Failed to fetch home feed:', error);
    } finally {
      setLoading(false);
    }
  }, [coords, radiusKm, cityName, user?.telegramId, useZoneBased, debugZone]);

  useEffect(() => {
    fetchHomeFeed();
  }, [fetchHomeFeed]);

  // Fetch new ads nearby
  useEffect(() => {
    const fetchNewAds = async () => {
      if (!coords && !debugZone) return;
      
      try {
        const params = new URLSearchParams();
        if (coords) {
          params.set('lat', coords.lat.toString());
          params.set('lng', coords.lng.toString());
        }
        params.set('radiusKm', (radiusKm || 30).toString());
        params.set('limit', '15');
        params.set('sort', 'newest');
        
        const response = await fetch(`/api/ads?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          if (data.items && Array.isArray(data.items)) {
            // Normalize and validate items with required fields
            const normalizedAds: NewAdItem[] = data.items
              .map((item: any) => {
                const id = item._id?.toString() || item.id || '';
                if (!id || !item.title) return null;
                
                return {
                  _id: id,
                  title: item.title,
                  price: item.price ?? 0,
                  photos: item.photos,
                  photo: item.photo || item.photos?.[0],
                  distanceKm: item.distanceKm,
                  isFreeGiveaway: item.isFreeGiveaway,
                  priceHistory: item.priceHistory,
                };
              })
              .filter((item: NewAdItem | null): item is NewAdItem => item !== null);
            
            setNewAds(normalizedAds.slice(0, 15));
          }
        }
      } catch (error) {
        console.error('Failed to fetch new ads:', error);
      }
    };
    
    fetchNewAds();
  }, [coords, radiusKm, debugZone]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleSearchClick = () => {
    navigate('/search');
  };

  const handleCategoryClick = (slug: string) => {
    navigate(`/category/${encodeURIComponent(slug)}`);
  };

  const handleMapClick = () => {
    navigate('/geo-feed');
  };

  const handleAdClick = (adId: string) => {
    navigate(`/ads/${adId}`);
  };

  if (showOnboarding) {
    return <GeoOnboarding onComplete={handleOnboardingComplete} />;
  }

  const zoneBlocks = homeConfig?.blocks || [];
  const zoneUiConfig = homeConfig?.uiConfig || {
    buttonSize: 'medium' as const,
    cardStyle: 'standard' as const,
    animations: true,
    colorAccent: '#3A7BFF',
  };
  const currentZone: ZoneType = debugZone || homeConfig?.zone || 'suburb';
  
  const bannersBlock = homeConfig 
    ? zoneBlocks.find(b => b.type === 'banners')
    : feedData?.blocks.find(b => b.type === 'banners');
  const listBlocks = homeConfig 
    ? zoneBlocks.filter(b => b.type === 'horizontal_list') 
    : (feedData?.blocks.filter(b => b.type === 'horizontal_list') || []);

  const zoneBackgroundStyles: Record<ZoneType, { background: string }> = {
    village: { background: '#F0FDF4' },
    suburb: { background: '#F5F6F7' },
    city_center: { background: '#FAFAFA' },
  };

  return (
    <div 
      className={`home-root zone-${currentZone}`}
      style={{ 
        ...zoneBackgroundStyles[currentZone],
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {debugZone && (
        <div 
          style={{
            position: 'fixed',
            bottom: 100,
            left: 16,
            right: 16,
            zIndex: 100,
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          }}
          data-testid="debug-zone-banner"
        >
          <Bug size={20} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Debug Mode</div>
            <div style={{ fontSize: 11, opacity: 0.9 }}>
              Zone: {ZONE_LABELS[debugZone]} | Blocks: {DEBUG_ZONE_BLOCKS[debugZone].length}
            </div>
          </div>
          <div style={{ 
            display: 'flex', 
            gap: 6,
          }}>
            {(['village', 'suburb', 'city_center'] as ZoneType[]).map((z) => (
              <button
                key={z}
                onClick={() => navigate(`/?debugZone=${z}`)}
                style={{
                  padding: '4px 8px',
                  fontSize: 10,
                  fontWeight: 600,
                  background: z === debugZone ? '#fff' : 'rgba(255,255,255,0.2)',
                  color: z === debugZone ? '#D97706' : '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
                data-testid={`debug-zone-switch-${z}`}
              >
                {z === 'village' ? 'V' : z === 'suburb' ? 'S' : 'C'}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Fixed Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: '#FFFFFF',
        zIndex: 50,
        paddingTop: 'env(safe-area-inset-top)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      }}>
        {/* Location Header */}
        <div style={{
          padding: '12px 16px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <button
            onClick={() => setShowLocationSettings(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            data-testid="button-location"
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3A7BFF 0%, #1E5FE6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <MapPin size={18} color="#FFFFFF" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{t('location.your_area')}</div>
              <div style={{ 
                fontSize: 15, 
                fontWeight: 600, 
                color: '#1F2937',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                {locationName}
                <ChevronRight size={16} color="#9CA3AF" />
              </div>
            </div>
          </button>

          <button
            onClick={handleMapClick}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #4A8CFF 0%, #3A7BFF 100%)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(58, 123, 255, 0.3)',
            }}
            data-testid="button-map"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
              <line x1="8" y1="2" x2="8" y2="18"></line>
              <line x1="16" y1="6" x2="16" y2="22"></line>
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '0 16px 12px' }}>
          <button
            onClick={handleSearchClick}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              background: '#F2F3F5',
              border: 'none',
              borderRadius: 18,
              cursor: 'pointer',
              textAlign: 'left',
            }}
            data-testid="button-search"
          >
            <Search size={20} color="#9CA3AF" />
            <span style={{ 
              fontSize: 16, 
              color: '#9CA3AF',
            }}>
              {t('search.placeholder')}
            </span>
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{ 
        flex: 1,
        paddingTop: 'calc(env(safe-area-inset-top) + 120px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
        overflowY: 'auto',
      }}>
        {/* Stories - temporarily hidden */}
        {/* <StoryCarousel /> */}

        {/* Category Grid with Gradients & Emoji Icons */}
        <section style={{ padding: '16px 4px 20px' }}>
          <GradientCategoryGrid 
            userLat={coords?.lat}
            userLng={coords?.lng}
            radiusKm={radiusKm || 30}
          />
        </section>

        {/* Quick Action Buttons - TikTok Feed & Map */}
        <section style={{ padding: '0 16px 20px' }}>
          <div style={{
            display: 'flex',
            gap: 12,
          }}>
            {/* Swipe Feed Button */}
            <button
              onClick={() => navigate('/feed')}
              data-testid="button-swipe-feed"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)',
                border: 'none',
                borderRadius: 16,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Play size={20} color="#fff" fill="#fff" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: 2,
                }}>
                  {t('home.swipe_feed')}
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.7)',
                }}>
                  {t('home.like_tiktok')}
                </div>
              </div>
            </button>

            {/* Map Button */}
            <button
              onClick={handleMapClick}
              data-testid="button-view-map"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #3A7BFF 0%, #2563EB 100%)',
                border: 'none',
                borderRadius: 16,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(58, 123, 255, 0.3)',
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Map size={20} color="#fff" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: 2,
                }}>
                  {t('home.on_map')}
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.7)',
                }}>
                  {t('home.near_you')}
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Promo Banners Carousel */}
        {bannersBlock && bannersBlock.items.length > 0 && (
          <section style={{ padding: '0 16px 20px' }}>
            <Swiper
              modules={[Autoplay, Pagination]}
              spaceBetween={12}
              slidesPerView={1.1}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              style={{ paddingBottom: 24 }}
            >
              {bannersBlock.items.map((banner: any) => (
                <SwiperSlide key={banner.id}>
                  <div
                    onClick={() => navigate(banner.link)}
                    style={{
                      height: 140,
                      borderRadius: 20,
                      background: `linear-gradient(135deg, ${banner.gradient[0]} 0%, ${banner.gradient[1]} 100%)`,
                      padding: 20,
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                    }}
                    data-testid={`banner-${banner.id}`}
                  >
                    <div>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                        {banner.title}
                      </h3>
                      <p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.9 }}>
                        {banner.subtitle}
                      </p>
                    </div>
                    <div style={{ 
                      fontSize: 13, 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      Смотреть
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Loader2 
              size={32} 
              style={{ 
                color: '#3A7BFF',
                animation: 'spin 1s linear infinite',
              }} 
            />
          </div>
        )}

        {/* Dynamic Sections - Zone-Based */}
        {!loading && homeConfig && listBlocks.map((block) => (
          <BlockRenderer
            key={block.id}
            block={block as any}
            zone={currentZone}
            uiConfig={zoneUiConfig}
          />
        ))}
        
        {/* Dynamic Sections - Legacy */}
        {!loading && !homeConfig && listBlocks.map((block) => (
          <HorizontalSection
            key={block.id}
            block={block}
            onAdClick={handleAdClick}
            onSeeAll={() => block.link && navigate(block.link)}
          />
        ))}

        {/* New Ads Nearby - Horizontal Carousel */}
        {!loading && newAds.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <div style={{
              padding: '0 16px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'rgba(59, 130, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Sparkles size={18} color="#3B82F6" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
                    Новые объявления
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9CA3AF' }}>
                    Рядом с вами
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/feed')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3B82F6',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
                data-testid="button-see-all-new-ads"
              >
                Все
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Horizontal Scroll Carousel */}
            <div style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              paddingLeft: 16,
              paddingRight: 16,
              paddingBottom: 8,
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}>
              {newAds.map((ad) => (
                <NewAdCard 
                  key={ad._id} 
                  ad={ad} 
                  onClick={() => handleAdClick(ad._id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!loading && listBlocks.length === 0 && !coords && (
          <div style={{
            margin: '0 16px',
            background: '#FFFFFF',
            borderRadius: 20,
            padding: 32,
            textAlign: 'center',
          }}>
            <MapPin size={40} color="#9CA3AF" style={{ marginBottom: 16 }} />
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#1F2937' }}>
              Укажите местоположение
            </h3>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 20px' }}>
              Чтобы увидеть товары рядом с вами
            </p>
            <button
              onClick={() => setShowLocationSettings(true)}
              style={{
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #3A7BFF 0%, #1E5FE6 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(58, 123, 255, 0.3)',
              }}
              data-testid="button-set-location"
            >
              Определить локацию
            </button>
          </div>
        )}
      </div>

      {showLocationSettings && (
        <LocationSettingsModal
          isOpen={showLocationSettings}
          onClose={() => setShowLocationSettings(false)}
          currentCoords={coords}
          currentRadius={radiusKm}
          currentCity={cityName}
          onRadiusChange={setRadius}
          onLocationChange={requestLocation}
        />
      )}
    </div>
  );
}

function HorizontalSection({ 
  block, 
  onAdClick, 
  onSeeAll 
}: { 
  block: HomeFeedBlock; 
  onAdClick: (id: string) => void;
  onSeeAll: () => void;
}) {
  const IconComponent = block.icon ? SECTION_ICONS[block.icon] || Sparkles : Sparkles;
  const accentColor = block.accentColor || '#3A7BFF';

  return (
    <section style={{ marginBottom: 24 }}>
      {/* Section Header */}
      <div style={{
        padding: '0 16px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: `${accentColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <IconComponent size={18} color={accentColor} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
              {block.title}
            </h3>
            {block.subtitle && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9CA3AF' }}>
                {block.subtitle}
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={onSeeAll}
          style={{
            background: 'none',
            border: 'none',
            color: accentColor,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
          data-testid={`button-see-all-${block.id}`}
        >
          Все
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Horizontal Scroll */}
      <div style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        paddingLeft: 16,
        paddingRight: 16,
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}>
        {block.items.map((ad: AdPreview & { id?: string }) => {
          const adId = ad._id || ad.id || '';
          return (
            <CompactAdCard 
              key={adId} 
              ad={{ ...ad, _id: adId }} 
              onClick={() => onAdClick(adId)}
              accentColor={accentColor}
            />
          );
        })}
      </div>
    </section>
  );
}

function CompactAdCard({ 
  ad, 
  onClick,
  accentColor,
}: { 
  ad: AdPreview & { photo?: string; distance?: number }; 
  onClick: () => void;
  accentColor: string;
}) {
  const formatPrice = (price: number) => {
    if (price === 0) return 'Бесплатно';
    return `${price.toLocaleString('ru-RU')} BYN`;
  };

  const photoUrl = ad.photo || ad.photos?.[0] ? getThumbnailUrl(ad.photo || ad.photos?.[0] || '') : NO_PHOTO_PLACEHOLDER;
  const distanceKm = ad.distanceKm ?? ad.distance;
  
  const priceHistory = ad.priceHistory || [];
  const hasDiscount = priceHistory.length > 0;
  const oldPrice = hasDiscount ? priceHistory[priceHistory.length - 1]?.oldPrice : null;

  return (
    <div
      onClick={onClick}
      style={{
        minWidth: 156,
        maxWidth: 156,
        background: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        scrollSnapAlign: 'start',
        flexShrink: 0,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      data-testid={`ad-card-${ad._id}`}
    >
      {/* Image */}
      <div style={{ 
        position: 'relative',
        width: '100%',
        paddingTop: '100%',
        background: '#F3F4F6',
      }}>
        <img
          src={photoUrl}
          alt={ad.title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          loading="lazy"
        />
        
        {/* Free Badge */}
        {ad.isFreeGiveaway && (
          <div style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: '#10B981',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 600,
            padding: '4px 8px',
            borderRadius: 6,
          }}>
            Даром
          </div>
        )}
        
        {/* Discount Badge */}
        {oldPrice && oldPrice > ad.price && (
          <div style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: '#EF4444',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 600,
            padding: '4px 8px',
            borderRadius: 6,
          }}>
            -{Math.round(((oldPrice - ad.price) / oldPrice) * 100)}%
          </div>
        )}
        
        {/* Favorite Button */}
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
        }}>
          <FavoriteButton 
            adId={ad._id} 
            size={20}
          />
        </div>
      </div>
      
      {/* Info */}
      <div style={{ padding: '12px' }}>
        {/* Title */}
        <div style={{
          fontSize: 13,
          fontWeight: 500,
          color: '#1F2937',
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          minHeight: 34,
          marginBottom: 8,
        }}>
          {ad.title}
        </div>
        
        {/* Price Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            fontSize: 15,
            fontWeight: 700,
            color: ad.isFreeGiveaway ? '#10B981' : '#1F2937',
          }}>
            {formatPrice(ad.price)}
          </div>
          
          {distanceKm !== undefined && distanceKm > 0 && (
            <div style={{
              fontSize: 11,
              color: '#9CA3AF',
            }}>
              {distanceKm < 1 
                ? `${Math.round(distanceKm * 1000)}м`
                : `${distanceKm.toFixed(1)}км`
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// New Ad Card - Yandex.Eda style card for horizontal carousel
function NewAdCard({ 
  ad, 
  onClick,
}: { 
  ad: NewAdItem; 
  onClick: () => void;
}) {
  const formatPrice = (price: number) => {
    if (price === 0) return 'Бесплатно';
    return `${price.toLocaleString('ru-RU')} BYN`;
  };

  const photoUrl = ad.photo || ad.photos?.[0] ? getThumbnailUrl(ad.photo || ad.photos?.[0] || '') : NO_PHOTO_PLACEHOLDER;
  const distanceKm = ad.distanceKm;
  
  const priceHistory = ad.priceHistory || [];
  const hasDiscount = priceHistory.length > 0;
  const oldPrice = hasDiscount ? priceHistory[priceHistory.length - 1]?.oldPrice : null;
  const discountPercent = oldPrice && oldPrice > ad.price ? Math.round(((oldPrice - ad.price) / oldPrice) * 100) : 0;

  return (
    <div
      onClick={onClick}
      style={{
        minWidth: 156,
        maxWidth: 156,
        background: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        scrollSnapAlign: 'start',
        flexShrink: 0,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onTouchStart={(e) => {
        e.currentTarget.style.transform = 'scale(0.98)';
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      data-testid={`new-ad-card-${ad._id}`}
    >
      {/* Image Container */}
      <div style={{ 
        position: 'relative',
        width: '100%',
        paddingTop: '100%',
        background: '#F3F4F6',
      }}>
        <img
          src={photoUrl}
          alt={ad.title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          loading="lazy"
        />
        
        {/* Free Badge */}
        {ad.isFreeGiveaway && (
          <div style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 8,
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
          }}>
            ДАРОМ
          </div>
        )}
        
        {/* Discount Badge */}
        {discountPercent > 0 && !ad.isFreeGiveaway && (
          <div style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 8,
            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
          }}>
            -{discountPercent}%
          </div>
        )}
        
        {/* Favorite Button */}
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
        }}>
          <FavoriteButton 
            adId={ad._id} 
            size={20}
          />
        </div>
        
        {/* Distance Badge */}
        {distanceKm !== undefined && distanceKm > 0 && (
          <div style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 500,
            padding: '4px 8px',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <MapPin size={10} />
            {distanceKm < 1 
              ? `${Math.round(distanceKm * 1000)}м`
              : `${distanceKm.toFixed(1)}км`
            }
          </div>
        )}
      </div>
      
      {/* Content - Title First (Yandex.Eda style) */}
      <div style={{ padding: '12px' }}>
        {/* Title */}
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#1F2937',
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          minHeight: 34,
          marginBottom: 8,
        }}>
          {ad.title}
        </div>
        
        {/* Price Row */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
        }}>
          <div style={{
            fontSize: 16,
            fontWeight: 700,
            color: ad.isFreeGiveaway ? '#10B981' : '#1F2937',
          }}>
            {formatPrice(ad.price)}
          </div>
          
          {oldPrice && oldPrice > ad.price && (
            <div style={{
              fontSize: 12,
              color: '#9CA3AF',
              textDecoration: 'line-through',
            }}>
              {oldPrice.toLocaleString('ru-RU')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
