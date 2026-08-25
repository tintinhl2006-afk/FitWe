# Perfil, Pagos, Ajustes, Admin y Dashboard

Archivos revisados:
- `src/app/(tabs)/_layout.tsx`, `index.tsx`, `classes/index.tsx`
- `src/app/(tabs)/profile/_layout.tsx`, `index.tsx`, `payment.tsx`
- `src/app/(tabs)/profile/settings/{account,appearance,gym,index,password,units}.tsx`
- `src/app/admin/qr-scanner.tsx`
- `src/components/SettingsHeader.tsx`, `external-link.tsx`, `ui/index.tsx`
- `src/hooks/use-color-scheme.ts`, `.web.ts`, `src/constants/theme.ts`

---

## High

### 1. Crash si `data.plans` no está definido — `payment.tsx:74`
```ts
setSelectedPlanId(data.currentPlanId || (data.plans[0] && data.plans[0].id) || null);
```
`plans` en el estado se protege con `data.plans || []`, pero esta línea accede a `data.plans[0]` directamente. Si la API devuelve alguna vez un payload sin campo `plans` (respuesta de error, gimnasio mal configurado), esto lanza `TypeError: Cannot read properties of undefined`, tumbando toda la pantalla de pago.

### 2. Riesgo de doble cobro si la verificación falla tras un cargo exitoso — `payment.tsx:132-146, 214-222`
`handleVerify` pasa a `step('error')` ante cualquier fallo de `GET /api/user/payment/verify` (incluyendo errores de red transitorios), pero la pasarela puede ya haber cobrado la tarjeta. La única acción de recuperación es el botón "Reintentar" (línea 218), que llama a `fetchPlans()` y devuelve al usuario a la pantalla de selección de plan/pago — no a reverificar. Un usuario que sufra un corte de red justo después de un cobro real puede verse llevado a pagar otra vez.

### 3. La pantalla de Unidades puede sobrescribir preferencias reales con valores por defecto — `settings/units.tsx:16-19` vs `PreferencesContext.tsx:20-45`
El estado local (`weightUnit`/`distanceUnit`/`measurementUnit`) se inicializa una sola vez con `useState(prefs.weightUnit)`, etc. `PreferencesContext` obtiene los valores reales de forma asíncrona (`refreshPreferences()`), que puede resolver *después* de que esta pantalla ya haya montado y capturado el valor por defecto stale (`'kg'/'km'/'cm'`). No hay ningún efecto en `units.tsx` para resincronizar el estado local cuando `prefs` termine de cargar.
- **Escenario de fallo**: si el usuario abre Ajustes → Unidades justo después de iniciar sesión y pulsa "Guardar Cambios" sin tocar nada, `handleSave` llama a `api.patch('/api/settings/units', { weightUnit: 'kg', distanceUnit: 'km', measurementUnit: 'cm' })`, **sobrescribiendo** las preferencias reales guardadas del usuario con valores hardcodeados. Pérdida silenciosa de datos.

---

## Medium

### 4. Condición de carrera: el WebView de pago puede cargar antes de que el script de inyección de token esté listo — `payment.tsx:82-103, 169-189`
`injectedAuthScript` empieza como `''` y se rellena de forma asíncrona vía `getAuthToken().then(...)`. El `WebView` se monta en cuanto `step === 'webview'`, con el valor que tenga `injectedAuthScript` en ese momento. Si el usuario llega a "Pagar Ahora" antes de que resuelva el fetch async del token (storage lento, cold start), el WebView monta con el script de inyección vacío, y las llamadas `fetch` de la página de checkout salen sin Bearer token.
- Nota: esto reproduce, del lado cliente, la misma clase de bug de "petición autenticada tratada como no autenticada" que el commit `6e12535` corrigió del lado del servidor/middleware — este caso concreto no queda cubierto por ese fix.

### 5. Sin manejo de permiso de cámara denegado permanentemente — `admin/qr-scanner.tsx:19-36`
Solo se comprueba `permission.granted`; `permission.canAskAgain === false` (iOS/Android "no volver a preguntar") no se gestiona. Pulsar "Conceder Permiso" llama a `requestPermission()`, que no mostrará el diálogo del sistema de nuevo y no hace nada silenciosamente, dejando al personal atascado en la pantalla de permisos sin forma de ir a Ajustes.

### 6. Sin recuperación si falla la obtención del token QR — `(tabs)/index.tsx:95-106, 258-265, 285-310`
Si `fetchQrToken()` falla (corte de red) mientras la suscripción está activa, `qrToken` queda `null` e `isQrLoading` en `false`. La rama de render `isQrLoading || !qrToken` muestra entonces permanentemente "Generando pase..." con un spinner — pero el botón de refresco manual solo se renderiza cuando `qrToken` es verdadero. La pantalla queda atascada hasta que el usuario la abandona y remonta.

### 7. Estado de suscripción/QR no se refresca al volver a la pestaña — `(tabs)/index.tsx:146-148`
`fetchAll()` se ejecuta una sola vez en `useEffect(..., [])`. Tras completar un pago en `profile/payment.tsx` y volver a la pestaña Home (si Expo Router mantiene montadas las pestañas hermanas), el dashboard sigue mostrando "Cuota inactiva/expirada" hasta reiniciar la app. No hay `useFocusEffect`/refresco al enfocar.

### 8. Estado de suscripción en Clases nunca se refresca al enfocar — `classes/index.tsx:63-71`
Mismo patrón que el bug #7: `isSubscriptionActive` se obtiene solo al montar. Tras renovar la suscripción, volver a la pestaña Clases sigue mostrando el banner "Tu cuota ha caducado" y los botones de reserva/cancelación deshabilitados.

### 9. `AuthContext.user` no se refresca tras cambiar de gimnasio — `settings/gym.tsx:46-59`
Tras un `/api/user/link-gym` exitoso, solo se vuelve a ejecutar `fetchGym()` (estado local de la página); nunca se llama a `refreshUser()` de `AuthContext`. `user.gymName` (usado en el dashboard Home) queda obsoleto hasta reiniciar la app.

---

## Low

### 10. `amount.toFixed(2)` asume que la API siempre devuelve un número — `payment.tsx:232`
`paymentDetails.amount.toFixed(2)` lanzará si el backend serializa alguna vez `amount` como string numérico (común en algunos serializadores JSON de moneda). Sin `Number()`/guardia.

### 11. Payload QR usado sin validar su forma — `admin/qr-scanner.tsx:44-48`
`JSON.parse(data)` se usa directamente como `payload.userId` sin validar que sea el tipo/forma esperada antes de enviarlo a `/api/access/verify`. JSON válido pero malformado (p. ej. `{"userId": {"a":1}}`) se reenvía tal cual, dependiendo enteramente de la validación del servidor.

---

## Notas adicionales (sin bug confirmado, pero a vigilar)
- `payment.tsx:137`: `url.split('?')[1]` es frágil si la pasarela añade más de un `?` o un fragmento tras la query.
- Patrón repetido en `payment.tsx`/`(tabs)/index.tsx`/`profile/index.tsx`: los timers de QR (`setInterval`) que disparan `fetchQrToken()` no tienen guardia de `isMounted`/abort — si el componente se desmonta a mitad del fetch, ocurre un "set state en componente desmontado" (inofensivo en React moderno, pero merece limpieza).
- Sin bugs relevantes encontrados en: `SettingsHeader.tsx`, `external-link.tsx`, `use-color-scheme.ts/.web.ts`, `constants/theme.ts`, `components/ui/index.tsx`, `(tabs)/_layout.tsx`, `profile/_layout.tsx`, `settings/appearance.tsx`, `settings/account.tsx`, `settings/password.tsx`.
