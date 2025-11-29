import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { X, Eye, Loader2, Calendar, MapPin, TrendingUp } from 'lucide-react';

declare module 'leaflet' {
  function heatLayer(
    latlngs: [number, number, number][],
    options?: Record<string, unknown>
  ): L.Layer;
}

interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}

interface AreaStat {
  district: string;
  views: number;
  share: number;
}

interface HeatmapData {
  adId: string;
  totalViews: number;
  timeRange: { from: string; to: string };
  points: HeatmapPoint[];
  areas: AreaStat[];
  ad: {
    _id: string;
    title: string;
    location?: { lat: number; lng: number };
  };
}

interface AdHeatmapModalProps {
  adId: string;
  adTitle: string;
  onClose: () => void;
}

const PERIOD_OPTIONS = [
  { value: '7', label: '7 дней' },
  { value: '30', label: '30 дней' },
  { value: '90', label: '3 месяца' },
  { value: '180', label: 'Все время' },
];

function HeatmapLayer({ points }: { points: HeatmapPoint[] }) {
  const map = useMap();
  const heatLayerRef = useRef<L.Layer | null>(null);
  
  useEffect(() => {
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }
    
    const validPoints = (points || []).filter(
      p => typeof p.lat === 'number' && 
           typeof p.lng === 'number' && 
           typeof p.weight === 'number' &&
           !isNaN(p.lat) && !isNaN(p.lng) && !isNaN(p.weight) &&
           Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180
    );
    
    if (validPoints.length > 0) {
      const heatData: [number, number, number][] = validPoints.map(p => [
        p.lat,
        p.lng,
        Math.max(0, p.weight) * 0.5
      ]);
      
      heatLayerRef.current = L.heatLayer(heatData, {
        radius: 35,
        blur: 25,
        maxZoom: 17,
        max: Math.max(...validPoints.map(p => p.weight), 1),
        gradient: {
          0.2: '#4ADE80',
          0.4: '#FACC15',
          0.6: '#FB923C',
          0.8: '#F87171',
          1.0: '#EF4444'
        }
      });
      
      heatLayerRef.current.addTo(map);
      
      const bounds = L.latLngBounds(validPoints.map(p => [p.lat, p.lng]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }
    
    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [points, map]);
  
  return null;
}

export default function AdHeatmapModal({ adId, adTitle, onClose }: AdHeatmapModalProps) {
  const [period, setPeriod] = useState('7');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HeatmapData | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useEffect(() => {
    const onboardingShown = localStorage.getItem('heatmapOnboardingShown');
    if (!onboardingShown) {
      setShowOnboarding(true);
    }
  }, []);
  
  const dismissOnboarding = () => {
    localStorage.setItem('heatmapOnboardingShown', 'true');
    setShowOnboarding(false);
  };
  
  useEffect(() => {
    const fetchHeatmap = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/seller-analytics/ads/${adId}/heatmap?period=${period}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Не удалось загрузить данные');
        }
        
        const rawData = result.data;
        if (!rawData || typeof rawData !== 'object') {
          throw new Error('Некорректный формат данных');
        }
        
        const safeData: HeatmapData = {
          adId: rawData.adId || adId,
          totalViews: typeof rawData.totalViews === 'number' ? rawData.totalViews : 0,
          timeRange: rawData.timeRange || { from: '', to: '' },
          points: Array.isArray(rawData.points) ? rawData.points : [],
          areas: Array.isArray(rawData.areas) ? rawData.areas : [],
          ad: rawData.ad || { _id: adId, title: adTitle },
        };
        
        setData(safeData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHeatmap();
  }, [adId, period, adTitle]);
  
  const defaultCenter: [number, number] = data?.ad?.location
    ? [data.ad.location.lat, data.ad.location.lng]
    : [53.9, 27.56];
  
  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: 500,
          maxHeight: '90vh',
          background: '#FFFFFF',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {showOnboarding && (
          <div style={{
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            padding: 16,
            color: '#FFFFFF',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Eye style={{ width: 24, height: 24, flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Карта интереса</p>
                <p style={{ fontSize: 14, opacity: 0.9 }}>
                  Теперь вы можете увидеть, из каких районов города люди чаще смотрят ваше объявление
                </p>
              </div>
              <button
                onClick={dismissOnboarding}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X style={{ width: 16, height: 16, color: '#FFFFFF' }} />
              </button>
            </div>
          </div>
        )}
        
        <div style={{
          padding: 16,
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', margin: 0 }}>
              Карта интереса
            </h2>
            <p style={{ 
              fontSize: 13, 
              color: '#6B7280', 
              margin: '4px 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 280,
            }}>
              {adTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            data-testid="button-close-heatmap"
          >
            <X style={{ width: 20, height: 20, color: '#6B7280' }} />
          </button>
        </div>
        
        <div style={{
          padding: '8px 16px',
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          borderBottom: '1px solid #E5E7EB',
        }}>
          <Calendar style={{ width: 18, height: 18, color: '#6B7280', flexShrink: 0 }} />
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              style={{
                flexShrink: 0,
                padding: '6px 12px',
                borderRadius: 16,
                border: period === opt.value ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                background: period === opt.value ? '#EFF6FF' : '#FFFFFF',
                color: period === opt.value ? '#3B82F6' : '#6B7280',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
              data-testid={`button-period-${opt.value}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        
        <div style={{ height: 280, position: 'relative' }}>
          {loading ? (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F3F4F6',
            }}>
              <Loader2 style={{ width: 32, height: 32, color: '#3B82F6', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : error ? (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F3F4F6',
              padding: 24,
              textAlign: 'center',
            }}>
              <p style={{ color: '#EF4444' }}>{error}</p>
            </div>
          ) : data && Array.isArray(data.points) && data.points.length > 0 ? (
            <MapContainer
              center={defaultCenter}
              zoom={12}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; OSM'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <HeatmapLayer points={data.points} />
            </MapContainer>
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F9FAFB',
              padding: 24,
              textAlign: 'center',
            }}>
              <MapPin style={{ width: 48, height: 48, color: '#D1D5DB', marginBottom: 12 }} />
              <p style={{ color: '#6B7280', fontWeight: 500 }}>Недостаточно данных</p>
              <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
                Вернитесь позже, когда объявление соберёт больше просмотров
              </p>
            </div>
          )}
        </div>
        
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          padding: 16,
          background: '#F9FAFB',
        }}>
          {data && data.totalViews > 0 && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}>
                <TrendingUp style={{ width: 18, height: 18, color: '#3B82F6' }} />
                <span style={{ fontWeight: 600, color: '#1F2937' }}>
                  Всего просмотров: {data.totalViews}
                </span>
              </div>
              
              {Array.isArray(data.areas) && data.areas.length > 0 && (
                <>
                  <h3 style={{ 
                    fontSize: 14, 
                    fontWeight: 600, 
                    color: '#4B5563',
                    marginBottom: 8,
                  }}>
                    Топ районов
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.areas.slice(0, 5).map((area, index) => (
                      <div 
                        key={area.district}
                        style={{
                          background: '#FFFFFF',
                          borderRadius: 12,
                          padding: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: index === 0 ? '#FEF3C7' : index === 1 ? '#E5E7EB' : index === 2 ? '#FFEDD5' : '#F3F4F6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: 13,
                          color: index === 0 ? '#D97706' : index === 1 ? '#6B7280' : index === 2 ? '#EA580C' : '#9CA3AF',
                        }}>
                          {index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 500, color: '#1F2937', marginBottom: 4 }}>
                            {area.district}
                          </p>
                          <div style={{
                            height: 6,
                            borderRadius: 3,
                            background: '#E5E7EB',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${area.share * 100}%`,
                              background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                              borderRadius: 3,
                            }} />
                          </div>
                        </div>
                        <span style={{ 
                          fontWeight: 600, 
                          color: '#3B82F6',
                          fontSize: 14,
                        }}>
                          {Math.round(area.share * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
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
