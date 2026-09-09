# Spec: Scaffold Ionic/Angular/Capacitor de 101tags mobile

**Status**: DRAFT  
**Spec ID**: 2026-09-09-ionic-scaffold  
**Author**: ChatGPT / planificación técnica  
**Date**: 2026-09-09  
**Related specs**: ninguna; es la primera spec del proyecto

---

## Contexto

`101tags-movil` es un proyecto greenfield. El repositorio contiene reglas, workflow, plan y backlog, pero todavía no existe el workspace Ionic ni las plataformas `ios/` y `android/`.

La aplicación será el cliente móvil para compradores de 101tags y consumirá la API Laravel 12 existente de `101tags.com-`. Esta tarea **no implementa lógica de negocio**: solamente crea una base técnica reproducible y verificable para las siguientes features.

## Problema

Antes de desarrollar Auth, catálogo o checkout se necesita una estructura real con:

- Ionic + Angular standalone.
- Capacitor para iOS/Android.
- Environments y acceso API configurable.
- Theme y Tailwind.
- Baseline de tests, lint, formato, typecheck y build.
- Estructura de carpetas suficiente para que las siguientes specs no improvisen arquitectura.

## Objetivo

Crear un scaffold móvil reproducible, sin secretos y con baseline de calidad verde, listo para empezar la spec de autenticación.

## Fuera de alcance

- Login/registro funcional.
- Catálogo/productos.
- Carrito/checkout/pagos.
- Pedidos/chat/notificaciones.
- Cambios en Laravel, DB o storefront web.
- Push notifications.
- CI/CD de publicación a tiendas, salvo archivos mínimos que el scaffold necesite.

## Arquitectura afectada

Archivos/directorios esperados después de esta tarea:

```text
src/
├── app/
│   ├── app.component.ts
│   ├── app.config.ts
│   ├── app.routes.ts
│   ├── core/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── models/
│   │   └── services/
│   ├── shared/
│   │   ├── components/
│   │   ├── directives/
│   │   └── pipes/
│   └── pages/
├── environments/
└── theme/
ios/
android/
```

La estructura puede ajustarse al scaffold real generado, pero cualquier diferencia relevante debe documentarse y no debe introducir una segunda arquitectura paralela.

## Contratos

### API

Esta spec no llama endpoints de negocio. Sólo establece `apiBaseUrl` configurable.

- Dev: preferencia por `/api` mediante proxy local al backend Laravel.
- Producción: URL definida por environment/configuración de build.
- Ningún dominio productivo debe quedar repetido en componentes/services.

### Storage local

Esta spec puede instalar/configurar storage **no sensible** si la decisión ya está aprobada.

El bearer token **NO se almacena** todavía. La implementación segura del token se decide en la spec de Auth y debe usar una solución respaldada por Keychain/Keystore en nativo. `@capacitor/preferences` queda reservado para datos no sensibles salvo evidencia técnica distinta documentada y aprobada.

### Estado/signals

No se crea estado de negocio. Se permiten únicamente señales de shell/demo necesarias para comprobar el scaffold.

### Rutas

Debe existir una ruta de arranque mínima y el router debe renderizar sin errores. Las rutas funcionales del MVP se incorporarán en sus propias specs.

## Stack y decisiones a cerrar antes de APPROVED

La intención original del plan es:

- Ionic 7.
- Angular 17 standalone.
- Capacitor 6.
- Tailwind CSS.
- TypeScript.
- pnpm.

Antes de cambiar esta spec a `APPROVED`, M0.3 debe validar compatibilidad con los requisitos vigentes de Android/iOS. Si hace falta una versión distinta, documentar:

1. versión propuesta;
2. motivo;
3. compatibilidad;
4. impacto/migración;
5. aprobación del usuario.

También debe cerrarse el test runner que realmente genere/soporte el scaffold. No sustituirlo por otra herramienta sin justificación.

## Seguridad

- No hardcodear tokens, passwords, OpenPay keys ni secrets.
- No commitear `.env` con secretos, certificados, provisioning profiles o keystores.
- API prod debe usar HTTPS.
- No introducir almacenamiento inseguro del bearer token durante el scaffold.
- Dependencias nuevas deben tener propósito documentado.
- Permisos nativos: ninguno extra salvo los que el scaffold requiera; Camera/Push/etc. se agregan cuando exista la feature que los necesita.

## Compatibilidad

- La API Laravel existente es la fuente de contratos; esta tarea no la cambia.
- Mantener idioma `es-MX` y branding de 101tags.
- El scaffold debe poder ejecutarse en navegador para desarrollo además de sincronizar Android/iOS.

## Riesgos

1. Las versiones originalmente propuestas pueden estar desfasadas respecto a SDK/store requirements vigentes.
2. Un plugin elegido prematuramente puede bloquear actualización de Capacitor.
3. Mezclar npm/pnpm puede generar lockfiles inconsistentes.
4. Agregar plataformas nativas sin una política de archivos generados puede ensuciar el repo.
5. Configurar storage sensible como Preferences sería una falsa garantía de seguridad.

## Plan de implementación

1. Ejecutar Discovery final de versiones y entorno.
2. Cerrar decisiones pendientes de esta spec y marcar `APPROVED`.
3. Generar proyecto Ionic Angular standalone con el package manager acordado.
4. Añadir/configurar Capacitor Android/iOS.
5. Configurar Tailwind y theme 101tags.
6. Configurar environments/proxy.
7. Crear estructura `core/shared/pages` sin implementar features.
8. Detectar scripts reales generados y configurar test/lint/format/typecheck/build.
9. Crear smoke tests del shell/configuración.
10. Ejecutar TDD/verification y registrar resultados en `STATE.md`.

---

## Escenarios BDD

### Escenario 1 — Instalación reproducible

**Dado** un checkout limpio del repositorio  
**Cuando** se instala usando el package manager documentado  
**Entonces** todas las dependencias del scaffold se resuelven sin mezclar lockfiles  
**Y** el comando de desarrollo puede iniciar la aplicación.

### Escenario 2 — Build web

**Dado** el scaffold configurado  
**Cuando** se ejecuta el build definido por el proyecto  
**Entonces** finaliza sin errores TypeScript  
**Y** genera los assets esperados para Capacitor.

### Escenario 3 — Configuración API por environment

**Dado** un build de desarrollo  
**Cuando** un futuro service consulte `apiBaseUrl`  
**Entonces** la URL proviene de la configuración central  
**Y** ningún componente necesita conocer el host productivo.

### Escenario 4 — Branding base

**Dado** el shell de la aplicación  
**Cuando** se renderiza  
**Entonces** usa las variables de theme 101tags  
**Y** la configuración tipográfica/estilos está centralizada.

### Escenario 5 — Baseline de tests

**Dado** el proyecto recién generado  
**Cuando** se ejecuta el comando de test  
**Entonces** existe al menos un smoke test válido  
**Y** termina verde antes de iniciar Auth.

### Escenario 6 — Typecheck/lint/build

**Dado** el scaffold terminado  
**Cuando** se ejecutan los comandos de verification disponibles  
**Entonces** los resultados reales se registran en `STATE.md`  
**Y** ninguna verificación se declara ejecutada si no existe o no pudo correrse.

### Escenario 7 — Sin secretos

**Dado** el diff completo de F0  
**Cuando** se revisan archivos de configuración y plataformas nativas  
**Entonces** no existen credenciales reales, tokens, keystores ni provisioning profiles versionados.

### Escenario 8 — Plataformas nativas

**Dado** que Android/iOS fueron añadidos  
**Cuando** se ejecuta la sincronización de Capacitor  
**Entonces** ambas plataformas reciben el web build/config sin errores atribuibles al scaffold.

### Escenario 9 — Storage sensible aún no implementado

**Dado** que Auth está fuera de alcance  
**Cuando** termina esta tarea  
**Entonces** no existe un bearer token persistido en Preferences/localStorage  
**Y** la decisión de secure storage queda explícita para F1.

---

## Verification esperada

Los nombres exactos de comandos deben obtenerse del scaffold real; no se inventarán antes de generarlo. Como mínimo se debe poder demostrar:

- instalación limpia;
- tests;
- lint si el scaffold lo configura;
- formatter/check si se configura;
- `tsc --noEmit` o equivalente;
- build web/Ionic;
- `cap sync` Android/iOS.

## Checklist

- [ ] M0.1 backend contracts audit completada
- [ ] M0.3 version matrix validada
- [ ] Spec aprobada
- [ ] BDD completo
- [ ] Tests escritos (RED) cuando sea razonable
- [ ] Tests fallando correctamente
- [ ] Scaffold implementado (GREEN)
- [ ] Refactor
- [ ] Verification completa
- [ ] `STATE.md` actualizado
- [ ] Dependencias y lockfile consistentes
- [ ] Sin secretos

> Mientras `Status` sea `DRAFT`, **no ejecutar `ionic start` ni implementar F0**. El siguiente paso es revisar las decisiones pendientes y aprobar explícitamente esta spec.
