import { catalogKeys, chatKeys, homeKeys, orderKeys } from '@/core/query/keys';

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
    it('orderKeys.list(userId) aísla la key por usuario bajo el namespace orders', () => {
      expect(orderKeys.list(1)).toEqual(['orders', 'list', 1]);
      expect(orderKeys.list(2)).toEqual(['orders', 'list', 2]);
      expect(orderKeys.list(1)).not.toEqual(orderKeys.list(2));
      expect(orderKeys.list(null)).toEqual(['orders', 'list', 'anonymous']);
      expect(orderKeys.all).toEqual(['orders']);
    });

    it('orderKeys.detail(userId, orderNumber) incluye usuario y número, y difiere entre pedidos', () => {
      expect(orderKeys.detail(1, 'ORD-1')).toEqual(['orders', 'detail', 1, 'ORD-1']);
      expect(orderKeys.detail(1, 'ORD-1')).not.toEqual(orderKeys.detail(1, 'ORD-2'));
      expect(orderKeys.detail(1, 'ORD-1')).not.toEqual(orderKeys.detail(2, 'ORD-1'));
      expect(orderKeys.detail(null, 'ORD-1')).toEqual(['orders', 'detail', 'anonymous', 'ORD-1']);
    });

    it('orderKeys.all es prefijo de list y detail (árbol invalidable)', () => {
      expect(orderKeys.list(1)[0]).toBe(orderKeys.all[0]);
      expect(orderKeys.detail(1, 'ORD-1')[0]).toBe(orderKeys.all[0]);
    });

    it('M4.2: orderKeys.returns(userId) aísla la key por usuario bajo el namespace orders', () => {
      expect(orderKeys.returns(1)).toEqual(['orders', 'returns', 1]);
      expect(orderKeys.returns(1)).not.toEqual(orderKeys.returns(2));
      expect(orderKeys.returns(null)).toEqual(['orders', 'returns', 'anonymous']);
      expect(orderKeys.returns(1)[0]).toBe(orderKeys.all[0]);
    });
  });

  describe('chatKeys (M5.1)', () => {
    it('chatKeys.conversations() es una key estable bajo el namespace chat', () => {
      expect(chatKeys.conversations()).toEqual(['chat', 'conversations']);
      expect(chatKeys.all).toEqual(['chat']);
    });

    it('chatKeys.conversation(orderNumber) incluye el número y difiere entre pedidos', () => {
      expect(chatKeys.conversation('ORD-1')).toEqual(['chat', 'conversation', 'ORD-1']);
      expect(chatKeys.conversation('ORD-1')).not.toEqual(chatKeys.conversation('ORD-2'));
    });

    it('chatKeys.all es prefijo de conversations y conversation (árbol invalidable)', () => {
      expect(chatKeys.conversations()[0]).toBe(chatKeys.all[0]);
      expect(chatKeys.conversation('ORD-1')[0]).toBe(chatKeys.all[0]);
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
