import { EmailLog, NurtureStep } from '../types';
import { request } from './api';

export const listNurtureSteps = async (sequenceId?: string): Promise<NurtureStep[]> => {
  const query = sequenceId ? `?sequence_id=${encodeURIComponent(sequenceId)}` : '';
  return request<NurtureStep[]>(`/api/nurture-steps${query}`);
};

export const listEmailLogs = async (leadId?: string, campaignId?: string): Promise<EmailLog[]> => {
  const params = new URLSearchParams();
  if (leadId) params.append('lead_id', leadId);
  if (campaignId) params.append('campaign_id', campaignId);
  const query = params.toString() ? `?${params.toString()}` : '';
  return request<EmailLog[]>(`/api/email-logs${query}`);
};
