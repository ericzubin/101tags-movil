import { catalogKeys, homeKeys, orderKeys } from '@/core/query/keys';

describe('query keys factory', () => {
  describe('homeKeys', () => {
    it('AC20: homeKeys.content() y homeKeys.content("hero") son keys distintas', () => {
      expect(homeKeys.content()).not.toEqual(homeKeys.content('hero'));
      expect(homeKeys.content('hero')).toEqual(['home', 'content', 'hero']);
      expect(homeKeys.content()).toEqual(['home', 'content']);
    });

    it('homeKeys.all es la raíz del namespace home', () => {
      expect(homeKeys.all).toEqual(['home']);
    });

    it('homeKeys.banners() retorna key estable', () => {
      expect(homeKeys.banners()).toEqual(['home', 'banners']);
    });
  });

  describe('catalogKeys', () => {
    it('AC21: catalogKeys.products({q:"x"}) y catalogKeys.products({q:"y"}) son keys distintas', () => {
      const a = catalogKeys.products({ q: 'x' });
      const b = catalogKeys.products({ q: 'y' });
      expect(a).not.toEqual(b);
    });

    it('catalogKeys.categories(segment) incluye el segment en la key', () => {
      expect(catalogKeys.categories('basicos')).toEqual(['catalog', 'categories', 'basicos']);
      expect(catalogKeys.categories('industrial')).toEqual(['catalog', 'categories', 'industrial']);
    });

    it('catalogKeys.product(slug) y catalogKeys.product(otroSlug) son distintos', () => {
      expect(catalogKeys.product('a')).not.toEqual(catalogKeys.product('b'));
      expect(catalogKeys.product('camisa')).toEqual(['catalog', 'product', 'camisa']);
    });

    it('catalogKeys.filters normaliza category=null cuando category ausente', () => {
      expect(catalogKeys.filters('basicos')).toEqual(['catalog', 'filters', 'basicos', null]);
      expect(catalogKeys.filters('basicos', 'ropa')).toEqual(['catalog', 'filters', 'basicos', 'ropa']);
    });

    it('catalogKeys.sponsoredAds() tiene key estable', () => {
      expect(catalogKeys.sponsoredAds()).toEqual(['catalog', 'sponsored-ads']);
    });
  });

  describe('orderKeys', () => {
    it('orderKeys.list() es una key estable bajo el namespace orders', () => {
      expect(orderKeys.list()).toEqual(['orders', 'list']);
      expect(orderKeys.all).toEqual(['orders']);
    });

    it('orderKeys.detail(orderNumber) incluye el número y difiere entre pedidos', () => {
      expect(orderKeys.detail('ORD-1')).toEqual(['orders', 'detail', 'ORD-1']);
      expect(orderKeys.detail('ORD-1')).not.toEqual(orderKeys.detail('ORD-2'));
    });

    it('orderKeys.all es prefijo de list y detail (árbol invalidable)', () => {
      expect(orderKeys.list()[0]).toBe(orderKeys.all[0]);
      expect(orderKeys.detail('ORD-1')[0]).toBe(orderKeys.all[0]);
    });
  });

  it('AC22: homeKeys.all es prefijo de cualquier homeKeys.* (árbol invalidable)', () => {
    expect(homeKeys.content()).toEqual(['home', 'content']);
    expect(homeKeys.content('hero')).toEqual(['home', 'content', 'hero']);
    expect(homeKeys.banners()).toEqual(['home', 'banners']);
    // All start with homeKeys.all prefix
    expect(homeKeys.content()[0]).toBe(homeKeys.all[0]);
    expect(homeKeys.content('hero')[0]).toBe(homeKeys.all[0]);
    expect(homeKeys.banners()[0]).toBe(homeKeys.all[0]);
  });
});
