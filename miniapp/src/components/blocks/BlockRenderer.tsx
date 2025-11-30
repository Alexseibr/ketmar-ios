import { useNavigate } from 'react-router-dom';
import { Gift, Tractor, Wrench, Shovel, Sparkles, Store, Palette, Flame, Search, Heart, Tag, Snowflake, Home, Calendar, ChevronRight, MapPin, Scissors, Hammer, Droplets, Trees, Leaf, Wheat, Star, Package } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { getThumbnailUrl, NO_PHOTO_PLACEHOLDER } from '@/constants/placeholders';
import FavoriteButton from '@/components/FavoriteButton';
import { useUserStore } from '@/store/useUserStore';
import 'swiper/css';
import 'swiper/css/pagination';

export type ZoneType = 'village' | 'suburb' | 'city_center';

const ZONE_STYLES = {
  village: {
    cardWidth: 170,
    cardBorderRadius: 12,
    titleSize: 18,
    subtitleSize: 13,
    itemTitleSize: 15,
    priceSize: 16,
    sectionPadding: 20,
    iconSize: 24,
    headerGap: 12,
    cardGap: 14,
    buttonPadding: '14px 24px',
    shadowStrength: 'none',
    borderStyle: '1px solid #E5E7EB',
  },
  suburb: {
    cardWidth: 155,
    cardBorderRadius: 14,
    titleSize: 17,
    subtitleSize: 12,
    itemTitleSize: 14,
    priceSize: 15,
    sectionPadding: 16,
    iconSize: 22,
    headerGap: 10,
    cardGap: 12,
    buttonPadding: '12px 20px',
    shadowStrength: '0 1px 3px rgba(0,0,0,0.08)',
    borderStyle: '1px solid #E5E7EB',
  },
  city_center: {
    cardWidth: 145,
    cardBorderRadius: 16,
    titleSize: 16,
    subtitleSize: 12,
    itemTitleSize: 13,
    priceSize: 14,
    sectionPadding: 14,
    iconSize: 20,
    headerGap: 8,
    cardGap: 10,
    buttonPadding: '10px 16px',
    shadowStrength: '0 2px 8px rgba(0,0,0,0.06)',
    borderStyle: 'none',
  },
};

interface BlockItem {
  id: string;
  title?: string;
  name?: string;
  price?: number;
  currency?: string;
  photo?: string;
  logo?: string;
  avatar?: string;
  distance?: number;
  location?: string;
  isFarmer?: boolean;
  isFree?: boolean;
  hasDiscount?: boolean;
  gradient?: string[];
  subtitle?: string;
  link?: string;
  icon?: string;
  query?: string;
  count?: number;
  category?: string;
  rating?: number;
  emoji?: string;
  color?: string;
  daysRemaining?: number;
  specialty?: string;
}

interface HomeBlock {
  type: 'banners' | 'horizontal_list';
  id: string;
  title?: string;
  subtitle?: string;
  icon?: string;
  accentColor?: string;
  link?: string;
  items: BlockItem[];
}

interface UIConfig {
  buttonSize: 'large' | 'medium' | 'small';
  cardStyle: 'simple' | 'standard' | 'fancy';
  animations: boolean;
  colorAccent: string;
  categoryGridCols?: number;
}

interface BlockRendererProps {
  block: HomeBlock;
  zone: ZoneType;
  uiConfig: UIConfig;
}

const ICONS: Record<string, typeof Gift> = {
  gift: Gift,
  tractor: Tractor,
  wrench: Wrench,
  shovel: Shovel,
  sparkles: Sparkles,
  store: Store,
  palette: Palette,
  fire: Flame,
  search: Search,
  heart: Heart,
  tag: Tag,
  snowflake: Snowflake,
  home: Home,
  calendar: Calendar,
  lipstick: Scissors,
  grass: Leaf,
  hammer: Hammer,
  droplets: Droplets,
  trees: Trees,
  wheat: Wheat,
  star: Star,
  package: Package,
};

export function BlockRenderer({ block, zone, uiConfig }: BlockRendererProps) {
  const navigate = useNavigate();

  if (!block.items?.length && block.type !== 'banners') {
    return null;
  }

  if (block.type === 'banners') {
    return <BannersBlock items={block.items} zone={zone} uiConfig={uiConfig} />;
  }

  return (
    <HorizontalListBlock 
      block={block} 
      zone={zone} 
      uiConfig={uiConfig}
      onItemClick={(id) => navigate(`/ads/${id}`)}
      onSeeAllClick={() => block.link && navigate(block.link)}
    />
  );
}

function BannersBlock({ items, zone, uiConfig }: { items: BlockItem[]; zone: ZoneType; uiConfig: UIConfig }) {
  const navigate = useNavigate();

  if (!items?.length) return null;

  const buttonPadding = uiConfig.buttonSize === 'large' ? '14px 24px' : 
                        uiConfig.buttonSize === 'small' ? '10px 16px' : '12px 20px';

  return (
    <div style={{ marginBottom: 16 }}>
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={12}
        slidesPerView={1.1}
        centeredSlides={true}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        style={{ paddingBottom: 24 }}
      >
        {items.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div
              onClick={() => banner.link && navigate(banner.link)}
              style={{
                background: banner.gradient 
                  ? `linear-gradient(135deg, ${banner.gradient[0]} 0%, ${banner.gradient[1]} 100%)`
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                borderRadius: zone === 'village' ? 12 : 16,
                padding: zone === 'village' ? 16 : 20,
                color: '#fff',
                cursor: 'pointer',
                minHeight: zone === 'village' ? 100 : 120,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
              data-testid={`banner-${banner.id}`}
            >
              <div style={{ 
                fontSize: zone === 'village' ? 20 : 22, 
                fontWeight: 700, 
                marginBottom: 4 
              }}>
                {banner.title}
              </div>
              <div style={{ 
                fontSize: zone === 'village' ? 13 : 14, 
                opacity: 0.9 
              }}>
                {banner.subtitle}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

function HorizontalListBlock({ 
  block, 
  zone, 
  uiConfig,
  onItemClick,
  onSeeAllClick,
}: { 
  block: HomeBlock; 
  zone: ZoneType; 
  uiConfig: UIConfig;
  onItemClick: (id: string) => void;
  onSeeAllClick: () => void;
}) {
  const user = useUserStore((state) => state.user);
  const IconComponent = block.icon ? ICONS[block.icon] || Sparkles : Sparkles;
  const styles = ZONE_STYLES[zone];

  const cardWidth = styles.cardWidth;
  const cardBorderRadius = styles.cardBorderRadius;
  const titleSize = styles.titleSize;
  const itemTitleSize = styles.itemTitleSize;

  const isShopBlock = block.id === 'local_shops' || block.id === 'author_brands';
  const isDemandBlock = block.id === 'demand';
  const isFairBlock = block.id === 'seasonal_fairs';

  const iconBoxSize = zone === 'village' ? 42 : zone === 'city_center' ? 32 : 36;

  return (
    <div style={{ marginBottom: styles.sectionPadding }}>
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `0 ${styles.sectionPadding}px`,
          marginBottom: styles.headerGap,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: styles.headerGap }}>
          <div style={{
            width: iconBoxSize,
            height: iconBoxSize,
            borderRadius: zone === 'village' ? 10 : zone === 'city_center' ? 12 : 10,
            background: `${block.accentColor || '#6366f1'}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: styles.shadowStrength,
          }}>
            <IconComponent size={styles.iconSize} color={block.accentColor || '#6366f1'} />
          </div>
          <div>
            <div style={{ 
              fontSize: titleSize, 
              fontWeight: 700, 
              color: '#111827',
              letterSpacing: zone === 'village' ? '0' : '-0.01em',
            }}>
              {block.title}
            </div>
            {block.subtitle && (
              <div style={{ fontSize: styles.subtitleSize, color: '#6B7280' }}>
                {block.subtitle}
              </div>
            )}
          </div>
        </div>
        {block.link && (
          <button
            onClick={onSeeAllClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: zone === 'city_center' ? `${block.accentColor || '#6366f1'}10` : 'none',
              border: 'none',
              color: block.accentColor || '#6366f1',
              fontSize: zone === 'village' ? 14 : 13,
              fontWeight: 600,
              cursor: 'pointer',
              padding: zone === 'city_center' ? '6px 12px' : 0,
              borderRadius: zone === 'city_center' ? 20 : 0,
            }}
            data-testid={`link-see-all-${block.id}`}
          >
            Все
            <ChevronRight size={zone === 'village' ? 18 : 16} />
          </button>
        )}
      </div>

      <div style={{
        display: 'flex',
        gap: styles.cardGap,
        overflowX: 'auto',
        paddingLeft: styles.sectionPadding,
        paddingRight: styles.sectionPadding,
        paddingBottom: 4,
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}>
        {block.items.map((item) => {
          if (isShopBlock) {
            return (
              <ShopCard 
                key={item.id} 
                item={item} 
                width={cardWidth} 
                borderRadius={cardBorderRadius}
                accentColor={block.accentColor}
                zone={zone}
              />
            );
          }
          if (isDemandBlock) {
            return (
              <DemandCard 
                key={item.id} 
                item={item} 
                width={cardWidth} 
                borderRadius={cardBorderRadius}
                accentColor={block.accentColor}
              />
            );
          }
          if (isFairBlock) {
            return (
              <FairCard 
                key={item.id} 
                item={item} 
                width={cardWidth + 20} 
                borderRadius={cardBorderRadius}
              />
            );
          }
          return (
            <AdCard 
              key={item.id} 
              item={item} 
              width={cardWidth}
              borderRadius={cardBorderRadius}
              titleSize={itemTitleSize}
              zone={zone}
              uiConfig={uiConfig}
              userId={user?.telegramId}
              onClick={() => onItemClick(item.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function AdCard({ 
  item, 
  width, 
  borderRadius, 
  titleSize, 
  zone,
  uiConfig,
  userId,
  onClick,
}: { 
  item: BlockItem; 
  width: number; 
  borderRadius: number; 
  titleSize: number;
  zone: ZoneType;
  uiConfig: UIConfig;
  userId?: number;
  onClick: () => void;
}) {
  const photoUrl = item.photo 
    ? getThumbnailUrl(item.photo) 
    : NO_PHOTO_PLACEHOLDER;

  const showAnimations = uiConfig.animations;
  const styles = ZONE_STYLES[zone];
  const badgeSize = zone === 'village' ? 12 : 10;
  const badgePadding = zone === 'village' ? '4px 10px' : '3px 8px';

  return (
    <div
      onClick={onClick}
      style={{
        minWidth: width,
        maxWidth: width,
        scrollSnapAlign: 'start',
        cursor: 'pointer',
        transition: showAnimations ? 'transform 0.2s ease' : 'none',
      }}
      data-testid={`card-ad-${item.id}`}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: zone === 'city_center' ? '4/5' : '1',
        borderRadius,
        overflow: 'hidden',
        background: '#F3F4F6',
        boxShadow: styles.shadowStrength,
      }}>
        <img
          src={photoUrl}
          alt={item.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          loading="lazy"
        />
        
        {item.isFree && (
          <div style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: '#ec4899',
            color: '#fff',
            fontSize: badgeSize,
            fontWeight: 700,
            padding: badgePadding,
            borderRadius: 6,
          }}>
            ДАРОМ
          </div>
        )}
        
        {item.isFarmer && !item.isFree && (
          <div style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: '#059669',
            color: '#fff',
            fontSize: badgeSize,
            fontWeight: 700,
            padding: badgePadding,
            borderRadius: 6,
          }}>
            ФЕРМЕР
          </div>
        )}
        
        {item.hasDiscount && !item.isFree && !item.isFarmer && (
          <div style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: '#f59e0b',
            color: '#fff',
            fontSize: badgeSize,
            fontWeight: 700,
            padding: badgePadding,
            borderRadius: 6,
          }}>
            СКИДКА
          </div>
        )}

        {userId && (
          <div style={{ position: 'absolute', top: 8, right: 8 }}>
            <FavoriteButton 
              adId={item.id} 
              size={zone === 'village' ? 24 : 20}
            />
          </div>
        )}
      </div>

      <div style={{ marginTop: zone === 'village' ? 10 : 8 }}>
        <div style={{
          fontSize: styles.priceSize,
          fontWeight: 700,
          color: item.isFree ? '#ec4899' : '#111827',
        }}>
          {item.isFree ? 'Бесплатно' : `${item.price?.toLocaleString()} ${item.currency || 'BYN'}`}
        </div>
        <div style={{
          fontSize: titleSize,
          color: '#374151',
          marginTop: 2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {item.title}
        </div>
        {item.distance != null && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 4,
            fontSize: zone === 'village' ? 12 : 11,
            color: '#9CA3AF',
          }}>
            <MapPin size={zone === 'village' ? 14 : 12} />
            {item.distance} км
          </div>
        )}
      </div>
    </div>
  );
}

function ShopCard({ 
  item, 
  width, 
  borderRadius, 
  accentColor,
  zone,
}: { 
  item: BlockItem; 
  width: number; 
  borderRadius: number;
  accentColor?: string;
  zone: ZoneType;
}) {
  const navigate = useNavigate();
  const logo = item.logo || item.avatar;

  return (
    <div
      onClick={() => navigate(`/shop/${item.id}`)}
      style={{
        minWidth: width,
        maxWidth: width,
        scrollSnapAlign: 'start',
        cursor: 'pointer',
        background: '#fff',
        borderRadius,
        padding: 12,
        border: '1px solid #E5E7EB',
      }}
      data-testid={`card-shop-${item.id}`}
    >
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: logo ? 'transparent' : `${accentColor || '#6366f1'}15`,
        overflow: 'hidden',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {logo ? (
          <img 
            src={logo} 
            alt={item.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Store size={24} color={accentColor || '#6366f1'} />
        )}
      </div>
      <div style={{
        fontSize: 14,
        fontWeight: 600,
        color: '#111827',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {item.name}
      </div>
      <div style={{
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
      }}>
        {item.category || item.specialty || 'Магазин'}
      </div>
    </div>
  );
}

function DemandCard({ 
  item, 
  width, 
  borderRadius,
  accentColor,
}: { 
  item: BlockItem; 
  width: number; 
  borderRadius: number;
  accentColor?: string;
}) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/search?q=${encodeURIComponent(item.query || '')}`)}
      style={{
        minWidth: width,
        maxWidth: width,
        scrollSnapAlign: 'start',
        cursor: 'pointer',
        background: `${accentColor || '#3b82f6'}10`,
        borderRadius,
        padding: 14,
        border: `1px solid ${accentColor || '#3b82f6'}30`,
      }}
      data-testid={`card-demand-${item.id}`}
    >
      <div style={{
        fontSize: 14,
        fontWeight: 600,
        color: '#111827',
        marginBottom: 6,
      }}>
        {item.query}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <Search size={14} color={accentColor || '#3b82f6'} />
        <span style={{ fontSize: 12, color: '#6B7280' }}>
          {item.count} запросов
        </span>
      </div>
    </div>
  );
}

function FairCard({ 
  item, 
  width, 
  borderRadius,
}: { 
  item: BlockItem; 
  width: number; 
  borderRadius: number;
}) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate('/fairs')}
      style={{
        minWidth: width,
        maxWidth: width,
        scrollSnapAlign: 'start',
        cursor: 'pointer',
        background: item.color 
          ? `linear-gradient(135deg, ${item.color} 0%, ${item.color}dd 100%)`
          : 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        borderRadius,
        padding: 16,
        color: '#fff',
      }}
      data-testid={`card-fair-${item.id}`}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>
        {item.emoji || '🎪'}
      </div>
      <div style={{
        fontSize: 15,
        fontWeight: 700,
        marginBottom: 4,
      }}>
        {item.name}
      </div>
      {item.daysRemaining != null && (
        <div style={{
          fontSize: 12,
          opacity: 0.9,
        }}>
          Осталось {item.daysRemaining} дней
        </div>
      )}
    </div>
  );
}

export default BlockRenderer;
