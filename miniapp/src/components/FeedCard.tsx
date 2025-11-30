import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Package, Share2, Gift, TrendingDown, Leaf, MessageCircle, Bookmark, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FeedItem } from '@/types';
import { getFeedImageUrl, getThumbnailUrl } from '@/constants/placeholders';
import { useFormatPrice } from '@/hooks/useFormatPrice';

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
  const { formatCard: formatPriceValue } = useFormatPrice();
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
  const totalImages = images.length || 1;
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
  const isNew = item.createdAt && (Date.now() - new Date(item.createdAt).getTime()) < 24 * 60 * 60 * 1000;

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
    onLike(item._id);
  }, [onLike, item._id]);

  const handleChat = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/chat/${item._id}`);
  }, [navigate, item._id]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/ads/${item._id}`;
    const shareText = `${item.title} - ${formatPriceValue(item.price, item.price === 0)}`;
    
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
  }, [item, formatPriceValue]);

  const handleViewDetails = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
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


  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} м`;
    }
    const km = meters / 1000;
    return `${km.toFixed(1).replace('.', ',')} км`;
  };

  const sellerName = item.sellerName || item.username || 'Продавец';
  const sellerAvatar = item.sellerAvatar;

  const description = item.description
    ? item.description.length > 100
      ? item.description.substring(0, 100) + '...'
      : item.description
    : '';

  return (
    <div
      data-testid={`feed-card-${item._id}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#000',
        overflow: 'hidden',
        touchAction: 'pan-y',
      }}
    >
      {/* Full-screen photo */}
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

      {/* Photo counter - top right */}
      {totalImages > 1 && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            padding: '6px 12px',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: 16,
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
          }}
          data-testid="text-photo-counter"
        >
          {currentImageIndex + 1} / {totalImages}
        </div>
      )}


      {/* Right side action buttons (TikTok style) */}
      <div
        style={{
          position: 'absolute',
          right: 12,
          bottom: 320,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        {/* Like button */}
        <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleLike}
            data-testid="button-like"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: isLiked
                ? 'rgba(255,255,255,0.95)'
                : 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <Heart
              size={22}
              fill={isLiked ? '#EF4444' : 'none'}
              color={isLiked ? '#EF4444' : '#fff'}
              strokeWidth={1.8}
            />
          </motion.button>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 500 }}>
            {item.favoritesCount || 0}
          </span>
        </motion.div>

        {/* Chat button */}
        <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleChat}
            data-testid="button-chat"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <MessageCircle size={20} color="#fff" strokeWidth={1.8} />
          </motion.button>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 500 }}>
            {item.messagesCount || 0}
          </span>
        </motion.div>

        {/* Share button */}
        <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleShare}
            data-testid="button-share"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <Share2 size={20} color="#fff" strokeWidth={1.8} />
          </motion.button>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 500 }}>
            {item.sharesCount || 0}
          </span>
        </motion.div>
      </div>

      {/* Bottom gradient overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 360,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Seller info - left side */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          bottom: 315,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {/* Seller avatar */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: isFarmerAd 
              ? 'linear-gradient(135deg, #FCD34D, #F59E0B)'
              : 'linear-gradient(135deg, #60A5FA, #3B82F6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.25)',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {sellerAvatar ? (
            <img 
              src={sellerAvatar} 
              alt={sellerName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : isFarmerAd ? (
            <Leaf size={22} color="#fff" />
          ) : (
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>
              {sellerName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
              {sellerName}
            </span>
            {isFarmerAd && (
              <span style={{ color: '#10B981', fontSize: 14 }}>✓</span>
            )}
          </div>
          {item.distanceMeters > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} color="rgba(255,255,255,0.7)" />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                {formatDistance(item.distanceMeters)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Badges row */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          bottom: 268,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        {isNew && !isFreeGiveaway && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              background: 'rgba(139, 92, 246, 0.85)',
              backdropFilter: 'blur(4px)',
              borderRadius: 12,
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            <Sparkles size={11} color="#fff" />
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 500 }}>Свежее</span>
          </motion.div>
        )}
        
        {isFarmerAd && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              background: 'rgba(16, 185, 129, 0.85)',
              backdropFilter: 'blur(4px)',
              borderRadius: 12,
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            <Leaf size={11} color="#fff" />
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 500 }}>Фермер</span>
          </motion.div>
        )}

        {isFreeGiveaway && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              background: 'rgba(236, 72, 153, 0.85)',
              backdropFilter: 'blur(4px)',
              borderRadius: 12,
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            <Gift size={11} color="#fff" />
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 500 }}>Даром</span>
          </motion.div>
        )}
        
        {hasDiscount && !isFreeGiveaway && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              background: 'rgba(245, 158, 11, 0.85)',
              backdropFilter: 'blur(4px)',
              borderRadius: 12,
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            <TrendingDown size={11} color="#fff" />
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 500 }}>Скидка</span>
          </motion.div>
        )}
      </div>

      {/* Price */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          bottom: 228,
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: isFreeGiveaway ? '#EC4899' : '#fff',
            textShadow: '0 1px 3px rgba(0,0,0,0.25)',
          }}
          data-testid="text-price"
        >
          {formatPriceValue(item.price, isFreeGiveaway)}
        </span>
      </div>

      {/* Title */}
      <h2
        style={{
          position: 'absolute',
          left: 16,
          right: 70,
          bottom: 198,
          margin: 0,
          fontSize: 16,
          fontWeight: 600,
          color: '#fff',
          lineHeight: 1.35,
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}
        data-testid="text-title"
      >
        {item.title}
      </h2>

      {/* Description */}
      {description && (
        <p
          style={{
            position: 'absolute',
            left: 16,
            right: 70,
            bottom: 158,
            margin: 0,
            fontSize: 13,
            lineHeight: 1.45,
            color: 'rgba(255,255,255,0.75)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          data-testid="text-description"
        >
          {description}
        </p>
      )}

      {/* Bottom action bar */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 115,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {/* View details button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleViewDetails}
          data-testid="button-view-details"
          style={{
            flex: 1,
            padding: '12px 20px',
            background: 'rgba(59, 130, 246, 0.9)',
            backdropFilter: 'blur(8px)',
            border: 'none',
            borderRadius: 20,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          Смотреть подробнее
        </motion.button>

        {/* Bookmark button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleLike}
          data-testid="button-bookmark"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: 'none',
            background: isLiked ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Bookmark
            size={20}
            fill={isLiked ? '#3B82F6' : 'none'}
            color={isLiked ? '#3B82F6' : '#fff'}
          />
        </motion.button>
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
              bottom: 80,
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
