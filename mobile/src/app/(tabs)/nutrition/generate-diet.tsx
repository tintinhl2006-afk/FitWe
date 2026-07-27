import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Sparkles, ArrowLeft, ArrowRight, Check, Trash2, RefreshCcw, Save } from 'lucide-react-native';
import { useAppTheme } from '../../../context/ThemeContext';
import { Card, SectionLabel, Chip, OptionCard, Field, TextField, Stepper } from '../../../components/ui';
import { SaveTemplateModal } from '../../../components/nutrition/SaveTemplateModal';
import { Palette } from '../../../constants/theme';
import { api } from '../../../lib/apiClient';

interface DietFoodLite {
  id: string;
  name: string;
  brand: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  group: string;
  allergens: string[];
}

interface SolvedItem {
  food: DietFoodLite;
  quantityGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealPlan {
  mealType: string;
  mealLabel: string;
  items: SolvedItem[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const DIET_TYPES = [
  { id: 'STANDARD', label: 'Estándar', desc: 'Todo tipo de alimentos' },
  { id: 'VEGETARIAN', label: 'Vegetariana', desc: 'Sin carnes ni pescados' },
  { id: 'VEGAN', label: 'Vegana', desc: '100% de origen vegetal' },
  { id: 'KETO', label: 'Keto / Cetogénico', desc: 'Bajo en carbohidratos' },
];

const CULINARY_STYLES = [
  { id: 'CLASSIC', label: 'Fitness Clásico', desc: 'Arroz, pollo...' },
  { id: 'MEDITERRANEAN', label: 'Mediterráneo', desc: 'Salud y variedad' },
  { id: 'QUICK', label: 'Fácil/Rápido', desc: 'Poco tiempo/prep' },
];

const ALLERGENS = [
  { id: 'GLUTEN', label: 'Gluten' },
  { id: 'LACTOSE', label: 'Lactosa' },
  { id: 'NUTS', label: 'Frutos Secos' },
  { id: 'EGG', label: 'Huevo' },
  { id: 'FISH', label: 'Pescado' },
];

function recalcMealTotals(meal: MealPlan): MealPlan {
  const totals = meal.items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return { ...meal, ...totals };
}

export default function GenerateDietScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [calories, setCalories] = useState(2000);
  const [proteinPct, setProteinPct] = useState(30);
  const [carbsPct, setCarbsPct] = useState(40);
  const [fatPct, setFatPct] = useState(30);
  const [dietType, setDietType] = useState('STANDARD');
  const [culinaryStyle, setCulinaryStyle] = useState('CLASSIC');
  const [allergens, setAllergens] = useState<string[]>([]);

  const [mealPlan, setMealPlan] = useState<MealPlan[] | null>(null);
  const [availableFoods, setAvailableFoods] = useState<DietFoodLite[]>([]);
  const [swapTarget, setSwapTarget] = useState<{ mealIndex: number; itemIndex: number } | null>(null);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);

  const targetDate = params.date || new Date().toISOString().split('T')[0];
  const totalPct = proteinPct + carbsPct + fatPct;

  const totals = useMemo(
    () =>
      (mealPlan || []).reduce(
        (acc, meal) => ({
          calories: acc.calories + meal.calories,
          protein: acc.protein + meal.protein,
          carbs: acc.carbs + meal.carbs,
          fat: acc.fat + meal.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [mealPlan]
  );

  function toggleAllergen(id: string) {
    setAllergens((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  async function handleGenerate() {
    if (totalPct !== 100) {
      Alert.alert('Error', `La distribución de macros debe sumar 100%. Actualmente suma ${totalPct}%.`);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const protein = Math.round((calories * (proteinPct / 100)) / 4);
      const carbs = Math.round((calories * (carbsPct / 100)) / 4);
      const fat = Math.round((calories * (fatPct / 100)) / 9);

      const query = new URLSearchParams({
        calories: calories.toString(),
        protein: protein.toString(),
        carbs: carbs.toString(),
        fat: fat.toString(),
        dietType,
        allergens: allergens.join(','),
        culinaryStyle,
      });

      const data = await api.get(`/api/user/nutrition/generate-diet?${query.toString()}`);
      setMealPlan(data.plan);
      setAvailableFoods(data.availableFoods || []);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error al generar la dieta.');
    } finally {
      setIsLoading(false);
    }
  }

  function deleteItem(mealIndex: number, itemIndex: number) {
    setMealPlan((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      const meal = { ...next[mealIndex], items: next[mealIndex].items.filter((_, i) => i !== itemIndex) };
      next[mealIndex] = recalcMealTotals(meal);
      return next;
    });
  }

  function swapItem(newFood: DietFoodLite) {
    if (!swapTarget || !mealPlan) return;
    const { mealIndex, itemIndex } = swapTarget;
    const oldItem = mealPlan[mealIndex].items[itemIndex];

    let ratio = 1;
    if (oldItem.food.group === 'CARB' && newFood.carbs > 0 && oldItem.food.carbs > 0) ratio = oldItem.food.carbs / newFood.carbs;
    else if (oldItem.food.group === 'PROTEIN' && newFood.protein > 0 && oldItem.food.protein > 0) ratio = oldItem.food.protein / newFood.protein;
    else if (oldItem.food.group === 'FAT' && newFood.fat > 0 && oldItem.food.fat > 0) ratio = oldItem.food.fat / newFood.fat;
    else if (newFood.calories > 0) ratio = oldItem.food.calories / newFood.calories;

    const newQty = Math.max(10, Math.round(oldItem.quantityGrams * ratio));
    const newItem: SolvedItem = {
      food: newFood,
      quantityGrams: newQty,
      calories: Math.round((newFood.calories * newQty) / 100),
      protein: Math.round(((newFood.protein * newQty) / 100) * 10) / 10,
      carbs: Math.round(((newFood.carbs * newQty) / 100) * 10) / 10,
      fat: Math.round(((newFood.fat * newQty) / 100) * 10) / 10,
    };

    setMealPlan((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      const items = [...next[mealIndex].items];
      items[itemIndex] = newItem;
      next[mealIndex] = recalcMealTotals({ ...next[mealIndex], items });
      return next;
    });
    setSwapTarget(null);
  }

  async function handleSavePlan() {
    if (!mealPlan) return;
    setIsSaving(true);
    try {
      const items = mealPlan.flatMap((meal) =>
        meal.items.map((item) => ({
          foodName: item.food.name,
          brand: item.food.brand,
          quantityGrams: item.quantityGrams,
          caloriesPer100g: item.food.calories,
          proteinPer100g: item.food.protein,
          carbsPer100g: item.food.carbs,
          fatPer100g: item.food.fat,
          mealType: meal.mealType,
        }))
      );
      await api.post('/api/user/nutrition/generate-diet', { date: targetDate, items });
      router.replace('/nutrition');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo registrar la dieta en tu diario.');
    } finally {
      setIsSaving(false);
    }
  }

  const templateItems = (mealPlan || []).flatMap((meal) =>
    meal.items.map((item) => ({
      foodName: item.food.name,
      brand: item.food.brand,
      calories: item.food.calories,
      protein: item.food.protein,
      carbs: item.food.carbs,
      fat: item.food.fat,
      quantityGrams: item.quantityGrams,
      mealType: meal.mealType,
    }))
  );

  const swapCandidates = swapTarget && mealPlan ? availableFoods.filter((f) => f.group === mealPlan[swapTarget.mealIndex].items[swapTarget.itemIndex].food.group) : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
        <View style={{ height: 38, width: 38, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={18} color={colors.primaryAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>Generar Menú Diario</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>Crea un plan de comidas ajustado a tus objetivos</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, backgroundColor: colors.surfaceAlt, borderRadius: 999 }}>
          <X size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Diseñando tu menú diario...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity onPress={handleGenerate} style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Volver a intentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4 }}>
            {step === 1 && (
              <View style={{ gap: 20 }}>
                <Field label="Calorías Objetivo (kcal/día)">
                  <TextField value={calories.toString()} onChangeText={(v) => setCalories(Number(v) || 0)} keyboardType="numeric" />
                </Field>

                <View>
                  <SectionLabel style={{ marginBottom: 10 }}>Distribución de Macros (%)</SectionLabel>
                  <MacroPctRow label="Proteína" value={proteinPct} onChange={setProteinPct} />
                  <MacroPctRow label="Carbohidratos" value={carbsPct} onChange={setCarbsPct} />
                  <MacroPctRow label="Grasas" value={fatPct} onChange={setFatPct} />
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: totalPct === 100 ? colors.textMuted : Palette.red500, marginTop: 4 }}>Total: {totalPct}%</Text>
                </View>

                <View>
                  <SectionLabel style={{ marginBottom: 10 }}>Tipo de Dieta</SectionLabel>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {DIET_TYPES.map((d) => (
                      <OptionCard key={d.id} label={d.label} desc={d.desc} active={dietType === d.id} onPress={() => setDietType(d.id)} />
                    ))}
                  </View>
                </View>

                <View>
                  <SectionLabel style={{ marginBottom: 10 }}>Estilo Culinario</SectionLabel>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {CULINARY_STYLES.map((s) => (
                      <OptionCard key={s.id} label={s.label} desc={s.desc} active={culinaryStyle === s.id} onPress={() => setCulinaryStyle(s.id)} />
                    ))}
                  </View>
                </View>
              </View>
            )}

            {step === 2 && (
              <View>
                <SectionLabel style={{ marginBottom: 10 }}>Alergias o Intolerancias</SectionLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {ALLERGENS.map((a) => (
                    <Chip key={a.id} label={a.label} active={allergens.includes(a.id)} onPress={() => toggleAllergen(a.id)} activeColor={Palette.red500} />
                  ))}
                </View>
                {allergens.length > 0 && (
                  <Text style={{ fontSize: 11, color: '#d97706', marginTop: 12, lineHeight: 16 }}>
                    ⚠️ El motor excluirá alimentos que contengan estos alérgenos.
                  </Text>
                )}
              </View>
            )}

            {step === 3 && mealPlan && (
              <View style={{ gap: 14 }}>
                <View style={{ alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)', borderRadius: 18, padding: 16, gap: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#10b981' }}>¡Menú generado con éxito!</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {Math.round(totals.calories)} kcal · {Math.round(totals.protein)}g P · {Math.round(totals.carbs)}g C · {Math.round(totals.fat)}g G
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setIsSaveTemplateOpen(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 42, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}
                >
                  <Save size={14} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 12 }}>Guardar como Plantilla</Text>
                </TouchableOpacity>

                {mealPlan.map((meal, mealIndex) => (
                  <Card key={meal.mealType} padding={14}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: colors.textPrimary }}>{meal.mealLabel}</Text>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textSecondary }}>{Math.round(meal.calories)} kcal</Text>
                    </View>
                    <View style={{ gap: 8 }}>
                      {meal.items.map((item, itemIndex) => (
                        <View key={itemIndex} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 10 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textPrimary }} numberOfLines={1}>
                              {item.food.name}
                            </Text>
                            <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                              {item.quantityGrams}g · {Math.round(item.calories)} kcal
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => setSwapTarget({ mealIndex, itemIndex })} style={{ padding: 6 }}>
                            <RefreshCcw size={14} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteItem(mealIndex, itemIndex)} style={{ padding: 6 }}>
                            <Trash2 size={14} color={Palette.red500} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderTopColor: colors.border }}>
            {step === 1 ? (
              <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 12 }}>Cancelar</Text>
              </TouchableOpacity>
            ) : step === 2 ? (
              <TouchableOpacity
                onPress={() => setStep(1)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}
              >
                <ArrowLeft size={14} color={colors.textPrimary} />
                <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 12 }}>Atrás</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}

            {step === 1 ? (
              <TouchableOpacity
                onPress={() => setStep(2)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.textPrimary }}
              >
                <Text style={{ color: colors.background, fontWeight: 'bold', fontSize: 12 }}>Siguiente</Text>
                <ArrowRight size={14} color={colors.background} />
              </TouchableOpacity>
            ) : step === 2 ? (
              <TouchableOpacity
                onPress={handleGenerate}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.primary }}
              >
                <Sparkles size={14} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Generar Menú</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSavePlan}
                disabled={isSaving}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.textPrimary, opacity: isSaving ? 0.7 : 1 }}
              >
                {isSaving && <ActivityIndicator size="small" color={colors.background} />}
                <Check size={14} color={colors.background} />
                <Text style={{ color: colors.background, fontWeight: 'bold', fontSize: 12 }}>Guardar en mi Diario</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* Swap Modal */}
      <Modal visible={!!swapTarget} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '70%', borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary }}>Cambiar Alimento</Text>
              <TouchableOpacity onPress={() => setSwapTarget(null)} style={{ padding: 6, backgroundColor: colors.surfaceAlt, borderRadius: 999 }}>
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
              {swapCandidates.map((food) => (
                <TouchableOpacity
                  key={food.id}
                  onPress={() => swapItem(food)}
                  style={{ padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSunken }}
                >
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary }}>{food.name}</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>100g • {food.calories} kcal</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SaveTemplateModal
        visible={isSaveTemplateOpen}
        onClose={() => setIsSaveTemplateOpen(false)}
        onSaved={() => Alert.alert('Guardado', 'Plantilla guardada en "Mis Dietas".')}
        items={templateItems}
        defaultName={`Menú ${dietType === 'STANDARD' ? '' : dietType.toLowerCase()} ${targetDate}`.trim()}
      />
    </SafeAreaView>
  );
}

function MacroPctRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>{label}</Text>
      <Stepper value={value} min={0} max={100} onDecrement={() => onChange(Math.max(0, value - 5))} onIncrement={() => onChange(Math.min(100, value + 5))} />
    </View>
  );
}
