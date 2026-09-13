/**
 * Z.AI dashboard key import API
 */

import { apiClient } from './client';

export interface ZaiImportResponse {
  status: 'ok';
  auth_file?: string;
  file?: string;
}

export const zaiApi = {
  importKey: (apiKey: string) =>
    apiClient.post<ZaiImportResponse>('/zai/import', {
      api_key: apiKey,
    }),
};
