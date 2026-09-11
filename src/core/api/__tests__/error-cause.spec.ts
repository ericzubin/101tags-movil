import { HttpError } from '@/core/api/client';

describe('HttpError — cause field (AC5)', () => {
  it('omits cause when not provided', () => {
    const err = new HttpError(500, 'Server Error', null, 'HTTP 500');
    expect(err.cause).toBeUndefined();
  });

  it('exposes cause as "timeout" when constructed with timeout', () => {
    const err = new HttpError(0, 'Timeout', null, 'Request timeout', 'timeout');
    expect(err.cause).toBe('timeout');
  });

  it('exposes cause as "canceled" when constructed with canceled', () => {
    const err = new HttpError(0, 'Canceled', null, 'Request canceled', 'canceled');
    expect(err.cause).toBe('canceled');
  });

  it('accepts cause as the fifth positional argument (order preserved)', () => {
    const err = new HttpError(422, 'Unprocessable', { message: 'invalid' }, 'HTTP 422', 'unknown');
    expect(err.status).toBe(422);
    expect(err.statusText).toBe('Unprocessable');
    expect(err.body).toEqual({ message: 'invalid' });
    expect(err.message).toBe('HTTP 422');
    expect(err.cause).toBe('unknown');
  });

  it('preserves error name and isInstanceOf checks regardless of cause', () => {
    const err = new HttpError(0, 'Canceled', null, 'Request canceled', 'canceled');
    expect(err).toBeInstanceOf(HttpError);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('HttpError');
  });
});
