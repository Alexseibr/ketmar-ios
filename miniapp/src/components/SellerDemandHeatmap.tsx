import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { 
  Loader2, Calendar, MapPin, TrendingUp, Eye, 
  ChevronDown, Map as MapIcon, BarChart3, AlertTriangle
} from 'lucide-react';

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

interface DistrictStat {
  district: string;
  views: number;
  share: number;
}

interface DemandHeatmapData {
  totalViews: number;
  points: HeatmapPoint[];
  districts: DistrictStat[];
  period: number;
  adsCount: number;
  timeRange: { from: string; to: string };
}

interface SellerDemandHeatmapProps {
  onClose?: () => void;
}

const PERIOD_OPTIONS = [
  { value: '7', label: '7 дней' },
  { value: '30', label: '30 дней' },
  { value: '90', label: '3 мес.' },
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
        radius: 30,
        blur: 20,
        maxZoom: 17,
        max: Math.max(...validPoints.map(p => p.weight), 1),
        gradient: {
          0.2: '#22C55E',
          0.4: '#84CC16',
          0.6: '#FACC15',
          0.8: '#FB923C',
          1.0: '#EF4444'
        }
      });
      
      heatLayerRef.current.addTo(map);
      
      const bounds = L.latLngBounds(validPoints.map(p => [p.lat, p.lng]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
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

export default function SellerDemandHeatmap({ onClose }: SellerDemandHeatmapProps) {
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DemandHeatmapData | null>(null);
  const [showDistricts, setShowDistricts] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/seller-analytics/demand-heatmap?period=${period}`, {
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
          totalViews: rawData.totalViews || 0,
          points: Array.isArray(rawData.points) ? rawData.points : [],
          districts: Array.isArray(rawData.districts) ? rawData.districts : [],
          period: rawData.period || parseInt(period),
          adsCount: rawData.adsCount || 0,
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
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MapIcon style={{ width: 20, height: 20, color: '#FFFFFF' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', margin: 0 }}>
              Карта спроса
            </h2>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
              Где смотрят ваши товары
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
                border: period === opt.value ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                background: period === opt.value ? '#EFF6FF' : '#FFFFFF',
                color: period === opt.value ? '#3B82F6' : '#6B7280',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
              data-testid={`button-demand-period-${opt.value}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      
      {data && !loading && (
        <div style={{
          padding: '12px 16px',
          background: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye style={{ width: 16, height: 16, color: '#3B82F6' }} />
            <span style={{ fontWeight: 600, color: '#1F2937' }}>{data.totalViews}</span>
            <span style={{ fontSize: 12, color: '#6B7280' }}>просмотров</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart3 style={{ width: 16, height: 16, color: '#8B5CF6' }} />
            <span style={{ fontWeight: 600, color: '#1F2937' }}>{data.adsCount}</span>
            <span style={{ fontSize: 12, color: '#6B7280' }}>объявл.</span>
          </div>
        </div>
      )}
      
      <div style={{ flex: 1, position: 'relative', minHeight: 300 }}>
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
            zoom={11}
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
            <p style={{ color: '#6B7280', fontWeight: 500 }}>Нет данных о просмотрах</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
              Данные появятся после того, как покупатели начнут смотреть ваши товары
            </p>
          </div>
        )}
      </div>
      
      {data && Array.isArray(data.districts) && data.districts.length > 0 && (
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
            data-testid="button-toggle-districts"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp style={{ width: 18, height: 18, color: '#3B82F6' }} />
              <span style={{ fontWeight: 600, color: '#1F2937' }}>
                Топ районов ({data.districts.length})
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
              maxHeight: 200,
              overflowY: 'auto',
            }}>
              {data.districts.slice(0, 8).map((area, index) => (
                <div 
                  key={area.district}
                  style={{
                    background: '#F9FAFB',
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
                    background: index === 0 ? '#FEF3C7' : index === 1 ? '#E5E7EB' : index === 2 ? '#FFEDD5' : '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: 12,
                    color: index === 0 ? '#D97706' : index === 1 ? '#6B7280' : index === 2 ? '#EA580C' : '#9CA3AF',
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, color: '#1F2937', fontSize: 14, margin: 0 }}>
                      {area.district}
                    </p>
                    <div style={{
                      height: 4,
                      borderRadius: 2,
                      background: '#E5E7EB',
                      overflow: 'hidden',
                      marginTop: 4,
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(area.share * 100, 100)}%`,
                        background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                        borderRadius: 2,
                      }} />
                    </div>
                  </div>
                  <span style={{ 
                    fontWeight: 600, 
                    color: '#3B82F6',
                    fontSize: 13,
                  }}>
                    {Math.round(area.share * 100)}%
                  </span>
                </div>
              ))}
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
