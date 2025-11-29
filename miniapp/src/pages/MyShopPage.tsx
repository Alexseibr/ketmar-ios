import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Store,
  Tractor,
  Camera,
  Palette,
  Check,
  Loader2,
  ChevronRight,
  MapPin,
  Phone,
  AtSign,
  FileText,
  AlertCircle,
  Sparkles,
  Clock,
  CheckCircle,
  Info,
  X,
  Globe,
  Send,
  Instagram,
  Video,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUserStore } from '@/store/useUserStore';
import { usePlatform } from '@/platform/PlatformProvider';
import http from '@/api/http';
import ScreenLayout from '@/components/layout/ScreenLayout';

type ShopRole = 'SHOP' | 'FARMER' | 'BLOGGER' | 'ARTISAN';

interface SellerProfile {
  _id: string;
  name: string;
  slug?: string;
  avatar?: string;
  isFarmer?: boolean;
  role?: ShopRole;
  shopRole?: ShopRole;
  description?: string;
  phone?: string;
  instagram?: string;
  telegramUsername?: string;
  address?: string;
  city?: string;
  isVerified?: boolean;
  messengers?: {
    telegram?: string;
    viber?: string;
    whatsapp?: string;
  };
  socials?: {
    tiktok?: string;
    youtube?: string;
    website?: string;
  };
}

interface RoleConfig {
  key: ShopRole;
  title: string;
  subtitle: string;
  icon: typeof Store;
  gradient: string;
  iconBgColor: string;
  borderColor: string;
}

const ROLE_CONFIGS: RoleConfig[] = [
  {
    key: 'SHOP',
    title: 'Магазин',
    subtitle: 'Розничная торговля',
    icon: Store,
    gradient: 'linear-gradient(135deg, #3B73FC 0%, #2563EB 100%)',
    iconBgColor: '#3B73FC',
    borderColor: '#3B73FC',
  },
  {
    key: 'FARMER',
    title: 'Фермер',
    subtitle: 'Сельхозпродукция',
    icon: Tractor,
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    iconBgColor: '#059669',
    borderColor: '#059669',
  },
  {
    key: 'BLOGGER',
    title: 'Авторский бренд',
    subtitle: 'Контент и реклама',
    icon: Camera,
    gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
    iconBgColor: '#EC4899',
    borderColor: '#EC4899',
  },
  {
    key: 'ARTISAN',
    title: 'Ремесленник',
    subtitle: 'Ручная работа',
    icon: Palette,
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    iconBgColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
];

const ROLE_LABELS: Record<ShopRole, { emoji: string; label: string }> = {
  SHOP: { emoji: '🏪', label: 'Магазин' },
  FARMER: { emoji: '🌾', label: 'Фермер' },
  BLOGGER: { emoji: '📸', label: 'Авторский бренд' },
  ARTISAN: { emoji: '🎨', label: 'Ремесленник' },
};

const ROLE_INFO: Record<ShopRole, {
  title: string;
  description: string;
  features: string[];
  examples: string[];
  categories: string[];
}> = {
  SHOP: {
    title: 'Магазин',
    description: 'Подходит для розничных продавцов, интернет-магазинов и точек продаж. Идеально для продажи готовых товаров массового потребления.',
    features: [
      'Каталог товаров с ценами',
      'Управление заказами',
      'Аналитика продаж',
      'Участие в городских ярмарках',
    ],
    examples: ['Магазин одежды', 'Магазин электроники', 'Магазин косметики', 'Продуктовый магазин'],
    categories: ['Одежда и обувь', 'Техника', 'Косметика', 'Товары для дома', 'Продукты питания'],
  },
  FARMER: {
    title: 'Фермер',
    description: 'Для производителей сельскохозяйственной продукции. Продавайте свежие продукты напрямую покупателям.',
    features: [
      'Сезонные ярмарки урожая',
      'Карта фермерских хозяйств',
      'Рекомендации по выращиванию',
      'Прямые продажи без посредников',
    ],
    examples: ['Фермерское хозяйство', 'Пасека', 'Молочная ферма', 'Овощеводство'],
    categories: ['Овощи и фрукты', 'Молоко и молочка', 'Мясо и птица', 'Яйца', 'Мёд', 'Ягоды'],
  },
  BLOGGER: {
    title: 'Авторский бренд',
    description: 'Для блогеров, инфлюенсеров и создателей уникального контента. Продвигайте свой личный бренд через соцсети.',
    features: [
      'Интеграция с Instagram',
      'Статистика переходов в соцсети',
      'Уникальные авторские товары',
      'Публикации и посты',
    ],
    examples: ['Beauty-блогер', 'Кондитер в Instagram', 'Автор курсов', 'Дизайнер одежды'],
    categories: ['Авторская выпечка', 'Пошив одежды', 'Beauty-услуги', 'Курсы и обучение', 'Handmade premium'],
  },
  ARTISAN: {
    title: 'Ремесленник',
    description: 'Для мастеров ручной работы и создателей уникальных изделий. Продавайте хендмейд и авторские работы.',
    features: [
      'Участие в ярмарках handmade',
      'Витрина уникальных изделий',
      'Индивидуальные заказы',
      'Категории для мастеров',
    ],
    examples: ['Гончар', 'Ювелир', 'Мастер по дереву', 'Свечник'],
    categories: ['Изделия из дерева', 'Керамика и глина', 'Свечи и мыло', 'Украшения', 'Игрушки', 'Декор'],
  },
};

interface RegistrationFormData {
  name: string;
  description: string;
  phone: string;
  instagram: string;
  address: string;
  role: ShopRole;
}

interface SocialsFormData {
  instagram: string;
  telegram: string;
  tiktok: string;
  youtube: string;
  website: string;
  viber: string;
  whatsapp: string;
}

export default function MyShopPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);
  const { getAuthToken } = usePlatform();
  
  const editMode = searchParams.get('edit');
  
  const [selectedRole, setSelectedRole] = useState<ShopRole | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showRoleInfo, setShowRoleInfo] = useState<ShopRole | null>(null);
  const [formData, setFormData] = useState<RegistrationFormData>({
    name: '',
    description: '',
    phone: user?.phone || '',
    instagram: '',
    address: '',
    role: 'SHOP',
  });
  
  const [socialsForm, setSocialsForm] = useState<SocialsFormData>({
    instagram: '',
    telegram: '',
    tiktok: '',
    youtube: '',
    website: '',
    viber: '',
    whatsapp: '',
  });

  const isSuperAdmin = user?.role === 'super_admin';

  const profileQuery = useQuery({
    queryKey: ['seller-profile-my'],
    queryFn: async () => {
      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await http.get('/api/seller-profile/my', { headers });
      return res.data;
    },
    enabled: !!user,
    retry: false,
  });

  const shopRequestQuery = useQuery({
    queryKey: ['my-shop-request'],
    queryFn: async () => {
      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await http.get('/api/seller-profile/my/shop-request', { headers });
      return res.data;
    },
    enabled: !!user && !isSuperAdmin,
    retry: false,
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const requestData = {
        name: data.name,
        shopRole: data.role,
        description: data.description,
        address: data.address,
        contacts: {
          phone: data.phone || null,
          instagram: data.instagram || null,
          telegram: user?.username || null,
        },
      };
      const res = await http.post('/api/seller-profile/shop-request', requestData, { headers });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shop-request'] });
      toast({ title: 'Заявка отправлена на модерацию!' });
      setShowRegistrationForm(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Ошибка отправки заявки';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const updateSocialsMutation = useMutation({
    mutationFn: async (data: SocialsFormData) => {
      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const payload = {
        instagram: data.instagram || profile?.instagram,
        socials: {
          instagram: data.instagram || undefined,
          tiktok: data.tiktok || undefined,
          youtube: data.youtube || undefined,
          website: data.website || undefined,
          telegram: data.telegram || undefined,
        },
        messengers: {
          telegram: data.telegram || undefined,
          viber: data.viber || undefined,
          whatsapp: data.whatsapp || undefined,
        },
      };
      const res = await http.patch('/api/seller-profile/update', payload, { headers });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-profile-my'] });
      toast({ title: 'Данные сохранены!' });
      navigate('/my-shop', { replace: true });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Ошибка сохранения';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const profile = profileQuery.data?.profile as SellerProfile | undefined;
  const hasProfile = !!profile && profile.name !== 'Мой магазин' && profile.isVerified;
  const pendingRequest = shopRequestQuery.data?.request;
  const hasPendingRequest = pendingRequest?.status === 'pending';

  useEffect(() => {
    if (profile && editMode === 'socials') {
      setSocialsForm({
        instagram: profile.instagram || profile.socials?.instagram || '',
        telegram: profile.messengers?.telegram || profile.socials?.telegram || '',
        tiktok: profile.socials?.tiktok || '',
        youtube: profile.socials?.youtube || '',
        website: profile.socials?.website || '',
        viber: profile.messengers?.viber || '',
        whatsapp: profile.messengers?.whatsapp || '',
      });
    }
  }, [profile, editMode]);

  useEffect(() => {
    if (hasProfile && !isSuperAdmin && editMode !== 'socials') {
      navigate('/seller/cabinet', { replace: true });
    }
  }, [hasProfile, isSuperAdmin, navigate, editMode]);

  const handleRoleSelect = useCallback((role: ShopRole) => {
    if (isSuperAdmin) {
      navigate('/seller/cabinet', { state: { adminViewRole: role } });
    } else {
      setSelectedRole(role);
      setFormData(prev => ({ ...prev, role }));
      setShowRegistrationForm(true);
    }
  }, [isSuperAdmin, navigate]);

  const handleFormChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitRegistration = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Введите название', variant: 'destructive' });
      return;
    }
    if (formData.name.trim().length < 2) {
      toast({ title: 'Название должно содержать минимум 2 символа', variant: 'destructive' });
      return;
    }
    const hasContact = formData.phone?.trim() || formData.instagram?.trim() || user?.username;
    if (!hasContact) {
      toast({ title: 'Укажите хотя бы один способ связи', variant: 'destructive' });
      return;
    }
    registerMutation.mutate(formData);
  };

  const header = (
    <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => showRegistrationForm ? setShowRegistrationForm(false) : navigate(-1)}
        aria-label="Назад"
        data-testid="button-back"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold">
          {showRegistrationForm ? 'Регистрация' : 'Мой магазин'}
        </h1>
        <p className="text-xs text-muted-foreground">
          {showRegistrationForm 
            ? `Создание профиля ${ROLE_LABELS[selectedRole || 'SHOP'].label.toLowerCase()}а`
            : isSuperAdmin 
              ? 'Выберите тип кабинета' 
              : 'Выберите тип деятельности'
          }
        </p>
      </div>
    </div>
  );

  if (profileQuery.isLoading || shopRequestQuery.isLoading) {
    return (
      <ScreenLayout header={header}>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </ScreenLayout>
    );
  }

  if (editMode === 'socials' && profile) {
    const editHeader = (
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/seller/cabinet')}
          aria-label="Назад"
          data-testid="button-back-socials"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold">Социальные сети</h1>
          <p className="text-xs text-muted-foreground">Редактирование контактов</p>
        </div>
      </div>
    );

    return (
      <ScreenLayout header={editHeader}>
        <div style={{ padding: 16 }}>
          <div style={{
            background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
            borderRadius: 16,
            padding: '16px 20px',
            marginBottom: 20,
            color: '#fff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Globe size={24} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Ваши ссылки</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>Укажите каналы связи для клиентов</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
              Социальные сети
            </div>
            <div style={{
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 16,
              overflow: 'hidden',
            }}>
              <div style={{ padding: 16, borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #E4405F 0%, #FD1D1D 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Instagram size={18} color="#fff" />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>Instagram</div>
                </div>
                <Input
                  placeholder="@username"
                  value={socialsForm.instagram}
                  onChange={(e) => setSocialsForm(prev => ({ ...prev, instagram: e.target.value }))}
                  data-testid="input-instagram"
                />
              </div>
              
              <div style={{ padding: 16, borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Video size={18} color="#fff" />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>TikTok</div>
                </div>
                <Input
                  placeholder="@username или ссылка"
                  value={socialsForm.tiktok}
                  onChange={(e) => setSocialsForm(prev => ({ ...prev, tiktok: e.target.value }))}
                  data-testid="input-tiktok"
                />
              </div>
              
              <div style={{ padding: 16, borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: '#FF0000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Video size={18} color="#fff" />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>YouTube</div>
                </div>
                <Input
                  placeholder="Ссылка на канал"
                  value={socialsForm.youtube}
                  onChange={(e) => setSocialsForm(prev => ({ ...prev, youtube: e.target.value }))}
                  data-testid="input-youtube"
                />
              </div>
              
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: '#3B82F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Globe size={18} color="#fff" />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>Сайт</div>
                </div>
                <Input
                  placeholder="https://example.com"
                  value={socialsForm.website}
                  onChange={(e) => setSocialsForm(prev => ({ ...prev, website: e.target.value }))}
                  data-testid="input-website"
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
              Мессенджеры
            </div>
            <div style={{
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 16,
              overflow: 'hidden',
            }}>
              <div style={{ padding: 16, borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #0088cc 0%, #229ED9 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Send size={18} color="#fff" />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>Telegram</div>
                </div>
                <Input
                  placeholder="@username"
                  value={socialsForm.telegram}
                  onChange={(e) => setSocialsForm(prev => ({ ...prev, telegram: e.target.value }))}
                  data-testid="input-telegram"
                />
              </div>
              
              <div style={{ padding: 16, borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: '#7C3AED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <MessageCircle size={18} color="#fff" />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>Viber</div>
                </div>
                <Input
                  placeholder="+375XXXXXXXXX"
                  value={socialsForm.viber}
                  onChange={(e) => setSocialsForm(prev => ({ ...prev, viber: e.target.value }))}
                  data-testid="input-viber"
                />
              </div>
              
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: '#25D366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <MessageCircle size={18} color="#fff" />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>WhatsApp</div>
                </div>
                <Input
                  placeholder="+375XXXXXXXXX"
                  value={socialsForm.whatsapp}
                  onChange={(e) => setSocialsForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                  data-testid="input-whatsapp"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={() => updateSocialsMutation.mutate(socialsForm)}
            disabled={updateSocialsMutation.isPending}
            className="w-full h-12 text-base"
            style={{ background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)' }}
            data-testid="button-save-socials"
          >
            {updateSocialsMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Сохранить изменения
              </>
            )}
          </Button>
        </div>
      </ScreenLayout>
    );
  }

  if (hasPendingRequest && !isSuperAdmin) {
    const requestRole = pendingRequest?.shopRole as ShopRole || 'SHOP';
    const roleConfig = ROLE_CONFIGS.find(r => r.key === requestRole) || ROLE_CONFIGS[0];
    const RoleIcon = roleConfig.icon;

    return (
      <ScreenLayout header={header}>
        <div style={{ padding: '24px 16px' }}>
          <div style={{
            background: '#FFFBEB',
            border: '1px solid #FCD34D',
            borderRadius: 16,
            padding: '20px',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              }}>
                <Clock size={28} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#92400E' }}>
                  Заявка на модерации
                </div>
                <div style={{ fontSize: 14, color: '#B45309' }}>
                  Ожидайте подтверждения
                </div>
              </div>
            </div>
            
            <p style={{ fontSize: 14, color: '#78350F', lineHeight: 1.5, margin: 0 }}>
              Ваша заявка на регистрацию отправлена и находится на рассмотрении. 
              Мы проверим данные и активируем ваш профиль в ближайшее время.
            </p>
          </div>

          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
              Информация о заявке
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: roleConfig.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <RoleIcon size={22} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#1F2937' }}>
                  {pendingRequest?.name}
                </div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>
                  {roleConfig.title} • {roleConfig.subtitle}
                </div>
              </div>
            </div>

            {pendingRequest?.description && (
              <p style={{ fontSize: 14, color: '#4B5563', marginTop: 8, marginBottom: 0 }}>
                {pendingRequest.description}
              </p>
            )}
          </div>

          <div style={{
            background: '#F0FDF4',
            borderRadius: 12,
            padding: '14px 16px',
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <CheckCircle size={20} color="#16A34A" />
            <p style={{ fontSize: 13, color: '#166534', margin: 0 }}>
              После одобрения вы сможете создавать объявления и управлять магазином
            </p>
          </div>
        </div>
      </ScreenLayout>
    );
  }

  if (showRegistrationForm && selectedRole) {
    const roleConfig = ROLE_CONFIGS.find(r => r.key === selectedRole)!;
    const RoleIcon = roleConfig.icon;

    return (
      <ScreenLayout header={header}>
        <div className="px-4 py-4 space-y-4">
          <div 
            className="rounded-xl p-4 text-white"
            style={{ background: roleConfig.gradient }}
            data-testid="registration-header"
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                <RoleIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">{ROLE_LABELS[selectedRole].emoji} {roleConfig.title}</h2>
                <p className="text-white/80 text-sm">{roleConfig.subtitle}</p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Основная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Название *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder={selectedRole === 'FARMER' ? 'Фермерское хозяйство...' : 'Мой магазин...'}
                  data-testid="input-name"
                />
              </div>

              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Расскажите о своём бизнесе..."
                  rows={3}
                  data-testid="input-description"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Контакты
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  placeholder="+375 29 123 45 67"
                  data-testid="input-phone"
                />
              </div>

              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => handleFormChange('instagram', e.target.value)}
                    placeholder="username"
                    className="pl-9"
                    data-testid="input-instagram"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Адрес</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleFormChange('address', e.target.value)}
                    placeholder="г. Минск, ул. Примерная, 1"
                    className="pl-9"
                    data-testid="input-address"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-amber-900 text-sm">Модерация заявок</p>
                <p className="text-amber-700 text-xs mt-1">
                  Заявка будет рассмотрена модератором в течение 1-2 рабочих дней
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmitRegistration}
            disabled={registerMutation.isPending}
            className="w-full h-12 text-base"
            style={{ background: roleConfig.gradient }}
            data-testid="button-register"
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Отправка...
              </>
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Отправить заявку
              </>
            )}
          </Button>
        </div>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout header={header}>
      <div style={{ padding: '16px' }}>
        {isSuperAdmin && (
          <div style={{
            background: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
            borderRadius: 16,
            padding: '14px 16px',
            marginBottom: 16,
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Sparkles size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                  Режим супер-админа
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.8)' }}>
                  Доступ ко всем типам кабинетов
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ROLE_CONFIGS.map((config) => {
            const Icon = config.icon;
            
            return (
              <div
                key={config.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#FFFFFF',
                  borderRadius: 16,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => handleRoleSelect(config.key)}
                  data-testid={`card-role-${config.key.toLowerCase()}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    flex: 1,
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: config.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${config.iconBgColor}40`,
                  }}>
                    <Icon size={26} color="#fff" strokeWidth={2} />
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#1F2937',
                      marginBottom: 2,
                    }}>
                      {config.title}
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: '#6B7280',
                    }}>
                      {config.subtitle}
                    </div>
                  </div>
                  
                  <ChevronRight size={20} color="#9CA3AF" style={{ flexShrink: 0 }} />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRoleInfo(config.key);
                  }}
                  data-testid={`button-info-${config.key.toLowerCase()}`}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: '#F3F4F6',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    flexShrink: 0,
                    transition: 'background 0.15s ease',
                  }}
                >
                  <Info size={18} color="#6B7280" />
                </button>
              </div>
            );
          })}
        </div>

        {!isSuperAdmin && (
          <div style={{
            background: '#F3F4F6',
            borderRadius: 12,
            padding: '14px 16px',
            marginTop: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <AlertCircle size={18} color="#6B7280" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, margin: 0 }}>
              Выберите тип деятельности, который лучше всего описывает ваш бизнес. 
              Это определит внешний вид вашего профиля и доступные функции.
            </p>
          </div>
        )}
      </div>

      {showRoleInfo && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setShowRoleInfo(null)}
          data-testid="modal-role-info"
        >
          <div
            style={{
              background: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              animation: 'slideUp 0.3s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const config = ROLE_CONFIGS.find(r => r.key === showRoleInfo);
              const info = ROLE_INFO[showRoleInfo];
              const Icon = config?.icon || Store;
              
              return (
                <>
                  <div
                    style={{
                      padding: '20px',
                      background: config?.gradient,
                      position: 'relative',
                    }}
                  >
                    <button
                      onClick={() => setShowRoleInfo(null)}
                      style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      data-testid="button-close-info"
                    >
                      <X size={20} color="#fff" />
                    </button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 16,
                          background: 'rgba(255, 255, 255, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={32} color="#fff" />
                      </div>
                      <div>
                        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>
                          {ROLE_LABELS[showRoleInfo].emoji} {info.title}
                        </h2>
                        <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 14, margin: '4px 0 0' }}>
                          {config?.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ padding: '20px' }}>
                    <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.6, margin: '0 0 20px' }}>
                      {info.description}
                    </p>
                    
                    <div style={{ marginBottom: 20 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 12 }}>
                        Возможности
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {info.features.map((feature, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                background: `${config?.iconBgColor}20`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Check size={12} color={config?.iconBgColor} />
                            </div>
                            <span style={{ fontSize: 14, color: '#4B5563' }}>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: 20 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 12 }}>
                        Примеры
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {info.examples.map((example, i) => (
                          <span
                            key={i}
                            style={{
                              padding: '6px 12px',
                              background: '#F3F4F6',
                              borderRadius: 20,
                              fontSize: 13,
                              color: '#4B5563',
                            }}
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 12 }}>
                        Категории товаров
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {info.categories.map((cat, i) => (
                          <span
                            key={i}
                            style={{
                              padding: '6px 12px',
                              background: `${config?.iconBgColor}15`,
                              borderRadius: 20,
                              fontSize: 13,
                              color: config?.iconBgColor,
                              fontWeight: 500,
                            }}
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => {
                        setShowRoleInfo(null);
                        handleRoleSelect(showRoleInfo);
                      }}
                      className="w-full h-12"
                      style={{ background: config?.gradient }}
                      data-testid="button-select-role"
                    >
                      Выбрать {info.title}
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </ScreenLayout>
  );
}
