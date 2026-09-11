import { httpClient } from '@/core/api/client';
import { contentService } from '@/core/services/content-service';

import type { FooterContent, PolicyContent } from '@/core/models/content.model';

jest.mock('@/core/api/client', () => {
  const actual = jest.requireActual('@/core/api/client');
  return {
    ...actual,
    httpClient: {
      request: jest.fn(),
    },
  };
});

const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('contentService (M6.3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AC1: getPolicies() llama GET /policies', async () => {
    const policies: PolicyContent = {
      manualPaymentDisclaimer: 'Pago manual',
      mediationWindowHours: 24,
      whatsappEnabled: true,
    };
    mockedHttpClient.request.mockResolvedValueOnce(policies);

    const result = await contentService.getPolicies();

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/policies');
    expect(options?.method).toBe('GET');
    expect(result).toEqual(policies);
  });

  it('AC2: getFooter() llama GET /footer', async () => {
    const footer: FooterContent = {
      groups: [],
      legal: [{ label: 'Términos y condiciones', url: 'https://101tags.com/terminos' }],
    };
    mockedHttpClient.request.mockResolvedValueOnce(footer);

    const result = await contentService.getFooter();

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/footer');
    expect(options?.method).toBe('GET');
    expect(result).toEqual(footer);
  });
});
