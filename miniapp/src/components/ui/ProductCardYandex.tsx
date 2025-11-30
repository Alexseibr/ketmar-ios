import { memo, useState } from 'react';

interface ProductCardYandexProps {
  id: string;
  title: string;
  subtitle?: string;
  price?: number | string;
  image?: string;
  rating?: number;
  distance?: string;
  isFree?: boolean;
  onClick?: () => void;
}

const ProductCardYandex = memo(({
  id,
  title,
  subtitle,
  price,
  image,
  rating,
  distance,
  isFree,
  onClick,
}: ProductCardYandexProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatPrice = (p: number | string | undefined) => {
    if (isFree) return 'Бесплатно';
    if (!p) return '';
    if (typeof p === 'string') return p;
    return `${p.toLocaleString('ru-RU')} BYN`;
  };

  const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="14"%3EНет фото%3C/text%3E%3C/svg%3E';

  return (
    <button
      onClick={onClick}
      data-testid={`product-card-${id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        width: '100%',
        textAlign: 'left',
      }}
      onTouchStart={(e) => {
        e.currentTarget.style.transform = 'scale(0.98)';
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.08)';
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
      }}
    >
      {/* Image Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '75%',
        backgroundColor: '#F3F4F6',
        borderRadius: '16px 16px 0 0',
        overflow: 'hidden',
      }}>
        {!imageLoaded && !imageError && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }} />
        )}
        <img
          src={imageError ? placeholderImage : (image || placeholderImage)}
          alt={title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: imageLoaded || imageError ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
        
        {/* Free Badge */}
        {isFree && (
          <span style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: '#10B981',
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 8px',
            borderRadius: 6,
          }}>
            Даром
          </span>
        )}
        
        {/* Rating Badge */}
        {rating && rating > 0 && (
          <span style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 8px',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}>
            <span style={{ color: '#FBBF24' }}>★</span>
            {rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Info Section */}
      <div style={{
        padding: '12px 12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        flex: 1,
      }}>
        {/* Title */}
        <h3 style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 600,
          color: '#1F2937',
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minHeight: '2.6em',
        }}>
          {title}
        </h3>

        {/* Subtitle */}
        {subtitle && (
          <p style={{
            margin: 0,
            fontSize: 12,
            color: '#6B7280',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {subtitle}
          </p>
        )}

        {/* Bottom Row: Price + Distance */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: 6,
        }}>
          <span style={{
            fontSize: 15,
            fontWeight: 700,
            color: isFree ? '#10B981' : '#1F2937',
          }}>
            {formatPrice(price)}
          </span>
          
          {distance && (
            <span style={{
              fontSize: 11,
              color: '#9CA3AF',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}>
              📍 {distance}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

ProductCardYandex.displayName = 'ProductCardYandex';

export default ProductCardYandex;
