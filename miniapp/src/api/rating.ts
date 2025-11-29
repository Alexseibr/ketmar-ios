import http from './http';

export interface ContactResponse {
  success: boolean;
  contactId: string;
  expiresAt: string;
}

export interface FeedbackPayload {
  contactId: string;
  score: number;
  reasonCode: string | null;
  comment: string | null;
}

export interface PendingFeedbackItem {
  contactId: string;
  adId: string;
  channel: string;
  createdAt: string;
  ad: {
    _id: string;
    title: string;
    photos?: string[];
    previewUrl?: string;
    price: number;
    currency: string;
  } | null;
}

export interface RatingSummary {
  avgScore: number;
  totalVotes: number;
  lastRatedAt: string | null;
  distribution: Record<number, number>;
  reasons: Record<string, number>;
}

export interface SellerRatingSummary {
  avgScore: number;
  totalVotes: number;
  lowScoreCount: number;
  fraudFlags: number;
  lastRatedAt: string | null;
  reasons: Record<string, number>;
}

export interface FeedbackCheckResponse {
  canSubmit: boolean;
  contactId: string | null;
  contactCreatedAt: string | null;
}

export async function logContact(
  adId: string, 
  channel: 'telegram' | 'phone' | 'instagram' | 'whatsapp' | 'chat'
): Promise<ContactResponse> {
  const response = await http.post(`/api/rating/ads/${adId}/contact`, { channel });
  return response.data;
}

export async function submitFeedback(
  adId: string,
  payload: FeedbackPayload
): Promise<{ success: boolean; feedbackId: string }> {
  const response = await http.post(`/api/rating/ads/${adId}/feedback`, payload);
  return response.data;
}

export async function getAdRating(adId: string): Promise<RatingSummary> {
  const response = await http.get(`/api/rating/ads/${adId}/rating`);
  return response.data;
}

export async function getSellerRating(sellerId: string): Promise<SellerRatingSummary> {
  const response = await http.get(`/api/rating/sellers/${sellerId}/rating`);
  return response.data;
}

export async function getPendingFeedback(): Promise<{ items: PendingFeedbackItem[] }> {
  const response = await http.get('/api/rating/my/pending-feedback');
  return response.data;
}

export async function checkFeedbackStatus(adId: string): Promise<FeedbackCheckResponse> {
  const response = await http.get(`/api/rating/check-feedback/${adId}`);
  return response.data;
}

export async function getFeedbackHistory(): Promise<{ items: any[] }> {
  const response = await http.get('/api/rating/my/feedback-history');
  return response.data;
}
