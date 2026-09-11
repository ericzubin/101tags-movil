import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Linking } from 'react-native';

import { contentService } from '@/core/services/content-service';

import type { FooterContent } from '@/core/models/content.model';

import TermsScreen from '../terms';

jest.mock('@/core/services/content-service', () => ({
  contentService: {
    getFooter: jest.fn(),
    getPolicies: jest.fn(),
  },
}));

const mockedContent = contentService as jest.Mocked<typeof contentService>;

const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

const footer: FooterContent = {
  groups: [],
  legal: [
    { label: 'Términos y condiciones', url: 'https://101tags.com/terminos' },
    { label: 'Contacto', url: '/contacto' },
  ],
};

describe('legal/terms (M6.3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedContent.getFooter.mockResolvedValue(footer);
  });

  it('AC2: muestra los enlaces legales reales de /footer.legal', async () => {
    render(<TermsScreen />);

    expect(await screen.findByTestId('legal-terms-legal-link-0')).toBeTruthy();
    expect(screen.getAllByText('Términos y condiciones').length).toBeGreaterThan(0);
    expect(screen.getByText('Contacto')).toBeTruthy();
  });

  it('AC2: marca el texto completo como pendiente (dependencia de negocio)', async () => {
    render(<TermsScreen />);

    const notice = await screen.findByTestId('legal-terms-pending-notice');
    expect(String(notice.props.children)).toMatch(/pendiente/i);
    expect(String(notice.props.children)).toMatch(/dependencia de negocio/i);
  });

  it('AC4: abrir un enlace legal llama Linking.openURL(url)', async () => {
    render(<TermsScreen />);

    fireEvent.press(await screen.findByTestId('legal-terms-legal-link-0'));

    expect(openURLSpy).toHaveBeenCalledWith('https://101tags.com/terminos');
  });

  it('AC4: no abre URLs no http(s) (rutas relativas)', async () => {
    render(<TermsScreen />);

    fireEvent.press(await screen.findByTestId('legal-terms-legal-link-1'));

    expect(openURLSpy).not.toHaveBeenCalled();
  });

  it('AC5: fallo de /footer muestra estado de error sin texto inventado', async () => {
    mockedContent.getFooter.mockRejectedValueOnce(new Error('offline'));

    render(<TermsScreen />);

    expect(await screen.findByTestId('legal-terms-error')).toBeTruthy();
    expect(screen.queryByTestId('legal-terms-pending-notice')).toBeNull();
    expect(screen.queryByTestId('legal-terms-legal-link-0')).toBeNull();
  });

  it('AC5: el retry vuelve a pedir /footer', async () => {
    mockedContent.getFooter.mockRejectedValueOnce(new Error('offline'));

    render(<TermsScreen />);
    await screen.findByTestId('legal-terms-error');

    fireEvent.press(screen.getByTestId('legal-terms-error-retry'));

    expect(await screen.findByTestId('legal-terms-legal-link-0')).toBeTruthy();
    expect(mockedContent.getFooter).toHaveBeenCalledTimes(2);
  });
});
