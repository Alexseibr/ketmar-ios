import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/useUserStore';
import { useQuery } from '@tanstack/react-query';
import http from '@/api/http';
import ScreenLayout from '@/components/layout/ScreenLayout';
import { useFormatPrice } from '@/hooks/useFormatPrice';
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  Save,
  Camera,
  MapPin,
  Tag,
  FileText,
  Phone
} from 'lucide-react';
import { Ad, CategoryNode } from '@/types';

interface EditFormData {
  title: string;
  description: string;
  price: string;
  categoryId: string;
  subcategoryId: string;
  contactPhone: string;
  contactUsername: string;
}

export default function AdEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const { formatCard } = useFormatPrice();
  
  const [formData, setFormData] = useState<EditFormData>({
    title: '',
    description: '',
    price: '',
    categoryId: '',
    subcategoryId: '',
    contactPhone: '',
    contactUsername: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [ad, setAd] = useState<Ad | null>(null);

  const { data: categoriesData } = useQuery<CategoryNode[]>({
    queryKey: ['/api/categories'],
    staleTime: 1000 * 60 * 30,
  });
  const categories = categoriesData || [];

  useEffect(() => {
    if (id && user?.telegramId) {
      loadAd();
    }
  }, [id, user]);

  const loadAd = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await http.get(`/api/ads/${id}`);
      const adData = response.data.ad || response.data;
      
      if (Number(adData.sellerTelegramId) !== Number(user?.telegramId)) {
        setError('Вы не можете редактировать это объявление');
        return;
      }
      
      setAd(adData);
      setFormData({
        title: adData.title || '',
        description: adData.description || '',
        price: String(adData.price || ''),
        categoryId: adData.categoryId || '',
        subcategoryId: adData.subcategoryId || '',
        contactPhone: adData.contactPhone || '',
        contactUsername: adData.contactUsername || '',
      });
    } catch (err: any) {
      console.error('Error loading ad:', err);
      setError(err.response?.data?.message || 'Не удалось загрузить объявление');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof EditFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!id || saving) return;
    
    if (!formData.title.trim()) {
      setError('Введите название');
      return;
    }
    if (!formData.price || parseFloat(formData.price) < 0) {
      setError('Введите корректную цену');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      await http.patch(`/api/ads/${id}`, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        categoryId: formData.categoryId,
        subcategoryId: formData.subcategoryId || formData.categoryId,
        contactPhone: formData.contactPhone || undefined,
        contactUsername: formData.contactUsername || undefined,
        sellerTelegramId: user?.telegramId,
      });
      
      navigate('/my-ads');
    } catch (err: any) {
      console.error('Error updating ad:', err);
      setError(err.response?.data?.message || 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  const selectedCategory = categories.find(c => c.slug === formData.categoryId);
  const subcategories = selectedCategory?.subcategories || [];

  const headerElement = (
    <div style={{
      padding: '16px 20px',
      borderBottom: '1px solid #F0F2F5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
          Редактировать
        </h1>
      </div>
      <button
        onClick={handleSubmit}
        disabled={saving}
        style={{
          padding: '10px 18px',
          background: '#3A7BFF',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 600,
          cursor: saving ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
        data-testid="button-save"
      >
        {saving ? (
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <Save size={18} />
        )}
        Сохранить
      </button>
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
          <p style={{ color: '#6B7280', fontSize: 15 }}>Загрузка...</p>
        </div>
      </ScreenLayout>
    );
  }

  if (error && !ad) {
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
            {error}
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
        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#FEE2E2',
            border: '1px solid #FECACA',
            borderRadius: 12,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <AlertCircle size={18} color="#DC2626" />
            <span style={{ fontSize: 14, color: '#991B1B' }}>{error}</span>
          </div>
        )}

        {/* Photos Preview */}
        {ad?.photos && ad.photos.length > 0 && (
          <div style={{
            marginBottom: 20,
          }}>
            <label style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: '#374151',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Camera size={18} color="#6B7280" />
              Фотографии
            </label>
            <div style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 8,
            }}>
              {ad.photos.map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`Фото ${idx + 1}`}
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 12,
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
              Для изменения фото создайте новое объявление
            </p>
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: '#374151',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <FileText size={18} color="#6B7280" />
            Название *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Введите название"
            maxLength={100}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: 12,
              fontSize: 15,
              color: '#1F2937',
              outline: 'none',
            }}
            data-testid="input-title"
          />
        </div>

        {/* Price */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: '#374151',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Tag size={18} color="#6B7280" />
            Цена *
          </label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => handleChange('price', e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
            style={{
              width: '100%',
              padding: '14px 16px',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: 12,
              fontSize: 15,
              color: '#1F2937',
              outline: 'none',
            }}
            data-testid="input-price"
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: '#374151',
            marginBottom: 8,
            display: 'block',
          }}>
            Категория
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => {
              handleChange('categoryId', e.target.value);
              handleChange('subcategoryId', '');
            }}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: 12,
              fontSize: 15,
              color: '#1F2937',
              outline: 'none',
            }}
            data-testid="select-category"
          >
            <option value="">Выберите категорию</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Subcategory */}
        {subcategories.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: '#374151',
              marginBottom: 8,
              display: 'block',
            }}>
              Подкатегория
            </label>
            <select
              value={formData.subcategoryId}
              onChange={(e) => handleChange('subcategoryId', e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                fontSize: 15,
                color: '#1F2937',
                outline: 'none',
              }}
              data-testid="select-subcategory"
            >
              <option value="">Выберите подкатегорию</option>
              {subcategories.map((sub) => (
                <option key={sub.slug} value={sub.slug}>{sub.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: '#374151',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <FileText size={18} color="#6B7280" />
            Описание
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Добавьте описание..."
            rows={4}
            maxLength={2000}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: 12,
              fontSize: 15,
              color: '#1F2937',
              outline: 'none',
              resize: 'vertical',
              minHeight: 100,
            }}
            data-testid="input-description"
          />
        </div>

        {/* Contact Info */}
        <div style={{
          background: '#F8FAFC',
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
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
            <Phone size={18} color="#6B7280" />
            Контакты
          </h3>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ 
              fontSize: 13, 
              color: '#6B7280',
              marginBottom: 4,
              display: 'block',
            }}>
              Телефон
            </label>
            <input
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              placeholder="+375..."
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 10,
                fontSize: 14,
                color: '#1F2937',
                outline: 'none',
              }}
              data-testid="input-phone"
            />
          </div>
          
          <div>
            <label style={{ 
              fontSize: 13, 
              color: '#6B7280',
              marginBottom: 4,
              display: 'block',
            }}>
              Telegram username
            </label>
            <input
              type="text"
              value={formData.contactUsername}
              onChange={(e) => handleChange('contactUsername', e.target.value)}
              placeholder="@username"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 10,
                fontSize: 14,
                color: '#1F2937',
                outline: 'none',
              }}
              data-testid="input-username"
            />
          </div>
        </div>

        {/* Location Info (read-only) */}
        {ad?.city && (
          <div style={{
            background: '#F0F9FF',
            borderRadius: 12,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <MapPin size={18} color="#0284C7" />
            <div>
              <div style={{ fontSize: 14, color: '#0284C7', fontWeight: 500 }}>
                {ad.city}{(ad as any).district ? `, ${(ad as any).district}` : ''}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>
                Для изменения локации создайте новое объявление
              </div>
            </div>
          </div>
        )}
      </div>
    </ScreenLayout>
  );
}
