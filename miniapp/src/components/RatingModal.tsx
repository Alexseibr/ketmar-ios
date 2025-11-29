import { useState } from 'react';
import { X, Star, MessageCircle, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitFeedback } from '@/api/rating';
import { getFullImageUrl } from '@/constants/placeholders';

interface RatingReason {
  code: string;
  label: string;
  labelRu: string;
}

const RATING_REASONS: RatingReason[] = [
  { code: 'no_response', label: 'No Response', labelRu: 'Не отвечает' },
  { code: 'wrong_price', label: 'Wrong Price', labelRu: 'Цена не совпадает' },
  { code: 'wrong_description', label: 'Wrong Description', labelRu: 'Описание не соответствует' },
  { code: 'fake', label: 'Fake Ad', labelRu: 'Фейковое объявление' },
  { code: 'rude', label: 'Rude Seller', labelRu: 'Грубое общение' },
  { code: 'other', label: 'Other', labelRu: 'Другое' },
];

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  adId: string;
  adTitle: string;
  adImage?: string;
  contactId: string;
  onSuccess?: () => void;
}

export default function RatingModal({
  isOpen,
  onClose,
  adId,
  adTitle,
  adImage,
  contactId,
  onSuccess,
}: RatingModalProps) {
  const [score, setScore] = useState<number>(0);
  const [hoveredScore, setHoveredScore] = useState<number>(0);
  const [reasonCode, setReasonCode] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const showReasons = score > 0 && score <= 3;
  const requiresReason = showReasons;

  const getScoreColor = (s: number): string => {
    if (s <= 2) return '#ec4899';
    if (s === 3) return '#f59e0b';
    return '#22c55e';
  };

  const getScoreLabel = (s: number): string => {
    switch (s) {
      case 1: return 'Очень плохо';
      case 2: return 'Плохо';
      case 3: return 'Нормально';
      case 4: return 'Хорошо';
      case 5: return 'Отлично';
      default: return 'Оцените продавца';
    }
  };

  const handleSubmit = async () => {
    if (score === 0) {
      setError('Выберите оценку');
      return;
    }
    if (requiresReason && !reasonCode) {
      setError('Укажите причину');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitFeedback(adId, {
        contactId,
        score,
        reasonCode: requiresReason ? reasonCode : null,
        comment: comment.trim() || null,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (e: any) {
      if (e?.response?.data?.error === 'You have already submitted feedback for this ad') {
        setError('Вы уже оставили отзыв на это объявление');
      } else {
        setError('Не удалось отправить отзыв');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setScore(0);
      setReasonCode(null);
      setComment('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        data-testid="rating-modal-overlay"
      >
        <motion.div
          className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-2xl max-h-[85vh] overflow-y-auto"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          data-testid="rating-modal-content"
        >
          <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Оцените продавца
            </h3>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              disabled={isSubmitting}
              data-testid="rating-modal-close"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="p-4 space-y-5">
            {success ? (
              <motion.div
                className="flex flex-col items-center justify-center py-8 gap-4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <motion.div
                  className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  <Check size={32} className="text-green-500" />
                </motion.div>
                <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                  Спасибо за отзыв!
                </span>
              </motion.div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  {adImage && (
                    <img
                      src={getFullImageUrl(adImage)}
                      alt={adTitle}
                      className="w-16 h-16 rounded-lg object-cover"
                      data-testid="rating-modal-ad-image"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2" data-testid="rating-modal-ad-title">
                      {adTitle}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Как прошёл контакт с продавцом?
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-2" data-testid="rating-modal-stars">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const isActive = s <= (hoveredScore || score);
                      const color = getScoreColor(hoveredScore || score || s);

                      return (
                        <motion.button
                          key={s}
                          className="p-2 rounded-full transition-all"
                          style={{
                            backgroundColor: isActive ? `${color}20` : 'transparent',
                          }}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          onMouseEnter={() => setHoveredScore(s)}
                          onMouseLeave={() => setHoveredScore(0)}
                          onTouchStart={() => setHoveredScore(s)}
                          onTouchEnd={() => setHoveredScore(0)}
                          onClick={() => {
                            setScore(s);
                            setReasonCode(null);
                            setError(null);
                          }}
                          data-testid={`rating-modal-star-${s}`}
                        >
                          <Star
                            size={32}
                            fill={isActive ? color : 'transparent'}
                            stroke={isActive ? color : '#9ca3af'}
                          />
                        </motion.button>
                      );
                    })}
                  </div>

                  <motion.span
                    key={hoveredScore || score}
                    className="text-base font-medium"
                    style={{
                      color: score > 0 ? getScoreColor(hoveredScore || score) : '#6b7280',
                    }}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    data-testid="rating-modal-score-label"
                  >
                    {getScoreLabel(hoveredScore || score)}
                  </motion.span>
                </div>

                <AnimatePresence mode="wait">
                  {showReasons && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <p className="text-sm text-gray-500 mb-3">Что пошло не так?</p>
                      <div className="flex flex-wrap gap-2">
                        {RATING_REASONS.map((reason) => (
                          <button
                            key={reason.code}
                            className={`px-3 py-2 rounded-full text-sm transition-all ${
                              reasonCode === reason.code
                                ? 'bg-pink-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                            onClick={() => {
                              setReasonCode(reason.code);
                              setError(null);
                            }}
                            data-testid={`rating-modal-reason-${reason.code}`}
                          >
                            {reason.labelRu}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Комментарий (необязательно)</p>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Расскажите подробнее..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl resize-none text-sm bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400"
                    data-testid="rating-modal-comment"
                  />
                </div>

                {error && (
                  <motion.div
                    className="px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center gap-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    data-testid="rating-modal-error"
                  >
                    <AlertTriangle size={16} className="text-red-500" />
                    <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                  </motion.div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    disabled={isSubmitting}
                    data-testid="rating-modal-cancel"
                  >
                    Позже
                  </button>
                  <button
                    onClick={handleSubmit}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      score > 0
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={isSubmitting || score === 0}
                    data-testid="rating-modal-submit"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Отправка...
                      </>
                    ) : (
                      'Отправить'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="h-8" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
