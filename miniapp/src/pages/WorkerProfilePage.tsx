import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, Phone, MessageCircle, Verified, ChevronRight, Image, Calendar, Award, Loader2 } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';

interface Worker {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
  categories: string[];
  categoryNames: { slug: string; name: string; icon: string }[];
  experienceYears: number;
  description?: string;
  priceFrom?: number;
  priceTo?: number;
  priceUnit: string;
  currency: string;
  location?: { city?: string; address?: string };
  rating: number;
  reviewsCount: number;
  reviewSummary?: { quality: number; punctuality: number; communication: number };
  completedOrdersCount: number;
  responseRate: number;
  avgResponseTimeMinutes?: number;
  tags: string[];
  isVerified: boolean;
  isPro: boolean;
  isTeam: boolean;
  teamSize?: number;
  status: string;
  lastActiveAt: string;
  viewsCount: number;
}

interface PortfolioItem {
  _id: string;
  title: string;
  description?: string;
  category: string;
  photos: string[];
  beforePhoto?: string;
  afterPhoto?: string;
  duration?: string;
  cost?: number;
  completedAt: string;
}

interface Review {
  _id: string;
  rating: number;
  quality: number;
  punctuality: number;
  communication: number;
  text?: string;
  photos: string[];
  createdAt: string;
  customerId: { firstName?: string; lastName?: string; avatar?: string };
}

const PRICE_UNIT_LABELS: Record<string, string> = {
  hour: 'час',
  day: 'день',
  project: 'проект',
  m2: 'м²',
};

export default function WorkerProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useUserStore((state) => state.user);

  const [worker, setWorker] = useState<Worker | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'reviews'>('about');

  useEffect(() => {
    if (id) {
      fetchWorker();
    }
  }, [id]);

  const fetchWorker = async () => {
    try {
      const res = await fetch(`/api/workers/${id}`);
      const data = await res.json();
      setWorker(data.worker);
      setPortfolio(data.portfolio || []);
      setReviews(data.reviews || []);
      setReviewStats(data.reviewStats);
    } catch (error) {
      console.error('Error fetching worker:', error);
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

  const formatLastActive = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 5) return 'Онлайн';
    if (minutes < 60) return `Был ${minutes} мин назад`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Был ${hours} ч назад`;
    const days = Math.floor(hours / 24);
    return `Был ${days} дн назад`;
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F3F4F6',
      }}>
        <Loader2 size={32} style={{ color: '#4F46E5', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!worker) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F3F4F6',
        padding: 20,
      }}>
        <p style={{ color: '#6B7280', marginBottom: 16 }}>Мастер не найден</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '12px 24px',
            borderRadius: 12,
            border: 'none',
            background: '#4F46E5',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Назад
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#F3F4F6',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 80,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
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
        </div>
      </div>

      <div style={{
        marginTop: -60,
        padding: '0 16px',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: worker.avatar ? `url(${worker.avatar}) center/cover` : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '3px solid #fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              {!worker.avatar && (
                <span style={{ color: '#fff', fontSize: 28, fontWeight: 600 }}>
                  {worker.name.charAt(0)}
                </span>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1F2937', margin: 0 }}>
                  {worker.name}
                </h1>
                {worker.isVerified && <Verified size={18} color="#4F46E5" />}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                {worker.isPro && (
                  <span style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                  }}>
                    PRO
                  </span>
                )}
                {worker.isTeam && (
                  <span style={{
                    background: '#E0E7FF',
                    color: '#4F46E5',
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 6,
                  }}>
                    Бригада {worker.teamSize} чел.
                  </span>
                )}
                <span style={{ fontSize: 12, color: '#6B7280' }}>
                  {formatLastActive(worker.lastActiveAt)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Star size={16} color="#F59E0B" fill="#F59E0B" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                    {worker.rating.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                    ({worker.reviewsCount})
                  </span>
                </div>
                <span style={{ fontSize: 13, color: '#6B7280' }}>
                  {worker.completedOrdersCount} заказов
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {worker.categoryNames.map((cat, i) => (
              <span
                key={i}
                style={{
                  background: '#F3F4F6',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#4B5563',
                }}
              >
                {cat.icon} {cat.name}
              </span>
            ))}
          </div>

          <div style={{
            background: '#F0FDF4',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#059669', marginBottom: 4 }}>
              {formatPrice(worker.priceFrom, worker.priceTo, worker.priceUnit, worker.currency)}
            </div>
            {worker.location?.city && (
              <div style={{ fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={14} />
                {worker.location.city}
                {worker.location.address && `, ${worker.location.address}`}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => navigate(`/chat/worker-${worker.id}`)}
              style={{
                flex: 1,
                padding: '14px 20px',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              data-testid="button-chat"
            >
              <MessageCircle size={18} />
              Написать
            </button>
            {worker.phone && (
              <a
                href={`tel:${worker.phone}`}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  border: '2px solid #4F46E5',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                }}
                data-testid="button-call"
              >
                <Phone size={20} color="#4F46E5" />
              </a>
            )}
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
        }}>
          {(['about', 'portfolio', 'reviews'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 12,
                border: 'none',
                background: activeTab === tab ? '#4F46E5' : '#fff',
                color: activeTab === tab ? '#fff' : '#6B7280',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
              data-testid={`tab-${tab}`}
            >
              {tab === 'about' && 'О мастере'}
              {tab === 'portfolio' && `Работы (${portfolio.length})`}
              {tab === 'reviews' && `Отзывы (${worker.reviewsCount})`}
            </button>
          ))}
        </div>

        {activeTab === 'about' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {worker.description && (
              <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: 16,
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>
                  О себе
                </h3>
                <p style={{ fontSize: 14, color: '#4B5563', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {worker.description}
                </p>
              </div>
            )}

            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 16,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 12 }}>
                Статистика
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div style={{ background: '#F3F4F6', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#4F46E5' }}>
                    {worker.experienceYears}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>лет опыта</div>
                </div>
                <div style={{ background: '#F3F4F6', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>
                    {worker.responseRate}%
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>отклик</div>
                </div>
                <div style={{ background: '#F3F4F6', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#F59E0B' }}>
                    {worker.completedOrdersCount}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>заказов</div>
                </div>
                <div style={{ background: '#F3F4F6', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#6366F1' }}>
                    {worker.viewsCount}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>просмотров</div>
                </div>
              </div>
            </div>

            {worker.reviewSummary && (
              <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: 16,
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 12 }}>
                  Оценки
                </h3>
                {(['quality', 'punctuality', 'communication'] as const).map(key => (
                  <div key={key} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: '#6B7280' }}>
                        {key === 'quality' && 'Качество работы'}
                        {key === 'punctuality' && 'Пунктуальность'}
                        {key === 'communication' && 'Коммуникация'}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>
                        {worker.reviewSummary![key].toFixed(1)}
                      </span>
                    </div>
                    <div style={{ background: '#E5E7EB', borderRadius: 4, height: 6 }}>
                      <div style={{
                        width: `${(worker.reviewSummary![key] / 5) * 100}%`,
                        background: '#4F46E5',
                        borderRadius: 4,
                        height: '100%',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {worker.tags.length > 0 && (
              <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: 16,
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 12 }}>
                  Преимущества
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {worker.tags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        background: '#E0E7FF',
                        color: '#4F46E5',
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {portfolio.length === 0 ? (
              <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: 32,
                textAlign: 'center',
              }}>
                <Image size={40} color="#9CA3AF" style={{ marginBottom: 12 }} />
                <p style={{ color: '#6B7280', fontSize: 14 }}>
                  Пока нет работ в портфолио
                </p>
              </div>
            ) : (
              portfolio.map(item => (
                <div
                  key={item._id}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    overflow: 'hidden',
                  }}
                >
                  {item.photos.length > 0 && (
                    <div style={{
                      height: 180,
                      background: `url(${item.photos[0]}) center/cover`,
                    }} />
                  )}
                  <div style={{ padding: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1F2937', margin: '0 0 6px' }}>
                      {item.title}
                    </h3>
                    {item.description && (
                      <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 8px' }}>
                        {item.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#9CA3AF' }}>
                      {item.duration && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={12} />
                          {item.duration}
                        </span>
                      )}
                      {item.cost && (
                        <span>{item.cost} BYN</span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Calendar size={12} />
                        {new Date(item.completedAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reviews.length === 0 ? (
              <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: 32,
                textAlign: 'center',
              }}>
                <Award size={40} color="#9CA3AF" style={{ marginBottom: 12 }} />
                <p style={{ color: '#6B7280', fontSize: 14 }}>
                  Пока нет отзывов
                </p>
              </div>
            ) : (
              reviews.map(review => (
                <div
                  key={review._id}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 16,
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: review.customerId?.avatar
                        ? `url(${review.customerId.avatar}) center/cover`
                        : '#E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {!review.customerId?.avatar && (
                        <span style={{ color: '#9CA3AF', fontSize: 16 }}>
                          {(review.customerId?.firstName || 'A').charAt(0)}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                        {review.customerId?.firstName || 'Аноним'} {review.customerId?.lastName || ''}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            size={12}
                            color="#F59E0B"
                            fill={star <= review.rating ? '#F59E0B' : 'none'}
                          />
                        ))}
                        <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>
                          {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.text && (
                    <p style={{ fontSize: 13, color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
                      {review.text}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
