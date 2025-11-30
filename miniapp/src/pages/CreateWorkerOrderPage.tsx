import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Camera, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import useGeoStore from '@/store/useGeoStore';

interface Category {
  slug: string;
  name: string;
  icon: string;
  parentSlug?: string;
}

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Не срочно', color: '#6B7280' },
  { value: 'normal', label: 'Обычный', color: '#3B82F6' },
  { value: 'high', label: 'Важно', color: '#F97316' },
  { value: 'urgent', label: 'Срочно', color: '#EF4444' },
];

const BUDGET_TYPES = [
  { value: 'negotiable', label: 'Договорная' },
  { value: 'fixed', label: 'Фиксированная' },
  { value: 'hourly', label: 'Почасовая' },
];

export default function CreateWorkerOrderPage() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const { coords } = useGeoStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budgetType, setBudgetType] = useState('negotiable');
  const [budgetFrom, setBudgetFrom] = useState('');
  const [budgetTo, setBudgetTo] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [deadline, setDeadline] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [materialsIncluded, setMaterialsIncluded] = useState(false);
  const [isRemoteOk, setIsRemoteOk] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/workers/categories/flat');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !title || !description) {
      return;
    }

    setSubmitting(true);

    try {
      const orderData: any = {
        category,
        title,
        description,
        budgetType,
        urgency,
        materialsIncluded,
        isRemoteOk,
      };

      if (user?._id) {
        orderData.customerId = user._id;
      }
      if (user?.telegramId) {
        orderData.customerTelegramId = user.telegramId;
      }

      if (budgetFrom) orderData.budgetFrom = parseInt(budgetFrom);
      if (budgetTo) orderData.budgetTo = parseInt(budgetTo);
      if (deadline) orderData.deadline = deadline;
      if (phone) orderData.customerPhone = phone;

      if (city || coords) {
        orderData.location = {
          city: city || undefined,
          address: address || undefined,
          lat: coords?.lat,
          lng: coords?.lng,
        };
      }

      const res = await fetch('/api/worker-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/services-workers');
        }, 1500);
      }
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
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
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          <CheckCircle size={40} color="#fff" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1F2937', marginBottom: 8 }}>
          Заказ создан!
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
          Мастера скоро откликнутся на ваш заказ
        </p>
      </div>
    );
  }

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
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1F2937', margin: 0 }}>
            Создать заказ
          </h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 70px)',
          paddingBottom: 100,
          padding: 'calc(env(safe-area-inset-top) + 70px) 16px 100px',
        }}
      >
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
            Категория работ *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              fontSize: 15,
              color: '#1F2937',
              background: '#fff',
            }}
            data-testid="select-category"
          >
            <option value="">Выберите категорию</option>
            {categories.map(cat => (
              <option key={cat.slug} value={cat.slug}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
            Название заказа *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Положить плитку в ванной"
            required
            maxLength={200}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              fontSize: 15,
              color: '#1F2937',
            }}
            data-testid="input-title"
          />
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
            Описание задачи *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Опишите подробно что нужно сделать..."
            required
            maxLength={2000}
            rows={5}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              fontSize: 15,
              color: '#1F2937',
              resize: 'vertical',
            }}
            data-testid="textarea-description"
          />
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 12 }}>
            Срочность
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {URGENCY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setUrgency(opt.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: urgency === opt.value ? `2px solid ${opt.color}` : '2px solid #E5E7EB',
                  background: urgency === opt.value ? opt.color + '15' : '#fff',
                  color: urgency === opt.value ? opt.color : '#6B7280',
                  fontWeight: 500,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
                data-testid={`urgency-${opt.value}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 12 }}>
            Бюджет
          </label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {BUDGET_TYPES.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBudgetType(opt.value)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: budgetType === opt.value ? '2px solid #4F46E5' : '2px solid #E5E7EB',
                  background: budgetType === opt.value ? '#EEF2FF' : '#fff',
                  color: budgetType === opt.value ? '#4F46E5' : '#6B7280',
                  fontWeight: 500,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
                data-testid={`budget-${opt.value}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {budgetType !== 'negotiable' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <input
                  type="number"
                  value={budgetFrom}
                  onChange={(e) => setBudgetFrom(e.target.value)}
                  placeholder="От"
                  min={0}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid #E5E7EB',
                    fontSize: 15,
                  }}
                  data-testid="input-budget-from"
                />
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="number"
                  value={budgetTo}
                  onChange={(e) => setBudgetTo(e.target.value)}
                  placeholder="До"
                  min={0}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid #E5E7EB',
                    fontSize: 15,
                  }}
                  data-testid="input-budget-to"
                />
              </div>
              <span style={{ alignSelf: 'center', color: '#9CA3AF', fontSize: 14 }}>BYN</span>
            </div>
          )}
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
            Срок выполнения
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="#9CA3AF" />
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid #E5E7EB',
                fontSize: 15,
              }}
              data-testid="input-deadline"
            />
          </div>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
            Адрес выполнения
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <MapPin size={18} color="#9CA3AF" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Город"
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid #E5E7EB',
                fontSize: 15,
              }}
              data-testid="input-city"
            />
          </div>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Улица, дом"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              fontSize: 15,
            }}
            data-testid="input-address"
          />
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
            Телефон для связи
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+375 29 123 45 67"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              fontSize: 15,
            }}
            data-testid="input-phone"
          />
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
        }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 12 }}>
            Дополнительно
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={materialsIncluded}
                onChange={(e) => setMaterialsIncluded(e.target.checked)}
                style={{ width: 20, height: 20 }}
                data-testid="checkbox-materials"
              />
              <span style={{ fontSize: 14, color: '#4B5563' }}>Материалы включены в стоимость</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isRemoteOk}
                onChange={(e) => setIsRemoteOk(e.target.checked)}
                style={{ width: 20, height: 20 }}
                data-testid="checkbox-remote"
              />
              <span style={{ fontSize: 14, color: '#4B5563' }}>Возможно удалённое выполнение</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !category || !title || !description}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 14,
            border: 'none',
            background: submitting || !category || !title || !description
              ? '#D1D5DB'
              : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 16,
            cursor: submitting ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          data-testid="button-submit"
        >
          {submitting ? (
            <>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              Создание...
            </>
          ) : (
            'Опубликовать заказ'
          )}
        </button>
      </form>
    </div>
  );
}
