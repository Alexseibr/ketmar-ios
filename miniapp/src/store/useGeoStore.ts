import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getTelegramWebApp } from '@/utils/telegram';
import useRegionStore, { type CountryCode } from '@/store/useRegionStore';

// Маппинг кода страны на наш CountryCode
const COUNTRY_CODE_MAP: Record<string, CountryCode> = {
  'BY': 'BY',
  'RU': 'RU', 
  'UA': 'UA',
  'KZ': 'KZ',
  'PL': 'PL',
  'DE': 'DE',
  'US': 'US',
};

interface GeoCoords {
  lat: number;
  lng: number;
}

interface MapCenter {
  lat: number;
  lng: number;
  zoom: number;
}

interface GeoState {
  coords: GeoCoords | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: string;
  radiusKm: number;
  cityName: string | null;
  hasCompletedOnboarding: boolean;
  smartRadiusEnabled: boolean;
  mapCenter: MapCenter | null;
  sheetHeight: 'collapsed' | 'half' | 'full';
  lastLocationUpdate: number | null;
  requestLocation: () => Promise<void>;
  setRadius: (value: number) => void;
  setCityName: (city: string | null) => void;
  setCoords: (coords: GeoCoords) => void;
  completeOnboarding: () => void;
  resetGeo: () => void;
  toggleSmartRadius: () => void;
  setMapCenter: (center: MapCenter) => void;
  setSheetHeight: (height: 'collapsed' | 'half' | 'full') => void;
  calculateSmartRadius: (adsCount: number) => void;
  refreshLocationOnAppStart: () => Promise<void>;
}

const SMART_RADIUS_STEPS = [0.3, 0.5, 1, 2, 3, 5, 10, 20];
const MIN_ADS_TARGET = 10;
const MAX_ADS_TARGET = 30;

interface GeoResolveResult {
  label: string | null;
  countryCode: string | null;
}

async function resolveLocationDetails(lat: number, lng: number): Promise<GeoResolveResult> {
  try {
    const response = await fetch('/api/geo/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
    });
    if (response.ok) {
      const data = await response.json();
      return {
        label: data.label || data.city || null,
        countryCode: data.countryCode || null,
      };
    }
  } catch (e) {
    console.warn('Failed to resolve location:', e);
  }
  return { label: null, countryCode: null };
}

async function requestTelegramLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp();
    
    if (!tg || !(tg as any).LocationManager) {
      console.log('📍 Telegram LocationManager not available, trying browser...');
      resolve(null);
      return;
    }

    let resolved = false;
    try {
      console.log('📍 Requesting location via Telegram LocationManager...');
      (tg as any).LocationManager.getLocation((locationData: any) => {
        if (resolved) return;
        resolved = true;
        if (locationData && locationData.latitude && locationData.longitude) {
          console.log('📍 Telegram location received:', locationData);
          resolve({ lat: locationData.latitude, lng: locationData.longitude });
        } else {
          console.log('📍 Telegram location denied or unavailable');
          resolve(null);
        }
      });
      
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      }, 3000);
    } catch (error) {
      console.error('📍 Telegram location error:', error);
      resolve(null);
    }
  });
}

async function requestBrowserLocation(): Promise<{ lat: number; lng: number } | null> {
  if (!('geolocation' in navigator)) {
    console.log('📍 Browser geolocation not supported');
    return null;
  }
  
  return new Promise((resolve) => {
    console.log('📍 Requesting location via browser...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('📍 Browser location received:', position.coords);
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        console.log('📍 Browser location error:', error.message);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
    );
  });
}

// Время жизни кэша геолокации - 5 минут (пользователь может переместиться)
const GEO_CACHE_TTL_MS = 5 * 60 * 1000;

// Проверка актуальности кэшированной геолокации
function isCachedLocationValid(lastUpdate: number | null): boolean {
  if (!lastUpdate) return false;
  return Date.now() - lastUpdate < GEO_CACHE_TTL_MS;
}

const useGeoStore = create<GeoState>()(
  persist(
    (set, get) => ({
      coords: null,
      status: 'idle',
      error: undefined,
      radiusKm: 30,
      cityName: null,
      hasCompletedOnboarding: false,
      smartRadiusEnabled: false,
      mapCenter: null,
      sheetHeight: 'half',
      lastLocationUpdate: null,

      async requestLocation() {
        set({ status: 'loading', error: undefined });
        
        let location = await requestTelegramLocation();
        
        if (!location) {
          location = await requestBrowserLocation();
        }
        
        if (location) {
          set({
            coords: { lat: location.lat, lng: location.lng },
            status: 'ready',
            lastLocationUpdate: Date.now(),
          });
          
          // Определяем город и страну по координатам
          const { label, countryCode } = await resolveLocationDetails(location.lat, location.lng);
          
          if (label) {
            set({ cityName: label });
          }
          
          // Автоматически устанавливаем регион по стране
          if (countryCode && COUNTRY_CODE_MAP[countryCode]) {
            const mappedCountry = COUNTRY_CODE_MAP[countryCode];
            const regionStore = useRegionStore.getState();
            
            // Устанавливаем страну только если регион ещё не был настроен пользователем
            if (!regionStore.isInitialized) {
              regionStore.setCountry(mappedCountry);
              console.log('🌍 Регион определён по координатам:', mappedCountry);
            }
          }
          
          console.log('✅ Геолокация обновлена:', location, label, countryCode);
        } else {
          set({ status: 'error', error: 'Не удалось получить местоположение' });
        }
      },
      
      async refreshLocationOnAppStart() {
        const currentCoords = get().coords;
        const lastUpdate = get().lastLocationUpdate;
        
        // Если есть валидный кэш геолокации (менее 24 часов) - используем его сразу
        if (currentCoords && isCachedLocationValid(lastUpdate)) {
          console.log('📍 [GeoStore] Using valid cached location:', currentCoords);
          set({ status: 'ready' });
          return;
        }
        
        // Нет кэша или он устарел - запрашиваем геолокацию
        console.log('🔄 Запрос актуальной геолокации при старте приложения...');
        set({ status: 'loading', error: undefined });
        await get().requestLocation();
      },

      setRadius(value) {
        const clampedValue = Math.max(0.1, Math.min(100, value));
        set({ radiusKm: clampedValue });
      },

      setCityName(city) {
        set({ cityName: city });
      },

      setCoords(coords) {
        set({ coords, status: 'ready' });
      },

      completeOnboarding() {
        set({ hasCompletedOnboarding: true });
      },

      resetGeo() {
        set({
          coords: null,
          status: 'idle',
          error: undefined,
          cityName: null,
        });
      },

      toggleSmartRadius() {
        set((state) => ({ smartRadiusEnabled: !state.smartRadiusEnabled }));
      },

      setMapCenter(center) {
        set({ mapCenter: center });
      },

      setSheetHeight(height) {
        set({ sheetHeight: height });
      },

      calculateSmartRadius(adsCount) {
        const { radiusKm, smartRadiusEnabled } = get();
        if (!smartRadiusEnabled) return;

        const currentIdx = SMART_RADIUS_STEPS.findIndex(r => r >= radiusKm);
        
        if (adsCount < MIN_ADS_TARGET && currentIdx < SMART_RADIUS_STEPS.length - 1) {
          set({ radiusKm: SMART_RADIUS_STEPS[currentIdx + 1] });
        } else if (adsCount > MAX_ADS_TARGET && currentIdx > 0) {
          set({ radiusKm: SMART_RADIUS_STEPS[currentIdx - 1] });
        }
      },
    }),
    {
      name: 'ketmar-geo-store',
      partialize: (state) => ({
        coords: state.coords,
        cityName: state.cityName,
        lastLocationUpdate: state.lastLocationUpdate,
        radiusKm: state.radiusKm,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        smartRadiusEnabled: state.smartRadiusEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.coords && isCachedLocationValid(state.lastLocationUpdate)) {
          console.log('📍 [GeoStore] Using cached location:', state.coords, state.cityName);
          state.status = 'ready';
        } else if (state) {
          console.log('📍 [GeoStore] No valid cached location, will request fresh');
          state.coords = null;
          state.cityName = null;
          state.status = 'idle';
        }
      },
    }
  )
);

export default useGeoStore;
