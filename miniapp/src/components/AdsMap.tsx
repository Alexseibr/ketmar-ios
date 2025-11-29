import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AdPreview } from '@/types';
import { useFormatPrice } from '@/hooks/useFormatPrice';

interface AdsMapProps {
  ads: AdPreview[];
  center?: { lat: number; lng: number };
  onMarkerClick?: (adId: string) => void;
  onZoneClick?: (ads: AdPreview[]) => void;
  zoom?: number;
  height?: string;
}

interface HeatZone {
  id: string;
  lat: number;
  lng: number;
  count: number;
  ads: AdPreview[];
  radius: number;
}

function groupAdsIntoZones(ads: AdPreview[]): HeatZone[] {
  const zones: Map<string, HeatZone> = new Map();
  const gridSize = 0.008;
  
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
      const offsetLat = (Math.random() - 0.5) * 0.004;
      const offsetLng = (Math.random() - 0.5) * 0.004;
      
      zones.set(key, {
        id: key,
        lat: gridLat + gridSize / 2 + offsetLat,
        lng: gridLng + gridSize / 2 + offsetLng,
        count: 1,
        ads: [ad],
        radius: 250 + Math.random() * 150
      });
    }
  });
  
  return Array.from(zones.values());
}

function HeatZonesLayer({ 
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
      const intensity = Math.min(zone.count / 8, 1);
      
      const r = Math.round(34 + intensity * 200);
      const g = Math.round(197 - intensity * 80);
      const b = Math.round(94 - intensity * 50);
      const color = `rgb(${r}, ${g}, ${b})`;
      
      const circleRadius = zone.radius + Math.min(zone.count * 30, 350);
      
      const circle = L.circle([zone.lat, zone.lng], {
        radius: circleRadius,
        color: color,
        fillColor: color,
        fillOpacity: 0.4 + intensity * 0.2,
        weight: 2,
        opacity: 0.7
      });
      
      circle.on('click', () => onZoneClick(zone));
      circle.addTo(layer);
      
      if (zone.count > 0) {
        const countLabel = L.divIcon({
          className: 'heat-zone-label',
          html: `
            <div style="
              background: white;
              border-radius: 16px;
              padding: 6px 12px;
              font-size: 13px;
              font-weight: 600;
              color: #1F2937;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
              display: flex;
              align-items: center;
              gap: 6px;
              white-space: nowrap;
              cursor: pointer;
            ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <span>${zone.count} ${zone.count === 1 ? 'товар' : zone.count < 5 ? 'товара' : 'товаров'}</span>
            </div>
          `,
          iconSize: [100, 30],
          iconAnchor: [50, 15]
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

export function AdsMap({
  ads,
  center,
  onMarkerClick,
  onZoneClick,
  zoom = 12,
  height = '400px',
}: AdsMapProps) {
  const { formatCard } = useFormatPrice();
  
  const adsWithLocation = ads.filter(
    (ad: AdPreview) => ad.location?.lat != null && ad.location?.lng != null
  );

  const heatZones = useMemo(() => groupAdsIntoZones(adsWithLocation), [adsWithLocation]);

  const mapCenter = center || (adsWithLocation.length > 0
    ? {
        lat: adsWithLocation[0].location!.lat!,
        lng: adsWithLocation[0].location!.lng!,
      }
    : { lat: 53.9006, lng: 27.5590 });

  const handleZoneClick = (zone: HeatZone) => {
    if (onZoneClick) {
      onZoneClick(zone.ads);
    } else if (onMarkerClick && zone.ads.length === 1) {
      onMarkerClick(zone.ads[0]._id);
    }
  };

  return (
    <div
      data-testid="ads-map"
      style={{
        width: '100%',
        height,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <style>{`
        .heat-zone-label {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
      
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{
          height: '100%',
          width: '100%',
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <HeatZonesLayer zones={heatZones} onZoneClick={handleZoneClick} />
      </MapContainer>
      
      {adsWithLocation.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'white',
            borderRadius: 12,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            color: '#1F2937',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            zIndex: 1000,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          {adsWithLocation.length} {adsWithLocation.length === 1 ? 'товар' : adsWithLocation.length < 5 ? 'товара' : 'товаров'} рядом
        </div>
      )}
    </div>
  );
}

export default AdsMap;
