import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Sparkles,
  Utensils,
  Flame,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  Check,
  Folder,
  RefreshCw,
  X,
  Edit3,
  Beef,
  Wheat,
  Droplet,
} from 'lucide-react-native';
import { api } from '../../../lib/apiClient';
import { generateDietPlan, STANDARD_FOODS } from '../../../lib/dietEngine';

const FOOD_CATEGORIES = [
  'Todos',
  'Carne',
  'Pescado',
  'Verdura',
  'Fruta',
  'Lácteos',
  'Legumbres',
  'Cereales/Carbohidratos',
  'Grasas/Aceites/Frutos Secos',
  'Otros',
];

interface FoodItem {
  id: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  userId?: string | null;
}

interface MealEntry {
  id: string;
  mealType: string;
  quantityGrams: number;
  foodItem: FoodItem;
}

export default function NutritionScreen() {
  // Date State (default to today YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isLogging, setIsLogging] = useState(false);

  // Data States
  const [profile, setProfile] = useState<any>(null);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);

  // Targets
  const goalCalories = profile?.dailyCalories || 2400;
  const goalProtein = profile?.proteinGrams || 150;
  const goalCarbs = profile?.carbsGrams || 270;
  const goalFat = profile?.fatGrams || 67;

  // Add Food Modal States
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [activeMealType, setActiveMealType] = useState('BREAKFAST');
  const [foodTab, setFoodTab] = useState<'buscar' | 'mis_alimentos' | 'crear'>('buscar');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  // Selected Food for Portion Input
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [portionGrams, setPortionGrams] = useState('100');

  // Create Food Form
  const [newFood, setNewFood] = useState({
    name: '',
    brand: '',
    category: 'Otros',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });

  // AI Diet Planner Wizard Modal
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [dietType, setDietType] = useState('STANDARD');
  const [culinaryStyle, setCulinaryStyle] = useState('CLASSIC');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [generatedMealPlan, setGeneratedMealPlan] = useState<any[] | null>(null);

  // Saved Diets Modal
  const [showSavedDietsModal, setShowSavedDietsModal] = useState(false);
  const [savedDiets, setSavedDiets] = useState<any[]>([]);

  useEffect(() => {
    fetchNutritionData();
  }, [selectedDate]);

  async function fetchNutritionData() {
    setIsLoading(true);
    try {
      // 1. Fetch User Nutrition Profile & Goals
      const profRes = await api.get('/api/user/nutrition-profile').catch(() => null);
      if (profRes) {
        setProfile(profRes);
      }

      // 2. Fetch Logged Meals for Selected Date
      const mealsRes = await api.get(`/api/user/meals?date=${selectedDate}`).catch(() => null);
      if (mealsRes && Array.isArray(mealsRes)) {
        setMeals(mealsRes);
      } else {
        setMeals([]);
      }

      // 3. Fetch Foods Database
      const foodsRes = await api.get('/api/user/foods').catch(() => null);
      if (foodsRes && Array.isArray(foodsRes)) {
        setFoods(foodsRes);
      }
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Calculate Logged Totals
  const totalCalories = meals.reduce((acc, m) => acc + Math.round((m.foodItem.calories * m.quantityGrams) / 100), 0);
  const totalProtein = meals.reduce((acc, m) => acc + Math.round((m.foodItem.protein * m.quantityGrams) / 100), 0);
  const totalCarbs = meals.reduce((acc, m) => acc + Math.round((m.foodItem.carbs * m.quantityGrams) / 100), 0);
  const totalFat = meals.reduce((acc, m) => acc + Math.round((m.foodItem.fat * m.quantityGrams) / 100), 0);

  // Date Navigation Helpers
  function changeDate(days: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  }

  function formatDisplayDate(dateStr: string) {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return 'Hoy';

    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  // Dynamic Meal Sections Config
  const mealSections = [
    { id: 'BREAKFAST', label: 'Desayuno' },
    { id: 'LUNCH', label: 'Almuerzo' },
    { id: 'DINNER', label: 'Cena' },
    { id: 'SNACK-1', label: 'Snack' },
  ];

  // Handle Add Food Entry to Meal
  async function handleAddFoodToMeal() {
    if (!selectedFood || !portionGrams || isNaN(Number(portionGrams))) return;

    setIsLogging(true);
    try {
      await api.post('/api/user/meals', {
        mealType: activeMealType,
        foodItemId: selectedFood.id,
        quantityGrams: Number(portionGrams),
        date: selectedDate,
      });

      setSelectedFood(null);
      setShowAddFoodModal(false);
      await fetchNutritionData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo registrar el alimento');
    } finally {
      setIsLogging(false);
    }
  }

  // Handle Delete Meal Entry
  async function handleDeleteMealEntry(id: string) {
    try {
      await api.delete(`/api/user/meals/${id}`);
      setMeals((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la entrada');
    }
  }

  // Handle Create Custom Food
  async function handleCreateCustomFood() {
    if (!newFood.name || !newFood.calories) {
      Alert.alert('Campos requeridos', 'Introduce al menos el nombre y las calorías.');
      return;
    }

    try {
      const created = await api.post('/api/user/foods', {
        name: newFood.name,
        brand: newFood.brand || null,
        category: newFood.category,
        calories: Number(newFood.calories),
        protein: Number(newFood.protein) || 0,
        carbs: Number(newFood.carbs) || 0,
        fat: Number(newFood.fat) || 0,
      });

      setFoods((prev) => [created, ...prev]);
      setSelectedFood(created);
      setFoodTab('buscar');
      setNewFood({ name: '', brand: '', category: 'Otros', calories: '', protein: '', carbs: '', fat: '' });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al crear el alimento');
    }
  }

  // Generate AI Diet Plan
  function handleGenerateAIDiet() {
    const plan = generateDietPlan(
      goalCalories,
      goalProtein,
      goalCarbs,
      goalFat,
      dietType,
      allergens,
      culinaryStyle
    );

    setGeneratedMealPlan(plan);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#ffffff' }}>Nutrición e IA</Text>
            <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              Diario nutricional y menús científicos
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setShowSavedDietsModal(true)}
              style={{
                backgroundColor: '#1e293b',
                borderWidth: 1,
                borderColor: '#334155',
                padding: 10,
                borderRadius: 14,
              }}
            >
              <Folder size={18} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                handleGenerateAIDiet();
                setShowPlannerModal(true);
              }}
              style={{
                backgroundColor: '#06b6d4',
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Sparkles size={16} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}>Planificar IA</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Navigator Bar */}
        <View
          style={{
            backgroundColor: '#1e293b',
            borderRadius: 18,
            padding: 10,
            borderWidth: 1,
            borderColor: '#334155',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <TouchableOpacity onPress={() => changeDate(-1)} style={{ padding: 6 }}>
            <ChevronLeft size={20} color="#06b6d4" />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CalendarIcon size={16} color="#06b6d4" />
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#ffffff' }}>
              {formatDisplayDate(selectedDate)}
            </Text>
          </View>

          <TouchableOpacity onPress={() => changeDate(1)} style={{ padding: 6 }}>
            <ChevronRight size={20} color="#06b6d4" />
          </TouchableOpacity>
        </View>

        {/* Macro Progress Summary Card */}
        <View
          style={{
            backgroundColor: '#1e293b',
            borderRadius: 22,
            padding: 18,
            borderWidth: 1,
            borderColor: '#334155',
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>
                Balance Calórico Diario
              </Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#ffffff', marginTop: 2 }}>
                {totalCalories} <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: 'bold' }}>/ {goalCalories} kcal</Text>
              </Text>
            </View>

            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(6, 182, 212, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={22} color="#06b6d4" />
            </View>
          </View>

          {/* Calorie Progress Bar */}
          <View style={{ height: 8, backgroundColor: '#0f172a', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
            <View
              style={{
                height: '100%',
                width: `${Math.min(Math.round((totalCalories / goalCalories) * 100), 100)}%`,
                backgroundColor: '#06b6d4',
                borderRadius: 4,
              }}
            />
          </View>

          {/* Macro Split Cards */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Protein */}
            <View style={{ flex: 1, backgroundColor: 'rgba(244, 63, 94, 0.12)', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(244, 63, 94, 0.2)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Beef size={14} color="#f43f5e" />
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#f43f5e', textTransform: 'uppercase' }}>Proteínas</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#ffffff' }}>
                {totalProtein}g <Text style={{ fontSize: 10, color: '#94a3b8' }}>/ {goalProtein}g</Text>
              </Text>
            </View>

            {/* Carbs */}
            <View style={{ flex: 1, backgroundColor: 'rgba(245, 158, 11, 0.12)', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Wheat size={14} color="#f59e0b" />
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#f59e0b', textTransform: 'uppercase' }}>Carbos</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#ffffff' }}>
                {totalCarbs}g <Text style={{ fontSize: 10, color: '#94a3b8' }}>/ {goalCarbs}g</Text>
              </Text>
            </View>

            {/* Fat */}
            <View style={{ flex: 1, backgroundColor: 'rgba(14, 165, 233, 0.12)', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.2)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Droplet size={14} color="#0ea5e9" />
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0ea5e9', textTransform: 'uppercase' }}>Grasas</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#ffffff' }}>
                {totalFat}g <Text style={{ fontSize: 10, color: '#94a3b8' }}>/ {goalFat}g</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Meal Sections List */}
        <View style={{ gap: 18 }}>
          {mealSections.map((section) => {
            const sectionMeals = meals.filter((m) => m.mealType === section.id);
            const sectionCalories = sectionMeals.reduce((acc, m) => acc + Math.round((m.foodItem.calories * m.quantityGrams) / 100), 0);

            return (
              <View
                key={section.id}
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: 20,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#334155',
                }}
              >
                {/* Section Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#06b6d4' }}>{section.label}</Text>
                    <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: 'bold' }}>{sectionCalories} kcal</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      setActiveMealType(section.id);
                      setShowAddFoodModal(true);
                    }}
                    style={{
                      backgroundColor: 'rgba(6, 182, 212, 0.15)',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Plus size={14} color="#06b6d4" />
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#06b6d4' }}>Añadir</Text>
                  </TouchableOpacity>
                </View>

                {/* Section Items */}
                {sectionMeals.length > 0 ? (
                  <View style={{ gap: 8 }}>
                    {sectionMeals.map((item) => {
                      const itemKcal = Math.round((item.foodItem.calories * item.quantityGrams) / 100);
                      return (
                        <View
                          key={item.id}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#0f172a',
                            padding: 12,
                            borderRadius: 14,
                          }}
                        >
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>
                              {item.foodItem.name}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                              {item.quantityGrams}g • P: {Math.round((item.foodItem.protein * item.quantityGrams) / 100)}g | C: {Math.round((item.foodItem.carbs * item.quantityGrams) / 100)}g | G: {Math.round((item.foodItem.fat * item.quantityGrams) / 100)}g
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#06b6d4' }}>
                              {itemKcal} kcal
                            </Text>

                            <TouchableOpacity onPress={() => handleDeleteMealEntry(item.id)} style={{ padding: 4 }}>
                              <Trash2 size={16} color="#f43f5e" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', paddingVertical: 4 }}>
                    Sin alimentos registrados en esta toma.
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Modal Add Food */}
      <Modal visible={showAddFoodModal} animationType="slide" transparent>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.98)', padding: 20 }}>
          <View style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#334155' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}>
                Añadir a {mealSections.find((m) => m.id === activeMealType)?.label}
              </Text>
              <TouchableOpacity onPress={() => setShowAddFoodModal(false)} style={{ padding: 6 }}>
                <X size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Food Tabs */}
            <View style={{ flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 14, padding: 4, marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setFoodTab('buscar')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: foodTab === 'buscar' ? '#06b6d4' : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: foodTab === 'buscar' ? '#ffffff' : '#94a3b8' }}>
                  Buscador
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFoodTab('crear')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: foodTab === 'crear' ? '#06b6d4' : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: foodTab === 'crear' ? '#ffffff' : '#94a3b8' }}>
                  + Crear Nuevo
                </Text>
              </TouchableOpacity>
            </View>

            {foodTab === 'buscar' ? (
              <View style={{ flex: 1 }}>
                {/* Search Bar */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#0f172a',
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    height: 46,
                    marginBottom: 12,
                  }}
                >
                  <Search size={18} color="#64748b" style={{ marginRight: 10 }} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Buscar pechuga, arroz, huevo..."
                    placeholderTextColor="#64748b"
                    style={{ flex: 1, color: '#ffffff', fontSize: 14 }}
                  />
                </View>

                {/* Foods List */}
                <ScrollView style={{ flex: 1 }}>
                  {STANDARD_FOODS.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map((food) => (
                    <TouchableOpacity
                      key={food.id}
                      onPress={() => setSelectedFood({ id: food.id, name: food.name, calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat })}
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        backgroundColor: selectedFood?.id === food.id ? 'rgba(6, 182, 212, 0.2)' : '#0f172a',
                        borderWidth: 1,
                        borderColor: selectedFood?.id === food.id ? '#06b6d4' : '#1e293b',
                        marginBottom: 8,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <View>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>{food.name}</Text>
                        <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                          P: {food.protein}g | C: {food.carbs}g | G: {food.fat}g (por 100g)
                        </Text>
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#06b6d4' }}>
                        {food.calories} kcal
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Portion Selector Footer */}
                {selectedFood && (
                  <View style={{ paddingTop: 14, borderTopWidth: 1, borderTopColor: '#334155', gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, color: '#ffffff', fontWeight: 'bold' }}>Gramos a consumir:</Text>
                      <TextInput
                        value={portionGrams}
                        onChangeText={setPortionGrams}
                        keyboardType="numeric"
                        style={{
                          backgroundColor: '#0f172a',
                          color: '#06b6d4',
                          fontSize: 16,
                          fontWeight: 'bold',
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 10,
                          textAlign: 'center',
                          width: 90,
                          borderWidth: 1,
                          borderColor: '#06b6d4',
                        }}
                      />
                    </View>

                    <TouchableOpacity
                      onPress={handleAddFoodToMeal}
                      disabled={isLogging}
                      style={{
                        backgroundColor: '#06b6d4',
                        height: 48,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isLogging ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15 }}>Añadir Entrada</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              /* Create Food Form */
              <ScrollView style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                  Nombre del Alimento
                </Text>
                <TextInput
                  value={newFood.name}
                  onChangeText={(val) => setNewFood((prev) => ({ ...prev, name: val }))}
                  placeholder="Ej: Avena Integral Hacendado"
                  placeholderTextColor="#64748b"
                  style={{ backgroundColor: '#0f172a', color: '#ffffff', borderRadius: 12, paddingHorizontal: 14, height: 44, marginBottom: 12 }}
                />

                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                  Calorías (por 100g)
                </Text>
                <TextInput
                  value={newFood.calories}
                  onChangeText={(val) => setNewFood((prev) => ({ ...prev, calories: val }))}
                  keyboardType="numeric"
                  placeholder="Ej: 375"
                  placeholderTextColor="#64748b"
                  style={{ backgroundColor: '#0f172a', color: '#ffffff', borderRadius: 12, paddingHorizontal: 14, height: 44, marginBottom: 12 }}
                />

                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#f43f5e', textTransform: 'uppercase', marginBottom: 4 }}>Proteína (g)</Text>
                    <TextInput
                      value={newFood.protein}
                      onChangeText={(val) => setNewFood((prev) => ({ ...prev, protein: val }))}
                      keyboardType="numeric"
                      placeholder="13"
                      placeholderTextColor="#64748b"
                      style={{ backgroundColor: '#0f172a', color: '#ffffff', borderRadius: 12, paddingHorizontal: 12, height: 44 }}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 4 }}>Carbos (g)</Text>
                    <TextInput
                      value={newFood.carbs}
                      onChangeText={(val) => setNewFood((prev) => ({ ...prev, carbs: val }))}
                      keyboardType="numeric"
                      placeholder="60"
                      placeholderTextColor="#64748b"
                      style={{ backgroundColor: '#0f172a', color: '#ffffff', borderRadius: 12, paddingHorizontal: 12, height: 44 }}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0ea5e9', textTransform: 'uppercase', marginBottom: 4 }}>Grasa (g)</Text>
                    <TextInput
                      value={newFood.fat}
                      onChangeText={(val) => setNewFood((prev) => ({ ...prev, fat: val }))}
                      keyboardType="numeric"
                      placeholder="7"
                      placeholderTextColor="#64748b"
                      style={{ backgroundColor: '#0f172a', color: '#ffffff', borderRadius: 12, paddingHorizontal: 12, height: 44 }}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleCreateCustomFood}
                  style={{ backgroundColor: '#06b6d4', height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15 }}>Guardar Alimento</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* AI Diet Wizard Modal */}
      <Modal visible={showPlannerModal} animationType="slide" transparent>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.98)', padding: 20 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={{ backgroundColor: '#1e293b', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#334155' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff' }}>Planificador de Dieta IA</Text>
                <TouchableOpacity onPress={() => setShowPlannerModal(false)} style={{ padding: 6 }}>
                  <X size={22} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Diet Type */}
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
                Tipo de Dieta
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {['STANDARD', 'VEGETARIAN', 'VEGAN', 'KETO'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setDietType(t)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: dietType === t ? '#06b6d4' : '#334155',
                      backgroundColor: dietType === t ? 'rgba(6, 182, 212, 0.2)' : '#0f172a',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: dietType === t ? '#06b6d4' : '#ffffff' }}>
                      {t === 'STANDARD' ? 'Estándar' : t === 'VEGETARIAN' ? 'Vegetariana' : t === 'VEGAN' ? 'Vegana' : 'Keto'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Generated Meal Plan Display */}
              {generatedMealPlan ? (
                <View style={{ gap: 14, marginVertical: 16 }}>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#ffffff' }}>Menú Generado</Text>
                  {generatedMealPlan.map((meal: any, idx: number) => (
                    <View key={idx} style={{ backgroundColor: '#0f172a', padding: 12, borderRadius: 14 }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#06b6d4', marginBottom: 6 }}>{meal.mealLabel}</Text>
                      {meal.items.map((item: any, iIdx: number) => (
                        <View key={iIdx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                          <Text style={{ fontSize: 12, color: '#ffffff' }}>{item.food.name} ({item.quantityGrams}g)</Text>
                          <Text style={{ fontSize: 11, color: '#94a3b8' }}>{item.equivalentText}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              ) : null}

              <TouchableOpacity
                onPress={handleGenerateAIDiet}
                style={{
                  backgroundColor: '#06b6d4',
                  height: 48,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                  marginTop: 8,
                }}
              >
                <Sparkles size={18} color="#ffffff" />
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15 }}>Generar Menú</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Saved Diets Modal */}
      <Modal visible={showSavedDietsModal} animationType="slide" transparent>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.98)', padding: 20 }}>
          <View style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#334155' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}>Plantillas de Dietas Guardadas</Text>
              <TouchableOpacity onPress={() => setShowSavedDietsModal(false)} style={{ padding: 6 }}>
                <X size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }}>
              {savedDiets.length > 0 ? (
                savedDiets.map((diet) => (
                  <View key={diet.id} style={{ backgroundColor: '#0f172a', padding: 14, borderRadius: 14, marginBottom: 10 }}>
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#ffffff' }}>{diet.name}</Text>
                    <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{diet.dailyCalories} kcal</Text>
                  </View>
                ))
              ) : (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Folder size={36} color="#64748b" style={{ marginBottom: 10 }} />
                  <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>
                    No tienes plantillas de dietas guardadas aún.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
