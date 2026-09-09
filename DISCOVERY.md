# DISCOVERY — Hallazgos, decisiones y notas técnicas de 101tags mobile

Este archivo conserva **todo lo extra** que se descubra durante análisis, revisión del backend, comparación con el storefront, decisiones de seguridad, riesgos, dudas y criterios que no conviene perder aunque todavía no pertenezcan a una spec concreta.

No sustituye `PLAN.md`, `TASKS.md`, `.spec/` ni `STATE.md`:

- `PLAN.md` = plan maestro estable.
- `TASKS.md` = backlog ejecutable.
- `.spec/*.md` = contrato técnico por tarea.
- `STATE.md` = estado actual/relevo.
- `DISCOVERY.md` = memoria técnica consolidada de hallazgos y decisiones de investigación.

---

## 1. Estado inicial del repositorio

Al revisar `main`, el proyecto estaba en estado **greenfield**:

- No existía scaffold Ionic real.
- No existían `src/`, `ios/`, `android/` funcionales.
- `package.json` era un placeholder con scripts pendientes.
- No había tests ni baseline de calidad.
- No había spec activa.
- Sí existían reglas de agentes, workflow SDD/BDD/TDD y plantilla de specs.

Conclusión: no correspondía comenzar por pantallas o servicios; primero había que convertir el plan en backlog/specs verificables.

---

## 2. Fuente de verdad del backend

El móvil **no debe reinventar lógica de negocio**. Para validar contratos se usa este orden:

1. `101tags.com-/routes/api.php`.
2. Controllers / requests / services backend relacionados.
3. Tests Feature/UserStories backend.
4. `storefront/src/api/client.ts` y tipos usados por el storefront.
5. Documentación del backend.

Si hay contradicción, gana el comportamiento real respaldado por rutas/tests.

---

## 3. Contratos backend ya confirmados

Durante la revisión se confirmó que el plan móvil sí está apoyado en endpoints reales, entre ellos:

### Autenticación

- `POST /api/auth/customer/register`
- `POST /api/auth/customer/login`
- `POST /api/auth/customer/forgot-password`
- `POST /api/auth/customer/reset-password`
- sesión `me` / logout dentro del contrato customer existente.

### Checkout

- `GET /api/checkout/config`
- `POST /api/checkout/request-orders`
- `Idempotency-Key` ya es usado por el storefront en `request-orders`.
- Existen pruebas backend para checkout, hardening, OpenPay, purchase flow y mediación de órdenes.

### Notificaciones

- `GET /api/notifications`
- `PATCH /api/notifications/{notification}`
- `POST /api/notifications/read-all`

### Chat / post-compra

- conversaciones existentes.
- mensajes por orden.
- upload de attachments por orden.

Conclusión: el MVP móvil puede construirse consumiendo contratos existentes sin pedir backend nuevo de entrada.

---

## 4. Aclaración funcional importante: compra vs chat

La compra **no se realiza por chat**.

Flujo correcto:

**catálogo → carrito → checkout → request/pago → pedido generado → chat/post-compra**

El chat sirve para comunicación posterior a la creación del pedido, incluyendo casos como comprobantes o seguimiento según contrato existente.

Esta distinción debe preservarse en UX, specs y tests.

---

## 5. Seguridad del token — corrección técnica

Se detectó una suposición que no debía conservarse:

> `Capacitor Preferences` no debe considerarse por sí solo equivalente a Keychain/Keystore cifrado para guardar el bearer token.

Decisión:

- El token Sanctum debe persistirse mediante una solución segura respaldada por Keychain en iOS y Keystore/equivalente seguro en Android.
- `Preferences` queda para información no sensible.
- La dependencia exacta se decide en la spec de Auth.
- No loggear token/password.
- Logout debe eliminar credenciales locales.
- No guardar datos de tarjeta.

Esta corrección ya está reflejada también en `PLAN.md` y `TASKS.md`.

---

## 6. Gate de versiones antes del scaffold

La intención original era:

- Ionic 7
- Angular 17
- Capacitor 6
- Tailwind
- pnpm

Pero estas versiones **no están congeladas**.

Antes de ejecutar `ionic start`, F0 debe validar compatibilidad vigente con:

- Node.
- Angular/Ionic.
- Capacitor.
- Android SDK / Gradle / JDK.
- Xcode / iOS deployment target.
- requisitos actuales de Google Play y App Store.

No se hará upgrade “por moda” ni downgrade arbitrario: cualquier cambio debe quedar justificado en spec.

---

## 7. Idempotencia y operaciones sensibles

`request-orders` ya soporta/usa `Idempotency-Key`.

Implicaciones para móvil:

- Un intento lógico de checkout debe conservar un UUID estable mientras se reintenta el mismo submit.
- Un timeout no debe provocar automáticamente una orden duplicada.
- El cliente no debe mostrar éxito si el backend no confirmó resultado.
- Reintentos de uploads o pagos también deben diseñarse para evitar duplicados involuntarios.

---

## 8. Guest checkout

El plan original contempla guest checkout porque el backend puede permitir flujo sin sesión en determinados contratos.

Todavía debe cerrarse en spec:

- UX exacta.
- cómo recuperar/consultar pedido guest.
- qué acciones post-compra requieren vincular cuenta.
- tratamiento del email.
- seguridad de enlaces/tokens guest.

No eliminarlo ni implementarlo por inercia hasta cerrar esta decisión.

---

## 9. OpenPay

OpenPay debe considerarse una integración condicionada por configuración backend.

Reglas:

- La UI de tarjeta sólo se muestra si `/checkout/config` la habilita.
- Nunca guardar PAN/CVV.
- No loggear datos sensibles.
- Validar que la estrategia del storefront basada en JS sea adecuada dentro del contexto móvil/WebView.
- Si requiere una estrategia móvil distinta, documentarla primero en spec.
- OXXO/SPEI deben mostrar exactamente las instrucciones que entregue la API.

---

## 10. Catálogo y media

Aspectos a conservar en specs:

- `segment=basicos` como alcance del MVP.
- resolver media URLs de forma centralizada.
- no duplicar productos al paginar.
- cancelar/ignorar requests obsoletos al cambiar filtros rápido.
- variantes válidas color/talla/stock deben derivarse del contrato real.
- la cantidad nunca debe superar stock disponible.

---

## 11. Carrito

Decisiones de diseño:

- Angular signals para estado de UI.
- La API sigue siendo autoridad.
- Si se usa actualización optimista, debe existir rollback fiable.
- Badge del tab debe reaccionar al mismo estado central.
- Errores de stock o cantidad no deben dejar carrito local corrupto.

---

## 12. Chat y polling

El plan contempla polling cercano a 5 segundos porque el web ya usa una estrategia de este tipo.

Antes de cerrar la spec:

- confirmar intervalo real.
- detener polling al salir/destruir vista.
- evitar intervals/subscriptions duplicados.
- controlar foreground/background.
- manejar red lenta y requests solapados.

Push remoto se mantiene fuera del MVP salvo nueva aprobación.

---

## 13. Manejo de errores

No tratar todos los errores como “algo salió mal”. Cuando el contrato lo permita se deben distinguir:

- 401: sesión inválida/expirada.
- 403: acción no autorizada.
- 404: recurso inexistente.
- 409: conflicto de estado.
- 422: validación.
- 429: rate limit.
- 5xx: error servidor.
- fallo de red/offline/timeout.

Cada pantalla relevante necesita loading, empty, error y retry seguros.

---

## 14. No confiar en precios/totales del cliente

La app puede mostrar cálculos para UX, pero:

- precios finales,
- descuentos,
- impuestos,
- stock,
- autorización,
- elegibilidad de cancelación/devolución,

siguen siendo autoridad del backend.

Nunca diseñar una spec suponiendo que el cliente puede imponer estas reglas.

---

## 15. Nativo, privacidad y release

F7 debe cubrir explícitamente:

- permisos Camera/Photos/Files necesarios.
- strings de privacidad iOS.
- permisos Android mínimos.
- universal/app links y Android App Links.
- signing Android.
- signing/provisioning iOS.
- excluir keystores, certificados, profiles y secretos del repo.
- QA en dispositivo real.
- comportamiento de back button Android.
- teclado/viewport/safe areas.
- accesibilidad básica.
- screenshots/metadata/checklist de release si la publicación queda dentro del alcance.

---

## 16. Calidad y pruebas

El workflow del repo exige:

**DISCOVERY → SDD → BDD → TDD RED → TDD GREEN → REFACTOR → VERIFICATION**

Aún queda por decidir en F0:

- test runner final.
- lint.
- formatter/check.
- typecheck.
- scripts exactos.
- posible CI.

No afirmar que algo “pasa” hasta haber ejecutado el comando real.

---

## 17. Estimación

El plan original hablaba de aproximadamente 7 días de implementación compacta.

Al convertirlo a trabajo verificable se obtuvo un backlog base de:

- 36 tareas.
- 135 horas de ingeniería orientativas.

La diferencia existe porque ahora se incluye:

- discovery,
- specs,
- BDD/TDD,
- seguridad,
- manejo de errores,
- QA Android/iOS,
- signing,
- deep links,
- accesibilidad,
- release.

Estas horas deben recalibrarse después de F0 y no son un compromiso contractual.

---

## 18. Jerarquía documental definitiva

Orden recomendado para cualquier agente:

1. `AGENTS.md`
2. `STATE.md`
3. `PLAN.md`
4. `DISCOVERY.md`
5. `TASKS.md`
6. `.agent/WORKFLOW.md`
7. `.spec/README.md`
8. spec activa
9. código/diff/git status

Uso:

- `PLAN.md`: qué producto se está construyendo.
- `DISCOVERY.md`: por qué se tomaron decisiones y qué se descubrió.
- `TASKS.md`: qué trabajo concreto existe.
- `.spec`: cómo debe comportarse una tarea específica.
- `STATE.md`: dónde quedó el trabajo.

---

## 19. Sincronización con Notion

Notion funciona como espejo de gestión, no como reemplazo de la fuente técnica.

Actualmente:

- existe proyecto `101tags-movil` en Proyectos Activos.
- existen 36 tareas `[101M]` en la base de Tareas.
- cada tarea conserva fase, ID, prioridad, estimación y detalle.

Si repo y Notion divergen:

1. corregir repo;
2. actualizar Notion.

---

## 20. Qué debe agregarse aquí en el futuro

Agregar a `DISCOVERY.md` cuando aparezcan:

- endpoints nuevos/encontrados.
- discrepancias backend/storefront.
- decisiones de librerías.
- limitaciones iOS/Android.
- hallazgos de seguridad.
- errores de toolchain.
- restricciones de tiendas.
- resultados de spikes/prototipos.
- riesgos no resueltos.
- decisiones descartadas y su motivo.

Cuando un hallazgo se vuelva estable/obligatorio, promoverlo también a `PLAN.md`, `TASKS.md`, `AGENTS.md` o la spec correspondiente.

---

## 21. Próxima investigación

El siguiente Discovery real debe cerrar:

1. matriz de versiones vigente;
2. secure storage elegido;
3. test runner/tooling;
4. deep-link strategy;
5. viabilidad OpenPay en WebView/nativo;
6. payloads exactos de Auth/Cart/Checkout para las primeras specs.

Hasta cerrar F0, el proyecto permanece **PLANNED / READY**, no en implementación.