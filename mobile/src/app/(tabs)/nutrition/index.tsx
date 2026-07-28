import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import {
  Plus,
  Flame,
  Beef,
  Wheat,
  Droplet,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  Search,
  Target,
  BarChart3,
  Sparkles,
  Folder,
  Save,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../../context/ThemeContext';
import { Palette } from '../../../constants/theme';
import { api } from '../../../lib/apiClient';
import { SaveTemplateModal, SavedDietItemInput } from '../../../components/nutrition/SaveTemplateModal';

interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  category?: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  userId: string | null;
}

interface MealEntry {
  id: string;
  mealType: string;
  quantityGrams: number;
  foodItem: FoodItem;
}

interface NutritionProfile {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  mealsConfig?: string | null;
}

function getMealTypes(config: string | null | undefined): { id: string; label: string }[] {
  if (!config) {
    return [
      { id: 'BREAKFAST', label: 'Desayuno' },
      { id: 'LUNCH', label: 'Almuerzo' },
      { id: 'DINNER', label: 'Cena' },
      { id: 'SNACK-1', label: 'Snack 1' },
    ];
  }
  const parts = config.split(',').map((s) => s.trim()).filter(Boolean);
  let snackCount = 0;
  return parts.map((id) => {
    if (id === 'BREAKFAST') return { id, label: 'Desayuno' };
    if (id === 'LUNCH') return { id, label: 'Almuerzo' };
    if (id === 'DINNER') return { id, label: 'Cena' };
    if (id === 'SNACK') return { id, label: 'Snack 1' };
    if (id.startsWith('SNACK-')) {
      snackCount++;
      return { id, label: `Snack ${snackCount}` };
    }
    return { id, label: id };
  });
}

function calcNutrients(meal: MealEntry) {
  const factor = meal.quantityGrams / 100;
  return {
    cal: meal.foodItem.calories * factor,
    pro: meal.foodItem.protein * factor,
    car: meal.foodItem.carbs * factor,
    fat: meal.foodItem.fat * factor,
  };
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function formatDateLabel(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  const label = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function NutritionScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [profile, setProfile] = useState<NutritionProfile | null>(null);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMealType, setModalMealType] = useState('BREAKFAST');
  const [activeTab, setActiveTab] = useState<'search' | 'create'>('search');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantityGrams, setQuantityGrams] = useState('');
  const [isLoggingMeal, setIsLoggingMeal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newFood, setNewFood] = useState({ name: '', brand: '', calories: '', protein: '', carbs: '', fat: '' });
  const [isCreatingFood, setIsCreatingFood] = useState(false);

  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);

  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [setupCalories, setSetupCalories] = useState('2000');
  const [setupProteinPct, setSetupProteinPct] = useState(30);
  const [setupCarbsPct, setSetupCarbsPct] = useState(40);
  const [setupFatPct, setSetupFatPct] = useState(30);
  const [isSavingSetup, setIsSavingSetup] = useState(false);

  const nutritionRequestIdRef = useRef(0);
  const foodSearchRequestIdRef = useRef(0);

  async function fetchNutritionData(date: string) {
    const requestId = ++nutritionRequestIdRef.current;
    setIsLoading(true);
    try {
      const data = await api.get(`/api/user/nutrition?date=${date}`);
      if (requestId !== nutritionRequestIdRef.current) return;
      setProfile(data.profile || null);
      setMeals(data.meals || []);
    } catch {
      if (requestId !== nutritionRequestIdRef.current) return;
      setProfile(null);
      setMeals([]);
    } finally {
      if (requestId === nutritionRequestIdRef.current) setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchNutritionData(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (!isModalOpen || activeTab !== 'search') return;
    const t = setTimeout(() => {
      const requestId = ++foodSearchRequestIdRef.current;
      setIsSearching(true);
      api
        .get(`/api/user/foods?query=${encodeURIComponent(searchQuery)}`)
        .then((data) => {
          if (requestId !== foodSearchRequestIdRef.current) return;
          setFoods(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          if (requestId !== foodSearchRequestIdRef.current) return;
          setFoods([]);
        })
        .finally(() => {
          if (requestId === foodSearchRequestIdRef.current) setIsSearching(false);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, isModalOpen, activeTab]);

  const mealTypesList = useMemo(() => getMealTypes(profile?.mealsConfig), [profile?.mealsConfig]);

  const totals = meals.reduce(
    (acc, meal) => {
      const { cal, pro, car, fat } = calcNutrients(meal);
      return { calories: acc.calories + cal, protein: acc.protein + pro, carbs: acc.carbs + car, fat: acc.fat + fat };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const mealBreakdowns = mealTypesList.map((type) => {
    const sectionMeals = meals.filter((m) => m.mealType === type.id);
    return {
      id: type.id,
      label: type.label,
      cals: sectionMeals.reduce((acc, m) => acc + calcNutrients(m).cal, 0),
    };
  });

  const templateItems: SavedDietItemInput[] = meals.map((meal) => ({
    foodName: meal.foodItem.name,
    brand: meal.foodItem.brand,
    calories: meal.foodItem.calories,
    protein: meal.foodItem.protein,
    carbs: meal.foodItem.carbs,
    fat: meal.foodItem.fat,
    quantityGrams: meal.quantityGrams,
    mealType: meal.mealType,
  }));

  function openAddFoodModal(mealType: string) {
    setModalMealType(mealType);
    setActiveTab('search');
    setSelectedFood(null);
    setQuantityGrams('');
    setSearchQuery('');
    setIsModalOpen(true);
  }

  async function handleLogMeal() {
    if (!selectedFood || !quantityGrams || Number(quantityGrams) <= 0) return;
    setIsLoggingMeal(true);
    try {
      const entryDate = new Date(`${selectedDate}T12:00:00`);
      await api.post('/api/user/meals', {
        foodItemId: selectedFood.id,
        mealType: modalMealType,
        quantityGrams: Number(quantityGrams),
        date: entryDate.toISOString(),
      });
      setIsModalOpen(false);
      fetchNutritionData(selectedDate);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo registrar el alimento.');
    } finally {
      setIsLoggingMeal(false);
    }
  }

  function handleDeleteMeal(id: string) {
    Alert.alert('Eliminar Alimento', '¿Seguro que quieres borrar este alimento de tu diario?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            await api.delete(`/api/user/meals/${id}`);
            fetchNutritionData(selectedDate);
          } catch {
            Alert.alert('Error', 'No se pudo eliminar el alimento.');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  }

  async function handleCreateFood() {
    if (!newFood.name || !newFood.calories || !newFood.protein || !newFood.carbs || !newFood.fat) {
      Alert.alert('Campos requeridos', 'Completa nombre, calorías, proteínas, carbohidratos y grasas.');
      return;
    }
    setIsCreatingFood(true);
    try {
      await api.post('/api/user/foods', {
        ...newFood,
        calories: Number(newFood.calories),
        protein: Number(newFood.protein),
        carbs: Number(newFood.carbs),
        fat: Number(newFood.fat),
      });
      setNewFood({ name: '', brand: '', calories: '', protein: '', carbs: '', fat: '' });
      setActiveTab('search');
      setSearchQuery(newFood.name);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar el alimento.');
    } finally {
      setIsCreatingFood(false);
    }
  }

  async function handleSaveSetup() {
    const totalPct = setupProteinPct + setupCarbsPct + setupFatPct;
    if (totalPct !== 100) {
      Alert.alert('Error', `Los porcentajes deben sumar 100%. Actualmente suman ${totalPct}%.`);
      return;
    }
    setIsSavingSetup(true);
    try {
      const parsedCal = Number(setupCalories);
      const cal = setupCalories.trim() !== '' && !Number.isNaN(parsedCal) ? parsedCal : 2000;
      const protein = Math.round((cal * (setupProteinPct / 100)) / 4);
      const carbs = Math.round((cal * (setupCarbsPct / 100)) / 4);
      const fat = Math.round((cal * (setupFatPct / 100)) / 9);
      await api.post('/api/user/nutrition-profile', {
        isManual: true,
        targetCalories: cal,
        targetProtein: protein,
        targetCarbs: carbs,
        targetFat: fat,
      });
      setIsSetupOpen(false);
      fetchNutritionData(selectedDate);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudieron guardar los objetivos.');
    } finally {
      setIsSavingSetup(false);
    }
  }

  function shiftDate(days: number) {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: colors.textPrimary }}>Diario de Nutrición</Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: 16 }}>
          Registra tus comidas y controla tus macros.
        </Text>

        {/* Date navigator */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 8, marginBottom: 16 }}>
          <TouchableOpacity onPress={() => shiftDate(-1)} style={{ padding: 8 }}>
            <ChevronLeft size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedDate(todayISO())}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary }}>{formatDateLabel(selectedDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => shiftDate(1)} style={{ padding: 8 }}>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={{ height: 160, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : !profile ? (
          <View style={{ alignItems: 'center', paddingVertical: 40, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border }}>
            <Target size={32} color={colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.textPrimary }}>Configura tus objetivos</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 6, marginBottom: 16, paddingHorizontal: 20 }}>
              Antes de registrar comidas, define tus calorías y macros objetivo.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSetupCalories('2000');
                setSetupProteinPct(30);
                setSetupCarbsPct(40);
                setSetupFatPct(30);
                setIsSetupOpen(true);
              }}
              style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Establecer Objetivos</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setIsSummaryOpen(true)}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 42, borderRadius: 14, backgroundColor: colors.primarySoft }}
              >
                <BarChart3 size={14} color={colors.primaryAccent} />
                <Text style={{ color: colors.primaryAccent, fontWeight: 'bold', fontSize: 12 }}>Ver Resumen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const cal = profile.targetCalories || 2000;
                  const pPct = Math.round(((profile.targetProtein * 4) / cal) * 100) || 30;
                  const fPct = Math.round(((profile.targetFat * 9) / cal) * 100) || 30;
                  setSetupCalories(cal.toString());
                  setSetupProteinPct(pPct);
                  setSetupFatPct(fPct);
                  setSetupCarbsPct(Math.max(0, 100 - pPct - fPct));
                  setIsSetupOpen(true);
                }}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 42, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}
              >
                <Target size={14} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 12 }}>Objetivos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/nutrition/saved-diets', params: { date: selectedDate } })}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 42, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}
              >
                <Folder size={14} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 12 }}>Mis Dietas</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.push({ pathname: '/nutrition/generate-diet', params: { date: selectedDate } })}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                height: 46,
                borderRadius: 14,
                backgroundColor: colors.primary,
                marginBottom: 20,
              }}
            >
              <Sparkles size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Generar Menú Diario con IA</Text>
            </TouchableOpacity>

            {meals.length > 0 && (
              <TouchableOpacity
                onPress={() => setIsSaveTemplateOpen(true)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 14, marginBottom: 20 }}
              >
                <Save size={13} color={colors.primaryAccent} />
                <Text style={{ color: colors.primaryAccent, fontWeight: 'bold', fontSize: 12 }}>Guardar el día de hoy como plantilla</Text>
              </TouchableOpacity>
            )}

            {/* Macro cards */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              <MacroCard colors={colors} icon={<Flame size={16} color={Palette.amber500} />} label="Calorías" value={Math.round(totals.calories)} target={profile.targetCalories} unit="kcal" />
              <MacroCard colors={colors} icon={<Beef size={16} color={Palette.rose500} />} label="Proteínas" value={Math.round(totals.protein)} target={profile.targetProtein} unit="g" />
              <MacroCard colors={colors} icon={<Wheat size={16} color={Palette.emerald500} />} label="Carbohidratos" value={Math.round(totals.carbs)} target={profile.targetCarbs} unit="g" />
              <MacroCard colors={colors} icon={<Droplet size={16} color={Palette.amber400} />} label="Grasas" value={Math.round(totals.fat)} target={profile.targetFat} unit="g" />
            </View>

            {/* Meal sections */}
            <View style={{ gap: 14 }}>
              {mealTypesList.map((mealType) => {
                const sectionMeals = meals.filter((m) => m.mealType === mealType.id);
                const sectionCals = sectionMeals.reduce((acc, m) => acc + calcNutrients(m).cal, 0);
                return (
                  <View key={mealType.id} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, overflow: 'hidden' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: colors.surfaceSunken, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary }}>{mealType.label}</Text>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textSecondary }}>{Math.round(sectionCals)} kcal</Text>
                    </View>

                    {sectionMeals.length > 0 ? (
                      <View>
                        {sectionMeals.map((meal) => {
                          const { cal, pro, car, fat } = calcNutrients(meal);
                          return (
                            <View
                              key={meal.id}
                              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}
                            >
                              <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary }} numberOfLines={1}>
                                  {meal.foodItem.name}
                                  {meal.foodItem.brand ? <Text style={{ color: colors.textMuted, fontWeight: '400' }}> ({meal.foodItem.brand})</Text> : null}
                                </Text>
                                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                                  {meal.quantityGrams}g • {Math.round(pro)}g P • {Math.round(car)}g C • {Math.round(fat)}g G
                                </Text>
                              </View>
                              <Text style={{ fontSize: 13, fontWeight: '900', color: colors.textPrimary, marginRight: 10 }}>{Math.round(cal)} kcal</Text>
                              <TouchableOpacity onPress={() => handleDeleteMeal(meal.id)} disabled={deletingId === meal.id} style={{ padding: 4 }}>
                                {deletingId === meal.id ? <ActivityIndicator size="small" color={Palette.red500} /> : <Trash2 size={16} color={Palette.red500} />}
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={{ padding: 18, textAlign: 'center', fontSize: 12, color: colors.textMuted }}>No has registrado alimentos aún.</Text>
                    )}

                    <TouchableOpacity
                      onPress={() => openAddFoodModal(mealType.id)}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, backgroundColor: colors.surfaceSunken }}
                    >
                      <Plus size={14} color={colors.primaryAccent} />
                      <Text style={{ color: colors.primaryAccent, fontWeight: 'bold', fontSize: 12 }}>Añadir Alimento</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* Add Food Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%', borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary }}>
                Añadir a {mealTypesList.find((m) => m.id === modalMealType)?.label || modalMealType}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={{ padding: 6, backgroundColor: colors.surfaceAlt, borderRadius: 999 }}>
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <TouchableOpacity onPress={() => setActiveTab('search')} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'search' ? colors.primary : 'transparent' }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: activeTab === 'search' ? colors.primaryAccent : colors.textMuted }}>Mis Alimentos</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab('create')} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'create' ? colors.primary : 'transparent' }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: activeTab === 'create' ? colors.primaryAccent : colors.textMuted }}>Crear Nuevo</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'search' ? (
              <>
                <View style={{ padding: 16, paddingBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surfaceAlt, borderRadius: 14, paddingHorizontal: 12 }}>
                    <Search size={16} color={colors.textMuted} />
                    <TextInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Buscar alimento..."
                      placeholderTextColor={colors.textMuted}
                      style={{ flex: 1, color: colors.textPrimary, height: 44 }}
                    />
                  </View>
                </View>
                <ScrollView style={{ paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 20, gap: 8 }}>
                  {isSearching ? (
                    <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                  ) : foods.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>No se encontraron alimentos.</Text>
                      <TouchableOpacity onPress={() => setActiveTab('create')} style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 12, color: colors.primaryAccent, fontWeight: 'bold' }}>Crear uno nuevo</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    foods.map((food) => (
                      <View key={food.id} style={{ padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSunken }}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary }}>{food.name}</Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2, marginBottom: 8 }}>
                          100g • {food.calories} kcal {food.category ? `• ${food.category}` : ''}
                        </Text>
                        {selectedFood?.id === food.id ? (
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TextInput
                              value={quantityGrams}
                              onChangeText={setQuantityGrams}
                              keyboardType="numeric"
                              placeholder="Gramos"
                              placeholderTextColor={colors.textMuted}
                              autoFocus
                              style={{ flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 10, paddingHorizontal: 10, height: 38, color: colors.textPrimary }}
                            />
                            <TouchableOpacity
                              onPress={handleLogMeal}
                              disabled={isLoggingMeal || !quantityGrams || Number(quantityGrams) <= 0}
                              style={{ backgroundColor: colors.primary, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center', opacity: isLoggingMeal || !quantityGrams || Number(quantityGrams) <= 0 ? 0.6 : 1 }}
                            >
                              {isLoggingMeal ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Guardar</Text>}
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity onPress={() => setSelectedFood(food)} style={{ backgroundColor: colors.surfaceAlt, borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textPrimary }}>Seleccionar</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))
                  )}
                </ScrollView>
              </>
            ) : (
              <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }}>
                <Field colors={colors} label="Nombre del Alimento *">
                  <TextInput value={newFood.name} onChangeText={(v) => setNewFood({ ...newFood, name: v })} style={fieldStyle(colors)} placeholderTextColor={colors.textMuted} />
                </Field>
                <Field colors={colors} label="Marca (Opcional)">
                  <TextInput value={newFood.brand} onChangeText={(v) => setNewFood({ ...newFood, brand: v })} style={fieldStyle(colors)} placeholderTextColor={colors.textMuted} />
                </Field>
                <Text style={{ fontSize: 10, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase' }}>Información nutricional (por 100g)</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Field colors={colors} label="Calorías *" flex>
                    <TextInput value={newFood.calories} onChangeText={(v) => setNewFood({ ...newFood, calories: v })} keyboardType="numeric" style={fieldStyle(colors)} placeholderTextColor={colors.textMuted} />
                  </Field>
                  <Field colors={colors} label="Proteínas (g) *" flex>
                    <TextInput value={newFood.protein} onChangeText={(v) => setNewFood({ ...newFood, protein: v })} keyboardType="numeric" style={fieldStyle(colors)} placeholderTextColor={colors.textMuted} />
                  </Field>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Field colors={colors} label="Carbohidratos (g) *" flex>
                    <TextInput value={newFood.carbs} onChangeText={(v) => setNewFood({ ...newFood, carbs: v })} keyboardType="numeric" style={fieldStyle(colors)} placeholderTextColor={colors.textMuted} />
                  </Field>
                  <Field colors={colors} label="Grasas (g) *" flex>
                    <TextInput value={newFood.fat} onChangeText={(v) => setNewFood({ ...newFood, fat: v })} keyboardType="numeric" style={fieldStyle(colors)} placeholderTextColor={colors.textMuted} />
                  </Field>
                </View>
                <TouchableOpacity
                  onPress={handleCreateFood}
                  disabled={isCreatingFood}
                  style={{ marginTop: 8, height: 48, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: isCreatingFood ? 0.6 : 1 }}
                >
                  {isCreatingFood ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Guardar en mi Catálogo</Text>}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Setup Targets Modal */}
      <Modal visible={isSetupOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>Establecer Objetivos</Text>
              <TouchableOpacity onPress={() => setIsSetupOpen(false)} style={{ padding: 6, backgroundColor: colors.surfaceAlt, borderRadius: 999 }}>
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Field colors={colors} label="Calorías Objetivo (kcal/día)">
              <TextInput value={setupCalories} onChangeText={setSetupCalories} keyboardType="numeric" style={fieldStyle(colors)} />
            </Field>

            <Text style={{ fontSize: 10, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', marginTop: 10, marginBottom: 8 }}>
              Distribución de Macros (% del total, deben sumar 100)
            </Text>
            <PercentRow label="Proteína" value={setupProteinPct} onChange={setSetupProteinPct} colors={colors} />
            <PercentRow label="Carbohidratos" value={setupCarbsPct} onChange={setSetupCarbsPct} colors={colors} />
            <PercentRow label="Grasas" value={setupFatPct} onChange={setSetupFatPct} colors={colors} />
            <Text style={{ fontSize: 11, color: setupProteinPct + setupCarbsPct + setupFatPct === 100 ? colors.textMuted : Palette.red500, marginTop: 8, fontWeight: 'bold' }}>
              Total: {setupProteinPct + setupCarbsPct + setupFatPct}%
            </Text>

            <TouchableOpacity
              onPress={handleSaveSetup}
              disabled={isSavingSetup}
              style={{ marginTop: 16, height: 50, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: isSavingSetup ? 0.6 : 1 }}
            >
              {isSavingSetup ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Guardar Objetivos</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Summary Modal */}
      <Modal visible={isSummaryOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%', borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>Resumen Nutricional</Text>
              <TouchableOpacity onPress={() => setIsSummaryOpen(false)} style={{ padding: 6, backgroundColor: colors.surfaceAlt, borderRadius: 999 }}>
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
              {profile && (
                <View style={{ gap: 14 }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase' }}>Objetivos vs Consumido</Text>
                  <ProgressStat label="Calorías" value={totals.calories} target={profile.targetCalories} unit="kcal" color={Palette.amber500} colors={colors} />
                  <ProgressStat label="Proteína" value={totals.protein} target={profile.targetProtein} unit="g" color={Palette.rose500} colors={colors} />
                  <ProgressStat label="Carbohidratos" value={totals.carbs} target={profile.targetCarbs} unit="g" color={Palette.emerald500} colors={colors} />
                  <ProgressStat label="Grasas" value={totals.fat} target={profile.targetFat} unit="g" color={Palette.amber400} colors={colors} />
                </View>
              )}

              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase' }}>Desglose por Momentos del Día</Text>
                {mealBreakdowns.map((m) => {
                  const pct = totals.calories > 0 ? Math.round((m.cals / totals.calories) * 100) : 0;
                  return (
                    <View key={m.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textPrimary }}>{m.label}</Text>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textSecondary }}>
                        {Math.round(m.cals)} kcal <Text style={{ color: colors.textMuted, fontWeight: '400' }}>({pct}%)</Text>
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SaveTemplateModal
        visible={isSaveTemplateOpen}
        onClose={() => setIsSaveTemplateOpen(false)}
        onSaved={() => Alert.alert('Guardado', 'Plantilla guardada en "Mis Dietas".')}
        items={templateItems}
        defaultName={`Dieta del día ${selectedDate}`}
      />
    </SafeAreaView>
  );
}

function MacroCard({ colors, icon, label, value, target, unit }: { colors: any; icon: React.ReactNode; label: string; value: number; target: number; unit: string }) {
  return (
    <View style={{ width: '47%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {icon}
        <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>
        {value} <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted }}>/ {target || 0} {unit}</Text>
      </Text>
    </View>
  );
}

function ProgressStat({ label, value, target, unit, color, colors }: { label: string; value: number; target: number; unit: string; color: string; colors: any }) {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0);
  const remaining = target - value;
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textSecondary }}>{label}</Text>
        <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textPrimary }}>
          {Math.round(value)} / {Math.round(target)} {unit}
        </Text>
      </View>
      <View style={{ height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 4 }} />
      </View>
      <Text style={{ fontSize: 10, color: remaining > 0 ? colors.textMuted : Palette.red500, marginTop: 3, fontWeight: '600' }}>
        {remaining > 0 ? `Faltan ${Math.round(remaining)} ${unit}` : `Excedido por ${Math.round(-remaining)} ${unit}`}
      </Text>
    </View>
  );
}

function PercentRow({ label, value, onChange, colors }: { label: string; value: number; onChange: (v: number) => void; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceAlt, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
        <TouchableOpacity onPress={() => onChange(Math.max(0, value - 5))}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>-</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 13, fontWeight: '900', color: colors.textPrimary, minWidth: 32, textAlign: 'center' }}>{value}%</Text>
        <TouchableOpacity onPress={() => onChange(Math.min(100, value + 5))}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Field({ colors, label, children, flex }: { colors: any; label: string; children: React.ReactNode; flex?: boolean }) {
  return (
    <View style={{ flex: flex ? 1 : undefined }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 }}>{label}</Text>
      {children}
    </View>
  );
}

function fieldStyle(colors: any) {
  return { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderRadius: 12, paddingHorizontal: 12, height: 44 };
}
