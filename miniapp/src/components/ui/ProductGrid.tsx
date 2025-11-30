import { memo, useCallback, useRef, useEffect } from 'react';
import ProductCardYandex from './ProductCardYandex';

interface Product {
  id: string;
  title: string;
  subtitle?: string;
  price?: number | string;
  image?: string;
  rating?: number;
  distance?: string;
  isFree?: boolean;
}

interface ProductGridProps {
  products: Product[];
  onProductClick?: (id: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}

const ProductGrid = memo(({
  products,
  onProductClick,
  onLoadMore,
  hasMore = false,
  loading = false,
  emptyMessage = 'Объявления не найдены',
}: ProductGridProps) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const handleProductClick = useCallback((id: string) => {
    onProductClick?.(id);
  }, [onProductClick]);

  useEffect(() => {
    if (!hasMore || !onLoadMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, onLoadMore, loading]);

  if (!loading && products.length === 0) {
    return (
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          color: '#9CA3AF',
        }}
        data-testid="product-grid-empty"
      >
        <span style={{ fontSize: 48, marginBottom: 12 }}>📦</span>
        <p style={{ margin: 0, fontSize: 14, textAlign: 'center' }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div data-testid="product-grid">
      {/* Grid Container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        padding: '0 12px',
      }}>
        {products.map((product) => (
          <ProductCardYandex
            key={product.id}
            id={product.id}
            title={product.title}
            subtitle={product.subtitle}
            price={product.price}
            image={product.image}
            rating={product.rating}
            distance={product.distance}
            isFree={product.isFree}
            onClick={() => handleProductClick(product.id)}
          />
        ))}
        
        {/* Loading Skeletons */}
        {loading && (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={`skeleton-${i}`}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                }}
              >
                <div style={{
                  width: '100%',
                  paddingTop: '75%',
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                }} />
                <div style={{ padding: '12px' }}>
                  <div style={{
                    height: 14,
                    background: '#E5E7EB',
                    borderRadius: 4,
                    marginBottom: 8,
                    width: '80%',
                  }} />
                  <div style={{
                    height: 12,
                    background: '#E5E7EB',
                    borderRadius: 4,
                    width: '60%',
                  }} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Load More Trigger */}
      {hasMore && (
        <div 
          ref={loadMoreRef}
          style={{ 
            height: 20, 
            marginTop: 12,
          }}
        />
      )}

      {/* Shimmer Animation Style */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
});

ProductGrid.displayName = 'ProductGrid';

export default ProductGrid;
