# Módulo de Entrenamiento (Workout)

Archivos revisados:
- `src/app/(tabs)/workout/_layout.tsx`, `index.tsx`, `generate.tsx`, `exercises.tsx`
- `src/app/(tabs)/workout/exercise/[id].tsx`, `live/[sessionId].tsx`, `routine/[id].tsx`
- `src/lib/workoutEngine.ts`, `src/components/workout/ExerciseAvatar.tsx`

---

## High

### 1. `SetRow` no se resincroniza cuando cambian los datos del set — `live/[sessionId].tsx:360-365`
```js
const [reps, setReps] = useState(set.reps === 0 ? '' : set.reps.toString());
const [weight, setWeight] = useState(set.weight === 0 ? '' : set.weight.toString());
```
Estos valores se inicializan una sola vez desde `set.reps`/`set.weight` (lazy initializer), sin `useEffect` para resincronizar cuando cambia la prop. Si el PATCH de `handleUpdateSet` falla, se llama a `fetchSession()` para recargar el estado autoritativo del servidor, pero como `set.id` (la `key`) no cambia, React reutiliza la misma instancia de `SetRow` y el valor mostrado se queda obsoleto (posiblemente rechazado/incorrecto).
- **Escenario de fallo**: el usuario ve un valor de reps/peso que el servidor rechazó, y un `onBlur` posterior reenvía ese mismo dato incorrecto.

### 2. Ejercicios duplicados dentro del mismo día generado — `src/lib/workoutEngine.ts:242-250, 277-278`
`usedExerciseIds` es un único `Set` compartido para todo el plan multi-día (nunca se resetea por día). Cuando el catálogo de un grupo muscular es pequeño (p. ej. Core con solo 2 ejercicios de respaldo) y varios días necesitan ese grupo, el pool se agota rápido. El camino de "backup" solo filtra por grupo muscular/lesiones excluidas — **no excluye `usedIds`** — por lo que puede devolver un ejercicio ya usado, incluso el mismo ejercicio dos veces en el mismo día.

---

## Medium

### 3. Las estadísticas del resumen no coinciden con lo que realmente se guarda — `live/[sessionId].tsx:106-109` vs `137-169`
`completedSets`/`totalVolume`/`recordsBroken` (mostrados en la pantalla de resumen) se calculan solo con los sets marcados `isCompleted === true`. Pero `handleSaveWorkout` (disparado desde esa misma pantalla) auto-completa además cualquier set con `reps > 0 || weight > 0` que no se había marcado, y lo persiste en el backend.
- **Escenario de fallo**: el resumen mostrado al usuario (volumen, récords) subestima el entrenamiento realmente guardado en el backend.

### 4. Descartar entrenamiento deja una sesión huérfana en progreso — `live/[sessionId].tsx:122-127`
`handleDiscardWorkout` solo navega fuera (`router.replace('/')`) sin llamar a ninguna API para borrar/cancelar la sesión en el servidor.
- **Escenario de fallo**: el registro de sesión (con `endTime: null`) queda colgado indefinidamente en el backend, pudiendo corromper comprobaciones de "sesión activa", historiales o estadísticas que asuman como máximo una sesión activa por usuario.

### 5. La comprobación de suscripción "falla abierta" ante error de red — `src/app/(tabs)/workout/index.tsx:22, 40-51`
`isSubscriptionActive` arranca en `true` por defecto. Si `/api/user/subscription-status` falla, el `catch` solo llama a `fetchRoutines()` sin fijar el estado real de suscripción.
- **Escenario de fallo**: un usuario con la suscripción realmente caducada puede seguir viendo "Generar Rutinas"/"Nueva"/"Comenzar" habilitados solo porque la comprobación de estado dio error de red, saltándose el muro de pago.

### 6. El split PPL descarta silenciosamente el día de pierna con 2 días elegidos manualmente — `src/lib/workoutEngine.ts:508-528`, `generate.tsx:54-73`
`getResolvedSplit`/`getRepeatsNeeded` solo fuerza repetición de día para PPL cuando `days === 4` o `5`. Si el usuario elige manualmente `split = 'ppl'` con `days = 2`, el else-branch en `workoutEngine.ts` solo genera `["empuje", "tiron"]` — nunca `"pierna"`.
- **Escenario de fallo**: el usuario elige un split que incluye pierna y recibe un plan con cero entrenamiento de piernas, sin aviso en la UI.

---

## Low

### 7. "Volumen" sin sentido en el historial de ejercicios cardio — `exercise/[id].tsx:130-132`
Para cardio, `reps` representa minutos y `weight` puede ser distancia o 0, pero el código calcula y muestra `weight * reps` como "vol." incondicionalmente — un número sin sentido para entradas de cardio.

### 8. `parseInt(...) || re.reps` trata un `0` legítimo como inválido — `routine/[id].tsx:58, 223`
Si un set tiene legítimamente `0` reps, `parseInt` devuelve `0` (falsy), y `|| re.reps` sustituye silenciosamente por el valor por defecto del ejercicio en lugar de preservar el `0` real.

### 9. El desplazamiento visual del drag-to-reorder no se ajusta al reordenar filas — `routine/[id].tsx:740-813` (`DraggableExerciseRow`)
`dragY` usa el `gesture.dy` absoluto mientras `onMove` reordena `orderedExercises` en paralelo (cambiando la posición renderizada de la fila arrastrada). El orden final se calcula bien por índices, pero la transformación visual no compensa el cambio de slot base, causando saltos/desalineación visual con 3+ elementos.
