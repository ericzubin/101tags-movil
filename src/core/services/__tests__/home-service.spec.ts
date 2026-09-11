import { homeService } from '@/core/services/home-service';
import { httpClient } from '@/core/api/client';

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

describe('homeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AC13: getHomeContent() llama a GET /home-content sin query', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ data: [] });

    await homeService.getHomeContent();

    expect(mockedHttpClient.request).toHaveBeenCalledTimes(1);
    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/home-content');
    expect(options?.method).toBe('GET');
    expect(options?.query).toBeUndefined();
  });

  it('AC14: getHomeContent(placement) llama GET /home-content?placement=hero', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ data: [] });

    await homeService.getHomeContent('hero');

    expect(mockedHttpClient.request).toHaveBeenCalledTimes(1);
    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/home-content');
    expect(options?.query).toEqual({ placement: 'hero' });
  });

  it('getBanners() llama GET /banners (DEPRECATED — preservado por paridad)', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ data: [] });

    await homeService.getBanners();

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/banners');
    expect(options?.method).toBe('GET');
  });
});
