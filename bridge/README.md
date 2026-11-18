# FitWe bridge — programa local del PC de recepción

Lee el lector de QR USB, valida el código en FitWe y, si lo permite, le dice a la controladora
Hikvision que abra el torno. **No necesita ningún navegador abierto**: corre solo, como un servicio.

```
Lector USB (puerto serie) ──► este programa ──► FitWe (valida)
                                   │
                                   └─ si PERMITIDO ──► controladora Hikvision ──► torno
```

## Estado

- **Probado con servidores falsos** (`npm test` en la raíz del repo): lectura, validación, apertura,
  renovación de sesión, errores.
- **Sin probar con hardware real.** Hay dos cosas que solo se pueden confirmar con la controladora y el
  lector delante: la ruta/XML de "abrir puerta" (`src/hikvision.js`, constantes al principio) y lo que
  el lector envía exactamente por el puerto serie. Por eso existe `npm run check`.

## Requisitos

- Windows con **Node.js 20 o superior**.
- El PC y la controladora en la misma red (cable de red al router).
- Una cuenta de **gimnasio** de FitWe (tipo GYM).
- La controladora ya activada (con SADP), con IP fija y contraseña de administrador.

## Instalación

1. Copia la carpeta `bridge/` al PC de recepción (por ejemplo `C:\fitwe-bridge`).
2. En esa carpeta: `npm install`
3. Copia `config.example.json` a `config.json` y rellénalo:
   - `fitwe`: la URL de FitWe y el correo/contraseña de la cuenta del gimnasio.
   - `controller`: la IP de la controladora y su usuario/contraseña.
   - `readers`: un bloque por lector. `port` es el puerto COM (ver abajo), `direction` es
     `entry` o `exit`, y `door` es la "puerta" de la controladora que abre ese lector
     (1 para un sentido del torno, 2 para el otro).
4. `npm run check` — comprueba la sesión en FitWe, la controladora y que el puerto del lector existe.
5. `npm start` — arranca. Cada lectura queda escrita en la consola con la hora.

## Poner el lector en modo "puerto serie USB"

El lector sale de fábrica en otro modo. Se cambia **escaneando con el propio lector** el código
"USB virtual serial port" del manual (página central, tercera fila, segunda columna). Debe pitar.
Después, en Windows aparecerá un puerto nuevo en *Administrador de dispositivos → Puertos (COM y LPT)*:
ese es el `port` de `config.json`. (Si se conecta en otro USB, el número COM puede cambiar.)

No escanees "Restore default settings": lo devuelve a fábrica.

## Que arranque solo con el PC

Lo más sencillo es **NSSM** (https://nssm.cc), que convierte un programa en un servicio de Windows:

```
nssm install FitWeBridge "C:\Program Files\nodejs\node.exe" "C:\fitwe-bridge\src\index.js"
nssm set FitWeBridge AppDirectory C:\fitwe-bridge
nssm set FitWeBridge AppStdout C:\fitwe-bridge\bridge.log
nssm set FitWeBridge AppStderr C:\fitwe-bridge\bridge.log
nssm start FitWeBridge
```

(No se ha probado en el PC real.) Hay que desactivar la suspensión del PC en las opciones de energía.

## Qué pasa en cada caso

| Situación | Qué hace el programa |
|---|---|
| QR válido y cuota al día | Abre la puerta y lo anota en la consola |
| QR caducado, repetido o cuota inactiva | No abre; escribe el motivo |
| Lo leído no es un QR de FitWe (p. ej. una tarjeta) | Lo ignora |
| Sin red hacia FitWe | No abre; escribe el error |
| FitWe permite pero la controladora no abre | **Escribe un ERROR bien visible**: la persona ya tiene el acceso registrado (y el crédito descontado en bonos) y hay que abrir a mano |
| La sesión de FitWe caduca | Vuelve a iniciar sesión sola |
| El lector se desconecta | Reintenta abrir el puerto cada 5 s |

## Seguridad

- `config.json` guarda la contraseña de la cuenta del gimnasio y de la controladora. Está en `.gitignore`;
  restringe también su acceso en Windows (solo el usuario que ejecuta el servicio).
- Cualquiera con acceso a ese PC podría usar esas credenciales. Más adelante se puede sustituir por
  una clave de dispositivo con permisos solo de acceso.
- La controladora no debe ser accesible desde internet.

## Limitaciones conocidas

- Si la controladora falla después de que FitWe conceda el acceso, el crédito ya se descontó. Aún no
  hay un "deshacer" automático.
- Los dos sentidos del torno se tratan como dos "puertas" de la controladora (1 y 2); hay que
  configurarlas así en la controladora.
