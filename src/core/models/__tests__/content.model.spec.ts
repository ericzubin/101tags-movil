import { toCamel } from '@/core/utils/snake-camel';

import { findWhatsAppLink, isOpenableUrl } from '@/core/models/content.model';

import type { FooterContent, FooterLink, PolicyContent } from '@/core/models/content.model';

const rawFooter = {
  groups: [
    { title: 'Ayuda', links: [{ label: 'Contacto', url: '/contacto' }] },
    { title: 'Contacto', links: [{ label: 'WhatsApp', url: 'https://wa.me/5215500000000' }] },
  ],
  legal: [
    { label: 'Términos y condiciones', url: 'https://101tags.com/terminos' },
    { label: 'Privacidad', url: '/privacidad' },
  ],
};

describe('content.model (M6.3)', () => {
  it('AC2: FooterContent mapea groups/legal con label y url', () => {
    const footer = toCamel<FooterContent>(rawFooter);

    expect(footer.groups).toHaveLength(2);
    expect(footer.groups[0].title).toBe('Ayuda');
    expect(footer.groups[0].links[0]).toEqual({ label: 'Contacto', url: '/contacto' });
    expect(footer.legal[0]).toEqual({
      label: 'Términos y condiciones',
      url: 'https://101tags.com/terminos',
    });
    expect(footer.legal[1].url).toBe('/privacidad');
  });

  it('AC1: PolicyContent refleja el contrato de /policies', () => {
    const policies: PolicyContent = {
      manualPaymentDisclaimer: 'Pago manual',
      mediationWindowHours: 24,
      whatsappEnabled: true,
    };

    expect(policies.manualPaymentDisclaimer).toBe('Pago manual');
    expect(policies.mediationWindowHours).toBe(24);
    expect(policies.whatsappEnabled).toBe(true);
  });

  it('AC4: isOpenableUrl solo acepta http(s)', () => {
    expect(isOpenableUrl('https://101tags.com/terminos')).toBe(true);
    expect(isOpenableUrl('http://localhost/terminos')).toBe(true);
    expect(isOpenableUrl('/terminos')).toBe(false);
    expect(isOpenableUrl('javascript:alert(1)')).toBe(false);
    expect(isOpenableUrl('')).toBe(false);
  });

  it('findWhatsAppLink encuentra el enlace wa.me en legal o groups', () => {
    const link: FooterLink = { label: 'WhatsApp', url: 'https://wa.me/5215500000000' };

    expect(findWhatsAppLink({ groups: [], legal: [link] })).toEqual(link);
    expect(findWhatsAppLink({ groups: [{ title: 'Contacto', links: [link] }], legal: [] })).toEqual(
      link,
    );
  });

  it('findWhatsAppLink devuelve null si no hay enlace o no hay footer', () => {
    expect(findWhatsAppLink({ groups: [], legal: [] })).toBeNull();
    expect(findWhatsAppLink(null)).toBeNull();
  });
});
