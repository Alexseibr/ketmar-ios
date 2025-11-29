import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

type AdType = 'farmer' | 'service' | 'goods' | 'free' | 'pro-shop' | 'unknown';

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
  onMarkerClick: (adId: string) => void;
  onMapClick?: () => void;
  onMapMove: (lat: number, lng: number) => void;
}

const PIN_COLORS: Record<AdType, { from: string; to: string; shadow: string; cluster: string }> = {
  farmer: { from: '#22C55E', to: '#16A34A', shadow: 'rgba(34, 197, 94, 0.4)', cluster: '#22C55E' },
  service: { from: '#8B5CF6', to: '#7C3AED', shadow: 'rgba(139, 92, 246, 0.4)', cluster: '#8B5CF6' },
  goods: { from: '#3B82F6', to: '#2563EB', shadow: 'rgba(59, 130, 246, 0.4)', cluster: '#3B82F6' },
  free: { from: '#F97316', to: '#EA580C', shadow: 'rgba(249, 115, 22, 0.4)', cluster: '#F97316' },
  'pro-shop': { from: '#06B6D4', to: '#0891B2', shadow: 'rgba(6, 182, 212, 0.4)', cluster: '#06B6D4' },
  unknown: { from: '#6B7280', to: '#4B5563', shadow: 'rgba(107, 114, 128, 0.4)', cluster: '#6B7280' },
};

const PIN_ICONS: Record<AdType, string> = {
  farmer: `<path d="M16 9c-2.5 0-4.5 2-4.5 5s2 5.5 4.5 5.5 4.5-2.5 4.5-5.5-2-5-4.5-5z" fill="white" opacity="0.95"/>`,
  service: `<path d="M11 12h10M16 9v9" stroke="white" stroke-width="2.5" stroke-linecap="round"/>`,
  goods: `<rect x="10" y="11" width="12" height="8" rx="1.5" fill="white"/>`,
  free: `<path d="M12 11h8M12 15h8M12 19h5" stroke="white" stroke-width="2" stroke-linecap="round"/>`,
  'pro-shop': `<path d="M10 14h12M13 11v8M19 11v8" stroke="white" stroke-width="2" stroke-linecap="round"/>`,
  unknown: `<circle cx="16" cy="15" r="4" fill="white"/>`,
};

const getAdType = (ad: Ad): AdType => {
  if (ad.isFreeGiveaway || ad.categoryId === 'darom') return 'free';
  if (ad.isFarmerAd || ad.categoryId?.includes('farmer') || ad.categoryName?.toLowerCase().includes('фермер')) return 'farmer';
  if (ad.isProSeller || ad.isShopAd || ad.categoryId?.includes('shop') || ad.categoryId?.includes('store')) return 'pro-shop';
  if (ad.type === 'service' || ad.categoryId?.includes('service') || ad.categoryName?.toLowerCase().includes('услуг')) return 'service';
  if (ad.type === 'goods' || ad.categoryId?.includes('goods')) return 'goods';
  return 'goods';
};

const createMarkerIcon = (type: AdType, isSelected: boolean = false) => {
  const c = PIN_COLORS[type];
  const scale = isSelected ? 1.2 : 1;
  const size = isSelected ? 38 : 32;
  const height = isSelected ? 48 : 40;
  
  return L.divIcon({
    className: 'ketmar-marker',
    html: `
      <div style="transform: scale(${scale}); transition: transform 150ms ease; filter: drop-shadow(0 3px 6px ${c.shadow});">
        <svg width="${size}" height="${height}" viewBox="0 0 32 40" fill="none">
          <defs>
            <linearGradient id="pin-${type}-${isSelected}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="${c.from}"/>
              <stop offset="100%" stop-color="${c.to}"/>
            </linearGradient>
          </defs>
          <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z" fill="url(#pin-${type}-${isSelected})"/>
          ${PIN_ICONS[type]}
        </svg>
      </div>
    `,
    iconSize: [size, height],
    iconAnchor: [size / 2, height]
  });
};

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

const createClusterIcon = (cluster: L.MarkerCluster) => {
  const markers = cluster.getAllChildMarkers();
  const count = markers.length;
  
  const typeCounts: Record<AdType, number> = {
    farmer: 0, service: 0, goods: 0, free: 0, 'pro-shop': 0, unknown: 0
  };
  
  markers.forEach(marker => {
    const type = (marker.options as { adType?: AdType }).adType || 'unknown';
    typeCounts[type]++;
  });
  
  let dominantType: AdType = 'goods';
  let maxCount = 0;
  
  (Object.keys(typeCounts) as AdType[]).forEach(type => {
    if (typeCounts[type] > maxCount) {
      maxCount = typeCounts[type];
      dominantType = type;
    }
  });
  
  const dominantRatio = maxCount / count;
  const clusterColor = dominantRatio > 0.5 ? PIN_COLORS[dominantType].cluster : '#6B7280';
  
  const size = count < 10 ? 36 : count < 100 ? 42 : 50;
  const fontSize = count < 10 ? 14 : count < 100 ? 15 : 16;
  
  return L.divIcon({
    html: `
      <div class="ketmar-cluster" style="
        width: ${size}px;
        height: ${size}px;
        background: ${clusterColor};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${fontSize}px;
        font-weight: 600;
        color: white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.25);
        transition: transform 150ms ease;
      ">
        ${count}
      </div>
    `,
    className: 'ketmar-cluster-wrapper',
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2)
  });
};

function MapController({ 
  center, 
  onMove,
  onMapClick 
}: { 
  center: [number, number];
  onMove: (lat: number, lng: number) => void;
  onMapClick?: () => void;
}) {
  const map = useMap();
  const initializedRef = useRef(false);
  
  useEffect(() => {
    if (!initializedRef.current && center[0] !== 0 && center[1] !== 0) {
      map.setView(center, 14);
      initializedRef.current = true;
    }
  }, [center, map]);
  
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

function MarkerClusterLayer({ 
  feed, 
  lat, 
  lng, 
  selectedAdId, 
  onMarkerClick 
}: { 
  feed: Ad[]; 
  lat: number; 
  lng: number; 
  selectedAdId: string | null;
  onMarkerClick: (adId: string) => void;
}) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  
  useEffect(() => {
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
    }
    
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      disableClusteringAtZoom: 16,
      maxClusterRadius: 60,
      iconCreateFunction: createClusterIcon,
      animate: true,
      animateAddingMarkers: false,
    });
    
    feed.forEach((ad) => {
      const adLat = ad.location?.lat || lat + (Math.random() - 0.5) * 0.02;
      const adLng = ad.location?.lng || lng + (Math.random() - 0.5) * 0.02;
      const type = getAdType(ad);
      const isSelected = ad._id === selectedAdId;
      
      const marker = L.marker([adLat, adLng], {
        icon: createMarkerIcon(type, isSelected),
        adType: type,
      } as L.MarkerOptions & { adType: AdType });
      
      marker.on('click', () => onMarkerClick(ad._id));
      clusterGroup.addLayer(marker);
    });
    
    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;
    
    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [feed, lat, lng, selectedAdId, onMarkerClick, map]);
  
  return null;
}

export default function GeoMap({ lat, lng, radiusKm, feed, selectedAdId, onMarkerClick, onMapClick, onMapMove }: GeoMapProps) {
  const center: [number, number] = [lat, lng];
  
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
        .ketmar-cluster-wrapper {
          background: transparent !important;
        }
        .ketmar-cluster:hover {
          transform: scale(1.1);
        }
        .marker-cluster {
          background: transparent !important;
        }
        .marker-cluster div {
          background: transparent !important;
        }
        .marker-cluster-small,
        .marker-cluster-medium,
        .marker-cluster-large {
          background: transparent !important;
        }
        .marker-cluster-small div,
        .marker-cluster-medium div,
        .marker-cluster-large div {
          background: transparent !important;
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
        
        <MapController center={center} onMove={onMapMove} onMapClick={onMapClick} />
        
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
        
        <MarkerClusterLayer
          feed={feed}
          lat={lat}
          lng={lng}
          selectedAdId={selectedAdId}
          onMarkerClick={onMarkerClick}
        />
      </MapContainer>
    </>
  );
}
