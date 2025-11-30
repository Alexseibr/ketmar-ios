import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, MapPin, Star, Filter, Plus, Briefcase, Users, Clock, ChevronRight, Verified, Loader2 } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import useGeoStore from '@/store/useGeoStore';

interface WorkerCategory {
  slug: string;
  name: string;
  icon: string;
  subcategories?: { slug: string; name: string; icon: string }[];
}

interface Worker {
  id: string;
  name: string;
  avatar?: string;
  categories: string[];
  experienceYears: number;
  priceFrom?: number;
  priceTo?: number;
  priceUnit: string;
  currency: string;
  rating: number;
  reviewsCount: number;
  completedOrdersCount: number;
  isVerified: boolean;
  isPro: boolean;
  isTeam: boolean;
  teamSize?: number;
  tags: string[];
  city?: string;
  distance?: number;
}

interface WorkerOrder {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetFrom?: number;
  budgetTo?: number;
  budgetType: string;
  currency: string;
  urgency: string;
  deadline?: string;
  responsesCount: number;
  maxResponses: number;
  city?: string;
  distance?: number;
  createdAt: string;
}

const URGENCY_LABELS: Record<string, { label: string; color: string }> = {
  urgent: { label: 'Срочно', color: '#EF4444' },
  high: { label: 'Важно', color: '#F97316' },
  normal: { label: 'Обычный', color: '#3B82F6' },
  low: { label: 'Не срочно', color: '#6B7280' },
};

const PRICE_UNIT_LABELS: Record<string, string> = {
  hour: 'час',
  day: 'день',
  project: 'проект',
  m2: 'м²',
};

export default function ServicesWorkersPage() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const { coords, radiusKm } = useGeoStore();

  const [activeTab, setActiveTab] = useState<'workers' | 'orders'>('workers');
  const [categories, setCategories] = useState<WorkerCategory[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [orders, setOrders] = useState<WorkerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [coords, selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const catRes = await fetch('/api/workers/categories');
      const catData = await catRes.json();
      setCategories(catData.categories || []);

      const params = new URLSearchParams();
      if (coords) {
        params.set('lat', coords.lat.toString());
        params.set('lng', coords.lng.toString());
        params.set('radiusKm', (radiusKm || 30).toString());
      }
      if (selectedCategory) {
        params.set('category', selectedCategory);
      }

      const [workersRes, ordersRes] = await Promise.all([
        fetch(`/api/workers?${params.toString()}`),
        fetch(`/api/worker-orders?${params.toString()}`),
      ]);

      const workersData = await workersRes.json();
      const ordersData = await ordersRes.json();

      setWorkers(workersData.workers || []);
      setOrders(ordersData.orders || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (from?: number, to?: number, unit?: string, currency = 'BYN') => {
    if (!from && !to) return 'Договорная';
    const unitLabel = PRICE_UNIT_LABELS[unit || 'hour'] || unit;
    if (from && to) {
      return `${from}–${to} ${currency}/${unitLabel}`;
    }
    if (from) {
      return `от ${from} ${currency}/${unitLabel}`;
    }
    return `до ${to} ${currency}/${unitLabel}`;
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return null;
    if (distance < 1) return `${Math.round(distance * 1000)} м`;
    return `${distance.toFixed(1)} км`;
  };

  const allSubcategories = categories.flatMap(c => c.subcategories || []);

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#F3F4F6',
    }}>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        zIndex: 50,
        paddingTop: 'env(safe-area-inset-top)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            data-testid="button-back"
          >
            <ArrowLeft size={20} color="#fff" />
          </button>
          
          <h1 style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
            margin: 0,
          }}>
            Услуги и Мастера
          </h1>

          <button
            onClick={() => navigate('/services-workers/create-order')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            data-testid="button-create-order"
          >
            <Plus size={20} color="#fff" />
          </button>
        </div>

        <div style={{
          display: 'flex',
          gap: 8,
          padding: '0 16px 12px',
        }}>
          <button
            onClick={() => setActiveTab('workers')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 12,
              border: 'none',
              background: activeTab === 'workers' ? '#fff' : 'rgba(255, 255, 255, 0.2)',
              color: activeTab === 'workers' ? '#4F46E5' : '#fff',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
            data-testid="tab-workers"
          >
            <Users size={16} />
            Мастера
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 12,
              border: 'none',
              background: activeTab === 'orders' ? '#fff' : 'rgba(255, 255, 255, 0.2)',
              color: activeTab === 'orders' ? '#4F46E5' : '#fff',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
            data-testid="tab-orders"
          >
            <Briefcase size={16} />
            Заказы
          </button>
        </div>
      </div>

      <div style={{ 
        paddingTop: 'calc(env(safe-area-inset-top) + 110px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
      }}>
        <div style={{
          display: 'flex',
          gap: 8,
          padding: '12px 16px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              border: 'none',
              background: !selectedCategory ? '#4F46E5' : '#fff',
              color: !selectedCategory ? '#fff' : '#374151',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
            data-testid="filter-all"
          >
            Все
          </button>
          {allSubcategories.slice(0, 10).map(cat => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug === selectedCategory ? null : cat.slug)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: 'none',
                background: selectedCategory === cat.slug ? '#4F46E5' : '#fff',
                color: selectedCategory === cat.slug ? '#fff' : '#374151',
                fontWeight: 500,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              data-testid={`filter-${cat.slug}`}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Loader2 size={32} style={{ color: '#4F46E5', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : activeTab === 'workers' ? (
          <div style={{ padding: '0 16px' }}>
            {workers.length === 0 ? (
              <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: 32,
                textAlign: 'center',
              }}>
                <Users size={40} color="#9CA3AF" style={{ marginBottom: 12 }} />
                <p style={{ color: '#6B7280', fontSize: 14 }}>
                  Мастера не найдены в вашем районе
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {workers.map(worker => (
                  <div
                    key={worker.id}
                    onClick={() => navigate(`/services-workers/worker/${worker.id}`)}
                    style={{
                      background: '#fff',
                      borderRadius: 16,
                      padding: 16,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                    data-testid={`worker-card-${worker.id}`}
                  >
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: 14,
                        background: worker.avatar ? `url(${worker.avatar}) center/cover` : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {!worker.avatar && (
                          <span style={{ color: '#fff', fontSize: 20, fontWeight: 600 }}>
                            {worker.name.charAt(0)}
                          </span>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 16, fontWeight: 600, color: '#1F2937' }}>
                            {worker.name}
                          </span>
                          {worker.isVerified && (
                            <Verified size={16} color="#4F46E5" />
                          )}
                          {worker.isPro && (
                            <span style={{
                              background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                              color: '#fff',
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}>
                              PRO
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Star size={14} color="#F59E0B" fill="#F59E0B" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>
                              {worker.rating.toFixed(1)}
                            </span>
                            <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                              ({worker.reviewsCount})
                            </span>
                          </div>
                          {worker.completedOrdersCount > 0 && (
                            <span style={{ fontSize: 12, color: '#6B7280' }}>
                              • {worker.completedOrdersCount} заказов
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                          {worker.categories.slice(0, 3).map((cat, i) => {
                            const catInfo = allSubcategories.find(c => c.slug === cat);
                            return (
                              <span
                                key={i}
                                style={{
                                  background: '#F3F4F6',
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  fontSize: 11,
                                  color: '#4B5563',
                                }}
                              >
                                {catInfo?.icon} {catInfo?.name || cat}
                              </span>
                            );
                          })}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#4F46E5' }}>
                            {formatPrice(worker.priceFrom, worker.priceTo, worker.priceUnit, worker.currency)}
                          </span>
                          {worker.distance && (
                            <span style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <MapPin size={12} />
                              {formatDistance(worker.distance)}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight size={20} color="#9CA3AF" style={{ flexShrink: 0, alignSelf: 'center' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '0 16px' }}>
            {orders.length === 0 ? (
              <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: 32,
                textAlign: 'center',
              }}>
                <Briefcase size={40} color="#9CA3AF" style={{ marginBottom: 12 }} />
                <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>
                  Заказов пока нет
                </p>
                <button
                  onClick={() => navigate('/services-workers/create-order')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                  data-testid="button-create-first-order"
                >
                  Создать заказ
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {orders.map(order => {
                  const urgencyInfo = URGENCY_LABELS[order.urgency] || URGENCY_LABELS.normal;
                  return (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/services-workers/order/${order.id}`)}
                      style={{
                        background: '#fff',
                        borderRadius: 16,
                        padding: 16,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      }}
                      data-testid={`order-card-${order.id}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1F2937', margin: 0, flex: 1 }}>
                          {order.title}
                        </h3>
                        <span style={{
                          background: urgencyInfo.color,
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 6,
                          marginLeft: 8,
                        }}>
                          {urgencyInfo.label}
                        </span>
                      </div>

                      <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 12px', lineHeight: 1.4 }}>
                        {order.description.length > 100 ? order.description.substring(0, 100) + '...' : order.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        {(order.budgetFrom || order.budgetTo) && (
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#059669' }}>
                            {order.budgetFrom && order.budgetTo
                              ? `${order.budgetFrom}–${order.budgetTo} ${order.currency}`
                              : order.budgetFrom
                                ? `от ${order.budgetFrom} ${order.currency}`
                                : `до ${order.budgetTo} ${order.currency}`
                            }
                          </span>
                        )}
                        {order.deadline && (
                          <span style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Clock size={12} />
                            до {new Date(order.deadline).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                          {order.responsesCount} из {order.maxResponses} откликов
                        </span>
                        {order.distance && (
                          <span style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <MapPin size={12} />
                            {formatDistance(order.distance)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {user && activeTab === 'workers' && (
          <div style={{
            position: 'fixed',
            bottom: 'calc(env(safe-area-inset-bottom) + 90px)',
            right: 16,
          }}>
            <button
              onClick={() => navigate('/services-workers/become-worker')}
              style={{
                padding: '14px 20px',
                borderRadius: 50,
                border: 'none',
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(5, 150, 105, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              data-testid="button-become-worker"
            >
              <Users size={18} />
              Стать мастером
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
