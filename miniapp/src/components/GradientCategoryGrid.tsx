import { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '@/api/http';
import handshakeIcon from '@assets/generated_images/3d_handshake_icon_clean_style.png';

interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  emoji?: string;
  image?: string;
  gradient: [string, string];
  isHot?: boolean;
  alwaysShow?: boolean;
}

const CATEGORY_ITEMS: CategoryItem[] = [
  { 
    id: 'farmers', 
    slug: 'farmer-market', 
    name: 'Фермеры', 
    emoji: '🥬',
    gradient: ['#4ADE80', '#22C55E'],
    alwaysShow: true,
  },
  { 
    id: 'bakery', 
    slug: 'vypechka', 
    name: 'Выпечка', 
    emoji: '🥖',
    gradient: ['#FBBF24', '#F59E0B'],
    alwaysShow: true,
  },
  { 
    id: 'darom', 
    slug: 'darom', 
    name: 'Даром', 
    emoji: '🎁',
    gradient: ['#F472B6', '#EC4899'],
    isHot: true,
    alwaysShow: true,
  },
  { 
    id: 'tech', 
    slug: 'elektronika', 
    name: 'Техника', 
    emoji: '📱',
    gradient: ['#60A5FA', '#3B82F6'],
  },
  { 
    id: 'clothes', 
    slug: 'odezhda', 
    name: 'Одежда', 
    emoji: '👕',
    gradient: ['#67E8F9', '#22D3EE'],
  },
  { 
    id: 'home', 
    slug: 'dlya-doma', 
    name: 'Для дома', 
    emoji: '🏠',
    gradient: ['#FB923C', '#F97316'],
  },
  { 
    id: 'auto', 
    slug: 'avto', 
    name: 'Авто', 
    emoji: '🚗',
    gradient: ['#F87171', '#EF4444'],
  },
  { 
    id: 'second_hand', 
    slug: 'iz-ruk-v-ruki', 
    name: 'Из рук в руки', 
    image: handshakeIcon,
    gradient: ['#A78BFA', '#8B5CF6'],
    alwaysShow: true,
  },
  { 
    id: 'services', 
    slug: 'uslugi', 
    name: 'Услуги', 
    emoji: '🔧',
    gradient: ['#818CF8', '#6366F1'],
  },
  { 
    id: 'hobby', 
    slug: 'hobbi', 
    name: 'Хобби', 
    emoji: '⚽',
    gradient: ['#86EFAC', '#4ADE80'],
  },
  { 
    id: 'animals', 
    slug: 'zhivotnye', 
    name: 'Животные', 
    emoji: '🐕',
    gradient: ['#FDBA74', '#FB923C'],
  },
  { 
    id: 'beauty', 
    slug: 'krasota', 
    name: 'Красота', 
    emoji: '💄',
    gradient: ['#FDA4AF', '#FB7185'],
  },
  { 
    id: 'kids', 
    slug: 'detskie-tovary', 
    name: 'Детям', 
    emoji: '🧸',
    gradient: ['#FCD34D', '#FBBF24'],
  },
];

interface CategoryCounts {
  [slug: string]: number;
}

interface GradientCategoryGridProps {
  userLat?: number;
  userLng?: number;
  radiusKm?: number;
}

const GradientCategoryGrid = memo(({ userLat, userLng, radiusKm = 30 }: GradientCategoryGridProps) => {
  const navigate = useNavigate();
  const [categoryCounts, setCategoryCounts] = useState<CategoryCounts>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const params = new URLSearchParams();
        if (userLat && userLng) {
          params.append('lat', userLat.toString());
          params.append('lng', userLng.toString());
          params.append('radiusKm', radiusKm.toString());
        }
        
        const slugs = CATEGORY_ITEMS.map(c => c.slug).join(',');
        params.append('categories', slugs);
        
        const response = await http.get(`/api/categories/counts?${params.toString()}`);
        setCategoryCounts(response.data.counts || {});
      } catch (error) {
        console.error('Failed to fetch category counts:', error);
        setCategoryCounts({});
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [userLat, userLng, radiusKm]);

  const handleCategoryClick = (slug: string) => {
    navigate(`/category/${slug}`);
  };

  const visibleCategories = CATEGORY_ITEMS.filter(cat => {
    if (cat.alwaysShow) return true;
    if (loading) return true;
    const count = categoryCounts[cat.slug] || 0;
    return count > 0;
  });

  return (
    <div 
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
        padding: '0 12px',
      }}
      data-testid="gradient-category-grid"
    >
      {visibleCategories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleCategoryClick(cat.slug)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
          data-testid={`category-grid-${cat.slug}`}
        >
          <div 
            style={{
              width: '100%',
              aspectRatio: '1',
              background: `linear-gradient(145deg, ${cat.gradient[0]} 0%, ${cat.gradient[1]} 100%)`,
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
            }}
          >
            {cat.isHot && (
              <span style={{
                position: 'absolute',
                top: 6,
                right: 6,
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: 9,
                fontWeight: 700,
                padding: '3px 6px',
                borderRadius: 6,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
              }}>
                HOT
              </span>
            )}
            {cat.image ? (
              <img 
                src={cat.image} 
                alt={cat.name}
                style={{
                  width: '70%',
                  height: '70%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                }}
              />
            ) : (
              <span style={{
                fontSize: 36,
                lineHeight: 1,
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
              }}>
                {cat.emoji}
              </span>
            )}
          </div>
          <span style={{
            marginTop: 8,
            fontSize: 12,
            fontWeight: 500,
            color: '#374151',
            textAlign: 'center',
            lineHeight: 1.2,
          }}>
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  );
});

GradientCategoryGrid.displayName = 'GradientCategoryGrid';

export default GradientCategoryGrid;
