import { httpClient } from '@/core/api/client';
import type {
  HomeContentPlacement,
  HomeContentResponse,
} from '@/core/models/home-content.model';

export const homeService = {
  async getHomeContent(placement?: HomeContentPlacement): Promise<HomeContentResponse> {
    const query = placement ? { placement } : undefined;
    return httpClient.request<HomeContentResponse>('/home-content', {
      method: 'GET',
      query,
    });
  },

  async getBanners(): Promise<{ data: unknown[] }> {
    return httpClient.request<{ data: unknown[] }>('/banners', { method: 'GET' });
  },
};
