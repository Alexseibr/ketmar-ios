import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MapPin, Loader2, ChevronUp, ChevronDown, Gift, Leaf, TrendingDown, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import FeedCard from '@/components/FeedCard';
import ScreenLayout from '@/components/layout/ScreenLayout';
import { useGeo } from '@/utils/geo';
import { FeedItem, FeedEvent } from '@/types';
import http from '@/api/http';
import { toggleFavorite } from '@/api/favorites';
import { useUserStore } from '@/store/useUserStore';

const FEED_RADIUS_KM = 20;
const FEED_LIMIT = 20;
const AUTO_REFRESH_INTERVAL = 45000; // 45 seconds

type FilterType = 'all' | 'free' | 'farmer' | 'discount';

interface FilterOption {
  id: FilterType;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'Все', icon: <Sparkles size={14} />, color: '#3A7BFF', bgColor: 'rgba(58, 123, 255, 0.1)' },
  { id: 'free', label: 'Даром', icon: <Gift size={14} />, color: '#EC4899', bgColor: 'rgba(236, 72, 153, 0.1)' },
  { id: 'farmer', label: 'Фермер', icon: <Leaf size={14} />, color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' },
  { id: 'discount', label: 'Скидки', icon: <TrendingDown size={14} />, color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)' },
];

interface FeedHeaderProps {
  onNotificationsClick: () => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

function FeedHeader({ onNotificationsClick, activeFilter, onFilterChange }: FeedHeaderProps) {
  return (
    <header
      style={{
        background: '#000',
        flexShrink: 0,
      }}
    >
      {/* Top row: Logo + Notifications */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px 8px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.5px',
          }}
        >
          KETMAR
        </h1>
        <button
          onClick={onNotificationsClick}
          data-testid="button-notifications"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Bell size={20} color="#fff" />
        </button>
      </div>
      
      {/* Filter tabs row */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '8px 16px 12px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {FILTER_OPTIONS.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <motion.button
              key={filter.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onFilterChange(filter.id)}
              data-testid={`filter-${filter.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 20,
                border: 'none',
                background: isActive ? '#fff' : 'rgba(255,255,255,0.15)',
                color: isActive ? '#000' : '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ color: isActive ? filter.color : 'inherit' }}>
                {filter.icon}
              </span>
              {filter.label}
            </motion.button>
          );
        })}
      </div>
    </header>
  );
}

export default function FeedPage() {
  const navigate = useNavigate();
  const { coords, status: geoStatus, requestLocation } = useGeo();
  const user = useUserStore((state) => state.user);
  
  const [items, setItems] = useState<FeedItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [newBuffer, setNewBuffer] = useState<FeedItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [cardHeight, setCardHeight] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const prevFilterRef = useRef<FilterType>('all');

  const { filteredItems, idToBaseIndex } = useMemo(() => {
    const filtered = items.filter(item => {
      switch (activeFilter) {
        case 'free':
          return item.isFreeGiveaway || item.price === 0;
        case 'farmer':
          return item.isFarmerAd;
        case 'discount':
          return item.priceHistory && item.priceHistory.length > 0;
        default:
          return true;
      }
    });
    const idMap = new Map<string, number>();
    items.forEach((item, idx) => idMap.set(item._id, idx));
    return { filteredItems: filtered, idToBaseIndex: idMap };
  }, [items, activeFilter]);

  // Refs moved up to be available for callbacks
  const currentStartTime = useRef<number | null>(null);
  const pendingEvents = useRef<FeedEvent[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollIndex = useRef<number>(0);
  const prevFilteredLengthRef = useRef<number>(0);
  const isScrollSnapPendingRef = useRef<boolean>(false);

  const sendEvents = useCallback(async (events: FeedEvent[]) => {
    if (events.length === 0) return;
    try {
      await http.post('/api/feed/events', { events });
    } catch (error) {
      console.error('Failed to send feed events:', error);
    }
  }, []);

  const flushPendingEvents = useCallback(() => {
    if (pendingEvents.current.length > 0) {
      sendEvents([...pendingEvents.current]);
      pendingEvents.current = [];
    }
  }, [sendEvents]);

  const trackEvent = useCallback((event: FeedEvent) => {
    pendingEvents.current.push(event);
    if (pendingEvents.current.length >= 5) {
      flushPendingEvents();
    }
  }, [flushPendingEvents]);

  const handleFilterChange = useCallback(async (filter: FilterType) => {
    if (currentStartTime.current && filteredItems.length > 0) {
      const currentItem = filteredItems[currentIndex];
      if (currentItem) {
        const dwellTimeMs = Date.now() - currentStartTime.current;
        trackEvent({
          adId: currentItem._id,
          eventType: 'impression',
          dwellTimeMs,
          positionIndex: currentIndex,
          radiusKm: FEED_RADIUS_KM,
          meta: { categoryId: currentItem.categoryId },
        });
      }
    }
    
    if (pendingEvents.current.length > 0) {
      const eventsToSend = [...pendingEvents.current];
      try {
        await sendEvents(eventsToSend);
        pendingEvents.current = pendingEvents.current.filter(
          e => !eventsToSend.includes(e)
        );
      } catch (error) {
        console.error('Failed to flush events on filter change:', error);
      }
    }
    
    setActiveFilter(filter);
    setCurrentIndex(0);
    lastScrollIndex.current = 0;
    currentStartTime.current = null;
  }, [sendEvents, trackEvent, filteredItems, currentIndex]);

  useEffect(() => {
    if (prevFilterRef.current !== activeFilter && scrollContainerRef.current && filteredItems.length > 0) {
      const container = scrollContainerRef.current;
      const cardHeight = container.clientHeight;
      if (cardHeight > 0) {
        container.scrollTop = cardHeight * filteredItems.length;
        lastScrollIndex.current = filteredItems.length;
      }
    }
    prevFilterRef.current = activeFilter;
  }, [activeFilter, filteredItems.length]);

  useEffect(() => {
    const prevLength = prevFilteredLengthRef.current;
    const currentLength = filteredItems.length;
    
    if (currentLength === 0 && items.length > 0) {
      setCurrentIndex(0);
      lastScrollIndex.current = 0;
      currentStartTime.current = null;
      
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
    else if (prevLength === 0 && currentLength > 0 && items.length > 0) {
      setCurrentIndex(0);
      isScrollSnapPendingRef.current = true;
      
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const cardHeight = container.clientHeight;
        if (cardHeight > 0) {
          container.scrollTop = cardHeight * currentLength;
          lastScrollIndex.current = currentLength;
        }
      }
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isScrollSnapPendingRef.current = false;
          currentStartTime.current = Date.now();
          
          const firstItem = filteredItems[0];
          if (firstItem) {
            trackEvent({
              adId: firstItem._id,
              eventType: 'impression',
              positionIndex: 0,
              radiusKm: FEED_RADIUS_KM,
              meta: { categoryId: firstItem.categoryId },
            });
          }
        });
      });
    }
    
    prevFilteredLengthRef.current = currentLength;
  }, [filteredItems.length, items.length, trackEvent, filteredItems]);
  
  // Auto-request location when page opens if not available
  useEffect(() => {
    if (!coords && geoStatus === 'idle') {
      console.log('[FeedPage] Auto-requesting location...');
      requestLocation();
    }
  }, [coords, geoStatus, requestLocation]);

  // Background refresh of location after feed loads (update cached location)
  const hasRefreshedLocation = useRef(false);
  useEffect(() => {
    if (coords && geoStatus === 'ready' && !hasRefreshedLocation.current) {
      hasRefreshedLocation.current = true;
      // Refresh location in background after 5 seconds
      const timer = setTimeout(() => {
        console.log('[FeedPage] Background refresh of location...');
        requestLocation();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [coords, geoStatus, requestLocation]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const hasShownHint = useRef(false);
  const lastFetchTime = useRef<number>(Date.now());
  const isFetchingRef = useRef<boolean>(false);
  const loadMoreDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateCardHeight = () => {
      if (scrollContainerRef.current) {
        const height = scrollContainerRef.current.clientHeight;
        if (height > 0 && height !== cardHeight) {
          setCardHeight(height);
        }
      }
    };

    const timer = setTimeout(updateCardHeight, 100);
    window.addEventListener('resize', updateCardHeight);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateCardHeight);
    };
  }, [cardHeight, isLoading]);

  useEffect(() => {
    const hintShown = localStorage.getItem('ketmar_feed_hint_shown');
    if (!hintShown) {
      setShowSwipeHint(true);
      hasShownHint.current = false;
    } else {
      hasShownHint.current = true;
    }
  }, []);

  useEffect(() => {
    if (showSwipeHint) {
      const timer = setTimeout(() => {
        setShowSwipeHint(false);
        localStorage.setItem('ketmar_feed_hint_shown', 'true');
        hasShownHint.current = true;
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSwipeHint]);

  const dismissHint = useCallback(() => {
    if (showSwipeHint) {
      setShowSwipeHint(false);
      localStorage.setItem('ketmar_feed_hint_shown', 'true');
      hasShownHint.current = true;
    }
  }, [showSwipeHint]);

  const filterWithPhotos = (items: FeedItem[]): FeedItem[] => {
    if (!items || !Array.isArray(items)) return [];
    return items.filter(item => {
      if (!item) return false;
      // Check previewUrl is not empty string
      if (item.previewUrl && item.previewUrl.trim() !== '') return true;
      // Check images array has valid entries
      if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        const hasValidImage = item.images.some(img => img && img.trim() !== '');
        if (hasValidImage) return true;
      }
      // Check photos array has valid entries
      if (item.photos && Array.isArray(item.photos) && item.photos.length > 0) {
        const hasValidPhoto = item.photos.some(photo => photo && photo.trim() !== '');
        if (hasValidPhoto) return true;
      }
      return false;
    });
  };

  const loadFeed = useCallback(async (cursor?: string, isRefresh?: boolean) => {
    if (!coords || !coords.lat || !coords.lng) return;
    
    // Guard against duplicate fetches for cursor-based loads
    if (cursor && isFetchingRef.current) {
      return;
    }
    
    try {
      if (cursor) {
        isFetchingRef.current = true;
      }
      if (!cursor && !isRefresh) {
        setIsLoading(true);
      }
      
      const params = new URLSearchParams({
        lat: String(coords.lat),
        lng: String(coords.lng),
        radiusKm: String(FEED_RADIUS_KM),
        limit: String(FEED_LIMIT),
      });
      
      if (cursor) {
        params.append('cursor', cursor);
      }
      
      const response = await http.get(`/api/feed?${params.toString()}`);
      const data = response.data as {
        items: FeedItem[];
        nextCursor: string | null;
        hasMore: boolean;
      };
      
      if (!data || !data.items) {
        console.warn('[FeedPage] Invalid response data:', data);
        return;
      }
      
      const filteredItems = filterWithPhotos(data.items);
      lastFetchTime.current = Date.now();
      
      if (isRefresh) {
        const existingIds = new Set(items.map(i => i?._id).filter(Boolean));
        const newItems = filteredItems.filter(item => item?._id && !existingIds.has(item._id));
        if (newItems.length > 0) {
          setNewBuffer(prev => [...prev, ...newItems]);
        }
      } else if (cursor) {
        setItems(prev => [...prev, ...filteredItems]);
      } else {
        setItems(filteredItems);
        setCurrentIndex(0);
        
        if (filteredItems.length > 0 && filteredItems[0]?._id) {
          currentStartTime.current = Date.now();
          trackEvent({
            adId: filteredItems[0]._id,
            eventType: 'impression',
            positionIndex: 0,
            radiusKm: FEED_RADIUS_KM,
            meta: { categoryId: filteredItems[0].categoryId },
          });
        }
      }
      
      if (!isRefresh) {
        setNextCursor(data.nextCursor ?? null);
        setHasMore(data.hasMore ?? false);
      }
    } catch (error) {
      console.error('[FeedPage] Failed to load feed:', error);
    } finally {
      setIsLoading(false);
      if (cursor) {
        isFetchingRef.current = false;
      }
    }
  }, [coords, items, trackEvent]);

  // Initial load
  useEffect(() => {
    if (coords) {
      loadFeed();
    }
  }, [coords]);

  // Load more when approaching end of filtered items with debounce guard
  // Note: We load more based on raw items having more data (nextCursor/hasMore)
  // but trigger based on approaching end of filtered view
  // Timer persists between renders - only cleared on unmount via separate effect
  useEffect(() => {
    if (hasMore && nextCursor && filteredItems.length > 0 && currentIndex >= filteredItems.length - 3) {
      // Only set timer if not already pending and not currently fetching
      if (!loadMoreDebounceRef.current && !isFetchingRef.current) {
        loadMoreDebounceRef.current = setTimeout(() => {
          loadMoreDebounceRef.current = null;
          if (!isFetchingRef.current) {
            loadFeed(nextCursor);
          }
        }, 150);
      }
    }
    // No cleanup here - timer persists between renders to avoid premature cancellation
  }, [currentIndex, filteredItems.length, hasMore, nextCursor, loadFeed]);

  // Cleanup load-more timer only on unmount
  useEffect(() => {
    return () => {
      if (loadMoreDebounceRef.current) {
        clearTimeout(loadMoreDebounceRef.current);
        loadMoreDebounceRef.current = null;
      }
    };
  }, []);

  // Periodic refresh for new items
  useEffect(() => {
    if (!coords || items.length === 0) return;
    
    const interval = setInterval(() => {
      loadFeed(undefined, true);
    }, AUTO_REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [coords, items.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      flushPendingEvents();
    };
  }, [flushPendingEvents]);

  // Create infinite scroll list (3x items for seamless looping)
  const infiniteItems = filteredItems.length > 0 ? [...filteredItems, ...filteredItems, ...filteredItems] : [];
  const itemsPerSet = filteredItems.length;
  
  // Initialize scroll position to middle set
  useEffect(() => {
    if (scrollContainerRef.current && items.length > 0) {
      const container = scrollContainerRef.current;
      const cardHeight = container.clientHeight;
      // Start at middle set (index = itemsPerSet)
      container.scrollTop = cardHeight * itemsPerSet;
      lastScrollIndex.current = itemsPerSet;
    }
  }, [items.length > 0]);

  // Handle scroll with infinite loop logic
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || filteredItems.length === 0 || itemsPerSet === 0) return;
    
    // Skip impression tracking while scroll snap is pending (prevents duplicates during repopulation)
    if (isScrollSnapPendingRef.current) return;
    
    const container = scrollContainerRef.current;
    const cardHeight = container.clientHeight;
    if (cardHeight === 0) return;
    
    const scrollTop = container.scrollTop;
    const virtualIndex = Math.round(scrollTop / cardHeight);
    
    // Calculate real index (0 to filteredItems.length-1), with safety check
    const realIndex = Math.max(0, Math.min(filteredItems.length - 1, ((virtualIndex % itemsPerSet) + itemsPerSet) % itemsPerSet));
    
    // Jump to middle set if at edges (for seamless infinite scroll)
    if (virtualIndex < itemsPerSet * 0.5) {
      // Near start - jump forward to middle set
      container.scrollTop = cardHeight * (itemsPerSet + realIndex);
      lastScrollIndex.current = itemsPerSet + realIndex;
    } else if (virtualIndex > itemsPerSet * 2.5) {
      // Near end - jump back to middle set
      container.scrollTop = cardHeight * (itemsPerSet + realIndex);
      lastScrollIndex.current = itemsPerSet + realIndex;
    }
    
    if (virtualIndex !== lastScrollIndex.current) {
      const prevVirtualIndex = lastScrollIndex.current;
      const prevRealIndex = ((prevVirtualIndex % itemsPerSet) + itemsPerSet) % itemsPerSet;
      const prevItem = filteredItems[prevRealIndex];
      const newItem = filteredItems[realIndex];
      
      // Track dwell time for previous item
      if (currentStartTime.current && prevItem) {
        const dwellTimeMs = Date.now() - currentStartTime.current;
        trackEvent({
          adId: prevItem._id,
          eventType: 'impression',
          dwellTimeMs,
          positionIndex: prevRealIndex,
          radiusKm: FEED_RADIUS_KM,
        });
      }
      
      // Track scroll direction
      if (prevItem) {
        trackEvent({
          adId: prevItem._id,
          eventType: virtualIndex > prevVirtualIndex ? 'scroll_next' : 'scroll_prev',
          positionIndex: prevRealIndex,
          radiusKm: FEED_RADIUS_KM,
        });
      }
      
      // Track impression for new item
      if (newItem) {
        trackEvent({
          adId: newItem._id,
          eventType: 'impression',
          positionIndex: realIndex,
          radiusKm: FEED_RADIUS_KM,
          meta: { categoryId: newItem.categoryId },
        });
      }
      
      lastScrollIndex.current = virtualIndex;
      currentStartTime.current = Date.now();
      setCurrentIndex(realIndex);
      dismissHint();
    }
  }, [filteredItems, itemsPerSet, trackEvent, dismissHint]);

  const handleLike = useCallback(async (adId: string) => {
    if (!user?.telegramId) return;
    
    const item = filteredItems.find(i => i._id === adId);
    if (!item) return;
    
    const isCurrentlyFavorite = favoriteIds.has(adId);
    const newFavoriteState = !isCurrentlyFavorite;
    
    // Optimistic update
    setFavoriteIds(prev => {
      const newSet = new Set(prev);
      if (newFavoriteState) {
        newSet.add(adId);
      } else {
        newSet.delete(adId);
      }
      return newSet;
    });
    
    // Track event (only track on adding to favorites)
    if (newFavoriteState) {
      const baseIndex = idToBaseIndex.get(adId) ?? filteredItems.indexOf(item);
      trackEvent({
        adId: item._id,
        eventType: 'like',
        positionIndex: baseIndex,
        radiusKm: FEED_RADIUS_KM,
        meta: { categoryId: item.categoryId },
      });
      flushPendingEvents();
    }
    
    // Call API
    try {
      await toggleFavorite(adId);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Rollback on error
      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyFavorite) {
          newSet.add(adId);
        } else {
          newSet.delete(adId);
        }
        return newSet;
      });
    }
  }, [filteredItems, idToBaseIndex, favoriteIds, user?.telegramId, trackEvent, flushPendingEvents]);

  const handleViewOpen = useCallback(() => {
    const item = filteredItems[currentIndex];
    if (item) {
      trackEvent({
        adId: item._id,
        eventType: 'view_open',
        positionIndex: currentIndex,
        radiusKm: FEED_RADIUS_KM,
        meta: { categoryId: item.categoryId },
      });
      flushPendingEvents();
    }
  }, [currentIndex, filteredItems, trackEvent, flushPendingEvents]);

  const handleNotificationsClick = useCallback(() => {
    navigate('/notifications');
  }, [navigate]);

  const needsLocation = !coords && geoStatus !== 'loading' && geoStatus !== 'idle';
  const isRequestingLocation = !coords && (geoStatus === 'loading' || geoStatus === 'idle');

  // Show loading while requesting location
  if (isRequestingLocation) {
    return (
      <ScreenLayout showBottomNav={true}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: '#FFFFFF',
          }}
        >
          <FeedHeader onNotificationsClick={handleNotificationsClick} activeFilter={activeFilter} onFilterChange={handleFilterChange} />

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Loader2
              size={48}
              color="#3A7BFF"
              style={{ animation: 'spin 1s linear infinite' }}
            />
            <p
              style={{
                marginTop: 16,
                fontSize: 16,
                color: '#6B7280',
              }}
            >
              Определяем местоположение...
            </p>
          </div>

          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </ScreenLayout>
    );
  }

  if (needsLocation) {
    return (
      <ScreenLayout showBottomNav={true}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: '#FFFFFF',
          }}
        >
          <FeedHeader onNotificationsClick={handleNotificationsClick} activeFilter={activeFilter} onFilterChange={handleFilterChange} />

          <main
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
                background: '#F0F4FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <MapPin size={36} color="#3A7BFF" />
            </div>
            
            <h2
              style={{
                margin: '0 0 12px',
                fontSize: 22,
                fontWeight: 700,
                color: '#1F2937',
                textAlign: 'center',
              }}
            >
              Определите местоположение
            </h2>
            
            <p
              style={{
                margin: '0 0 24px',
                fontSize: 15,
                color: '#6B7280',
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              Чтобы показать товары рядом с вами
            </p>
            
            <button
              onClick={requestLocation}
              disabled={(geoStatus as string) === 'loading'}
              data-testid="button-request-location"
              style={{
                width: '100%',
                maxWidth: 300,
                padding: '16px 24px',
                background: '#3A7BFF',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                cursor: (geoStatus as string) === 'loading' ? 'not-allowed' : 'pointer',
                opacity: (geoStatus as string) === 'loading' ? 0.6 : 1,
              }}
            >
              {(geoStatus as string) === 'loading' ? 'Получаем геолокацию...' : 'Определить местоположение'}
            </button>
          </main>
        </div>
      </ScreenLayout>
    );
  }

  if (isLoading && items.length === 0) {
    return (
      <ScreenLayout showBottomNav={true}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: '#FFFFFF',
          }}
        >
          <FeedHeader onNotificationsClick={handleNotificationsClick} activeFilter={activeFilter} onFilterChange={handleFilterChange} />

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Loader2
              size={48}
              color="#3A7BFF"
              style={{ animation: 'spin 1s linear infinite' }}
            />
            <p
              style={{
                marginTop: 16,
                fontSize: 16,
                color: '#6B7280',
              }}
            >
              Загружаем ленту...
            </p>
          </div>

          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </ScreenLayout>
    );
  }

  if (items.length === 0) {
    return (
      <ScreenLayout showBottomNav={true}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: '#FFFFFF',
          }}
        >
          <FeedHeader onNotificationsClick={handleNotificationsClick} activeFilter={activeFilter} onFilterChange={handleFilterChange} />

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
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: '#F5F6F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <MapPin size={36} color="#9CA3AF" />
            </div>
            
            <h2
              style={{
                margin: '0 0 12px',
                fontSize: 20,
                fontWeight: 600,
                color: '#1F2937',
                textAlign: 'center',
              }}
            >
              Нет товаров поблизости
            </h2>
            
            <p
              style={{
                margin: 0,
                fontSize: 15,
                color: '#6B7280',
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              В радиусе {FEED_RADIUS_KM} км пока нет объявлений с фото
            </p>
          </div>
        </div>
      </ScreenLayout>
    );
  }

  // Empty filter result - show message when filter applied but no matches
  if (filteredItems.length === 0 && items.length > 0) {
    const filterLabel = FILTER_OPTIONS.find(f => f.id === activeFilter)?.label || 'Выбранный фильтр';
    return (
      <ScreenLayout showBottomNav={true}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: '#000',
          }}
        >
          <FeedHeader onNotificationsClick={handleNotificationsClick} activeFilter={activeFilter} onFilterChange={handleFilterChange} />

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
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              {activeFilter === 'free' && <Gift size={36} color="#EC4899" />}
              {activeFilter === 'farmer' && <Leaf size={36} color="#10B981" />}
              {activeFilter === 'discount' && <TrendingDown size={36} color="#F59E0B" />}
            </div>
            
            <h2
              style={{
                margin: '0 0 12px',
                fontSize: 20,
                fontWeight: 600,
                color: '#fff',
                textAlign: 'center',
              }}
            >
              Нет объявлений "{filterLabel}"
            </h2>
            
            <p
              style={{
                margin: '0 0 24px',
                fontSize: 15,
                color: 'rgba(255,255,255,0.7)',
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              Попробуйте другой фильтр или посмотрите все объявления
            </p>

            <button
              onClick={() => handleFilterChange('all')}
              data-testid="button-show-all"
              style={{
                padding: '12px 24px',
                background: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: 24,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Показать все
            </button>
          </div>
        </div>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout showBottomNav={true} noPadding={true}>
      <div
        ref={containerRef}
        data-testid="feed-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: '#000',
          overflow: 'hidden',
        }}
      >
        {/* Header with filters - TikTok style */}
        <FeedHeader 
          onNotificationsClick={handleNotificationsClick} 
          activeFilter={activeFilter} 
          onFilterChange={handleFilterChange} 
        />

        {/* Main content - TikTok-style infinite scroll with scroll-snap */}
        <main
          ref={scrollContainerRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {infiniteItems.map((item, index) => {
            const realIndex = index % itemsPerSet;
            const nextRealIndex = (realIndex + 1) % itemsPerSet;
            const nextItem = filteredItems[nextRealIndex];
            
            return (
              <div
                key={`${item._id}-${index}`}
                data-index={index}
                style={{
                  height: cardHeight > 0 ? cardHeight : '100%',
                  minHeight: cardHeight > 0 ? cardHeight : '100%',
                  scrollSnapAlign: 'start',
                  scrollSnapStop: 'always',
                  padding: '0 16px 8px',
                  boxSizing: 'border-box',
                  flexShrink: 0,
                }}
              >
                <FeedCard
                  item={item}
                  onLike={handleLike}
                  onViewOpen={handleViewOpen}
                  isActive={realIndex === currentIndex}
                  nextImageUrl={nextItem?.previewUrl || nextItem?.images?.[0] || nextItem?.photos?.[0]}
                  isLiked={favoriteIds.has(item._id)}
                />
              </div>
            );
          })}
        </main>

        {/* Swipe hint overlay */}
        {showSwipeHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissHint}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.75)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              gap: 20,
            }}
          >
            <motion.div
              animate={{ y: [-8, 8, -8] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ChevronUp size={36} color="#fff" />
              <span style={{ fontSize: 15, color: '#fff', fontWeight: 500 }}>
                Свайп вверх
              </span>
            </motion.div>
            
            <div
              style={{
                width: 56,
                height: 90,
                borderRadius: 28,
                border: '2px solid rgba(255,255,255,0.5)',
                position: 'relative',
              }}
            >
              <motion.div
                animate={{ y: [8, 24, 8] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 12,
                  transform: 'translateX(-50%)',
                  width: 8,
                  height: 16,
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.8)',
                }}
              />
            </div>
            
            <motion.div
              animate={{ y: [8, -8, 8] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 15, color: '#fff', fontWeight: 500 }}>
                Свайп вниз
              </span>
              <ChevronDown size={36} color="#fff" />
            </motion.div>
          </motion.div>
        )}

        {/* New items notification */}
        {newBuffer.length > 0 && (
          <motion.button
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            onClick={() => {
              setItems(prev => [...newBuffer, ...prev]);
              setNewBuffer([]);
              setCurrentIndex(0);
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 0;
              }
            }}
            data-testid="button-new-items"
            style={{
              position: 'fixed',
              top: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '10px 20px',
              background: '#3A7BFF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              zIndex: 60,
              boxShadow: '0 4px 12px rgba(58, 123, 255, 0.4)',
            }}
          >
            {newBuffer.length} новых товаров
          </motion.button>
        )}
      </div>
    </ScreenLayout>
  );
}
