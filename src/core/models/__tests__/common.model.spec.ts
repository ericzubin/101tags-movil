import type { ApiError, LaravelErrorPayload, Paginated } from '@/core/models/common.model';

describe('common.model', () => {
  it('AC1: Paginated<T> tiene shape flat camelCase del LengthAwarePaginator', () => {
    const item = { id: 1 };
    const paginated: Paginated<typeof item> = {
      data: [item],
      currentPage: 1,
      lastPage: 5,
      perPage: 12,
      total: 60,
      from: 1,
      to: 12,
      nextPageUrl: 'https://api.test/api/catalog/products?page=2',
      prevPageUrl: null,
    };

    expect(paginated.data).toHaveLength(1);
    expect(paginated.currentPage).toBe(1);
    expect(paginated.lastPage).toBe(5);
    expect(paginated.perPage).toBe(12);
    expect(paginated.total).toBe(60);
    expect(paginated.from).toBe(1);
    expect(paginated.to).toBe(12);
    expect(paginated.nextPageUrl).toContain('page=2');
    expect(paginated.prevPageUrl).toBeNull();
  });

  it('Paginated<T> admite from/to null en página vacía', () => {
    const paginated: Paginated<{ id: number }> = {
      data: [],
      currentPage: 1,
      lastPage: 1,
      perPage: 12,
      total: 0,
      from: null,
      to: null,
      nextPageUrl: null,
      prevPageUrl: null,
    };

    expect(paginated.data).toHaveLength(0);
    expect(paginated.from).toBeNull();
    expect(paginated.to).toBeNull();
    expect(paginated.nextPageUrl).toBeNull();
  });

  it('LaravelErrorPayload soporta message + errors opcionales', () => {
    const error: LaravelErrorPayload = {
      message: 'Validation failed',
      errors: { email: ['required'], password: ['too short'] },
    };
    expect(error.message).toBe('Validation failed');
    expect(error.errors?.email[0]).toBe('required');
  });

  it('ApiError soporta status + message + errors opcionales', () => {
    const err: ApiError = {
      status: 422,
      message: 'Validation failed',
      errors: { email: ['required'] },
    };
    expect(err.status).toBe(422);
    expect(err.errors?.email).toEqual(['required']);
  });
});
