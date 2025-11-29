import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/useUserStore';
import http from '@/api/http';
import ScreenLayout from '@/components/layout/ScreenLayout';
import { 
  ArrowLeft, 
  Eye, 
  MessageCircle, 
  Heart, 
  Calendar, 
  TrendingUp, 
  Loader2, 
  AlertCircle,
  Lightbulb,
  Clock,
  RefreshCw
} from 'lucide-react';

interface ContactStats {
  total: number;
  byChannel?: {
    telegram?: number;
    phone?: number;
    instagram?: number;
    whatsapp?: number;
    chat?: number;
  };
}

interface Recommendation {
  type: string;
  priority: string;
  icon: string;
  title: string;
  message: string;
  action?: string;
}

interface AdStats {
  adId: string;
  title: string;
  status?: string;
  views: number;
  viewsTotal: number;
  viewsToday: number;
  impressions?: number;
  impressionsToday?: number;
  contactClicks?: number;
  contacts: ContactStats | number;
  favorites?: number;
  favoritesCount?: number;
  daysActive: number;
  daysLeft: number | null;
  expiresAt: string | null;
  lifetimeType?: string;
  recommendations: Recommendation[];
}

export default function AdStatsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const [stats, setStats] = useState<AdStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [extending, setExtending] = useState(false);

  useEffect(() => {
    if (id && user?.telegramId) {
      loadStats();
    }
  }, [id, user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await http.get(`/api/ads/stats/${id}`);
      const data = response.data;
      if (data.stats) {
        setStats({
          ...data.stats,
          recommendations: data.recommendations || [],
        });
      } else if (data.data) {
        setStats(data.data);
      } else {
        throw new Error('Неверный формат ответа');
      }
    } catch (err: any) {
      console.error('Error loading stats:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Не удалось загрузить статистику');
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async () => {
    if (!id || extending) return;
    try {
      setExtending(true);
      await http.post(`/api/ads/${id}/extend`);
      await loadStats();
    } catch (err: any) {
      console.error('Error extending ad:', err);
      alert(err.response?.data?.message || 'Не удалось продлить объявление');
    } finally {
      setExtending(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Не указано';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getLifetimeLabel = (type: string) => {
    switch (type) {
      case 'perishable_daily': return '1 день';
      case 'fast': return '7 дней';
      case 'medium': return '14 дней';
      case 'long': return '30 дней';
      default: return type;
    }
  };

  const headerElement = (
    <div style={{
      padding: '16px 20px',
      borderBottom: '1px solid #F0F2F5',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          width: 36,
          height: 36,
          background: '#F5F6F8',
          border: 'none',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        data-testid="button-back"
      >
        <ArrowLeft size={20} color="#374151" />
      </button>
      <h1 style={{ 
        fontSize: 20, 
        fontWeight: 700, 
        color: '#1F2937',
        margin: 0,
      }}>
        Статистика объявления
      </h1>
    </div>
  );

  if (loading) {
    return (
      <ScreenLayout header={headerElement} showBottomNav={false}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: 300,
          flexDirection: 'column',
          gap: 16,
        }}>
          <Loader2 size={36} color="#3A7BFF" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#6B7280', fontSize: 15 }}>Загрузка статистики...</p>
        </div>
      </ScreenLayout>
    );
  }

  if (error || !stats) {
    return (
      <ScreenLayout header={headerElement} showBottomNav={false}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: 300,
          flexDirection: 'column',
          gap: 16,
          padding: 24,
        }}>
          <AlertCircle size={48} color="#DC2626" />
          <p style={{ color: '#DC2626', fontSize: 15, textAlign: 'center' }}>
            {error || 'Не удалось загрузить статистику'}
          </p>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 24px',
              background: '#3A7BFF',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Назад
          </button>
        </div>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout header={headerElement} showBottomNav={false}>
      <div style={{ padding: 16 }}>
        {/* Title */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #F0F2F5',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
        }}>
          <h2 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: '#1F2937',
            margin: '0 0 8px',
          }}>
            {stats.title}
          </h2>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            flexWrap: 'wrap',
          }}>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 6,
              background: stats.status === 'active' ? '#DCFCE7' : '#FEE2E2',
              color: stats.status === 'active' ? '#16A34A' : '#DC2626',
            }}>
              {stats.status === 'active' ? 'Активно' : stats.status === 'expired' ? 'Истекло' : stats.status}
            </span>
            <span style={{ 
              fontSize: 13, 
              color: '#6B7280',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <Clock size={14} />
              Срок жизни: {getLifetimeLabel(stats.lifetimeType || 'medium')}
            </span>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 16,
        }}>
          <StatCard
            icon={<Eye size={24} color="#3A7BFF" />}
            label="Всего просмотров"
            value={stats.viewsTotal}
            bg="#EBF5FF"
          />
          <StatCard
            icon={<TrendingUp size={24} color="#22C55E" />}
            label="Сегодня"
            value={stats.viewsToday}
            bg="#DCFCE7"
          />
          <StatCard
            icon={<MessageCircle size={24} color="#F59E0B" />}
            label="Контактов"
            value={typeof stats.contacts === 'number' ? stats.contacts : stats.contacts?.total || 0}
            bg="#FEF3C7"
          />
          <StatCard
            icon={<Heart size={24} color="#EC4899" />}
            label="В избранном"
            value={stats.favorites || stats.favoritesCount || 0}
            bg="#FCE7F3"
          />
        </div>

        {/* Lifecycle Info */}
        <div style={{
          background: '#F8FAFC',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
        }}>
          <h3 style={{ 
            fontSize: 15, 
            fontWeight: 600, 
            color: '#374151',
            margin: '0 0 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Calendar size={18} color="#6B7280" />
            Жизненный цикл
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#6B7280' }}>Активно дней</span>
              <span style={{ color: '#1F2937', fontWeight: 500 }}>{stats.daysActive}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#6B7280' }}>Осталось дней</span>
              <span style={{ 
                color: (stats.daysLeft ?? 0) <= 1 ? '#DC2626' : (stats.daysLeft ?? 0) <= 3 ? '#F59E0B' : '#22C55E', 
                fontWeight: 500 
              }}>
                {stats.daysLeft ?? 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#6B7280' }}>Истекает</span>
              <span style={{ color: '#1F2937', fontWeight: 500 }}>{formatDate(stats.expiresAt)}</span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {stats.recommendations && stats.recommendations.length > 0 && (
          <div style={{
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}>
            <h3 style={{ 
              fontSize: 15, 
              fontWeight: 600, 
              color: '#92400E',
              margin: '0 0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Lightbulb size={18} color="#F59E0B" />
              Рекомендации
            </h3>
            <ul style={{ 
              margin: 0, 
              paddingLeft: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              {stats.recommendations.map((rec, idx) => (
                <li key={idx} style={{ fontSize: 14, color: '#78350F', lineHeight: 1.5 }}>
                  {typeof rec === 'string' ? rec : `${rec.icon || ''} ${rec.title}: ${rec.message}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Extend Button */}
        {stats.status === 'active' && (stats.daysLeft ?? 0) <= 3 && (
          <button
            onClick={handleExtend}
            disabled={extending}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: '#3A7BFF',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 600,
              cursor: extending ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 16,
            }}
            data-testid="button-extend-ad"
          >
            {extending ? (
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <RefreshCw size={20} />
            )}
            Продлить объявление
          </button>
        )}

        {/* Expired - Republish */}
        {stats.status === 'expired' && (
          <button
            onClick={handleExtend}
            disabled={extending}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: '#22C55E',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 600,
              cursor: extending ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 16,
            }}
            data-testid="button-republish-ad"
          >
            {extending ? (
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <RefreshCw size={20} />
            )}
            Опубликовать заново
          </button>
        )}
      </div>
    </ScreenLayout>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}

function StatCard({ icon, label, value, bg }: StatCardProps) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #F0F2F5',
      borderRadius: 14,
      padding: 16,
    }}>
      <div style={{
        width: 48,
        height: 48,
        background: bg,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: '#6B7280' }}>
        {label}
      </div>
    </div>
  );
}
