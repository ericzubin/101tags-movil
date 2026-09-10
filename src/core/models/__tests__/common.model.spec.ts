import type { ApiError, LaravelErrorPayload, Paginated, PaginatedLinks, PaginatedMeta } from '@/core/models/common.model';

describe('common.model', () => {
  it('AC1: Paginated<T> tiene data, meta, links con campos exactos del backend', () => {
    const item = { id: 1 };
    const meta: PaginatedMeta = {
      current_page: 1,
      from: 1,
      last_page: 5,
      per_page: 20,
      to: 20,
      total: 100,
    };
    const links: PaginatedLinks = {
      first_page_url: 'https://api.test/api/catalog/products?page=1',
      last_page_url: 'https://api.test/api/catalog/products?page=5',
      next_page_url: 'https://api.test/api/catalog/products?page=2',
      prev_page_url: null,
      path: 'https://api.test/api/catalog/products',
      links: [
        { url: null, label: 'Previous', active: false },
        { url: 'https://api.test/api/catalog/products?page=1', label: '1', active: true, page: 1 },
      ],
    };
    const paginated: Paginated<typeof item> = {
      data: [item],
      meta,
      links,
    };

    expect(paginated.data).toHaveLength(1);
    expect(paginated.meta.current_page).toBe(1);
    expect(paginated.meta.last_page).toBe(5);
    expect(paginated.meta.per_page).toBe(20);
    expect(paginated.meta.total).toBe(100);
    expect(paginated.links.first_page_url).toContain('page=1');
    expect(paginated.links.links[1].page).toBe(1);
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
