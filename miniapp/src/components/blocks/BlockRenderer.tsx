import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Gift, Tractor, Wrench, Shovel, Sparkles, Store, Palette, Flame, Search, Heart, Tag, Snowflake, Home, Calendar, ChevronRight, MapPin, Scissors, Hammer, Droplets, Trees, Leaf, Wheat, Star, Package, HandHeart, Plus, Smartphone, Sofa, Shirt, Baby, Dumbbell, Car, LayoutGrid, Carrot } from 'lucide-react';
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
  displayQuery?: string;
  count?: number;
  category?: string;
  rating?: number;
  emoji?: string;
  color?: string;
  daysRemaining?: number;
  specialty?: string;
  badge?: string;
  badgeType?: 'farmer' | 'garden' | 'free' | 'used';
  isHot?: boolean;
  createdAt?: string | Date;
}

function formatTimeAgo(date: string | Date | undefined): string | null {
  if (!date) return null;
  
  const now = Date.now();
  const created = new Date(date).getTime();
  const diffMs = now - created;
  
  if (diffMs < 0) return null;
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин`;
  if (hours < 24) return `${hours} ч`;
  if (days < 7) return `${days} д`;
  if (days < 30) return `${Math.floor(days / 7)} нед`;
  return `${Math.floor(days / 30)} мес`;
}

interface FilterOption {
  id: string;
  label: string;
  icon?: string;
  keywords?: string[];
}

interface HomeBlock {
  type: 'banners' | 'horizontal_list' | 'demand_chips' | 'banner_card';
  id: string;
  title?: string;
  subtitle?: string;
  icon?: string;
  accentColor?: string;
  link?: string;
  instruction?: string;
  gradient?: string[];
  items: BlockItem[];
  filters?: FilterOption[] | null;
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
  hand: HandHeart,
  grid: LayoutGrid,
  smartphone: Smartphone,
  sofa: Sofa,
  shirt: Shirt,
  baby: Baby,
  dumbbell: Dumbbell,
  car: Car,
  carrot: Carrot,
};

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  farmer: { bg: '#059669', text: '#FFF' },
  garden: { bg: '#84CC16', text: '#FFF' },
  free: { bg: '#EC4899', text: '#FFF' },
  used: { bg: '#F59E0B', text: '#FFF' },
};

export function BlockRenderer({ block, zone, uiConfig }: BlockRendererProps) {
  const navigate = useNavigate();

  if (!block.items?.length && block.type !== 'banners' && block.type !== 'banner_card') {
    if (block.id === 'second_hand') {
      return <SecondHandEmptyState zone={zone} onPostClick={() => navigate('/create')} />;
    }
    return null;
  }

  if (block.type === 'banners') {
    return <BannersBlock items={block.items} zone={zone} uiConfig={uiConfig} />;
  }

  if (block.type === 'banner_card') {
    return (
      <BannerCardBlock 
        block={block} 
        zone={zone}
        onClick={() => block.link && navigate(block.link)}
      />
    );
  }

  if (block.type === 'demand_chips') {
    return (
      <DemandChipsBlock 
        block={block} 
        zone={zone}
        onChipClick={(query, category) => navigate(`/create?demandQuery=${encodeURIComponent(query)}&demandCategory=${category || ''}`)}
      />
    );
  }

  if (block.id === 'second_hand') {
    return (
      <SecondHandBlock 
        block={block} 
        zone={zone} 
        uiConfig={uiConfig}
        onItemClick={(id) => navigate(`/ads/${id}`)}
        onSeeAllClick={() => block.link && navigate(block.link)}
        onPostClick={() => navigate('/create')}
      />
    );
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

function BannerCardBlock({ 
  block, 
  zone,
  onClick,
}: { 
  block: HomeBlock; 
  zone: ZoneType;
  onClick: () => void;
}) {
  const IconComponent = block.icon ? ICONS[block.icon] || Search : Search;
  const styles = ZONE_STYLES[zone];
  
  const cardPadding = zone === 'village' ? 20 : zone === 'city_center' ? 16 : 18;
  const titleSize = zone === 'village' ? 20 : zone === 'city_center' ? 17 : 18;
  const subtitleSize = zone === 'village' ? 14 : zone === 'city_center' ? 12 : 13;
  const borderRadius = zone === 'village' ? 16 : zone === 'city_center' ? 14 : 16;
  
  const gradientColors = block.gradient || ['#6366f1', '#4f46e5'];

  return (
    <div style={{ 
      padding: `0 ${styles.sectionPadding}px`,
      marginBottom: styles.sectionPadding,
    }}>
      <div
        onClick={onClick}
        style={{
          background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
          borderRadius,
          padding: cardPadding,
          color: '#fff',
          cursor: 'pointer',
          minHeight: zone === 'village' ? 110 : 100,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(99, 102, 241, 0.25)',
        }}
        data-testid={`banner-card-${block.id}`}
      >
        {/* Background pattern */}
        <div style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -30,
          right: 40,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        
        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ 
            fontSize: titleSize, 
            fontWeight: 700, 
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <IconComponent size={zone === 'village' ? 24 : 20} />
            {block.title}
          </div>
          <div style={{ 
            fontSize: subtitleSize, 
            opacity: 0.9,
            marginBottom: 12,
          }}>
            {block.subtitle}
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: zone === 'village' ? 14 : 13,
            fontWeight: 600,
          }}>
            Смотреть
            <ChevronRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DemandChipsBlock({ 
  block, 
  zone,
  onChipClick,
}: { 
  block: HomeBlock; 
  zone: ZoneType;
  onChipClick: (query: string, category?: string) => void;
}) {
  const IconComponent = block.icon ? ICONS[block.icon] || Search : Search;
  const styles = ZONE_STYLES[zone];
  
  const iconBoxSize = zone === 'village' ? 42 : zone === 'city_center' ? 32 : 36;
  const chipPadding = zone === 'village' ? '12px 18px' : zone === 'city_center' ? '8px 14px' : '10px 16px';
  const chipFontSize = zone === 'village' ? 15 : zone === 'city_center' ? 13 : 14;
  const chipGap = zone === 'village' ? 10 : 8;

  return (
    <div style={{ marginBottom: styles.sectionPadding }}>
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: `0 ${styles.sectionPadding}px`,
          marginBottom: styles.headerGap,
          gap: styles.headerGap,
        }}
      >
        <div style={{
          width: iconBoxSize,
          height: iconBoxSize,
          borderRadius: zone === 'village' ? 10 : 12,
          background: `${block.accentColor || '#8B5CF6'}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: styles.shadowStrength,
        }}>
          <IconComponent size={styles.iconSize} color={block.accentColor || '#8B5CF6'} />
        </div>
        <div>
          <div style={{ 
            fontSize: styles.titleSize, 
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

      {block.instruction && (
        <div 
          style={{
            padding: `0 ${styles.sectionPadding}px`,
            marginBottom: 12,
            fontSize: zone === 'village' ? 13 : 12,
            color: '#6B7280',
            fontStyle: 'italic',
          }}
        >
          {block.instruction}
        </div>
      )}

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: chipGap,
        padding: `0 ${styles.sectionPadding}px`,
      }}>
        {block.items.map((item) => (
          <button
            key={item.id}
            onClick={() => onChipClick(item.query || item.displayQuery, item.category)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: chipPadding,
              background: item.isHot 
                ? 'linear-gradient(135deg, #8B5CF6 0%, #6366f1 100%)' 
                : '#F3F4F6',
              color: item.isHot ? '#FFF' : '#374151',
              border: 'none',
              borderRadius: 20,
              fontSize: chipFontSize,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow: item.isHot ? '0 2px 8px rgba(139, 92, 246, 0.3)' : 'none',
            }}
            data-testid={`chip-demand-${item.id}`}
          >
            {item.isHot && <Flame size={14} />}
            {item.displayQuery || item.query}
            {item.count && item.count >= 5 && (
              <span style={{
                background: item.isHot ? 'rgba(255,255,255,0.2)' : '#E5E7EB',
                padding: '2px 6px',
                borderRadius: 10,
                fontSize: chipFontSize - 2,
              }}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>
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
        {block.items.map((item, index) => {
          const elements: JSX.Element[] = [];
          
          const CTA_INTERVAL = 8;
          const showCTA = !isShopBlock && !isDemandBlock && !isFairBlock && index > 0 && index % CTA_INTERVAL === 0;
          
          if (showCTA) {
            const ctaType: CTAType = block.id === 'darom' ? 'giveaway' : (index % (CTA_INTERVAL * 2) === 0) ? 'sell' : 'giveaway';
            elements.push(
              <CTACard
                key={`cta-${index}`}
                type={ctaType}
                width={cardWidth}
                borderRadius={cardBorderRadius}
                zone={zone}
              />
            );
          }
          
          if (isShopBlock) {
            elements.push(
              <ShopCard 
                key={item.id} 
                item={item} 
                width={cardWidth} 
                borderRadius={cardBorderRadius}
                accentColor={block.accentColor}
                zone={zone}
              />
            );
          } else if (isDemandBlock) {
            elements.push(
              <DemandCard 
                key={item.id} 
                item={item} 
                width={cardWidth} 
                borderRadius={cardBorderRadius}
                accentColor={block.accentColor}
              />
            );
          } else if (isFairBlock) {
            elements.push(
              <FairCard 
                key={item.id} 
                item={item} 
                width={cardWidth + 20} 
                borderRadius={cardBorderRadius}
              />
            );
          } else {
            elements.push(
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
          }
          
          return elements;
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
        
        {(item.badge || item.isFree || item.isFarmer || item.hasDiscount) && (
          <div style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: item.badge 
              ? (BADGE_COLORS[item.badgeType || 'used']?.bg || '#F59E0B')
              : item.isFree 
                ? '#ec4899' 
                : item.isFarmer 
                  ? '#059669' 
                  : '#f59e0b',
            color: '#fff',
            fontSize: badgeSize,
            fontWeight: 700,
            padding: badgePadding,
            borderRadius: 6,
          }}>
            {item.badge || (item.isFree ? 'ДАРОМ' : item.isFarmer ? 'ФЕРМЕР' : 'СКИДКА')}
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 4,
          fontSize: zone === 'village' ? 11 : 10,
          color: '#9CA3AF',
        }}>
          {item.distance != null && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={zone === 'village' ? 12 : 10} />
              {item.distance} км
            </span>
          )}
          {item.createdAt && (
            <span style={{
              padding: '2px 6px',
              background: '#F3F4F6',
              borderRadius: 4,
              fontSize: zone === 'village' ? 10 : 9,
              color: '#6B7280',
              fontWeight: 500,
            }}>
              {formatTimeAgo(item.createdAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

type CTAType = 'sell' | 'giveaway';

const CTA_CONFIGS: Record<CTAType, { title: string; subtitle: string; color: string; bgColor: string; borderColor: string; link: string }> = {
  sell: {
    title: 'Продать своё',
    subtitle: 'Быстро и бесплатно',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    borderColor: '#FCD34D',
    link: '/create',
  },
  giveaway: {
    title: 'Отдам даром',
    subtitle: 'Одно фото — и готово',
    color: '#EC4899',
    bgColor: '#FDF2F8',
    borderColor: '#F9A8D4',
    link: '/create-giveaway',
  },
};

function CTACard({
  type,
  width,
  borderRadius,
  zone,
}: {
  type: CTAType;
  width: number;
  borderRadius: number;
  zone: ZoneType;
}) {
  const navigate = useNavigate();
  const config = CTA_CONFIGS[type];
  const styles = ZONE_STYLES[zone];
  
  const iconSize = zone === 'village' ? 32 : zone === 'city_center' ? 24 : 28;
  const titleSize = zone === 'village' ? 16 : zone === 'city_center' ? 13 : 14;
  const subtitleSize = zone === 'village' ? 13 : zone === 'city_center' ? 11 : 12;

  return (
    <div
      onClick={() => navigate(config.link)}
      style={{
        minWidth: width,
        maxWidth: width,
        scrollSnapAlign: 'start',
        cursor: 'pointer',
      }}
      data-testid={`card-cta-${type}`}
    >
      <div style={{
        width: '100%',
        aspectRatio: zone === 'city_center' ? '4/5' : '1',
        borderRadius,
        background: config.bgColor,
        border: `2px dashed ${config.borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: zone === 'village' ? 56 : zone === 'city_center' ? 40 : 48,
          height: zone === 'village' ? 56 : zone === 'city_center' ? 40 : 48,
          borderRadius: '50%',
          background: `${config.color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: zone === 'village' ? 14 : 10,
        }}>
          <Plus size={iconSize} color={config.color} strokeWidth={2.5} />
        </div>
        <div style={{
          fontSize: titleSize,
          fontWeight: 700,
          color: config.color,
          textAlign: 'center',
          marginBottom: 4,
        }}>
          {config.title}
        </div>
        <div style={{
          fontSize: subtitleSize,
          color: '#6B7280',
          textAlign: 'center',
        }}>
          {config.subtitle}
        </div>
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

function SecondHandEmptyState({ 
  zone, 
  onPostClick 
}: { 
  zone: ZoneType; 
  onPostClick: () => void;
}) {
  const styles = ZONE_STYLES[zone];
  const accentColor = '#F59E0B';

  return (
    <section style={{ marginBottom: 24, padding: `0 ${styles.sectionPadding}px` }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: styles.headerGap,
        marginBottom: 16,
      }}>
        <div style={{
          width: zone === 'village' ? 40 : 36,
          height: zone === 'village' ? 40 : 36,
          borderRadius: 10,
          background: `${accentColor}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <HandHeart size={styles.iconSize} color={accentColor} />
        </div>
        <div>
          <h3 style={{ 
            margin: 0, 
            fontSize: styles.titleSize, 
            fontWeight: 700, 
            color: '#1F2937' 
          }}>
            Из рук в руки
          </h3>
          <p style={{ 
            margin: '2px 0 0', 
            fontSize: styles.subtitleSize, 
            color: '#9CA3AF' 
          }}>
            Б/У товары от соседей
          </p>
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
        borderRadius: styles.cardBorderRadius,
        padding: zone === 'village' ? 24 : 20,
        textAlign: 'center',
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#FFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
        }}>
          <HandHeart size={32} color={accentColor} />
        </div>
        
        <h4 style={{
          margin: '0 0 8px',
          fontSize: zone === 'village' ? 18 : 16,
          fontWeight: 700,
          color: '#92400E',
        }}>
          Здесь соседи продают ненужное
        </h4>
        
        <p style={{
          margin: '0 0 20px',
          fontSize: zone === 'village' ? 15 : 14,
          color: '#B45309',
          lineHeight: 1.5,
        }}>
          Продай вещи, которые тебе уже не нужны — они ещё послужат кому-то рядом
        </p>

        <button
          onClick={onPostClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: accentColor,
            color: '#FFF',
            border: 'none',
            borderRadius: 12,
            padding: styles.buttonPadding,
            fontSize: zone === 'village' ? 16 : 15,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
          }}
          data-testid="button-post-second-hand"
        >
          <Plus size={20} />
          Подать объявление
        </button>

        <p style={{
          margin: '16px 0 0',
          fontSize: 13,
          color: '#92400E',
          fontStyle: 'italic',
        }}>
          Пусть объявление найдёт того, кому это нужнее 😊
        </p>
      </div>
    </section>
  );
}

function SecondHandBlock({ 
  block, 
  zone, 
  uiConfig,
  onItemClick,
  onSeeAllClick,
  onPostClick,
}: { 
  block: HomeBlock; 
  zone: ZoneType; 
  uiConfig: UIConfig;
  onItemClick: (id: string) => void;
  onSeeAllClick: () => void;
  onPostClick: () => void;
}) {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const [activeFilter, setActiveFilter] = useState('all');
  const styles = ZONE_STYLES[zone];
  const accentColor = block.accentColor || '#F59E0B';
  const cardWidth = styles.cardWidth;
  const cardBorderRadius = styles.cardBorderRadius;

  const filters = block.filters || [];
  
  const filteredItems = activeFilter === 'all' 
    ? block.items 
    : block.items.filter(item => {
        const filter = filters.find(f => f.id === activeFilter);
        if (!filter?.keywords) return true;
        const title = (item.title || item.name || '').toLowerCase();
        return filter.keywords.some(kw => title.includes(kw.toLowerCase()));
      });

  const handleFilterClick = (filterId: string) => {
    setActiveFilter(filterId);
  };

  const handleSeeAllWithFilter = () => {
    if (activeFilter === 'all') {
      navigate('/feed?type=second_hand');
    } else {
      const filter = filters.find(f => f.id === activeFilter);
      if (filter?.keywords?.length) {
        navigate(`/feed?type=second_hand&q=${encodeURIComponent(filter.keywords[0])}`);
      } else {
        navigate('/feed?type=second_hand');
      }
    }
  };

  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{
        padding: `0 ${styles.sectionPadding}px 12px`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: styles.headerGap }}>
          <div style={{
            width: zone === 'village' ? 40 : 36,
            height: zone === 'village' ? 40 : 36,
            borderRadius: 10,
            background: `${accentColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <HandHeart size={styles.iconSize} color={accentColor} />
          </div>
          <div>
            <h3 style={{ 
              margin: 0, 
              fontSize: styles.titleSize, 
              fontWeight: 700, 
              color: '#1F2937' 
            }}>
              {block.title}
            </h3>
            <p style={{ 
              margin: '2px 0 0', 
              fontSize: styles.subtitleSize, 
              color: '#9CA3AF' 
            }}>
              {block.subtitle}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleSeeAllWithFilter}
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
          data-testid="button-see-all-second-hand"
        >
          Все
          <ChevronRight size={16} />
        </button>
      </div>

      {filters.length > 0 && (
        <div style={{ 
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          marginBottom: 12,
        }}>
          <div style={{
            display: 'flex',
            gap: 8,
            padding: `0 ${styles.sectionPadding}px`,
            minWidth: 'max-content',
          }}>
            {filters.map((filter) => {
              const isActive = activeFilter === filter.id;
              const FilterIcon = filter.icon ? ICONS[filter.icon] : null;
              
              return (
                <button
                  key={filter.id}
                  onClick={() => handleFilterClick(filter.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: zone === 'village' ? '10px 16px' : '8px 14px',
                    borderRadius: 20,
                    border: 'none',
                    background: isActive ? accentColor : '#F3F4F6',
                    color: isActive ? '#FFF' : '#4B5563',
                    fontSize: zone === 'village' ? 14 : 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                  }}
                  data-testid={`filter-second-hand-${filter.id}`}
                >
                  {FilterIcon && <FilterIcon size={zone === 'village' ? 18 : 16} />}
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div style={{
          padding: `20px ${styles.sectionPadding}px`,
          textAlign: 'center',
        }}>
          <p style={{ color: '#9CA3AF', fontSize: 14, margin: '0 0 12px' }}>
            Нет товаров в этой категории поблизости
          </p>
          <button
            onClick={onPostClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: accentColor,
              color: '#FFF',
              border: 'none',
              borderRadius: 10,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            data-testid="button-post-second-hand-empty"
          >
            <Plus size={18} />
            Добавить первым
          </button>
        </div>
      ) : (
        <Swiper
          modules={[Autoplay]}
          spaceBetween={styles.cardGap}
          slidesPerView="auto"
          loop={filteredItems.length >= 3}
          freeMode={true}
          style={{ paddingLeft: styles.sectionPadding, paddingRight: styles.sectionPadding }}
        >
          {filteredItems.map((item) => (
          <SwiperSlide key={item.id} style={{ width: 'auto' }}>
            <div
              onClick={() => onItemClick(item.id)}
              style={{
                minWidth: cardWidth,
                maxWidth: cardWidth,
                cursor: 'pointer',
                background: '#FFFFFF',
                borderRadius: cardBorderRadius,
                overflow: 'hidden',
                boxShadow: styles.shadowStrength,
                border: styles.borderStyle,
              }}
              data-testid={`card-second-hand-${item.id}`}
            >
              <div style={{ 
                position: 'relative', 
                paddingTop: '100%',
                background: '#F3F4F6',
              }}>
                <img
                  src={getThumbnailUrl(item.photo)}
                  alt={item.title || item.name}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = NO_PHOTO_PLACEHOLDER;
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                
                <div style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  background: accentColor,
                  color: '#FFF',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: 6,
                }}>
                  Б/У
                </div>

                {user?.telegramId && (
                  <div style={{ position: 'absolute', top: 8, right: 8 }}>
                    <FavoriteButton adId={item.id} size="sm" />
                  </div>
                )}

                {item.distance != null && (
                  <div style={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    background: 'rgba(0,0,0,0.6)',
                    color: '#FFF',
                    fontSize: 11,
                    fontWeight: 500,
                    padding: '3px 8px',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    <MapPin size={12} />
                    {item.distance < 1 ? `${Math.round(item.distance * 1000)} м` : `${item.distance.toFixed(1)} км`}
                  </div>
                )}
              </div>

              <div style={{ padding: 12 }}>
                <div style={{
                  fontSize: styles.itemTitleSize,
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: 6,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.title || item.name}
                </div>
                
                <div style={{
                  fontSize: styles.priceSize,
                  fontWeight: 700,
                  color: accentColor,
                }}>
                  {item.price ? `${item.price.toLocaleString()} ${item.currency || 'BYN'}` : 'Цена по запросу'}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
        
        <SwiperSlide style={{ width: 'auto' }}>
          <div
            onClick={onPostClick}
            style={{
              minWidth: cardWidth,
              maxWidth: cardWidth,
              height: cardWidth + 80,
              cursor: 'pointer',
              background: `${accentColor}10`,
              borderRadius: cardBorderRadius,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px dashed ${accentColor}40`,
              padding: 16,
            }}
            data-testid="card-post-second-hand"
          >
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: `${accentColor}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}>
              <Plus size={28} color={accentColor} />
            </div>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: accentColor,
              textAlign: 'center',
            }}>
              Продать своё
            </div>
            <div style={{
              fontSize: 12,
              color: '#9CA3AF',
              textAlign: 'center',
              marginTop: 4,
            }}>
              Быстро и бесплатно
            </div>
          </div>
          </SwiperSlide>
        </Swiper>
      )}

      <div style={{
        padding: `12px ${styles.sectionPadding}px 0`,
        textAlign: 'center',
      }}>
        <p style={{
          margin: 0,
          fontSize: 13,
          color: '#9CA3AF',
          fontStyle: 'italic',
        }}>
          Пусть твоё объявление найдёт того, кому это нужнее 😊
        </p>
      </div>
    </section>
  );
}

export default BlockRenderer;
