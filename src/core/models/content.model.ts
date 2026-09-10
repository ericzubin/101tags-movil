/**
 * Footer / legal content contracts — mirror of the public Laravel endpoints:
 *   GET /api/footer   → FooterContent  (groups + legal links)
 *   GET /api/policies → PolicyContent  (manual payment / mediation / whatsapp)
 *
 * `httpClient` applies `toCamel`, so snake_case keys arrive camelCase.
 *
 * The backend does NOT expose full Terms/Privacy text; screens must show the
 * available `/footer.legal` links and mark the full document as pending
 * (business dependency) instead of inventing legal copy.
 *
 * @see .spec/2026-09-11-m6-3-legal-help.md §Contratos
 */

import type { CheckoutPolicies } from '@/core/models/checkout.model';

export interface FooterLink {
  readonly label: string;
  readonly url: string;
}

export interface FooterGroup {
  readonly title: string;
  readonly links: FooterLink[];
}

export interface FooterContent {
  readonly groups: FooterGroup[];
  readonly legal: FooterLink[];
}

/**
 * `/policies` payload. Reuses the checkout contract so both consumers share a
 * single shape (the endpoint is the same for checkout and the help screen).
 */
export type PolicyContent = CheckoutPolicies;

const HTTP_URL_PATTERN = /^https?:\/\//i;
const WHATSAPP_URL_PATTERN = /(wa\.me|whatsapp)/i;

/**
 * Only absolute `http(s)` URLs may be handed to `Linking.openURL` (AGENTS
 * §Seguridad). Relative footer paths and custom schemes are rejected.
 */
export function isOpenableUrl(url: string): boolean {
  return HTTP_URL_PATTERN.test(url);
}

/**
 * Resolve a customer-facing WhatsApp contact link from the footer, if the
 * backend configured one. Returns `null` when absent so the caller can avoid
 * fabricating a phone number.
 */
export function findWhatsAppLink(footer: FooterContent | null): FooterLink | null {
  if (!footer) return null;
  const candidates = [...footer.legal, ...footer.groups.flatMap((group) => group.links)];
  return candidates.find((link) => WHATSAPP_URL_PATTERN.test(link.url)) ?? null;
}
