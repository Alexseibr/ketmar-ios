import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, MapPin, Search, TrendingUp, 
  Loader2, Plus, ChevronRight, Sparkles
} from 'lucide-react';
import { usePlatform } from '@/platform/PlatformProvider';

interface DemandItem {
  query: string;
  count: number;
  trend?: 'up' | 'down' | 'stable';
}

interface LocalDemandResponse {
  items: DemandItem[];
  radius: number;
  total: number;
}

const RADIUS_OPTIONS = [
  { value: 1, label: '1 км' },
  { value: 3, label: '3 км' },
  { value: 5, label: '5 км' },
  { value: 10, label: '10 км' },
  { value: 20, label: '20 км' },
];

export default function JobSeekersPage() {
  const navigate = useNavigate();
  const { getLocation } = usePlatform();
  const [radius, setRadius] = useState(5);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const loc = await getLocation();
        if (loc) {
          setLocation({ lat: loc.lat, lng: loc.lng });
        }
      } catch (error) {
        console.error('[JobSeekersPage] Error getting location:', error);
        setLocation({ lat: 53.9, lng: 27.5667 });
      }
    };
    fetchLocation();
  }, [getLocation]);

  const { data, isLoading } = useQuery<LocalDemandResponse>({
    queryKey: ['/api/local-demand', location?.lat, location?.lng, radius],
    enabled: !!location,
  });

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleDemandClick = (query: string) => {
    navigate(`/create?title=${encodeURIComponent(query)}`);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#F9FAFB',
      paddingBottom: 100,
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        padding: '16px 16px 24px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
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
            data-testid="button-back"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={20} color="#fff" />
          </button>
          <div>
            <h1 style={{ 
              fontSize: 22, 
              fontWeight: 700, 
              margin: 0,
              letterSpacing: '-0.5px',
            }}>
              Ищут в районе
            </h1>
            <p style={{ 
              fontSize: 13, 
              opacity: 0.9, 
              margin: '4px 0 0',
            }}>
              Что хотят купить люди рядом
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.15)',
          padding: '10px 14px',
          borderRadius: 12,
          position: 'relative',
          zIndex: 1,
        }}>
          <Search size={18} />
          <span style={{ fontSize: 14 }}>
            {data?.total || 0} запросов в радиусе {radius} км
          </span>
        </div>
      </div>

      {/* Radius selector */}
      <div style={{
        padding: '12px 16px',
        overflowX: 'auto',
        display: 'flex',
        gap: 8,
        WebkitOverflowScrolling: 'touch',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}>
        {RADIUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setRadius(opt.value)}
            data-testid={`radius-${opt.value}`}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              border: 'none',
              background: radius === opt.value ? '#0ea5e9' : '#fff',
              color: radius === opt.value ? '#fff' : '#374151',
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Info banner */}
      <div style={{
        margin: '0 16px 16px',
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        borderRadius: 12,
        border: '1px solid #bae6fd',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Sparkles size={20} color="#0ea5e9" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ 
              margin: 0, 
              fontSize: 13, 
              color: '#0369a1',
              fontWeight: 500,
            }}>
              Нажмите на запрос, чтобы создать объявление
            </p>
            <p style={{ 
              margin: '4px 0 0', 
              fontSize: 12, 
              color: '#0284c7',
            }}>
              Продайте то, что ищут люди в вашем районе
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 16px' }}>
        {isLoading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
            color: '#9CA3AF',
          }}>
            <Loader2 size={32} className="animate-spin" style={{ marginBottom: 12 }} />
            <span style={{ fontSize: 14 }}>Анализируем запросы...</span>
          </div>
        ) : !data?.items.length ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
            color: '#9CA3AF',
          }}>
            <Search size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p style={{ fontSize: 16, fontWeight: 500, margin: 0, color: '#374151' }}>
              Пока нет запросов
            </p>
            <p style={{ fontSize: 13, margin: '8px 0 0', textAlign: 'center' }}>
              В вашем районе пока не ищут товары
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.items.map((item, index) => (
              <button
                key={index}
                onClick={() => handleDemandClick(item.query)}
                data-testid={`demand-item-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#fff',
                  borderRadius: 14,
                  padding: '14px 16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Search size={20} color="#fff" />
                </div>

                {/* Query text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: 15, 
                    fontWeight: 600,
                    color: '#111827',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.query}
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    marginTop: 4,
                  }}>
                    <span style={{
                      fontSize: 12,
                      color: '#6B7280',
                    }}>
                      {item.count} {item.count === 1 ? 'запрос' : item.count < 5 ? 'запроса' : 'запросов'}
                    </span>
                    {item.trend === 'up' && (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        fontSize: 11,
                        color: '#10B981',
                        fontWeight: 500,
                      }}>
                        <TrendingUp size={12} />
                        растёт
                      </span>
                    )}
                  </div>
                </div>

                {/* Action */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: '#f0f9ff',
                  color: '#0284c7',
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  <Plus size={14} />
                  Продать
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {data?.items.length ? (
        <div style={{
          position: 'fixed',
          bottom: 100,
          left: 16,
          right: 16,
          zIndex: 10,
        }}>
          <button
            onClick={() => navigate('/create')}
            data-testid="button-create-ad"
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 14,
              border: 'none',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(14, 165, 233, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Plus size={20} />
            Создать своё объявление
          </button>
        </div>
      ) : null}
    </div>
  );
}
