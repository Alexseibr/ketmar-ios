import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Users,
  Package,
  Eye,
  Heart,
  MessageSquare,
  Calendar,
  Loader2,
  RefreshCw,
  ShoppingBag,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { usePlatform } from '@/platform/PlatformProvider';
import http from '@/api/http';

interface AnalyticsData {
  users: {
    total: number;
    newToday: number;
    newWeek: number;
    active: number;
  };
  ads: {
    total: number;
    active: number;
    pending: number;
    newToday: number;
    newWeek: number;
  };
  sellers: {
    total: number;
    shops: number;
    farmers: number;
    bloggers: number;
    artisans: number;
  };
  engagement: {
    views: number;
    favorites: number;
    contacts: number;
  };
  topCategories: Array<{ name: string; count: number }>;
  topCities: Array<{ name: string; count: number }>;
}

export default function AdminAnalyticsPage() {
  const navigate = useNavigate();
  const { getAuthToken } = usePlatform();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['/api/admin/analytics', period],
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const res = await http.get('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` },
        params: { period },
      });
      return res.data as AnalyticsData;
    },
    staleTime: 60000,
  });

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    gradient,
    iconColor,
  }: {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: typeof BarChart3;
    gradient: string;
    iconColor: string;
  }) => (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1F2937' }}>{value}</div>
          {subtitle && (
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={22} color={iconColor} />
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => {
    const percent = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: '#4B5563' }}>{label}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{value}</span>
        </div>
        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              width: `${percent}%`,
              height: '100%',
              background: color,
              borderRadius: 4,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          padding: '12px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: '#F3F4F6',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            data-testid="button-back"
          >
            <ArrowLeft size={20} color="#374151" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1F2937' }}>Аналитика</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>Статистика платформы</div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: '#F3F4F6',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            data-testid="button-refresh"
          >
            <RefreshCw size={20} color="#374151" className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 12,
            overflowX: 'auto',
            paddingBottom: 4,
          }}
        >
          {[
            { key: 'today', label: 'Сегодня' },
            { key: 'week', label: 'Неделя' },
            { key: 'month', label: 'Месяц' },
            { key: 'all', label: 'Всё время' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key as typeof period)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: 'none',
                background: period === p.key ? '#4F46E5' : '#F3F4F6',
                color: period === p.key ? '#FFFFFF' : '#4B5563',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              data-testid={`button-period-${p.key}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
            }}
          >
            <Loader2 size={40} color="#4F46E5" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 16, color: '#6B7280' }}>Загрузка данных...</p>
          </div>
        ) : data ? (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <StatCard
                title="Пользователи"
                value={data.users?.total || 0}
                subtitle={`+${data.users?.newWeek || 0} за неделю`}
                icon={Users}
                gradient="linear-gradient(135deg, #818CF8 0%, #6366F1 100%)"
                iconColor="#FFFFFF"
              />
              <StatCard
                title="Объявления"
                value={data.ads?.total || 0}
                subtitle={`${data.ads?.active || 0} активных`}
                icon={Package}
                gradient="linear-gradient(135deg, #34D399 0%, #10B981 100%)"
                iconColor="#FFFFFF"
              />
              <StatCard
                title="Продавцы"
                value={data.sellers?.total || 0}
                subtitle="Всего магазинов"
                icon={ShoppingBag}
                gradient="linear-gradient(135deg, #F472B6 0%, #EC4899 100%)"
                iconColor="#FFFFFF"
              />
              <StatCard
                title="Просмотры"
                value={data.engagement?.views || 0}
                subtitle={`${data.engagement?.favorites || 0} в избранном`}
                icon={Eye}
                gradient="linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)"
                iconColor="#FFFFFF"
              />
            </div>

            {data.sellers && (
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  padding: '16px',
                  marginBottom: 16,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Sparkles size={18} color="#4F46E5" />
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#1F2937' }}>
                    Типы продавцов
                  </span>
                </div>
                <ProgressBar
                  label="Магазины"
                  value={data.sellers.shops || 0}
                  total={data.sellers.total || 1}
                  color="#3B82F6"
                />
                <ProgressBar
                  label="Фермеры"
                  value={data.sellers.farmers || 0}
                  total={data.sellers.total || 1}
                  color="#10B981"
                />
                <ProgressBar
                  label="Блогеры"
                  value={data.sellers.bloggers || 0}
                  total={data.sellers.total || 1}
                  color="#EC4899"
                />
                <ProgressBar
                  label="Мастера"
                  value={data.sellers.artisans || 0}
                  total={data.sellers.total || 1}
                  color="#8B5CF6"
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <TrendingUp size={16} color="#10B981" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                    Топ категории
                  </span>
                </div>
                {data.topCategories?.length > 0 ? (
                  data.topCategories.slice(0, 5).map((cat, i) => (
                    <div
                      key={cat.name}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        borderBottom: i < 4 ? '1px solid #F3F4F6' : 'none',
                      }}
                    >
                      <span style={{ fontSize: 13, color: '#4B5563' }}>{cat.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>
                        {cat.count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>Нет данных</p>
                )}
              </div>

              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <MapPin size={16} color="#F59E0B" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                    Топ городов
                  </span>
                </div>
                {data.topCities?.length > 0 ? (
                  data.topCities.slice(0, 5).map((city, i) => (
                    <div
                      key={city.name}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        borderBottom: i < 4 ? '1px solid #F3F4F6' : 'none',
                      }}
                    >
                      <span style={{ fontSize: 13, color: '#4B5563' }}>{city.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>
                        {city.count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>Нет данных</p>
                )}
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                borderRadius: 16,
                padding: '20px',
                color: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BarChart3 size={24} color="#FFFFFF" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Активность</div>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>За выбранный период</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <Eye size={20} style={{ marginBottom: 4, opacity: 0.8 }} />
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{data.engagement?.views || 0}</div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>Просмотров</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Heart size={20} style={{ marginBottom: 4, opacity: 0.8 }} />
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{data.engagement?.favorites || 0}</div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>В избранном</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <MessageSquare size={20} style={{ marginBottom: 4, opacity: 0.8 }} />
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{data.engagement?.contacts || 0}</div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>Контактов</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#6B7280',
            }}
          >
            <BarChart3 size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
            <p>Нет данных для отображения</p>
          </div>
        )}
      </div>
    </div>
  );
}
