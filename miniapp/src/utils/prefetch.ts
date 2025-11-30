import { queryClient } from '@/lib/queryClient';

export async function prefetchCriticalData() {
  if (typeof window === 'undefined') return;

  // Check if user wants to save data
  const connection = (navigator as any).connection;
  if (connection?.saveData) {
    console.log('⚠️ Data saver mode - skipping prefetch');
    return;
  }

  const doPrefetch = async () => {
    try {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['/api/categories'],
          staleTime: 1000 * 60 * 30, // 30 minutes
        }),
        queryClient.prefetchQuery({
          queryKey: ['/api/ads/search', JSON.stringify({}), 1],
          staleTime: 1000 * 60 * 5, // 5 minutes
        }),
      ]);
      
      console.log('✅ Critical data prefetched');
    } catch (error) {
      console.warn('⚠️ Prefetch failed (non-critical):', error);
    }
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => doPrefetch(), { timeout: 2000 });
  } else {
    setTimeout(doPrefetch, 100);
  }
}
