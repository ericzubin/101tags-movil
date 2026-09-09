# `.spec/` — Convenciones para Specs

Las specs viven en esta carpeta.

## Nombrado

`.spec/<nombre-en-kebab-case>.md`

Ejemplos:
- `.spec/login-screen.md`
- `.spec/product-detail-variants.md`
- `.spec/order-chat-polling.md`
- `.spec/checkout-without-payment.md`

Una spec por tarea. Una tarea puede referenciar otra spec si hay dependencia.

## Estado

Actualizar el campo **Status** al inicio de la spec:

- `DRAFT` — en redacción.
- `APPROVED` — lista para implementar.
- `IN PROGRESS` — implementación en curso.
- `DONE` — implementada y verificada.
- `CANCELLED` — descartada (mantener el archivo como historial).

---

## Plantilla SDD

Copiar la siguiente plantilla para cada nueva spec:

````markdown
# Spec: <Título>

**Status**: DRAFT
**Spec ID**: <YYYY-MM-DD-kebab-case>
**Author**: <agente o persona>
**Date**: <YYYY-MM-DD>
**Related specs**: <rutas a otras specs si aplica>

---

## Contexto

Situación actual del sistema relevante a esta tarea.

## Problema

Qué debe resolverse. Por qué importa.

## Objetivo

Resultado esperado en una frase.

## Fuera de alcance

Qué NO forma parte de esta tarea.

## Arquitectura afectada

Componentes, capas y módulos involucrados:
- Pages: …
- Services: …
- Models: …
- Components: …
- Guards: …
- Routes: …

## Contratos

### API endpoints consumidos

| Método | Path | Auth | Request | Response | Errores |
|---|---|---|---|---|---|
| POST | /api/... | Bearer | `{…}` | `{…}` | 401, 422, 5xx |

### Storage local

Claves en Capacitor Preferences:
- `101tags-token` (secure)
- `101tags-cart`
- …

### Señales / estado

Si aplica:
- `authSignal: Signal<User | null>`
- `cartSignal: Signal<CartLine[]>`
- …

### Rutas / navegación

- `/login`
- `/product/:slug`
- …

## Modelos / DTOs

```ts
interface ProductSummary {
  id: number;
  name: string;
  slug: string;
  base_price: number;
  // …
}
```

## Seguridad

- Autenticación requerida: sí / no.
- Autorización: ownership check sobre `user_id`.
- Validaciones: email, teléfono E.164, etc.
- Sanitización: body de chat no permite `@`, `mailto:`, `tel:`, `whatsapp`, `http://`, `https://` (mismo filtro que el backend).
- Rate limits: respetados.
- Exposición de datos sensibles: nunca loggear tokens.

## Compatibilidad

Comportamiento existente a preservar (especialmente referencia al storefront web).

## Riesgos

Posibles regresiones o problemas.

## Plan de implementación

1. …
2. …
3. …

---

## Escenarios BDD

Cada comportamiento esperado se escribe como escenario.

```gherkin
Dado <contexto inicial>
  Y <contexto adicional si aplica>
Cuando <acción del usuario o sistema>
Entonces <resultado observable>
  Y <resultado adicional si aplica>
```

### Escenario 1 — Happy path

**Dado** que el usuario está autenticado
**Y** tiene productos en el carrito
**Cuando** presiona "Solicitar pedido"
**Entonces** la app llama a `POST /api/checkout/request-orders`
**Y** recibe un `purchase_number`
**Y** abre el chat de la orden

### Escenario 2 — Validación

**Dado** que el carrito está vacío
**Cuando** el usuario abre la pantalla de carrito
**Entonces** se muestra el mensaje "Tu carrito está vacío"
**Y** el botón "Solicitar pedido" está deshabilitado

### Escenario 3 — Error de red

**Dado** que no hay conexión
**Cuando** el usuario intenta hacer checkout
**Entonces** la app muestra un toast de error
**Y** no se llama al backend

(añadir tantos como aplique: permisos, ownership, rate limit, etc.)

---

## Checklist

- [ ] Spec aprobada
- [ ] BDD completo
- [ ] Tests escritos (RED)
- [ ] Tests fallando correctamente
- [ ] Implementación (GREEN)
- [ ] Refactor
- [ ] Verification completa
- [ ] STATE.md actualizado
````

---

## Reglas

1. **Una spec por tarea.** Si la tarea crece, partirla.
2. **No implementar antes de aprobar.** Status `DRAFT` significa "todavía no".
3. **Specs canceladas se mantienen** como historial.
4. **Specs DONE incluyen el commit hash o referencia** de lo que se implementó.

---

## Cómo empezar una tarea

```bash
# 1. Copiar plantilla
cp .spec/README.md .spec/mi-tarea.md
# Editar el contenido (reemplazar la plantilla)

# 2. Marcar Status: APPROVED cuando esté lista

# 3. Empezar FASE 3 (TDD RED)
```
