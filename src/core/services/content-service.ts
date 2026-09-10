import { httpClient } from '@/core/api/client';

import type { FooterContent, PolicyContent } from '@/core/models/content.model';

/**
 * Public content API — footer links and store policies.
 *
 *   GET /footer   → FooterContent (link groups + legal bar)
 *   GET /policies → PolicyContent (manual payment / mediation / whatsapp)
 *
 * Both endpoints are public; `httpClient` still applies `toCamel`. The full
 * Terms/Privacy text is not exposed by the backend, so callers must render
 * the available footer links and flag the pending legal copy.
 *
 * @see .spec/2026-09-11-m6-3-legal-help.md §Contratos
 */
export const contentService = {
  async getFooter(): Promise<FooterContent> {
    return httpClient.request<FooterContent>('/footer', { method: 'GET' });
  },

  async getPolicies(): Promise<PolicyContent> {
    return httpClient.request<PolicyContent>('/policies', { method: 'GET' });
  },
};
