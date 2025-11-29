import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Package, Share2, ChevronLeft, ChevronRight, Gift, TrendingDown, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FeedItem } from '@/types';
import { getFeedImageUrl, getThumbnailUrl } from '@/constants/placeholders';
import { getLocationDisplayText } from '@/utils/geo';

interface FeedCardProps {
  item: FeedItem;
  onLike: (adId: string) => void;
  onViewOpen: () => void;
  isActive?: boolean;
  nextImageUrl?: string;
  isLiked?: boolean;
}

export default function FeedCard({
  item,
  onLike,
  onViewOpen,
  isActive = true,
  nextImageUrl,
  isLiked = false,
}: FeedCardProps) {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareToast, setShowShareToast] = useState(false);
  const preloadRef = useRef<HTMLImageElement | null>(null);
  const shareToastTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (shareToastTimerRef.current) {
        clearTimeout(shareToastTimerRef.current);
      }
    };
  }, []);

  const images = item.images?.length ? item.images : item.photos || [];
  const hasMultipleImages = images.length > 1;
  const currentImage = images[currentImageIndex] || images[0];
  const rawMainImage = item.previewUrl || currentImage;
  const optimizedUrl = rawMainImage ? getFeedImageUrl(rawMainImage) : '';
  const fallbackUrl = rawMainImage || '';
  const mainImage = useFallback ? fallbackUrl : optimizedUrl;
  const hasImage = !!rawMainImage && !imageError;

  const isFreeGiveaway = item.isFreeGiveaway || item.price === 0;
  const isFarmerAd = item.isFarmerAd;
  const hasDiscount = item.priceHistory && item.priceHistory.length > 0;
  const oldPrice = hasDiscount ? item.priceHistory?.[item.priceHistory.length - 1]?.oldPrice : null;

  useEffect(() => {
    if (nextImageUrl && isActive) {
      const img = new Image();
      img.src = getThumbnailUrl(nextImageUrl);
      preloadRef.current = img;
    }
    return () => {
      if (preloadRef.current) {
        preloadRef.current = null;
      }
    };
  }, [nextImageUrl, isActive]);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setUseFallback(false);
    setCurrentImageIndex(0);
  }, [item._id]);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLiked) {
      onLike(item._id);
    }
  }, [isLiked, onLike, item._id]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/ads/${item._id}`;
    const shareText = `${item.title} - ${item.price > 0 ? `${item.price.toLocaleString('ru-RU')} руб.` : 'Даром'}`;
    
    const showToast = () => {
      if (shareToastTimerRef.current) {
        clearTimeout(shareToastTimerRef.current);
      }
      setShowShareToast(true);
      shareToastTimerRef.current = setTimeout(() => setShowShareToast(false), 2000);
    };
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(shareUrl);
          showToast();
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showToast();
    }
  }, [item]);

  const handleCardClick = useCallback(() => {
    onViewOpen();
    navigate(`/ads/${item._id}`);
  }, [item._id, navigate, onViewOpen]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    if (!useFallback && rawMainImage) {
      setUseFallback(true);
      setImageLoaded(false);
    } else {
      setImageError(true);
      setImageLoaded(true);
    }
  }, [useFallback, rawMainImage]);

  const handlePrevImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
    setImageLoaded(false);
  }, [images.length]);

  const handleNextImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
    setImageLoaded(false);
  }, [images.length]);

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} м`;
    }
    const km = meters / 1000;
    return `${km.toFixed(1).replace('.', ',')} км`;
  };

  const formatPrice = (price: number): string => {
    if (price === 0) return 'Даром';
    return `${price.toLocaleString('ru-RU')} р.`;
  };

  const location = getLocationDisplayText(item.city, item.district, 'Беларусь');

  const description = item.description
    ? item.description.length > 80
      ? item.description.substring(0, 80) + '...'
      : item.description
    : '';

  return (
    <div
      onClick={handleCardClick}
      data-testid={`feed-card-${item._id}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#FFFFFF',
        cursor: 'pointer',
        overflow: 'hidden',
        touchAction: 'pan-y',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 20,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}
    >
      {/* Photo container - Main focus like TikTok */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          background: '#000',
          overflow: 'hidden',
        }}
      >
        {/* Loading skeleton */}
        {hasImage && !imageLoaded && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Package size={48} color="#444" strokeWidth={1.5} />
          </div>
        )}

        {/* Main photo */}
        {hasImage ? (
          <img
            src={mainImage}
            alt={item.title}
            loading={isActive ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: '#1a1a1a',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <Package size={64} color="#444" strokeWidth={1.5} />
            <span style={{ fontSize: 15, color: '#666' }}>Нет фото</span>
          </div>
        )}

        {/* Image slider controls */}
        {hasMultipleImages && (
          <>
            <button
              onClick={handlePrevImage}
              style={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              data-testid="button-prev-image"
            >
              <ChevronLeft size={20} color="#fff" />
            </button>
            <button
              onClick={handleNextImage}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              data-testid="button-next-image"
            >
              <ChevronRight size={20} color="#fff" />
            </button>
            
            {/* Image indicators */}
            <div
              style={{
                position: 'absolute',
                bottom: 100,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 6,
              }}
            >
              {images.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: idx === currentImageIndex ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: idx === currentImageIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Badges */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {isFreeGiveaway && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                borderRadius: 20,
                boxShadow: '0 2px 8px rgba(236, 72, 153, 0.4)',
              }}
            >
              <Gift size={14} color="#fff" />
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>Даром</span>
            </motion.div>
          )}
          
          {hasDiscount && !isFreeGiveaway && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                borderRadius: 20,
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
              }}
            >
              <TrendingDown size={14} color="#fff" />
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>Скидка</span>
            </motion.div>
          )}
          
          {isFarmerAd && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                borderRadius: 20,
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
              }}
            >
              <Leaf size={14} color="#fff" />
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>Фермер</span>
            </motion.div>
          )}
        </div>

        {/* Right side action buttons (TikTok style) */}
        <div
          style={{
            position: 'absolute',
            right: 12,
            bottom: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {/* Like button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            data-testid="button-like"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: 'none',
              background: isLiked
                ? 'linear-gradient(135deg, #FF6B6B, #EE5A5A)'
                : 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isLiked ? '0 4px 16px rgba(255, 107, 107, 0.4)' : 'none',
            }}
          >
            <Heart
              size={24}
              fill={isLiked ? '#fff' : 'none'}
              color="#fff"
              strokeWidth={isLiked ? 0 : 2}
            />
          </motion.button>

          {/* Share button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            data-testid="button-share"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Share2 size={22} color="#fff" />
          </motion.button>
        </div>

        {/* Bottom gradient overlay for info */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 140,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Bottom info overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 70,
            padding: '16px',
          }}
        >
          {/* Title */}
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: 18,
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
            data-testid="text-title"
          >
            {item.title}
          </h2>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: isFreeGiveaway ? '#EC4899' : '#fff',
                textShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
              data-testid="text-price"
            >
              {formatPrice(item.price)}
            </span>
            {oldPrice && !isFreeGiveaway && (
              <span
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.6)',
                  textDecoration: 'line-through',
                }}
              >
                {oldPrice.toLocaleString('ru-RU')} р.
              </span>
            )}
          </div>

          {/* Description */}
          {description && (
            <p
              style={{
                margin: '0 0 6px',
                fontSize: 13,
                lineHeight: 1.4,
                color: 'rgba(255,255,255,0.8)',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
              data-testid="text-description"
            >
              {description}
            </p>
          )}

          {/* Location + Distance */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MapPin size={14} color="rgba(255,255,255,0.7)" />
            <span
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.7)',
              }}
              data-testid="text-location"
            >
              {location}
            </span>
            {item.distanceMeters > 0 && (
              <>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>·</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#60A5FA',
                  }}
                  data-testid="text-distance"
                >
                  {formatDistance(item.distanceMeters)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Share toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '10px 20px',
              background: 'rgba(0,0,0,0.8)',
              borderRadius: 20,
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Ссылка скопирована
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
