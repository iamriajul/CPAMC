/**
 * OpenCode Zen Go API key import API
 */

import { apiClient } from './client';

export interface OpenCodeImportResponse {
  status: 'ok';
  auth_file?: string;
  file?: string;
}

export const opencodeApi = {
  importKey: (apiKey: string, baseUrl?: string) =>
    apiClient.post<OpenCodeImportResponse>('/opencode/import', {
      api_key: apiKey,
      ...(baseUrl?.trim() ? { base_url: baseUrl.trim() } : {}),
    }),
};
