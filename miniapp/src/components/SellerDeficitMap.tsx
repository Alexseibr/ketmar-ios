import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Loader2, Calendar, MapPin, TrendingDown, TrendingUp,
  ChevronDown, Target, AlertTriangle, PlusCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DeficitPoint {
  lat: number;
  lng: number;
  deficit: number;
  demandScore: number;
  supplyScore: number;
}

interface DistrictDeficit {
  district: string;
  deficit: number;
  demandScore: number;
  supplyScore: number;
}

interface DeficitMapData {
  points: DeficitPoint[];
  topDeficitDistricts: DistrictDeficit[];
  period: number;
  categorySlug: string | null;
  timeRange: { from: string; to: string };
}

interface SellerDeficitMapProps {
  onAddAd?: (categorySlug?: string) => void;
}

const PERIOD_OPTIONS = [
  { value: '7', label: '7 дней' },
  { value: '30', label: '30 дней' },
  { value: '90', label: '3 мес.' },
];

function DeficitMarkers({ points }: { points: DeficitPoint[] }) {
  const validPoints = (points || []).filter(
    p => typeof p.lat === 'number' && 
         typeof p.lng === 'number' && 
         !isNaN(p.lat) && !isNaN(p.lng) &&
         Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180
  );
  
  const maxDeficit = Math.max(...validPoints.map(p => Math.abs(p.deficit)), 1);
  
  return (
    <>
      {validPoints.slice(0, 100).map((point, index) => {
        const isDeficit = point.deficit > 0;
        const intensity = Math.abs(point.deficit) / maxDeficit;
        const radius = 8 + intensity * 15;
        
        const color = isDeficit 
          ? `rgba(239, 68, 68, ${0.4 + intensity * 0.4})`
          : `rgba(34, 197, 94, ${0.4 + intensity * 0.4})`;
        
        const fillColor = isDeficit
          ? `rgba(254, 202, 202, ${0.6 + intensity * 0.3})`
          : `rgba(187, 247, 208, ${0.6 + intensity * 0.3})`;
        
        return (
          <CircleMarker
            key={`${point.lat}-${point.lng}-${index}`}
            center={[point.lat, point.lng]}
            radius={radius}
            pathOptions={{
              color,
              fillColor,
              fillOpacity: 0.7,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ minWidth: 140 }}>
                <p style={{ fontWeight: 600, margin: '0 0 4px' }}>
                  {isDeficit ? 'Высокий спрос' : 'Насыщенный рынок'}
                </p>
                <p style={{ fontSize: 13, margin: 0, color: '#6B7280' }}>
                  Спрос: {point.demandScore}
                </p>
                <p style={{ fontSize: 13, margin: 0, color: '#6B7280' }}>
                  Предложение: {point.supplyScore}
                </p>
                <p style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  margin: '4px 0 0',
                  color: isDeficit ? '#DC2626' : '#16A34A',
                }}>
                  {isDeficit ? '+' : ''}{point.deficit} дефицит
                </p>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

function MapBoundsHandler({ points }: { points: DeficitPoint[] }) {
  const map = useMap();
  
  useEffect(() => {
    const validPoints = (points || []).filter(
      p => typeof p.lat === 'number' && typeof p.lng === 'number'
    );
    
    if (validPoints.length > 0) {
      const bounds = L.latLngBounds(validPoints.map(p => [p.lat, p.lng]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      }
    }
  }, [points, map]);
  
  return null;
}

export default function SellerDeficitMap({ onAddAd }: SellerDeficitMapProps) {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DeficitMapData | null>(null);
  const [showDistricts, setShowDistricts] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/seller-analytics/deficit-map?period=${period}`, {
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
        
        setData({
          points: Array.isArray(rawData.points) ? rawData.points : [],
          topDeficitDistricts: Array.isArray(rawData.topDeficitDistricts) ? rawData.topDeficitDistricts : [],
          period: rawData.period || parseInt(period),
          categorySlug: rawData.categorySlug || null,
          timeRange: rawData.timeRange || { from: '', to: '' },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [period]);
  
  const defaultCenter: [number, number] = [53.9, 27.56];
  
  const handleAddAd = () => {
    if (onAddAd) {
      onAddAd(data?.categorySlug || undefined);
    } else {
      navigate('/create');
    }
  };
  
  const deficitDistricts = data?.topDeficitDistricts?.filter(d => d.deficit > 0) || [];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: 16,
        borderBottom: '1px solid #E5E7EB',
        background: '#FFFFFF',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #EF4444, #F97316)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Target style={{ width: 20, height: 20, color: '#FFFFFF' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', margin: 0 }}>
              Где вас ждут
            </h2>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
              Районы с высоким спросом
            </p>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
        }}>
          <Calendar style={{ width: 16, height: 16, color: '#6B7280', flexShrink: 0, marginTop: 6 }} />
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              style={{
                flexShrink: 0,
                padding: '6px 12px',
                borderRadius: 16,
                border: period === opt.value ? '2px solid #EF4444' : '1px solid #E5E7EB',
                background: period === opt.value ? '#FEF2F2' : '#FFFFFF',
                color: period === opt.value ? '#DC2626' : '#6B7280',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
              data-testid={`button-deficit-period-${opt.value}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{
        padding: '10px 16px',
        background: '#FEF3C7',
        borderBottom: '1px solid #FDE68A',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <AlertTriangle style={{ width: 16, height: 16, color: '#D97706', flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: '#92400E' }}>
          Красные зоны - высокий спрос, мало предложений
        </span>
      </div>
      
      <div style={{ flex: 1, position: 'relative', minHeight: 280 }}>
        {loading ? (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F3F4F6',
          }}>
            <Loader2 style={{ width: 32, height: 32, color: '#EF4444', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F3F4F6',
            padding: 24,
            textAlign: 'center',
          }}>
            <AlertTriangle style={{ width: 48, height: 48, color: '#EF4444', marginBottom: 12 }} />
            <p style={{ color: '#EF4444' }}>{error}</p>
          </div>
        ) : data && Array.isArray(data.points) && data.points.length > 0 ? (
          <MapContainer
            center={defaultCenter}
            zoom={10}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; OSM'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DeficitMarkers points={data.points} />
            <MapBoundsHandler points={data.points} />
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
              Анализ станет доступен после накопления статистики
            </p>
          </div>
        )}
      </div>
      
      {deficitDistricts.length > 0 && (
        <div style={{
          background: '#FFFFFF',
          borderTop: '1px solid #E5E7EB',
        }}>
          <button
            onClick={() => setShowDistricts(!showDistricts)}
            style={{
              width: '100%',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            data-testid="button-toggle-deficit-districts"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp style={{ width: 18, height: 18, color: '#DC2626' }} />
              <span style={{ fontWeight: 600, color: '#1F2937' }}>
                Топ районов с дефицитом
              </span>
            </div>
            <ChevronDown 
              style={{ 
                width: 20, 
                height: 20, 
                color: '#6B7280',
                transform: showDistricts ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }} 
            />
          </button>
          
          {showDistricts && (
            <div style={{ 
              padding: '0 16px 16px',
              display: 'flex', 
              flexDirection: 'column', 
              gap: 8,
              maxHeight: 180,
              overflowY: 'auto',
            }}>
              {deficitDistricts.slice(0, 5).map((area, index) => (
                <div 
                  key={area.district}
                  style={{
                    background: '#FEF2F2',
                    borderRadius: 10,
                    padding: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#FECACA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: 12,
                    color: '#DC2626',
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, color: '#1F2937', fontSize: 14, margin: 0 }}>
                      {area.district}
                    </p>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>
                      Спрос: {area.demandScore} / Предл: {area.supplyScore}
                    </p>
                  </div>
                  <span style={{ 
                    fontWeight: 700, 
                    color: '#DC2626',
                    fontSize: 14,
                  }}>
                    +{area.deficit}
                  </span>
                </div>
              ))}
              
              <button
                onClick={handleAddAd}
                style={{
                  marginTop: 8,
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #EF4444, #F97316)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                data-testid="button-add-ad-from-deficit"
              >
                <PlusCircle style={{ width: 18, height: 18 }} />
                Добавить товар в эти районы
              </button>
            </div>
          )}
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
