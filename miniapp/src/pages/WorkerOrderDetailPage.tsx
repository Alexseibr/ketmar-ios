import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Calendar, Star, MessageCircle, Send, Loader2, AlertCircle, CheckCircle, ChevronRight, Verified, User } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';

interface Order {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetFrom?: number;
  budgetTo?: number;
  budgetType: string;
  currency: string;
  location?: {
    city?: string;
    address?: string;
  };
  photos: string[];
  deadline?: string;
  urgency: string;
  status: string;
  responsesCount: number;
  maxResponses: number;
  viewsCount: number;
  isRemoteOk: boolean;
  materialsIncluded: boolean;
  createdAt: string;
  customer: {
    name: string;
    avatar?: string;
  };
  assignedWorker?: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
  };
}

interface WorkerResponse {
  id: string;
  message: string;
  priceOffer?: number;
  priceType: string;
  currency: string;
  estimatedDuration?: string;
  canStartAt?: string;
  materialsIncluded: boolean;
  status: string;
  createdAt: string;
  worker: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    reviewsCount: number;
    completedOrdersCount: number;
    isVerified: boolean;
    categories: string[];
  };
}

const URGENCY_LABELS: Record<string, { label: string; color: string }> = {
  urgent: { label: 'Срочно', color: '#EF4444' },
  high: { label: 'Важно', color: '#F97316' },
  normal: { label: 'Обычный', color: '#3B82F6' },
  low: { label: 'Не срочно', color: '#6B7280' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: 'Открыт', color: '#059669' },
  in_progress: { label: 'В работе', color: '#3B82F6' },
  completed: { label: 'Завершён', color: '#6B7280' },
  cancelled: { label: 'Отменён', color: '#EF4444' },
};

export default function WorkerOrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useUserStore((state) => state.user);

  const [order, setOrder] = useState<Order | null>(null);
  const [responses, setResponses] = useState<WorkerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [myWorker, setMyWorker] = useState<any>(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [responsePriceOffer, setResponsePriceOffer] = useState('');
  const [responseEstimatedDuration, setResponseEstimatedDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrder();
      fetchMyWorkerProfile();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      const [orderRes, responsesRes] = await Promise.all([
        fetch(`/api/worker-orders/${id}`),
        fetch(`/api/worker-orders/${id}/responses`),
      ]);

      const orderData = await orderRes.json();
      const responsesData = await responsesRes.json();

      setOrder(orderData.order);
      setResponses(responsesData.responses || []);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyWorkerProfile = async () => {
    if (!user) return;
    try {
      const params = new URLSearchParams();
      if (user._id) params.set('userId', user._id);
      if (user.telegramId) params.set('telegramId', user.telegramId.toString());

      const res = await fetch(`/api/workers/my/profile?${params.toString()}`);
      const data = await res.json();

      if (data.registered) {
        setMyWorker(data.worker);
      }
    } catch (error) {
      console.error('Error fetching my worker profile:', error);
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myWorker || !responseMessage) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/worker-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: id,
          workerId: myWorker.id,
          message: responseMessage,
          priceOffer: responsePriceOffer ? parseInt(responsePriceOffer) : undefined,
          estimatedDuration: responseEstimatedDuration || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowResponseForm(false);
        setResponseMessage('');
        setResponsePriceOffer('');
        setResponseEstimatedDuration('');
        fetchOrder();
      }
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const hasAlreadyResponded = myWorker && responses.some(r => r.worker.id === myWorker.id);

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

  if (!order) {
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
        <AlertCircle size={40} color="#EF4444" style={{ marginBottom: 16 }} />
        <p style={{ color: '#6B7280', marginBottom: 16 }}>Заказ не найден</p>
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

  const urgencyInfo = URGENCY_LABELS[order.urgency] || URGENCY_LABELS.normal;
  const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.open;

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
        background: '#fff',
        zIndex: 50,
        paddingTop: 'env(safe-area-inset-top)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          gap: 12,
        }}>
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
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1F2937', margin: 0, flex: 1 }}>
            Детали заказа
          </h1>
          <span style={{
            background: statusInfo.color,
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 8,
          }}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      <div style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 70px)',
        paddingBottom: 100,
        padding: 'calc(env(safe-area-inset-top) + 70px) 16px 100px',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1F2937', margin: 0, flex: 1 }}>
              {order.title}
            </h2>
            <span style={{
              background: urgencyInfo.color,
              color: '#fff',
              fontSize: 10,
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 6,
              marginLeft: 8,
              flexShrink: 0,
            }}>
              {urgencyInfo.label}
            </span>
          </div>

          <p style={{ fontSize: 14, color: '#4B5563', margin: '0 0 16px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {order.description}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            {(order.budgetFrom || order.budgetTo) && (
              <div style={{
                background: '#F0FDF4',
                padding: '8px 12px',
                borderRadius: 10,
              }}>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>Бюджет</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#059669' }}>
                  {order.budgetFrom && order.budgetTo
                    ? `${order.budgetFrom}–${order.budgetTo} ${order.currency}`
                    : order.budgetFrom
                      ? `от ${order.budgetFrom} ${order.currency}`
                      : `до ${order.budgetTo} ${order.currency}`
                  }
                </div>
              </div>
            )}
            {order.deadline && (
              <div style={{
                background: '#FEF3C7',
                padding: '8px 12px',
                borderRadius: 10,
              }}>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>Срок до</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#D97706', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={14} />
                  {new Date(order.deadline).toLocaleDateString('ru-RU')}
                </div>
              </div>
            )}
          </div>

          {order.location?.city && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <MapPin size={16} color="#6B7280" />
              <span style={{ fontSize: 14, color: '#6B7280' }}>
                {order.location.city}
                {order.location.address && `, ${order.location.address}`}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#9CA3AF' }}>
            <span>{order.viewsCount} просмотров</span>
            <span>•</span>
            <span>{order.responsesCount}/{order.maxResponses} откликов</span>
            <span>•</span>
            <span>{new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: order.customer.avatar
                ? `url(${order.customer.avatar}) center/cover`
                : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {!order.customer.avatar && (
                <User size={24} color="#fff" />
              )}
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>Заказчик</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1F2937' }}>
                {order.customer.name}
              </div>
            </div>
          </div>
        </div>

        {responses.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', marginBottom: 12 }}>
              Отклики ({responses.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {responses.map(response => (
                <div
                  key={response.id}
                  onClick={() => navigate(`/services-workers/worker/${response.worker.id}`)}
                  style={{
                    background: '#fff',
                    borderRadius: 14,
                    padding: 14,
                    cursor: 'pointer',
                    border: response.status === 'accepted' ? '2px solid #059669' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 11,
                      background: response.worker.avatar
                        ? `url(${response.worker.avatar}) center/cover`
                        : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {!response.worker.avatar && (
                        <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
                          {response.worker.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                          {response.worker.name}
                        </span>
                        {response.worker.isVerified && <Verified size={14} color="#4F46E5" />}
                        {response.status === 'accepted' && (
                          <CheckCircle size={14} color="#059669" />
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Star size={12} color="#F59E0B" fill="#F59E0B" />
                        <span style={{ fontSize: 12, color: '#6B7280' }}>
                          {response.worker.rating.toFixed(1)} ({response.worker.reviewsCount})
                        </span>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                          • {response.worker.completedOrdersCount} заказов
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={18} color="#9CA3AF" style={{ flexShrink: 0, alignSelf: 'center' }} />
                  </div>
                  <p style={{ fontSize: 13, color: '#4B5563', margin: '0 0 8px', lineHeight: 1.4 }}>
                    {response.message.length > 150 ? response.message.substring(0, 150) + '...' : response.message}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#6B7280' }}>
                    {response.priceOffer && (
                      <span style={{ fontWeight: 600, color: '#059669' }}>
                        {response.priceOffer} {response.currency}
                      </span>
                    )}
                    {response.estimatedDuration && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={12} />
                        {response.estimatedDuration}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {order.status === 'open' && myWorker && !hasAlreadyResponded && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 16,
          }}>
            {showResponseForm ? (
              <form onSubmit={handleSubmitResponse}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', marginBottom: 12 }}>
                  Ваш отклик
                </h3>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Опишите почему вы подходите для этого заказа..."
                  required
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid #E5E7EB',
                    fontSize: 14,
                    marginBottom: 12,
                    resize: 'vertical',
                  }}
                  data-testid="textarea-response"
                />
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <input
                    type="number"
                    value={responsePriceOffer}
                    onChange={(e) => setResponsePriceOffer(e.target.value)}
                    placeholder="Ваша цена (BYN)"
                    min={0}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: '1px solid #E5E7EB',
                      fontSize: 14,
                    }}
                    data-testid="input-price-offer"
                  />
                  <input
                    type="text"
                    value={responseEstimatedDuration}
                    onChange={(e) => setResponseEstimatedDuration(e.target.value)}
                    placeholder="Срок (напр. 2 дня)"
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: '1px solid #E5E7EB',
                      fontSize: 14,
                    }}
                    data-testid="input-duration"
                  />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setShowResponseForm(false)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: 12,
                      border: '1px solid #E5E7EB',
                      background: '#fff',
                      color: '#6B7280',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !responseMessage}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: 12,
                      border: 'none',
                      background: submitting || !responseMessage ? '#D1D5DB' : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: submitting ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                    data-testid="button-submit-response"
                  >
                    {submitting ? (
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>
                        <Send size={16} />
                        Отправить
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowResponseForm(true)}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                data-testid="button-respond"
              >
                <MessageCircle size={18} />
                Откликнуться на заказ
              </button>
            )}
          </div>
        )}

        {hasAlreadyResponded && (
          <div style={{
            background: '#F0FDF4',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <CheckCircle size={24} color="#059669" />
            <span style={{ fontSize: 14, color: '#059669', fontWeight: 500 }}>
              Вы уже откликнулись на этот заказ
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
