import { validateLogin, validateRegister } from '@/core/validation/auth';

describe('validateLogin', () => {
  it('rejects empty email', () => {
    const result = validateLogin({ email: '', password: '12345678' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.email).toBe('El correo es obligatorio');
    }
  });

  it('rejects malformed email', () => {
    const result = validateLogin({ email: 'no-es-email', password: '12345678' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.email).toBe('Ingresa un correo válido');
    }
  });

  it('rejects empty password', () => {
    const result = validateLogin({ email: 'user@x.com', password: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.password).toBe('La contraseña es obligatoria');
    }
  });

  it('rejects password shorter than 8 characters', () => {
    const result = validateLogin({ email: 'user@x.com', password: '1234567' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.password).toBe(
        'La contraseña debe tener al menos 8 caracteres',
      );
    }
  });

  it('accumulates multiple field errors in one call', () => {
    const result = validateLogin({ email: '', password: '1' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.email).toBeDefined();
      expect(result.fieldErrors.password).toBeDefined();
    }
  });

  it('accepts a well-formed email and 8+ character password', () => {
    const result = validateLogin({ email: 'user@example.com', password: '12345678' });
    expect(result.ok).toBe(true);
  });

  it('accepts an email with subdomain and plus alias', () => {
    const result = validateLogin({ email: 'user+tag@mail.sub.example.com', password: 'longenoughpass' });
    expect(result.ok).toBe(true);
  });
});

describe('validateRegister', () => {
  it('rejects empty name', () => {
    const result = validateRegister({
      name: '',
      email: 'user@x.com',
      password: '12345678',
      passwordConfirmation: '12345678',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.name).toBe('El nombre es obligatorio');
    }
  });

  it('rejects name shorter than 2 characters', () => {
    const result = validateRegister({
      name: 'a',
      email: 'user@x.com',
      password: '12345678',
      passwordConfirmation: '12345678',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.name).toBe('El nombre debe tener al menos 2 caracteres');
    }
  });

  it('rejects empty email in register', () => {
    const result = validateRegister({
      name: 'Ana',
      email: '',
      password: '12345678',
      passwordConfirmation: '12345678',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.email).toBe('El correo es obligatorio');
    }
  });

  it('rejects malformed email in register', () => {
    const result = validateRegister({
      name: 'Ana',
      email: 'sin-aroba',
      password: '12345678',
      passwordConfirmation: '12345678',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.email).toBe('Ingresa un correo válido');
    }
  });

  it('rejects password shorter than 8 characters in register', () => {
    const result = validateRegister({
      name: 'Ana',
      email: 'user@x.com',
      password: '1234567',
      passwordConfirmation: '1234567',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.password).toBe(
        'La contraseña debe tener al menos 8 caracteres',
      );
    }
  });

  it('rejects mismatched password confirmation', () => {
    const result = validateRegister({
      name: 'Ana',
      email: 'user@x.com',
      password: '12345678',
      passwordConfirmation: '12345679',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.passwordConfirmation).toBe('Las contraseñas no coinciden');
    }
  });

  it('accumulates multiple field errors at once', () => {
    const result = validateRegister({
      name: 'a',
      email: '',
      password: '1',
      passwordConfirmation: '2',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.name).toBeDefined();
      expect(result.fieldErrors.email).toBeDefined();
      expect(result.fieldErrors.password).toBeDefined();
      expect(result.fieldErrors.passwordConfirmation).toBeDefined();
    }
  });

  it('accepts a fully valid register payload', () => {
    const result = validateRegister({
      name: 'Ana López',
      email: 'ana@example.com',
      password: '12345678',
      passwordConfirmation: '12345678',
    });
    expect(result.ok).toBe(true);
  });
});
