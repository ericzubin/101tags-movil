import type {
  HomeContentCategory,
  HomeContentItem,
  HomeContentPlacement,
  HomeContentResponse,
  HomeContentType,
} from '@/core/models/home-content.model';

describe('home-content.model', () => {
  it('AC2: HomeContentItem usa camelCase para sortOrder/startsAt/endsAt; category puede ser null', () => {
    const cat: HomeContentCategory = { id: 5, slug: 'ropa', name: 'Ropa' };
    const item: HomeContentItem = {
      id: 1,
      placement: 'hero',
      type: 'image',
      image: '/storage/banners/hero.jpg',
      video: null,
      poster: null,
      alt: 'Hero banner',
      link: 'https://tienda.test/x',
      size: 'large',
      category: cat,
      title: 'Bienvenido',
      subtitle: null,
      sortOrder: 1,
      startsAt: '2026-01-01T00:00:00Z',
      endsAt: '2026-12-31T23:59:59Z',
    };

    expect(item.sortOrder).toBe(1);
    expect(item.startsAt).toBe('2026-01-01T00:00:00Z');
    expect(item.endsAt).toBe('2026-12-31T23:59:59Z');
    expect(item.placement).toBe<HomeContentPlacement>('hero');
    expect(item.type).toBe<HomeContentType>('image');
    expect(item.category).toEqual(cat);
  });

  it('HomeContentItem soporta category=null y campos null opcionales sin romper shape', () => {
    const item: HomeContentItem = {
      id: 2,
      placement: 'ribbon',
      type: 'image',
      image: null,
      video: null,
      poster: null,
      alt: null,
      link: null,
      size: null,
      category: null,
      title: null,
      subtitle: null,
      sortOrder: 0,
      startsAt: null,
      endsAt: null,
    };
    expect(item.category).toBeNull();
    expect(item.image).toBeNull();
    expect(item.size).toBeNull();
  });

  it('HomeContentResponse envuelve HomeContentItem[] en data', () => {
    const resp: HomeContentResponse = {
      data: [
        {
          id: 1,
          placement: 'hero',
          type: 'image',
          image: '/x.jpg',
          video: null,
          poster: null,
          alt: null,
          link: null,
          size: 'large',
          category: null,
          title: null,
          subtitle: null,
          sortOrder: 1,
          startsAt: null,
          endsAt: null,
        },
      ],
    };
    expect(Array.isArray(resp.data)).toBe(true);
  });
});
