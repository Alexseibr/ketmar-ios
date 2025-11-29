import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Ad {
  _id: string;
  title: string;
  price: number;
  currency?: string;
  photos?: string[];
  distanceKm?: number;
  categoryId?: string;
  subcategoryId?: string;
  isFarmerAd?: boolean;
  isFreeGiveaway?: boolean;
  isProSeller?: boolean;
  isShopAd?: boolean;
  type?: string;
  categoryName?: string;
  location?: { lat: number; lng: number };
}

interface GeoMapProps {
  lat: number;
  lng: number;
  radiusKm: number;
  feed: Ad[];
  selectedAdId: string | null;
  onZoneClick: (ads: Ad[]) => void;
  onMapClick?: () => void;
  onMapMove: (lat: number, lng: number) => void;
}

interface HeatZone {
  id: string;
  lat: number;
  lng: number;
  count: number;
  ads: Ad[];
  radius: number;
  dominantType: 'farmer' | 'free' | 'goods' | 'service';
}

const ZONE_COLORS = {
  farmer: { fill: '#22C55E', border: '#16A34A' },
  free: { fill: '#F97316', border: '#EA580C' },
  goods: { fill: '#3B82F6', border: '#2563EB' },
  service: { fill: '#8B5CF6', border: '#7C3AED' },
};

const getAdType = (ad: Ad): 'farmer' | 'free' | 'goods' | 'service' => {
  if (ad.isFreeGiveaway || ad.categoryId === 'darom') return 'free';
  if (ad.isFarmerAd || ad.categoryId?.includes('farmer')) return 'farmer';
  if (ad.type === 'service' || ad.categoryId?.includes('service')) return 'service';
  return 'goods';
};

function groupAdsIntoZones(ads: Ad[]): HeatZone[] {
  const zones: Map<string, HeatZone> = new Map();
  const gridSize = 0.006;
  
  ads.forEach(ad => {
    if (!ad.location?.lat || !ad.location?.lng) return;
    
    const gridLat = Math.floor(ad.location.lat / gridSize) * gridSize;
    const gridLng = Math.floor(ad.location.lng / gridSize) * gridSize;
    const key = `${gridLat.toFixed(4)}_${gridLng.toFixed(4)}`;
    
    if (zones.has(key)) {
      const zone = zones.get(key)!;
      zone.count++;
      zone.ads.push(ad);
    } else {
      const offsetLat = (Math.random() - 0.5) * 0.003;
      const offsetLng = (Math.random() - 0.5) * 0.003;
      
      zones.set(key, {
        id: key,
        lat: gridLat + gridSize / 2 + offsetLat,
        lng: gridLng + gridSize / 2 + offsetLng,
        count: 1,
        ads: [ad],
        radius: 180 + Math.random() * 120,
        dominantType: getAdType(ad)
      });
    }
  });
  
  zones.forEach(zone => {
    const typeCounts: Record<string, number> = {};
    zone.ads.forEach(ad => {
      const type = getAdType(ad);
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    let maxType = 'goods';
    let maxCount = 0;
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxType = type;
      }
    });
    zone.dominantType = maxType as 'farmer' | 'free' | 'goods' | 'service';
  });
  
  return Array.from(zones.values());
}

const userIcon = L.divIcon({
  className: 'ketmar-user-marker',
  html: `
    <div style="position: relative; width: 24px; height: 24px;">
      <div style="position: absolute; inset: -8px; background: rgba(59, 130, 246, 0.2); border-radius: 50%; animation: userPulse 2s ease-out infinite;"></div>
      <div style="width: 24px; height: 24px; background: linear-gradient(135deg, #3B82F6, #1D4ED8); border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.5);"></div>
      <div style="position: absolute; top: 50%; left: 50%; width: 8px; height: 8px; background: white; border-radius: 50%; transform: translate(-50%, -50%);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const RADIUS_ZOOM_MAP: Array<{ radius: number; zoom: number }> = [
  { radius: 0.3, zoom: 17 },
  { radius: 1, zoom: 15 },
  { radius: 3, zoom: 14 },
  { radius: 5, zoom: 13 },
  { radius: 10, zoom: 12 },
  { radius: 20, zoom: 11 },
];

function getZoomForRadius(radiusKm: number): number {
  for (const item of RADIUS_ZOOM_MAP) {
    if (Math.abs(radiusKm - item.radius) < 0.01) {
      return item.zoom;
    }
  }
  for (const item of RADIUS_ZOOM_MAP) {
    if (radiusKm <= item.radius) {
      return item.zoom;
    }
  }
  return 11;
}

function MapController({ 
  center, 
  radiusKm,
  onMove,
  onMapClick 
}: { 
  center: [number, number];
  radiusKm: number;
  onMove: (lat: number, lng: number) => void;
  onMapClick?: () => void;
}) {
  const map = useMap();
  const initializedRef = useRef(false);
  const lastRadiusRef = useRef(radiusKm);
  
  useEffect(() => {
    if (!initializedRef.current && center[0] !== 0 && center[1] !== 0) {
      const zoom = getZoomForRadius(radiusKm);
      map.setView(center, zoom);
      initializedRef.current = true;
      lastRadiusRef.current = radiusKm;
    }
  }, [center, radiusKm, map]);
  
  useEffect(() => {
    if (initializedRef.current && lastRadiusRef.current !== radiusKm) {
      const zoom = getZoomForRadius(radiusKm);
      map.flyTo(center, zoom, { duration: 0.5 });
      lastRadiusRef.current = radiusKm;
    }
  }, [radiusKm, center, map]);
  
  useMapEvents({
    moveend: () => {
      const c = map.getCenter();
      onMove(c.lat, c.lng);
    },
    click: () => {
      if (onMapClick) {
        onMapClick();
      }
    }
  });
  
  return null;
}

function HeatZonesLayer({ 
  zones, 
  onZoneClick,
  selectedAdId
}: { 
  zones: HeatZone[]; 
  onZoneClick: (ads: Ad[]) => void;
  selectedAdId: string | null;
}) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);
  const panesCreatedRef = useRef(false);
  
  useEffect(() => {
    if (!panesCreatedRef.current) {
      if (!map.getPane('heatCircles')) {
        const circlePane = map.createPane('heatCircles');
        circlePane.style.zIndex = '350';
        circlePane.style.pointerEvents = 'none';
      }
      if (!map.getPane('heatLabels')) {
        const labelPane = map.createPane('heatLabels');
        labelPane.style.zIndex = '650';
      }
      panesCreatedRef.current = true;
    }
  }, [map]);
  
  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    
    const layer = L.layerGroup();
    
    zones.forEach(zone => {
      const colors = ZONE_COLORS[zone.dominantType] || ZONE_COLORS.goods;
      const intensity = Math.min(zone.count / 8, 1);
      
      const circleRadius = zone.radius + Math.min(zone.count * 25, 300);
      
      const hasSelectedAd = zone.ads.some(ad => ad._id === selectedAdId);
      
      const circle = L.circle([zone.lat, zone.lng], {
        radius: circleRadius,
        color: hasSelectedAd ? '#1D4ED8' : colors.border,
        fillColor: colors.fill,
        fillOpacity: 0.35 + intensity * 0.25,
        weight: hasSelectedAd ? 4 : 2,
        opacity: 0.8,
        interactive: false,
        pane: 'heatCircles'
      });
      
      circle.addTo(layer);
      
      if (zone.count > 0) {
        const iconHtml = zone.dominantType === 'farmer' 
          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${colors.border}" stroke-width="2.5"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5" fill="${colors.border}"/></svg>`
          : zone.dominantType === 'free'
          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${colors.border}" stroke-width="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
          : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${colors.border}" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
        
        const countLabel = L.divIcon({
          className: 'heat-zone-label',
          html: `
            <div style="
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              background: white;
              border-radius: 16px;
              padding: 6px 12px;
              font-size: 13px;
              font-weight: 600;
              color: #1F2937;
              box-shadow: 0 2px 10px rgba(0,0,0,0.15);
              display: flex;
              align-items: center;
              gap: 6px;
              white-space: nowrap;
              cursor: pointer;
              border: 2px solid ${hasSelectedAd ? '#1D4ED8' : 'transparent'};
            ">
              ${iconHtml}
              <span>${zone.count}</span>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });
        
        const marker = L.marker([zone.lat, zone.lng], { 
          icon: countLabel,
          interactive: true,
          pane: 'heatLabels'
        });
        marker.on('click', () => onZoneClick(zone.ads));
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
  }, [zones, map, onZoneClick, selectedAdId]);
  
  return null;
}

export default function GeoMap({ lat, lng, radiusKm, feed, selectedAdId, onZoneClick, onMapClick, onMapMove }: GeoMapProps) {
  const center: [number, number] = [lat, lng];
  
  const heatZones = useMemo(() => groupAdsIntoZones(feed), [feed]);
  
  const handleZoneClick = (ads: Ad[]) => {
    onZoneClick(ads);
  };
  
  return (
    <>
      <style>{`
        @keyframes userPulse {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        .leaflet-container { 
          width: 100%; 
          height: 100%; 
          font-family: inherit;
        }
        .leaflet-control-attribution {
          font-size: 10px !important;
          background: rgba(255,255,255,0.8) !important;
          padding: 2px 6px !important;
        }
        .heat-zone-label {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
      
      <MapContainer
        center={center}
        zoom={14}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={center} radiusKm={radiusKm} onMove={onMapMove} onMapClick={onMapClick} />
        
        <Marker position={center} icon={userIcon} />
        
        <Circle
          center={center}
          radius={radiusKm * 1000}
          pathOptions={{
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.06,
            weight: 2,
            dashArray: '8, 12'
          }}
        />
        
        <HeatZonesLayer
          zones={heatZones}
          onZoneClick={handleZoneClick}
          selectedAdId={selectedAdId}
        />
      </MapContainer>
      
      {feed.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            background: 'white',
            borderRadius: 12,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            color: '#1F2937',
            boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 1000,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>{feed.length} {feed.length === 1 ? 'товар' : feed.length < 5 ? 'товара' : 'товаров'}</span>
        </div>
      )}
    </>
  );
}
