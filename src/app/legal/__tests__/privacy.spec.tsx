import { render, screen } from '@testing-library/react-native';

import { contentService } from '@/core/services/content-service';

import type { FooterContent } from '@/core/models/content.model';

import PrivacyScreen from '../privacy';

jest.mock('@/core/services/content-service', () => ({
  contentService: {
    getFooter: jest.fn(),
    getPolicies: jest.fn(),
  },
}));

const mockedContent = contentService as jest.Mocked<typeof contentService>;

const footer: FooterContent = {
  groups: [],
  legal: [{ label: 'Privacidad', url: 'https://101tags.com/privacidad' }],
};

describe('legal/privacy (M6.3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedContent.getFooter.mockResolvedValue(footer);
  });

  it('AC2: muestra los enlaces legales reales de /footer.legal', async () => {
    render(<PrivacyScreen />);

    expect(await screen.findByTestId('legal-privacy-legal-link-0')).toBeTruthy();
    expect(screen.getByText('Privacidad')).toBeTruthy();
  });

  it('AC2: marca el texto completo como pendiente (dependencia de negocio)', async () => {
    render(<PrivacyScreen />);

    expect(await screen.findByTestId('legal-privacy-pending-notice')).toBeTruthy();
  });

  it('AC5: fallo de /footer muestra estado de error sin texto inventado', async () => {
    mockedContent.getFooter.mockRejectedValueOnce(new Error('offline'));

    render(<PrivacyScreen />);

    expect(await screen.findByTestId('legal-privacy-error')).toBeTruthy();
    expect(screen.queryByTestId('legal-privacy-pending-notice')).toBeNull();
  });
});
