# Informe de bugs — App móvil (FitWe)

Revisión completa del código en `mobile/src` realizada el 2026-07-28. Los hallazgos están agrupados por área funcional en documentos separados. Cada bug incluye archivo, línea, descripción, escenario de fallo concreto y severidad.

## Documentos

- [01-auth-context-lib.md](./01-auth-context-lib.md) — Autenticación, contexts globales, apiClient, cryptoUtils (10 hallazgos, 2 críticos)
- [02-workout.md](./02-workout.md) — Entrenamiento: rutinas, sesión en vivo, generador de rutinas (9 hallazgos)
- [03-nutrition.md](./03-nutrition.md) — Nutrición: dietas, generador de dietas, catálogo de alimentos (9 hallazgos, 1 crítico)
- [04-profile-payment-admin.md](./04-profile-payment-admin.md) — Perfil, pagos (Stripe/Redsys), ajustes, escáner QR admin, dashboard (11 hallazgos)

## Resumen por severidad

| Severidad | Cantidad | Área principal |
|---|---|---|
| Critical | 3 | Seguridad de tokens de acceso (cryptoUtils), filtros de alergias/dieta bypaseados |
| High | 9 | Sesión expirada no gestionada, ajustes de unidades sobrescritos, doble cobro en pagos, ejercicios duplicados en rutinas, valores de sets desincronizados |
| Medium | 15 | Estados no refrescados al volver de foco, condiciones de carrera, validaciones de formulario, filtro Keto incompleto |
| Low | 8 | Cálculos cosméticos incorrectos, edge cases de `parseInt`/`Number` con `0` |

## Prioridad de arreglo recomendada

1. **Crítico — seguridad**: `cryptoUtils.ts` (secret hardcodeado, sin expiración) — arreglar antes de usar este módulo en producción para control de acceso.
2. **Crítico — salud/seguridad alimentaria**: fallback de `dietEngine.ts` que ignora alergias y tipo de dieta.
3. **Alto — dinero**: posible doble cobro en el flujo de pago (`payment.tsx`).
4. **Alto — datos de usuario**: pantalla de unidades que puede sobrescribir preferencias reales con valores por defecto.
5. **Alto — sesión**: no hay manejo de token expirado (401) en ningún punto de la app.
6. El resto de hallazgos medium/low se pueden abordar de forma incremental.
