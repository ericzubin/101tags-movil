import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Linking } from 'react-native';

import { contentService } from '@/core/services/content-service';

import type { FooterContent, PolicyContent } from '@/core/models/content.model';

import HelpScreen from '../help';

jest.mock('@/core/services/content-service', () => ({
  contentService: {
    getFooter: jest.fn(),
    getPolicies: jest.fn(),
  },
}));

const mockedContent = contentService as jest.Mocked<typeof contentService>;

const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

const policies: PolicyContent = {
  manualPaymentDisclaimer: 'El pago se confirma manualmente por el proveedor.',
  mediationWindowHours: 24,
  whatsappEnabled: true,
};

const footerWithWhatsApp: FooterContent = {
  groups: [{ title: 'Contacto', links: [{ label: 'WhatsApp', url: 'https://wa.me/5215500000000' }] }],
  legal: [],
};

const emptyFooter: FooterContent = { groups: [], legal: [] };

describe('legal/help (M6.3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedContent.getPolicies.mockResolvedValue(policies);
    mockedContent.getFooter.mockResolvedValue(footerWithWhatsApp);
  });

  it('AC1: muestra el manual_payment_disclaimer de /policies', async () => {
    render(<HelpScreen />);

    const disclaimer = await screen.findByTestId('help-disclaimer');
    expect(String(disclaimer.props.children)).toBe(
      'El pago se confirma manualmente por el proveedor.',
    );
  });

  it('AC1: muestra mediation_window_hours cuando existe', async () => {
    render(<HelpScreen />);

    const mediation = await screen.findByTestId('help-mediation');
    expect(String(mediation.props.children)).toMatch(/24/);
  });

  it('AC1: no muestra la ventana de mediación cuando es 0/ausente', async () => {
    mockedContent.getPolicies.mockResolvedValueOnce({ ...policies, mediationWindowHours: 0 });

    render(<HelpScreen />);

    await screen.findByTestId('help-disclaimer');
    expect(screen.queryByTestId('help-mediation')).toBeNull();
  });

  it('AC1: whatsapp_enabled con enlace wa.me permite abrirlo con Linking.openURL', async () => {
    render(<HelpScreen />);

    expect(await screen.findByTestId('help-whatsapp')).toBeTruthy();
    fireEvent.press(screen.getByTestId('help-whatsapp-action'));

    expect(openURLSpy).toHaveBeenCalledWith('https://wa.me/5215500000000');
  });

  it('AC1: sin whatsapp_enabled no se muestra el contacto de WhatsApp', async () => {
    mockedContent.getPolicies.mockResolvedValueOnce({ ...policies, whatsappEnabled: false });

    render(<HelpScreen />);

    await screen.findByTestId('help-disclaimer');
    expect(screen.queryByTestId('help-whatsapp')).toBeNull();
  });

  it('AC1: whatsapp_enabled sin enlace no fabrica un número; muestra aviso informativo', async () => {
    mockedContent.getFooter.mockResolvedValueOnce(emptyFooter);

    render(<HelpScreen />);

    expect(await screen.findByTestId('help-whatsapp')).toBeTruthy();
    expect(screen.queryByTestId('help-whatsapp-action')).toBeNull();
  });

  it('AC5: fallo de /policies muestra estado claro y no inventa texto', async () => {
    mockedContent.getPolicies.mockRejectedValueOnce(new Error('offline'));

    render(<HelpScreen />);

    expect(await screen.findByTestId('help-error')).toBeTruthy();
    expect(screen.queryByTestId('help-disclaimer')).toBeNull();
    expect(screen.queryByTestId('help-mediation')).toBeNull();
  });

  it('AC5: fallo de /footer no bloquea la ayuda (policies visibles, sin enlace WhatsApp)', async () => {
    mockedContent.getFooter.mockRejectedValueOnce(new Error('offline'));

    render(<HelpScreen />);

    expect(await screen.findByTestId('help-disclaimer')).toBeTruthy();
    expect(screen.getByTestId('help-whatsapp')).toBeTruthy();
    expect(screen.queryByTestId('help-whatsapp-action')).toBeNull();
  });
});
