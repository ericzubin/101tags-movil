import type {
  HomeContentByPlacement,
  HomeContentResponse,
} from '@/core/models/home-content.model';

export function normalizeHomeContent(
  data: HomeContentResponse['data'] | undefined,
): HomeContentByPlacement | null {
  if (!data) return null;
  if (Array.isArray(data)) return null;
  return data;
}
