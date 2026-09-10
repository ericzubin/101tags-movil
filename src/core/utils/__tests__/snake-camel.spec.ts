import { toCamel } from '@/core/utils/snake-camel';

describe('snake-camel mapper (toCamel)', () => {
  it('AC5: convierte top-level snake_case keys → camelCase', () => {
    const result = toCamel<{ userId: number; userName: string }>({
      user_id: 1,
      user_name: 'X',
    });
    expect(result).toEqual({ userId: 1, userName: 'X' });
  });

  it('AC6: procesa objetos anidados y arrays recursivamente', () => {
    const input = {
      user_profile: {
        user_id: 1,
        nested_field: { inner_key: 'v' },
      },
      items_list: [
        { item_id: 10, item_name: 'A' },
        { item_id: 20, item_name: 'B' },
      ],
    };
    const result = toCamel<{
      userProfile: {
        userId: number;
        nestedField: { innerKey: string };
      };
      itemsList: { itemId: number; itemName: string }[];
    }>(input);
    expect(result.userProfile.userId).toBe(1);
    expect(result.userProfile.nestedField.innerKey).toBe('v');
    expect(result.itemsList[0].itemId).toBe(10);
    expect(result.itemsList[1].itemName).toBe('B');
  });

  it('AC7: null, undefined, primitives, Date, RegExp se preservan', () => {
    expect(toCamel(null)).toBeNull();
    expect(toCamel(undefined)).toBeUndefined();
    expect(toCamel(42)).toBe(42);
    expect(toCamel('plain string')).toBe('plain string');
    expect(toCamel(true)).toBe(true);

    const d = new Date('2026-01-01T00:00:00Z');
    expect(toCamel(d)).toBe(d);

    const r = /abc/;
    expect(toCamel(r)).toBe(r);
  });

  it('AC8: arrays vacíos y objetos vacíos devuelven [] y {} (no pierden estructura)', () => {
    expect(toCamel([])).toEqual([]);
    expect(toCamel({})).toEqual({});
  });

  it('preserva keys ya en camelCase sin doble-transformación', () => {
    const result = toCamel({ alreadyCamel: 1, snake_case: 2 });
    expect(result).toEqual({ alreadyCamel: 1, snakeCase: 2 });
  });
});
