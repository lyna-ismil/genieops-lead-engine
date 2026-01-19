import { EmailLog, NurtureStep } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

const get = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`);
  const json = await response.json();
  if (!response.ok || !json?.success) {
    const message = json?.error?.message || 'Request failed';
    throw new Error(message);
  }
  return json.data as T;
};

export const listNurtureSteps = async (sequenceId?: string): Promise<NurtureStep[]> => {
  const query = sequenceId ? `?sequence_id=${encodeURIComponent(sequenceId)}` : '';
  return get<NurtureStep[]>(`/api/nurture-steps${query}`);
};

export const listEmailLogs = async (leadId?: string, campaignId?: string): Promise<EmailLog[]> => {
  const params = new URLSearchParams();
  if (leadId) params.append('lead_id', leadId);
  if (campaignId) params.append('campaign_id', campaignId);
  const query = params.toString() ? `?${params.toString()}` : '';
  return get<EmailLog[]>(`/api/email-logs${query}`);
};
