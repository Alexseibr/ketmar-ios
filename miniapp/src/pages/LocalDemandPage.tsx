import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, Search, MapPin, Flame, TrendingUp, 
  Plus, Loader2, RefreshCw, ChevronRight 
} from 'lucide-react';
import { usePlatform } from '@/platform/PlatformProvider';

interface DemandItem {
  id: string;
  query: string;
  displayQuery: string;
  category?: string;
  count: number;
  isHot?: boolean;
  distance?: number;
}

interface LocalDemandResponse {
  items: DemandItem[];
  radius: number;
  totalSearches: number;
}

const RADIUS_OPTIONS = [
  { value: 0.3, label: '300м' },
  { value: 1, label: '1 км' },
  { value: 3, label: '3 км' },
  { value: 5, label: '5 км' },
  { value: 10, label: '10 км' },
  { value: 20, label: '20 км' },
];

export default function LocalDemandPage() {
  const navigate = useNavigate();
  const { getLocation } = usePlatform();
  const [selectedRadius, setSelectedRadius] = useState(3);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const loc = await getLocation();
        if (loc) {
          setLocation({ lat: loc.lat, lng: loc.lng });
        }
      } catch (error) {
        console.error('[LocalDemandPage] Error getting location:', error);
        setLocation({ lat: 53.9, lng: 27.5667 });
      }
    };
    fetchLocation();
  }, [getLocation]);

  const { data, isLoading, refetch, isRefetching } = useQuery<LocalDemandResponse>({
    queryKey: ['/api/local-demand', location?.lat, location?.lng, selectedRadius],
    enabled: !!location,
  });

  const handleChipClick = (item: DemandItem) => {
    const params = new URLSearchParams({
      demandQuery: item.query,
      demandSource: 'local_demand_page',
    });
    if (item.category) {
      params.set('demandCategory', item.category);
    }
    navigate(`/create?${params.toString()}`);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#F9FAFB',
      paddingBottom: 100,
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        padding: '16px 16px 24px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decorations */}
        <div style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -60,
          left: -30,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />

        {/* Navigation */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12,
          marginBottom: 16,
          position: 'relative',
          zIndex: 1,
        }}>
          <button
            onClick={handleBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            data-testid="button-back"
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              В вашем районе ищут
            </div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              Разместите то, что востребовано
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            data-testid="button-refresh"
          >
            <RefreshCw 
              size={18} 
              style={{ 
                animation: isRefetching ? 'spin 1s linear infinite' : 'none' 
              }} 
            />
          </button>
        </div>

        {/* Radius selector */}
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          position: 'relative',
          zIndex: 1,
        }}>
          {RADIUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedRadius(option.value)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: 'none',
                background: selectedRadius === option.value 
                  ? '#fff' 
                  : 'rgba(255,255,255,0.15)',
                color: selectedRadius === option.value 
                  ? '#4f46e5' 
                  : '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              data-testid={`button-radius-${option.value}`}
            >
              <MapPin size={14} />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {isLoading ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            padding: 48,
            gap: 12,
          }}>
            <Loader2 size={32} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ color: '#6B7280', fontSize: 14 }}>
              Загружаем запросы...
            </div>
          </div>
        ) : data?.items?.length ? (
          <>
            {/* Stats */}
            <div style={{
              display: 'flex',
              gap: 12,
              marginBottom: 20,
            }}>
              <div style={{
                flex: 1,
                background: '#fff',
                borderRadius: 12,
                padding: 12,
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#6366f1' }}>
                  {data.items.length}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>
                  запросов
                </div>
              </div>
              <div style={{
                flex: 1,
                background: '#fff',
                borderRadius: 12,
                padding: 12,
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#EC4899' }}>
                  {data.items.filter(i => i.isHot).length}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>
                  горячих
                </div>
              </div>
              <div style={{
                flex: 1,
                background: '#fff',
                borderRadius: 12,
                padding: 12,
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#059669' }}>
                  {selectedRadius >= 1 ? `${selectedRadius} км` : `${selectedRadius * 1000}м`}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>
                  радиус
                </div>
              </div>
            </div>

            {/* Hot section */}
            {data.items.some(i => i.isHot) && (
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}>
                  <Flame size={18} color="#EC4899" />
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>
                    Горячие запросы
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}>
                  {data.items.filter(i => i.isHot).map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleChipClick(item)}
                      style={{
                        padding: '12px 18px',
                        borderRadius: 12,
                        border: 'none',
                        background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)',
                      }}
                      data-testid={`chip-hot-${index}`}
                    >
                      <Flame size={14} />
                      {item.displayQuery}
                      <ChevronRight size={14} style={{ opacity: 0.7 }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All queries */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}>
                <Search size={18} color="#6366f1" />
                <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>
                  Все запросы
                </span>
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                {data.items.filter(i => !i.isHot).map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => handleChipClick(item)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 10,
                      border: '1px solid #E5E7EB',
                      background: '#fff',
                      color: '#374151',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                    data-testid={`chip-query-${index}`}
                  >
                    {item.displayQuery}
                    {item.count > 5 && (
                      <span style={{
                        background: '#EEF2FF',
                        color: '#6366f1',
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 6,
                      }}>
                        {item.count}
                      </span>
                    )}
                    <ChevronRight size={14} style={{ opacity: 0.5 }} />
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{
              marginTop: 24,
              padding: 20,
              background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
              borderRadius: 16,
              border: '1px solid #BBF7D0',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#166534', marginBottom: 8 }}>
                Есть что продать?
              </div>
              <div style={{ fontSize: 13, color: '#22C55E', marginBottom: 16 }}>
                Нажмите на любой запрос, чтобы разместить объявление
              </div>
              <button
                onClick={() => navigate('/create')}
                style={{
                  padding: '14px 28px',
                  borderRadius: 12,
                  border: 'none',
                  background: '#059669',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                }}
                data-testid="button-create-ad"
              >
                <Plus size={18} />
                Разместить объявление
              </button>
            </div>
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: 48,
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: '#EEF2FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Search size={32} color="#6366f1" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
              Пока нет запросов
            </div>
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
              В выбранном радиусе пока не было поисковых запросов. 
              Попробуйте увеличить радиус поиска.
            </div>
            <button
              onClick={() => setSelectedRadius(Math.min(selectedRadius * 2, 20))}
              style={{
                padding: '12px 24px',
                borderRadius: 10,
                border: '1px solid #6366f1',
                background: '#fff',
                color: '#6366f1',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              data-testid="button-expand-radius"
            >
              Увеличить радиус
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
