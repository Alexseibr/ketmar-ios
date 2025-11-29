import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import useGeoStore from '../../store/useGeoStore';
import { Locate, List, ShoppingBag } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const RADIUS_OPTIONS = [0.3, 1, 3, 5, 10, 20];

const userIcon = L.divIcon({
  className: 'user-marker',
  html: `
    <div style="position: relative;">
      <div style="position: absolute; width: 32px; height: 32px; background: rgba(59, 130, 246, 0.3); border-radius: 50%; animation: ping 1s infinite;"></div>
      <div style="position: relative; width: 16px; height: 16px; background: #2563EB; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
    </div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

interface HeatZone {
  geoHash: string;
  lat: number;
  lng: number;
  count: number;
  radius: number;
}

interface ClusterData {
  geoHash: string;
  lat: number;
  lng: number;
  count: number;
  avgPrice?: number;
  isCluster: boolean;
  adId?: string;
  sampleAd?: {
    id?: string;
    title: string;
    price: number;
  };
}

interface GeoMapProps {
  onMarkerClick?: (cluster: ClusterData) => void;
  onMapMove?: (center: { lat: number; lng: number }, zoom: number) => void;
  onClustersUpdate?: (count: number) => void;
  showHeatmap?: boolean;
  heatmapType?: 'demand' | 'supply';
  categoryId?: string;
}

function MapController({ 
  center, 
  zoom, 
  onMove 
}: { 
  center: [number, number]; 
  zoom: number;
  onMove?: (center: { lat: number; lng: number }, zoom: number) => void;
}) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  useMapEvents({
    moveend: () => {
      const c = map.getCenter();
      onMove?.({ lat: c.lat, lng: c.lng }, map.getZoom());
    }
  });
  
  return null;
}

function HeatmapZones({ 
  zones, 
  onZoneClick 
}: { 
  zones: HeatZone[]; 
  onZoneClick: (zone: HeatZone) => void;
}) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);
  
  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    
    const layer = L.layerGroup();
    
    zones.forEach(zone => {
      const intensity = Math.min(zone.count / 10, 1);
      
      const r = Math.round(34 + intensity * 221);
      const g = Math.round(197 - intensity * 100);
      const b = Math.round(94 - intensity * 60);
      const color = `rgb(${r}, ${g}, ${b})`;
      
      const baseRadius = 200 + (zone.radius || 300);
      const circleRadius = baseRadius + Math.min(zone.count * 20, 300);
      
      const circle = L.circle([zone.lat, zone.lng], {
        radius: circleRadius,
        color: color,
        fillColor: color,
        fillOpacity: 0.35 + intensity * 0.25,
        weight: 2,
        opacity: 0.6
      });
      
      circle.on('click', () => onZoneClick(zone));
      circle.addTo(layer);
      
      if (zone.count > 0) {
        const countLabel = L.divIcon({
          className: 'zone-count-label',
          html: `
            <div style="
              background: white;
              border-radius: 12px;
              padding: 4px 10px;
              font-size: 12px;
              font-weight: 600;
              color: #1F2937;
              box-shadow: 0 2px 6px rgba(0,0,0,0.15);
              display: flex;
              align-items: center;
              gap: 4px;
              white-space: nowrap;
            ">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              ${zone.count}
            </div>
          `,
          iconSize: [50, 24],
          iconAnchor: [25, 12]
        });
        
        const marker = L.marker([zone.lat, zone.lng], { 
          icon: countLabel,
          interactive: true
        });
        marker.on('click', () => onZoneClick(zone));
        marker.addTo(layer);
      }
    });
    
    layer.addTo(map);
    layerRef.current = layer;
    
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [zones, map, onZoneClick]);
  
  return null;
}

export function GeoMap({ 
  onMarkerClick, 
  onMapMove, 
  onClustersUpdate,
  categoryId 
}: GeoMapProps) {
  const { coords, radiusKm, setRadius, requestLocation } = useGeoStore();
  const lat = coords?.lat;
  const lng = coords?.lng;
  
  const [heatZones, setHeatZones] = useState<HeatZone[]>([]);
  const [totalAdsCount, setTotalAdsCount] = useState(0);
  const [zoom, setZoom] = useState(13);
  const [isLocating, setIsLocating] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  
  const defaultCenter: [number, number] = [lat || 53.9, lng || 27.5667];
  
  const fetchHeatZones = useCallback(async (centerLat: number, centerLng: number, currentZoom: number) => {
    try {
      const response = await fetch(
        `/api/geo-intelligence/clusters?lat=${centerLat}&lng=${centerLng}&radiusKm=${radiusKm}&zoom=${currentZoom}${categoryId ? `&categoryId=${categoryId}` : ''}`
      );
      const data = await response.json();
      if (data.success && data.data.clusters) {
        const zones: HeatZone[] = data.data.clusters.map((cluster: ClusterData) => {
          const offsetLat = (Math.random() - 0.5) * 0.003;
          const offsetLng = (Math.random() - 0.5) * 0.003;
          
          return {
            geoHash: cluster.geoHash,
            lat: cluster.lat + offsetLat,
            lng: cluster.lng + offsetLng,
            count: cluster.count,
            radius: 200 + Math.random() * 100
          };
        });
        
        setHeatZones(zones);
        const totalCount = zones.reduce((sum, z) => sum + z.count, 0);
        setTotalAdsCount(totalCount);
        onClustersUpdate?.(totalCount);
      }
    } catch (error) {
      console.error('Failed to fetch heat zones:', error);
    }
  }, [radiusKm, categoryId, onClustersUpdate]);
  
  useEffect(() => {
    if (lat && lng) {
      fetchHeatZones(lat, lng, zoom);
    }
  }, [lat, lng, zoom, fetchHeatZones]);
  
  const handleMapMove = useCallback((center: { lat: number; lng: number }, newZoom: number) => {
    setZoom(newZoom);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchHeatZones(center.lat, center.lng, newZoom);
      onMapMove?.(center, newZoom);
    }, 300);
  }, [fetchHeatZones, onMapMove]);
  
  const handleLocate = async () => {
    setIsLocating(true);
    try {
      await requestLocation();
    } finally {
      setIsLocating(false);
    }
  };
  
  const handleZoneClick = useCallback((zone: HeatZone) => {
    if (onMarkerClick) {
      onMarkerClick({
        geoHash: zone.geoHash,
        lat: zone.lat,
        lng: zone.lng,
        count: zone.count,
        isCluster: true
      });
    }
  }, [onMarkerClick]);
  
  return (
    <div className="relative w-full h-full" style={{ minHeight: '400px' }}>
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .leaflet-container {
          width: 100%;
          height: 100%;
          min-height: 400px;
          z-index: 0;
        }
        .zone-count-label {
          background: transparent;
          border: none;
        }
      `}</style>
      
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        className="w-full h-full"
        style={{ zIndex: 0, width: '100%', height: '100%', minHeight: '400px' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController 
          center={defaultCenter} 
          zoom={zoom} 
          onMove={handleMapMove}
        />
        
        {lat && lng && (
          <>
            <Marker position={[lat, lng]} icon={userIcon} />
            <Circle
              center={[lat, lng]}
              radius={radiusKm * 1000}
              pathOptions={{
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 0.08,
                weight: 2,
                dashArray: '8, 12'
              }}
            />
          </>
        )}
        
        <HeatmapZones zones={heatZones} onZoneClick={handleZoneClick} />
      </MapContainer>
      
      {/* Floating Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2" style={{ zIndex: 1000 }}>
        <button
          className="w-12 h-12 rounded-full shadow-lg bg-white flex items-center justify-center active:scale-95 transition-transform"
          onClick={handleLocate}
          disabled={isLocating}
          data-testid="button-locate"
        >
          <Locate className={`w-5 h-5 ${isLocating ? 'animate-pulse text-blue-500' : 'text-gray-700'}`} />
        </button>
        
        {totalAdsCount > 0 && (
          <button
            className="w-12 h-12 rounded-full shadow-lg bg-green-500 flex items-center justify-center active:scale-95 transition-transform"
            onClick={() => onMarkerClick?.({ geoHash: '', lat: lat || 0, lng: lng || 0, count: totalAdsCount, isCluster: true })}
            data-testid="button-view-all"
          >
            <List className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
      
      {/* Info Badge */}
      {totalAdsCount > 0 && (
        <div 
          className="absolute top-4 left-4 bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2"
          style={{ zIndex: 1000 }}
        >
          <ShoppingBag className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-gray-700">
            {totalAdsCount} {totalAdsCount === 1 ? 'товар' : totalAdsCount < 5 ? 'товара' : 'товаров'} рядом
          </span>
        </div>
      )}
      
      {/* Radius Selector */}
      <div className="absolute bottom-4 left-4 right-4" style={{ zIndex: 1000 }}>
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Радиус поиска</span>
            <span className="text-lg font-bold text-blue-600" data-testid="text-radius-value">
              {radiusKm < 1 ? `${radiusKm * 1000} м` : `${radiusKm} км`}
            </span>
          </div>
          <div className="flex gap-2">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                className={`flex-1 py-2 px-1 text-xs rounded-lg font-medium transition-colors ${
                  radiusKm === r 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setRadius(r)}
                data-testid={`button-radius-${r}`}
              >
                {r < 1 ? `${r * 1000}м` : `${r}км`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GeoMap;
