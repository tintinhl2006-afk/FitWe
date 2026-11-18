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

## Instalación (con el instalador)

1. En tu PC de desarrollo, genera el paquete: `powershell -File bridge\installer\empaquetar.ps1`
   (crea `bridge\dist\FitWe-Bridge.zip`, unos 20 KB, sin credenciales).
2. Lleva el `.zip` al PC de recepción y extráelo.
3. **Doble clic en `Instalar.bat`.** No hace falta ser administrador. El asistente:
   - usa el Node.js del PC o, si no hay (o es antiguo), descarga una copia propia y comprueba su integridad;
   - copia el programa a `C:\FitWeBridge` e instala las dependencias (hace falta internet);
   - te pregunta: dirección de FitWe, cuenta del gimnasio, IP y credenciales de la controladora, y
     los puertos COM de los lectores (te muestra los que detecta);
   - guarda `config.json` protegido (solo lo lee el usuario que instala);
   - hace una comprobación (`--check`);
   - crea una tarea de Windows que **arranca el programa al iniciar sesión** y lo reinicia si falla.
4. Para desinstalar: doble clic en `C:\FitWeBridge\Desinstalar.bat`.

Opciones avanzadas de `install.ps1`: `-InstallDir`, `-ConfigFile` (un `config.json` ya preparado, sin
preguntas), `-NoAutostart`, `-SkipCheck`.

El registro de lo que ocurre está en `C:\FitWeBridge\bridge.log` (se rota solo a partir de 5 MB).
Para cambiar la configuración: edita `config.json` y reinicia el PC (o la tarea `FitWeBridge`).

### Instalación manual (alternativa)

1. Instala Node.js 20+ y copia la carpeta `bridge/` al PC.
2. `npm install`
3. Copia `config.example.json` a `config.json` y rellénalo (`fitwe`, `controller` y un bloque de
   `readers` por lector: `port` = puerto COM, `direction` = `entry` o `exit`, `door` = puerta de la
   controladora que abre ese lector).
4. `npm run check` y después `npm start`.

## Poner el lector en modo "puerto serie USB"

El lector sale de fábrica en otro modo. Se cambia **escaneando con el propio lector** el código
"USB virtual serial port" del manual (página central, tercera fila, segunda columna). Debe pitar.
Después, en Windows aparecerá un puerto nuevo en *Administrador de dispositivos → Puertos (COM y LPT)*:
ese es el `port` de `config.json`. (Si se conecta en otro USB, el número COM puede cambiar.)

No escanees "Restore default settings": lo devuelve a fábrica.

## Arranque automático: qué cubre y qué no

- La tarea arranca **al iniciar sesión** en Windows y se reinicia sola si el programa falla.
- Si el PC se reinicia y **nadie inicia sesión**, no arranca. Para recepción lo normal es activar el
  inicio de sesión automático del usuario, o instalar el programa como servicio de Windows
  (p. ej. con NSSM, https://nssm.cc, ejecutándolo como administrador; no probado).
- Desactiva la suspensión del PC en Opciones de energía.
- Probado en este PC de desarrollo (Windows PowerShell 5.1): instalación, arranque, reinicio de la
  tarea y desinstalación. **No probado todavía en el PC de recepción.**

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
