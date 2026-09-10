# Spec: M1.9-forgot-reset — Pantalla "¿Olvidaste tu contraseña?" (single-screen entry, reset on web)

**Status**: APPROVED (auto-aprobado)
**Spec ID**: 2026-09-10-m1-9-forgot-reset
**Author**: Agente principal (Architect)
**Date**: 2026-09-10
**Banda**: Tier 2 — UX/auth
**Issue GitHub**: #10 [101M][F1] M1.4 — Forgot/reset password y deep links
**Decisión de producto** (confirmada con usuario 2026-09-10): **flujo web nativo**. La app solo captura el email; el backend envía link al storefront web; el usuario hace reset en el navegador. NO deep-links, NO paste helper, NO pantalla reset en la app.

---

## Contexto

Issue #10 del backlog: forgot/reset password. Backend Laravel ya tiene los endpoints implementados y probados (8 tests en `PasswordResetTest.php`):

- `POST /api/auth/customer/forgot-password` (público, `throttle:auth`) — body `{email}`, **siempre retorna 200** con mensaje genérico (anti-enumeración).
- `POST /api/auth/customer/reset-password` (público, `throttle:auth`) — body `{email, token, password, password_confirmation}`.

El email contiene `{STOREFRONT_URL}/restablecer-contrasena?token=…&email=…` apuntando al storefront web Vue. El reset ocurre 100% en el navegador.

## Objetivo

1. **Pantalla `(auth)/forgot-password.tsx`** con input email + submit + mensaje genérico "Revisa tu correo" + link "Volver a iniciar sesión".
2. **AuthService.forgotPassword(email)** method que llama `POST /api/auth/customer/forgot-password` y retorna mensaje genérico.
3. **Link "¿Olvidaste tu contraseña?"** en `(auth)/login.tsx` que navega a `/(auth)/forgot-password`.
4. **Tests BDD** (≥6) que cubren render, submit OK, error de validación, anti-enumeración, network error, loading, navegación back.
5. **Mensaje siempre en es-MX**, copy exacto del backend ("Si el correo está registrado...").

## Fuera de alcance

- Pantalla de reset en la app (ocurre en web).
- Deep links / Universal Links / App Links (F7 — M7.2/M7.3).
- Cambio al backend `buildResetUrl()` (lectura-only per AGENTS.md).
- Paste-helper de token (UX pobre, descartado).
- 2FA / OTP (no soportado por backend actual).
- Change-password autenticado (no existe endpoint; futuro).

## Arquitectura afectada

### Crear

- `src/app/(auth)/forgot-password.tsx` (~140 líneas, análogo a `register.tsx` y `login.tsx`)
- `src/app/(auth)/__tests__/forgot-password.spec.tsx` (~6 tests)

### Modificar

- `src/core/services/auth-service.ts` — añadir método `forgotPassword(email: string): Promise<{message: string}>`
- `src/core/models/auth.ts` — añadir tipos `ForgotPasswordRequest = {email: string}` y `ForgotPasswordResponse = {message: string}`
- `src/app/(auth)/_layout.tsx` — añadir `<Stack.Screen name="forgot-password" options={{title: 'Recuperar contraseña', headerShown: true}} />`
- `src/app/(auth)/login.tsx` — añadir `<Pressable onPress={() => router.push('/(auth)/forgot-password')}>¿Olvidaste tu contraseña?</Pressable>`

### NO tocar

- `src/app/_layout.tsx` (raíz completo).
- `src/core/api/client.ts` (request ya soporta cualquier endpoint).
- Backend Laravel.
- Otros tabs / screens.

## Contratos

### Backend (`POST /api/auth/customer/forgot-password`)

**Request:**
```json
{ "email": "cliente@ejemplo.com" }
```

**Response `200 OK`** (siempre idéntico, éxito o no — anti-enumeración):
```json
{
  "message": "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña."
}
```

**Response `422 Unprocessable`** (solo si email no pasa validación de formato):
```json
{
  "message": "The given data was invalid.",
  "errors": { "email": ["The email field must be a valid email address."] }
}
```

### AuthService.forgotPassword

```ts
async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const response = await httpClient.request<ForgotPasswordResponse>({
    method: 'POST',
    path: '/auth/customer/forgot-password',
    body: { email },
  });
  return response.data;
}
```

- No lanza error en 200 (es success siempre).
- Sí lanza `AuthError` en 422 (error de validación).
- Sí lanza `AuthError('NETWORK_ERROR', ...)` en error de red.

### Pantalla

```tsx
// src/app/(auth)/forgot-password.tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { authService } from '@/core/services/auth-service';
// ... usar Nativewind className, brand colors, Montserrat fonts

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Ingresa un correo electrónico válido.');
        return;
      }
      await authService.forgotPassword(email);
      setSuccess(true);  // siempre muestra éxito (anti-enumeración)
    } catch (err) {
      // Solo network errors (no 422 ya validado cliente-side)
      setError('No pudimos enviar el correo. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-medium p-6">
        <Text className="font-brand-bold text-2xl text-brand-dark mb-4">Revisa tu correo</Text>
        <Text className="font-brand text-base text-brand-dark text-center mb-6">
          Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.
        </Text>
        <Pressable
          onPress={() => router.replace('/(auth)/login')}
          className="bg-brand-primary rounded-lg px-6 py-3 active:opacity-80"
        >
          <Text className="font-brand-bold text-white text-base">Volver a iniciar sesión</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-brand-medium p-6 justify-center">
      <Text className="font-brand-bold text-2xl text-brand-dark mb-2">¿Olvidaste tu contraseña?</Text>
      <Text className="font-brand text-sm text-brand-dark mb-6">
        Te enviaremos un enlace para restablecerla.
      </Text>
      
      <TextInput
        accessibilityLabel="Correo electrónico"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        placeholder="tucorreo@ejemplo.com"
        value={email}
        onChangeText={setEmail}
        editable={!submitting}
        className="bg-white border border-brand-dark/20 rounded-lg px-4 py-3 mb-2 font-brand"
        testID="forgot-email-input"
      />
      {error && (
        <Text className="font-brand text-sm text-red-600 mb-2" testID="forgot-error">
          {error}
        </Text>
      )}
      
      <Pressable
        onPress={handleSubmit}
        disabled={submitting}
        className="bg-brand-primary rounded-lg px-6 py-3 active:opacity-80 mt-4 flex-row justify-center items-center"
        testID="forgot-submit"
      >
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="font-brand-bold text-white text-base">Enviar enlace</Text>
        )}
      </Pressable>
      
      <Pressable
        onPress={() => router.back()}
        disabled={submitting}
        className="mt-4 active:opacity-80"
        testID="forgot-back"
      >
        <Text className="font-brand text-brand-dark text-center">Volver</Text>
      </Pressable>
    </View>
  );
}
```

## Acceptance Criteria (BDD)

### AC1: Pantalla existe y renderiza

```gherkin
Scenario: Renderizado inicial
  Given usuario navega a /forgot-password
  Then aparece TextInput email
  And aparece botón "Enviar enlace"
  And aparece botón "Volver"
  And NO aparece mensaje de éxito
  And NO aparece mensaje de error
```

### AC2: Validación cliente email

```gherkin
Scenario: Email inválido
  Given email = "no-es-email"
  When submit
  Then NO se llama authService.forgotPassword
  And aparece mensaje "Ingresa un correo electrónico válido."
  And email input mantiene foco
```

### AC3: Submit OK → mensaje genérico

```gherkin
Scenario: Email válido + 200 OK
  Given email = "existente@ejemplo.com"
  And authService.forgotPassword mock retorna { message: "Si el correo..." }
  When submit
  Then se llama authService.forgotPassword("existente@ejemplo.com")
  And aparece Text "Revisa tu correo"
  And aparece mensaje "Si el correo está registrado, recibirás instrucciones..."
  And aparece botón "Volver a iniciar sesión"
```

### AC4: Anti-enumeración

```gherkin
Scenario: Email no registrado → MISMO mensaje
  Given email = "no-existe@ejemplo.com"
  And authService.forgotPassword mock retorna { message: "Si el correo..." } (200 OK)
  When submit
  Then aparece MISMO mensaje genérico que para email existente
  And NO aparece "Este correo no está registrado"
  And NO aparece "Correo no encontrado"
```

### AC5: Network error

```gherkin
Scenario: Sin conexión
  Given email = "test@ejemplo.com"
  And authService.forgotPassword mock throws AuthError('NETWORK_ERROR')
  When submit
  Then aparece Text error "No pudimos enviar el correo. Revisa tu conexión e inténtalo de nuevo."
  And NO aparece mensaje de éxito
```

### AC6: Loading state

```gherkin
Scenario: Durante submit
  Given authService.forgotPassword mock retorna Promise pendiente
  When submit
  Then TextInput es editable={false}
  And submit button muestra ActivityIndicator
  And submit button está disabled
```

### AC7: Link back navega a /login

```gherkin
Scenario: Click "Volver"
  Given pantalla forgot-password
  When presiona "Volver"
  Then router navega a /(auth)/login
```

### AC8: Link "Volver a iniciar sesión" (post-success)

```gherkin
Scenario: Success → click back-to-login
  Given pantalla forgot-password en estado success
  When presiona "Volver a iniciar sesión"
  Then router.replace navega a /(auth)/login
```

### AC9: Login link "¿Olvidaste tu contraseña?"

```gherkin
Scenario: Desde login
  Given pantalla login
  Then aparece link "¿Olvidaste tu contraseña?"
  When click link
  Then router navega a /(auth)/forgot-password
```

### AC10: AuthService.forgotPassword llama POST correcto

```gherkin
Scenario: Service method
  When authService.forgotPassword("a@b.com")
  Then httpClient.request fue llamado con:
    method="POST"
    path="/auth/customer/forgot-password"
    body={email: "a@b.com"}
```

## Definition of Done

- [ ] Spec escrita.
- [ ] `forgot-password.tsx` creado.
- [ ] `AuthService.forgotPassword(email)` añadido.
- [ ] Tipos `ForgotPasswordRequest` y `ForgotPasswordResponse` en `auth.ts`.
- [ ] `(auth)/_layout.tsx` registra `forgot-password` screen.
- [ ] `login.tsx` tiene link "¿Olvidaste tu contraseña?".
- [ ] `forgot-password.spec.tsx` con ≥6 tests (AC1, AC2, AC3, AC4, AC5, AC6).
- [ ] `auth-service.spec.ts` (o similar) con test para `forgotPassword` (AC10).
- [ ] `pnpm typecheck` exit 0.
- [ ] `pnpm lint` exit 0.
- [ ] Cada test pasa (≥7 nuevos).
- [ ] STATE.md, TASKS.md, spec DONE; commit docs a `developer`.
- [ ] PR contra `developer`, NO merge.

## Riesgos / caveats

1. **Anti-enumeración es crítica**: backend ya la garantiza; cliente debe respetarla. Nunca filtrar "ese correo no existe".
2. **Mensaje genérico**: copy debe ser EXACTO al del backend. Si backend cambia, cliente debe sincronizarse (no debería sin aprobación).
3. **Email puede no llegar**: `MAIL_MAILER=log` en dev = solo log. Cliente no puede verificar entrega; solo pedir al usuario que revise (incluyendo spam).
4. **Throttle HTTP**: `throttle:auth` (60/min por IP). Cliente no debe auto-retry agresivo.
5. **Email inválido en cliente** ya bloquea submit → evita round-trip al backend. Pero backend re-valida con `email` rule.
6. **No hay pantalla reset en app**: usuario debe entender que el flujo continúa en navegador. Copy debe ser claro.
7. **Link "Volver"** vs "Volver a iniciar sesión": success usa `router.replace` (reemplaza la pantalla en el stack, evita back-to-forgot-password), form usa `router.back` (vuelve a login).

## Handover

Al cerrar:
- ~7 tests nuevos.
- Total tests: 240 → **~247**.
- Issue #10 cerrada en GitHub.
- Próximo: **M1.10-splash-tabs (#11)** que arranca en worktree paralela.
