import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, MapPin, Briefcase, Clock, Star, 
  Phone, Loader2, User, ChevronRight, Filter
} from 'lucide-react';
import { usePlatform } from '@/platform/PlatformProvider';

interface JobSeeker {
  id: string;
  name: string;
  photo?: string;
  age?: number;
  skills: string[];
  category: string;
  categoryLabel: string;
  description?: string;
  experience?: string;
  hourlyRate?: number;
  currency: string;
  availability: string;
  availabilityLabel: string;
  location?: string;
  distanceKm?: number;
  viewsCount: number;
  lastActiveAt: string;
  createdAt: string;
}

interface CategoryOption {
  id: string;
  label: string;
}

interface JobSeekersResponse {
  items: JobSeeker[];
  total: number;
  categories: CategoryOption[];
}

const CATEGORY_COLORS: Record<string, string> = {
  cleaning: '#10B981',
  repair: '#F59E0B',
  garden: '#84CC16',
  driving: '#3B82F6',
  childcare: '#EC4899',
  eldercare: '#8B5CF6',
  cooking: '#F97316',
  tutoring: '#6366F1',
  construction: '#78716C',
  moving: '#14B8A6',
  beauty: '#F472B6',
  other: '#6B7280',
};

export default function JobSeekersPage() {
  const navigate = useNavigate();
  const { getLocation } = usePlatform();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const loc = await getLocation();
        if (loc) {
          setLocation({ lat: loc.lat, lng: loc.lng });
        }
      } catch (error) {
        console.error('[JobSeekersPage] Error getting location:', error);
        setLocation({ lat: 53.9, lng: 27.5667 });
      }
    };
    fetchLocation();
  }, [getLocation]);

  const { data, isLoading } = useQuery<JobSeekersResponse>({
    queryKey: ['/api/job-seekers', location?.lat, location?.lng, selectedCategory],
    enabled: !!location,
  });

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleSeekerClick = (seeker: JobSeeker) => {
    navigate(`/job-seeker/${seeker.id}`);
  };

  const formatDistance = (km?: number) => {
    if (!km) return null;
    if (km < 1) return `${Math.round(km * 1000)} м`;
    return `${km.toFixed(1)} км`;
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return 'Сейчас онлайн';
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#F9FAFB',
      paddingBottom: 100,
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        padding: '16px 16px 24px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -60,
          left: -30,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12,
          marginBottom: 16,
          position: 'relative',
          zIndex: 1,
        }}>
          <button
            onClick={handleBack}
            data-testid="button-back"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={20} color="#fff" />
          </button>
          <div>
            <h1 style={{ 
              fontSize: 22, 
              fontWeight: 700, 
              margin: 0,
              letterSpacing: '-0.5px',
            }}>
              Соискатели
            </h1>
            <p style={{ 
              fontSize: 13, 
              opacity: 0.9, 
              margin: '4px 0 0',
            }}>
              Люди ищут работу рядом с вами
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.15)',
          padding: '10px 14px',
          borderRadius: 12,
          position: 'relative',
          zIndex: 1,
        }}>
          <Briefcase size={18} />
          <span style={{ fontSize: 14 }}>
            {data?.total || 0} человек готовы к работе
          </span>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{
        padding: '12px 16px',
        overflowX: 'auto',
        display: 'flex',
        gap: 8,
        WebkitOverflowScrolling: 'touch',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}>
        <button
          onClick={() => setSelectedCategory('all')}
          data-testid="filter-all"
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            border: 'none',
            background: selectedCategory === 'all' ? '#0ea5e9' : '#fff',
            color: selectedCategory === 'all' ? '#fff' : '#374151',
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          Все
        </button>
        {data?.categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            data-testid={`filter-${cat.id}`}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              border: 'none',
              background: selectedCategory === cat.id ? CATEGORY_COLORS[cat.id] || '#0ea5e9' : '#fff',
              color: selectedCategory === cat.id ? '#fff' : '#374151',
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '8px 16px' }}>
        {isLoading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
            color: '#9CA3AF',
          }}>
            <Loader2 size={32} className="animate-spin" style={{ marginBottom: 12 }} />
            <span style={{ fontSize: 14 }}>Ищем соискателей...</span>
          </div>
        ) : data?.items.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
            color: '#9CA3AF',
          }}>
            <User size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p style={{ fontSize: 16, fontWeight: 500, margin: 0, color: '#374151' }}>
              Пока нет соискателей
            </p>
            <p style={{ fontSize: 13, margin: '8px 0 0', textAlign: 'center' }}>
              В вашем районе пока никто не ищет работу
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data?.items.map((seeker) => (
              <div
                key={seeker.id}
                onClick={() => handleSeekerClick(seeker)}
                data-testid={`seeker-card-${seeker.id}`}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 16,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: seeker.photo 
                      ? `url(${seeker.photo}) center/cover`
                      : `linear-gradient(135deg, ${CATEGORY_COLORS[seeker.category] || '#6B7280'}, ${CATEGORY_COLORS[seeker.category] || '#6B7280'}dd)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {!seeker.photo && (
                      <User size={24} color="#fff" />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h3 style={{ 
                        fontSize: 16, 
                        fontWeight: 600, 
                        margin: 0,
                        color: '#111827',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {seeker.name}
                        {seeker.age && <span style={{ fontWeight: 400, color: '#6B7280' }}>, {seeker.age}</span>}
                      </h3>
                    </div>

                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: `${CATEGORY_COLORS[seeker.category] || '#6B7280'}15`,
                      color: CATEGORY_COLORS[seeker.category] || '#6B7280',
                      fontSize: 12,
                      fontWeight: 500,
                      marginBottom: 8,
                    }}>
                      <Briefcase size={12} />
                      {seeker.categoryLabel}
                    </div>

                    {seeker.skills.length > 0 && (
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 4, 
                        marginBottom: 8,
                      }}>
                        {seeker.skills.slice(0, 3).map((skill, idx) => (
                          <span 
                            key={idx}
                            style={{
                              fontSize: 11,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: '#F3F4F6',
                              color: '#6B7280',
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                        {seeker.skills.length > 3 && (
                          <span style={{
                            fontSize: 11,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: '#F3F4F6',
                            color: '#6B7280',
                          }}>
                            +{seeker.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12,
                      flexWrap: 'wrap',
                    }}>
                      {seeker.distanceKm && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 4,
                          fontSize: 12,
                          color: '#6B7280',
                        }}>
                          <MapPin size={12} />
                          {formatDistance(seeker.distanceKm)}
                        </div>
                      )}
                      {seeker.location && (
                        <div style={{ 
                          fontSize: 12,
                          color: '#6B7280',
                        }}>
                          {seeker.location}
                        </div>
                      )}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 4,
                        fontSize: 12,
                        color: '#9CA3AF',
                      }}>
                        <Clock size={12} />
                        {formatTimeAgo(seeker.lastActiveAt)}
                      </div>
                    </div>
                  </div>

                  {/* Price & Arrow */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                  }}>
                    {seeker.hourlyRate ? (
                      <div style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#0ea5e9',
                      }}>
                        {seeker.hourlyRate} {seeker.currency}/ч
                      </div>
                    ) : (
                      <div style={{
                        fontSize: 13,
                        color: '#9CA3AF',
                      }}>
                        Договорная
                      </div>
                    )}
                    <ChevronRight size={20} color="#D1D5DB" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
