import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, MapPin, ChevronRight, Gift, Tractor, Flame, Tag, Sparkles, Navigation } from 'lucide-react';
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
import 'swiper/css';
import 'swiper/css/pagination';

import farmerMarketIcon from '@assets/generated_images/farmer_market_vegetables_icon.png';
import vegetablesIcon from '@assets/generated_images/fruits_vegetables_apple_icon.png';
import bakeryIcon from '@assets/generated_images/fresh_bakery_bread_icon.png';
import personalItemsIcon from '@assets/generated_images/personal_items_clothes_icon.png';
import clothesIcon from '@assets/generated_images/clothing_dress_icon.png';
import shoesIcon from '@assets/generated_images/footwear_sneaker_icon.png';
import householdIcon from '@assets/generated_images/home_household_items_icon.png';
import electronicsIcon from '@assets/generated_images/electronics_phone_icon.png';
import tractorIcon from '@assets/generated_images/farm_tractor_equipment_icon.png';
import servicesIcon from '@assets/generated_images/services_wrench_tool_icon.png';
import toolsIcon from '@assets/generated_images/tool_rental_repair_icon.png';
import giftIcon from '@assets/generated_images/free_giveaway_gift_icon.png';

const QUICK_CATEGORIES = [
  { slug: 'farmer-market', label: 'Фермеры', icon: farmerMarketIcon, bgColor: '#E8F5E9' },
  { slug: 'vypechka', label: 'Выпечка', icon: bakeryIcon, bgColor: '#FFF8E1' },
  { slug: 'ovoschi-frukty', label: 'Еда', icon: vegetablesIcon, bgColor: '#FFEBEE' },
  { slug: 'darom', label: 'Даром', icon: giftIcon, bgColor: '#FCE4EC', isHot: true },
  { slug: 'odezhda', label: 'Одежда', icon: clothesIcon, bgColor: '#E0F7FA' },
  { slug: 'obuv', label: 'Обувь', icon: shoesIcon, bgColor: '#E3F2FD' },
  { slug: 'bytovye-melochi', label: 'Дом', icon: householdIcon, bgColor: '#FFF3E0' },
  { slug: 'elektronika', label: 'Техника', icon: electronicsIcon, bgColor: '#ECEFF1' },
  { slug: 'selhoztekhnika', label: 'Сельхоз', icon: tractorIcon, bgColor: '#FFF8E1' },
  { slug: 'uslugi', label: 'Услуги', icon: servicesIcon, bgColor: '#E8EAF6' },
  { slug: 'arenda', label: 'Аренда', icon: toolsIcon, bgColor: '#ECEFF1' },
  { slug: 'lichnye-veshchi', label: 'Вещи', icon: personalItemsIcon, bgColor: '#F3E5F5' },
];

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

const SECTION_ICONS: Record<string, typeof Flame> = {
  fire: Flame,
  gift: Gift,
  tractor: Tractor,
  tag: Tag,
  sparkles: Sparkles,
};

export default function HomePage() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const { 
    coords, 
    cityName,
    radiusKm,
    setRadius,
    requestLocation,
    hasCompletedOnboarding,
  } = useGeo(false);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLocationSettings, setShowLocationSettings] = useState(false);
  const [feedData, setFeedData] = useState<HomeFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState('Ваш район');

  useEffect(() => {
    if (!hasCompletedOnboarding && !coords) {
      setShowOnboarding(true);
    }
  }, [hasCompletedOnboarding, coords]);

  const fetchHomeFeed = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (coords) {
        params.set('lat', coords.lat.toString());
        params.set('lng', coords.lng.toString());
      }
      params.set('radiusKm', (radiusKm || 10).toString());
      
      const response = await fetch(`/api/home-feed?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFeedData(data);
          setLocationName(data.location || cityName || 'Ваш район');
        }
      }
    } catch (error) {
      console.error('Failed to fetch home feed:', error);
    } finally {
      setLoading(false);
    }
  }, [coords, radiusKm, cityName]);

  useEffect(() => {
    fetchHomeFeed();
  }, [fetchHomeFeed]);

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

  const bannersBlock = feedData?.blocks.find(b => b.type === 'banners');
  const listBlocks = feedData?.blocks.filter(b => b.type === 'horizontal_list') || [];

  return (
    <div style={{ 
      background: '#F5F6F7', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
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
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Ваш район</div>
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
              Что ищете?
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

        {/* Service Icons Grid */}
        <section style={{ padding: '16px 16px 20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
          }}>
            {QUICK_CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategoryClick(cat.slug)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '12px 4px 10px',
                  background: '#FFFFFF',
                  border: 'none',
                  borderRadius: 16,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  transition: 'transform 0.15s ease',
                  position: 'relative',
                }}
                data-testid={`category-quick-${cat.slug}`}
              >
                {cat.isHot && (
                  <span style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: '#EC4899',
                    color: '#FFFFFF',
                    fontSize: 8,
                    fontWeight: 700,
                    padding: '2px 5px',
                    borderRadius: 4,
                  }}>
                    HOT
                  </span>
                )}
                
                <div style={{
                  width: 52,
                  height: 52,
                  background: cat.bgColor,
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 6,
                  overflow: 'hidden',
                }}>
                  <img 
                    src={cat.icon} 
                    alt={cat.label}
                    style={{
                      width: 38,
                      height: 38,
                      objectFit: 'contain',
                    }}
                    loading="lazy"
                  />
                </div>
                
                <span style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#1F2937',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}>
                  {cat.label}
                </span>
              </button>
            ))}
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

        {/* Dynamic Sections */}
        {!loading && listBlocks.map((block) => (
          <HorizontalSection
            key={block.id}
            block={block}
            onAdClick={handleAdClick}
            onSeeAll={() => block.link && navigate(block.link)}
          />
        ))}

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
        {block.items.map((ad: AdPreview) => (
          <CompactAdCard 
            key={ad._id} 
            ad={ad} 
            onClick={() => onAdClick(ad._id)}
            accentColor={accentColor}
          />
        ))}
      </div>
    </section>
  );
}

function CompactAdCard({ 
  ad, 
  onClick,
  accentColor,
}: { 
  ad: AdPreview; 
  onClick: () => void;
  accentColor: string;
}) {
  const formatPrice = (price: number) => {
    if (price === 0) return 'Даром';
    return `${price.toLocaleString('ru-RU')} р.`;
  };

  const photoUrl = ad.photos?.[0] ? getThumbnailUrl(ad.photos[0]) : NO_PHOTO_PLACEHOLDER;
  
  const priceHistory = ad.priceHistory || [];
  const hasDiscount = priceHistory.length > 0;
  const oldPrice = hasDiscount ? priceHistory[priceHistory.length - 1]?.oldPrice : null;

  const isFresh = (() => {
    if (!ad.createdAt) return false;
    const createdDate = new Date(ad.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  })();

  return (
    <div
      onClick={onClick}
      style={{
        minWidth: 140,
        maxWidth: 140,
        background: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        scrollSnapAlign: 'start',
        flexShrink: 0,
      }}
      data-testid={`ad-card-${ad._id}`}
    >
      <div style={{ 
        position: 'relative',
        aspectRatio: '1',
        background: '#F0F2F5',
      }}>
        <img
          src={photoUrl}
          alt={ad.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          loading="lazy"
        />
        
        {isFresh && (
          <div style={{
            position: 'absolute',
            top: 6,
            left: 6,
            background: '#10B981',
            color: '#FFFFFF',
            fontSize: 9,
            fontWeight: 600,
            padding: '3px 6px',
            borderRadius: 6,
          }}>
            NEW
          </div>
        )}

        {ad.isFreeGiveaway && (
          <div style={{
            position: 'absolute',
            top: 6,
            left: 6,
            background: '#EC4899',
            color: '#FFFFFF',
            fontSize: 9,
            fontWeight: 600,
            padding: '3px 6px',
            borderRadius: 6,
          }}>
            FREE
          </div>
        )}
        
        <div style={{
          position: 'absolute',
          top: 6,
          right: 6,
        }}>
          <FavoriteButton 
            adId={ad._id} 
            size={18}
          />
        </div>
      </div>
      
      <div style={{ padding: '10px' }}>
        <div style={{
          fontSize: 15,
          fontWeight: 700,
          color: ad.isFreeGiveaway ? '#EC4899' : '#1F2937',
          marginBottom: 2,
        }}>
          {formatPrice(ad.price)}
          {oldPrice && oldPrice > ad.price && (
            <span style={{
              fontSize: 11,
              color: '#9CA3AF',
              textDecoration: 'line-through',
              marginLeft: 6,
              fontWeight: 400,
            }}>
              {oldPrice.toLocaleString('ru-RU')} р.
            </span>
          )}
        </div>
        
        <div style={{
          fontSize: 12,
          color: '#6B7280',
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          minHeight: 32,
        }}>
          {ad.title}
        </div>
        
        {ad.distanceKm !== undefined && ad.distanceKm > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 10,
            color: '#9CA3AF',
            marginTop: 4,
          }}>
            <Navigation size={10} />
            <span>
              {ad.distanceKm < 1 
                ? `${Math.round(ad.distanceKm * 1000)} м`
                : `${ad.distanceKm.toFixed(1)} км`
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
