import { useState, useEffect, useCallback, useRef } from 'react';
import useGeoStore from '../../store/useGeoStore';
import { ChevronDown, MapPin, TrendingUp, Search, Package } from 'lucide-react';
import { getThumbnailUrl } from '@/constants/placeholders';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { useFormatPrice } from '@/hooks/useFormatPrice';

interface Ad {
  _id: string;
  title: string;
  price: number;
  currency?: string;
  photos?: string[];
  distanceKm?: string;
  categoryId?: string;
  createdAt?: string;
  isFreeGiveaway?: boolean;
  isFarmerAd?: boolean;
}

interface TrendingSearch {
  query: string;
  count: number;
  demandScore: number;
}

interface GeoFeedSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: string;
  onAdClick?: (adId: string) => void;
}

const SHEET_HEIGHTS = {
  collapsed: 0,
  peek: 200,
  half: 0.45,
  full: 0.85,
};

export function GeoFeedSheet({ isOpen, onOpenChange, categoryId, onAdClick }: GeoFeedSheetProps) {
  const { coords, radiusKm } = useGeoStore();
  const { formatCard } = useFormatPrice();
  const lat = coords?.lat;
  const lng = coords?.lng;
  
  const [ads, setAds] = useState<Ad[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<TrendingSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheetHeight, setSheetHeight] = useState<'half' | 'full'>('half');
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 200], [1, 0.5]);
  
  const fetchFeed = useCallback(async () => {
    if (!lat || !lng) return;
    
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    
    setLoading(true);
    try {
      const [feedRes, trendingRes] = await Promise.all([
        fetch(
          `/api/geo-intelligence/feed?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}${categoryId ? `&categoryId=${categoryId}` : ''}&limit=20`,
          { signal: abortRef.current.signal }
        ),
        fetch(
          `/api/geo-intelligence/trending-searches?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}&limit=5`,
          { signal: abortRef.current.signal }
        )
      ]);
      
      const [feedData, trendingData] = await Promise.all([
        feedRes.json(),
        trendingRes.json()
      ]);
      
      if (feedData.success) {
        setAds(feedData.data.ads);
      }
      if (trendingData.success) {
        setTrendingSearches(trendingData.data.trends);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to fetch geo feed:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radiusKm, categoryId]);
  
  useEffect(() => {
    if (isOpen) {
      fetchFeed();
      setSheetHeight('half');
    }
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [isOpen, fetchFeed]);
  
  const formatPrice = (price: number, isFree?: boolean) => {
    return formatCard(price, isFree || price === 0);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    const velocity = info.velocity.y;
    
    if (info.offset.y > threshold || velocity > 500) {
      if (sheetHeight === 'full') {
        setSheetHeight('half');
      } else {
        onOpenChange(false);
      }
    } else if (info.offset.y < -threshold || velocity < -500) {
      setSheetHeight('full');
    }
  };

  const getHeightValue = () => {
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    return sheetHeight === 'full' 
      ? screenHeight * SHEET_HEIGHTS.full 
      : screenHeight * SHEET_HEIGHTS.half;
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black"
            style={{ zIndex: 1000 }}
            onClick={() => onOpenChange(false)}
          />
          
          {/* Sheet */}
          <motion.div
            ref={containerRef}
            initial={{ y: '100%' }}
            animate={{ y: 0, height: getHeightValue() }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ y, opacity }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl overflow-hidden"
            data-testid="geo-feed-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div 
              className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'none' }}
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="px-4 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Рядом с вами</h2>
                {lat && lng && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span>в радиусе {radiusKm < 1 ? `${radiusKm * 1000} м` : `${radiusKm} км`}</span>
                    {ads.length > 0 && (
                      <span className="text-blue-500 ml-1">
                        ({ads.length} {ads.length === 1 ? 'объявление' : ads.length < 5 ? 'объявления' : 'объявлений'})
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
                onClick={() => onOpenChange(false)}
                data-testid="button-close-sheet"
              >
                <ChevronDown className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            
            {/* Content */}
            <div 
              className="px-4 overflow-y-auto overscroll-contain"
              style={{ height: 'calc(100% - 90px)' }}
            >
              {/* Trending Searches */}
              {trendingSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-semibold text-gray-700">Сейчас ищут</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((trend) => (
                      <motion.span 
                        key={trend.query}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-sm cursor-pointer hover:bg-gray-200 active:bg-gray-300 transition-colors"
                        data-testid={`badge-trending-${trend.query}`}
                      >
                        <Search className="w-3 h-3 mr-1.5 text-gray-400" />
                        <span className="text-gray-700">{trend.query}</span>
                        <span className="ml-1.5 text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">
                          {trend.count}
                        </span>
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Ads Feed */}
              <div className="space-y-3 pb-8">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-2xl bg-gray-50 animate-pulse">
                      <div className="w-24 h-24 rounded-xl bg-gray-200" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 w-4/5 bg-gray-200 rounded" />
                        <div className="h-5 w-2/5 bg-gray-200 rounded" />
                        <div className="h-3 w-1/3 bg-gray-200 rounded" />
                      </div>
                    </div>
                  ))
                ) : ads.length > 0 ? (
                  ads.map((ad, index) => (
                    <motion.div 
                      key={ad._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex gap-3 p-3 rounded-2xl bg-gray-50 cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition-colors"
                      onClick={() => onAdClick?.(ad._id)}
                      data-testid={`card-ad-${ad._id}`}
                    >
                      {/* Photo */}
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                        {ad.photos?.[0] ? (
                          <img 
                            src={getThumbnailUrl(ad.photos[0])} 
                            alt={ad.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        {/* Badge */}
                        {(ad.isFreeGiveaway || ad.price === 0) && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-pink-500 text-white text-xs font-medium rounded">
                            Даром
                          </div>
                        )}
                        {ad.isFarmerAd && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-green-500 text-white text-xs font-medium rounded">
                            Фермер
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0 py-0.5">
                        <h4 className="font-medium text-gray-900 line-clamp-2 leading-tight">
                          {ad.title}
                        </h4>
                        <p className={`text-lg font-bold mt-1 ${
                          ad.isFreeGiveaway || ad.price === 0 
                            ? 'text-pink-500' 
                            : 'text-gray-900'
                        }`}>
                          {formatPrice(ad.price, ad.isFreeGiveaway)}
                        </p>
                        {ad.distanceKm && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{ad.distanceKm} км</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-900 mb-1">Нет объявлений рядом</p>
                    <p className="text-sm text-gray-500">Попробуйте увеличить радиус поиска</p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default GeoFeedSheet;
