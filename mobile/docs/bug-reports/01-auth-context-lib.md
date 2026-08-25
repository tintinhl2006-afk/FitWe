# Auth, Contexts y librerías compartidas

Archivos revisados:
- `src/app/(auth)/_layout.tsx`, `login.tsx`, `register.tsx`
- `src/context/AuthContext.tsx`, `PreferencesContext.tsx`, `ThemeContext.tsx`
- `src/lib/apiClient.ts`, `src/lib/cryptoUtils.ts`
- `src/app/_layout.tsx`, `src/app/index.tsx`

---

## Critical

### 1. Secreto hardcodeado en el cliente — `src/lib/cryptoUtils.ts:2`
El secreto usado para firmar códigos de acceso (`SECRET = "fitwe_secure_access_token_secret"`) vive en el bundle JS del cliente, visible para cualquiera que descompile la app. Combinado con `simpleHash` (líneas 35-43), un hash rotatorio no criptográfico (no HMAC-SHA256, sin sal, sin comparación en tiempo constante), cualquiera puede recrear el algoritmo y **forjar un código de acceso válido para cualquier `userId`**.
- **Escenario de fallo**: si este módulo se conecta alguna vez a un control de acceso real (puerta del gimnasio, check-in QR), el esquema completo es bypaseable.
- **Nota**: actualmente `cryptoUtils.ts` no se importa desde ningún sitio en `src/` — es código muerto hoy, pero una bomba de tiempo si se conecta más adelante.

### 2. `verifyAccessCode` nunca comprueba la expiración — `src/lib/cryptoUtils.ts:52-79`
La función decodifica `userId:timestamp:signature` y valida la firma, pero nunca compara `timestamp` con `Date.now()`. Un código generado es válido para siempre. Combinado con el bug #1, un código forjado o filtrado nunca caduca.

---

## High

### 3. No hay manejo de sesión expirada (401) en ningún punto — `src/lib/apiClient.ts:53-78`, `src/context/AuthContext.tsx:103-113`
`fetchApi` lanza un `Error` genérico ante cualquier respuesta no-OK, sin caso especial para 401/403. No existe interceptor de respuesta ni refresco de token. `refreshUser()` solo hace `console.error` si falla, sin limpiar la sesión.
- **Escenario de fallo**: cuando el JWT en SecureStore expira o se revoca, todas las pantallas autenticadas empiezan a fallar en sus llamadas para siempre — el usuario sigue "logueado" sin ninguna forma de volver al login salvo hacer logout manual.

### 4. Login/registro no validan la forma de la respuesta del servidor antes de persistir — `src/context/AuthContext.tsx:52-70, 72-90`
Si el backend devolviera un payload con forma distinta (error envuelto en 200, `data.user` incompleto), se llamaría a `saveAuthToken(undefined)`. `SecureStore.setItemAsync` lanzaría con un valor no-string, pero ese throw se traga en `saveAuthToken` (solo `console.error`), y `setToken`/`setUser` se ejecutan igualmente.
- **Escenario de fallo**: la app puede quedar en un estado donde `user`/`token` son verdaderos en el estado de React (navega a la app autenticada) pero nada se persistió en SecureStore — la sesión desaparece silenciosamente al reiniciar la app.

---

## Medium

### 5. `token` de `AuthContext` es estado muerto/desincronizado — `src/context/AuthContext.tsx:29,63,83,96,117-125`
`apiClient.fetchApi` relee el token desde `SecureStore` en cada llamada vía `getAuthToken()`; nunca usa el `token` expuesto por el contexto. Puede haber drift entre ambos (ver bug #4). Cualquier código futuro que confíe en `useAuth().token` como fuente de verdad estará equivocado.

### 6. `PreferencesContext` no resetea a valores por defecto en logout — `src/context/PreferencesContext.tsx:26-45`
Cuando `user` pasa a `null` (logout), solo se pone `isLoading = false`; no se resetean `weightUnit`/`distanceUnit`/`measurementUnit`.
- **Escenario de fallo**: en un dispositivo compartido, si el Usuario A cierra sesión y el Usuario B entra antes de que resuelva `refreshPreferences()`, el Usuario B ve brevemente (o indefinidamente si falla el fetch, dado el `catch` vacío en líneas 32-34) las unidades del Usuario A.

### 7. `register.tsx` no redirige si ya hay un usuario autenticado
A diferencia de `login.tsx` (líneas 25-29), `register.tsx` nunca comprueba `user` de `useAuth()` para redirigir. Un usuario ya logueado que llegue a esta pantalla (deep link, navegación stale) podría enviar el formulario de registro y sobrescribir la sesión actual con una cuenta nueva sin aviso.

---

## Low

### 8. Doble navegación redundante tras login/registro — `login.tsx:41-42`, `register.tsx:41-42`
Tras `login()`/`register()` con éxito, se llama a `router.replace('/(tabs)')` directamente Y además el `useEffect` que observa `user` hace lo mismo. Inofensivo en la práctica, pero frágil: si alguna vez apuntaran a rutas distintas causaría parpadeo o pantalla incorrecta.

### 9. Sin timeout/abort en las peticiones — `src/lib/apiClient.ts:53-94`
`fetchApi`/`fetchApiText` no usan `AbortController` ni timeout. Una petición colgada deja spinners de carga bloqueados indefinidamente en login/registro.

### 10. `API_BASE_URL` cae silenciosamente a la URL de producción — `src/lib/apiClient.ts:4`
Si `EXPO_PUBLIC_API_URL` no está definida (build de desarrollo/staging mal configurado), las peticiones van silenciosamente a `https://fit-we.vercel.app` (producción real), sin ningún aviso — riesgo de mezclar datos/tráfico de pruebas con producción.
