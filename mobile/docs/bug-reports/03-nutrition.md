# Módulo de Nutrición

Archivos revisados:
- `src/app/(tabs)/nutrition/_layout.tsx`, `index.tsx`, `generate-diet.tsx`, `saved-diets.tsx`
- `src/lib/dietEngine.ts`, `src/lib/nutritionUtils.ts`
- `src/components/nutrition/SaveTemplateModal.tsx`

---

## Critical

### 1. El fallback de alérgenos/tipo de dieta salta todos los filtros de seguridad — `src/lib/dietEngine.ts` — `pickFromPool` (5685-5704), `pickVeg` (5707-5719), `pickFruit` (5722-5738)
Los tres helpers de selección filtran primero candidatos de `availableFoods` (ya filtrado por alérgenos/tipo de dieta/exclusiones). Pero cuando ese pool filtrado está vacío, cada uno cae a:
```ts
return STANDARD_FOODS.find((f) => f.id === fallbackId);
```
Esto busca en **todo el catálogo sin filtrar**, ignorando `dietType`, `userAllergens` y `excludedFoodIds` por completo.
- **Escenario de fallo**: un usuario con alergia al PESCADO que no tenga elementos elegibles en un pool curado puede recibir igualmente `std-salmon`/`std-merluza` como fallback; un usuario VEGANO cuyo pool de proteína disponible esté vacío (p. ej. tofu/seitán excluidos vía `excludedFoodIds`) puede recibir `std-pechuga-pollo` inyectado en su plan "vegano". Esto es un bug de seguridad alimentaria, no solo cosmético.

---

## High

### 2. El filtro KETO solo excluye alimentos del grupo CARB, no VEG/FRUIT — `src/lib/dietEngine.ts`, `filterFoodsForUser`, líneas 5322-5327
```ts
if (dietType === "KETO" && !food.isKeto && food.group === "CARB") {
  return false;
}
```
La comprobación `isKeto` está condicionada a `food.group === "CARB"`. Verduras altas en carbohidratos marcadas explícitamente `isKeto: false` en el catálogo (p. ej. `std-cebolla` 9.3g, `std-zanahoria` 9.6g, `std-ajo` 33g(!), `std-puerro` 14g, `std-calabaza` 6.5g, `std-alcachofas` 10.5g) pertenecen al grupo `VEG`, así que pasan el filtro sin problema. La fruta no se comprueba en absoluto, y `getMealTemplate`'s caso `BREAKFAST` llama incondicionalmente a `pickFruit("std-platano")` sin importar `dietType`.
- **Escenario de fallo**: un desayuno "Keto" generado puede incluir plátano. Esto anula el propósito de la opción de dieta cetogénica.

---

## Medium

### 3. `getPortionEquivalent` usa IDs que no coinciden con el catálogo real — código muerto de facto — `src/lib/dietEngine.ts:5569-5661`
El catálogo (`STANDARD_FOODS`) usa slugs en español: `std-avena`, `std-pechuga-pollo`, `std-huevo-entero`, `std-aceite-oliva`, `std-patata`, `std-arroz-integral`, `std-lentejas`, `std-boniato`, `std-pan-integral`, etc. Pero el `switch (food.id)` en `getPortionEquivalent` compara con IDs en inglés: `std-oats`, `std-chicken`, `std-brown-rice`, `std-whole-egg`, `std-olive-oil`, `std-potato`, `std-lentils`, `std-sweet-potato`, `std-whole-wheat-bread`, etc. Prácticamente ninguno coincide (solo unos pocos casos coincidentes como `std-salmon`, `std-tofu`, `std-quinoa` funcionan).
- **Escenario de fallo**: para casi todas las comidas generadas, en lugar de mostrar el texto legible previsto ("1 taza de avena", "2 huevos"), se muestra silenciosamente el genérico `${grams}g` — una funcionalidad real está rota.

### 4. Condiciones de carrera en fetches sin protección en `index.tsx`
- `fetchNutritionData` (líneas 130-146): al pulsar rápido las flechas de fecha anterior/siguiente se disparan llamadas `api.get` solapadas sin guardia de abort/id de petición. Si las respuestas llegan desordenadas, se puede mostrar el estado de una fecha que el usuario ya no está viendo.
- Debounce de búsqueda de alimentos (líneas 148-159): el debounce solo retrasa el *disparo* de la petición 300ms vía `setTimeout`, pero no protege contra la *resolución* desordenada de las llamadas de red (sin ignore-flag/abort al desmontar o cambiar la query), así que una consulta antigua y lenta puede sobrescribir resultados de una consulta más nueva y rápida.

### 5. `handleCreateFood` envía valores string sin coerción numérica — `index.tsx:241-257`
Los campos de `newFood` (`calories`, `protein`, `carbs`, `fat`) son strings de `TextInput` y se envían por POST tal cual, sin `Number(...)`, a diferencia de `handleSaveSetup` que sí convierte (líneas 267-270).
- **Escenario de fallo**: si el backend espera tipos numéricos, esto puede crear alimentos con campos de nutrientes como string, produciendo `NaN` silenciosos en cualquier cálculo posterior, o fallos de validación confusos en el backend.

### 6. `solveMealGrams` solo corrige el exceso de calorías, nunca el déficit — `src/lib/dietEngine.ts:5512-5529`
El bloque de reescalado solo se activa `if (totalSolvedCals > targetCalories + 20)`. Debido a los suelos de `minGrams` en `addDynamicItem` (líneas 5459-5478), una comida también puede quedar significativamente *por debajo* del objetivo calórico, sin ningún reescalado compensatorio ni aviso al usuario.

---

## Low

### 7. `handleSaveSetup` convierte un "0" explícito al valor por defecto 2000 — `index.tsx:267`
```ts
const cal = Number(setupCalories) || 2000;
```
Si el usuario escribe explícitamente `0`, `Number("0")` es `0` (falsy), así que `|| 2000` lo sobrescribe silenciosamente. Además, esto es inconsistente con `generate-diet.tsx:268` (`Number(v) || 0`), que sí permite un `0` explícito — comportamiento distinto para el mismo caso en dos pantallas.

### 8. El prellenado de porcentajes del modal de configuración puede quedar negativo sin clamping — `index.tsx:348-358`
```ts
const pPct = Math.round(((profile.targetProtein * 4) / cal) * 100) || 30;
const fPct = Math.round(((profile.targetFat * 9) / cal) * 100) || 30;
...
setSetupCarbsPct(100 - pPct - fPct);
```
Si el redondeo hace que `pPct + fPct` supere 100, `setSetupCarbsPct` queda en un número negativo — el clamp `Math.max(0, ...)` solo se aplica a los botones +/- del stepper, no aquí. El modal se abre mostrando un porcentaje negativo (p. ej. "-3%") hasta que el usuario lo ajusta manualmente.

### 9. `handleLogMeal` no valida que la cantidad sea un número positivo — `index.tsx:201`
```ts
if (!selectedFood || !quantityGrams) return;
```
Esto solo comprueba que `quantityGrams` no sea un string vacío. Un valor `"0"` pasa (string truthy) y se registra una comida con `Number(quantityGrams) = 0` gramos/macros — una entrada en el diario que no aporta nada, sin mensaje de validación.
