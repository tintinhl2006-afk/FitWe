import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Sparkles, Utensils, Flame, ChevronRight, Check, AlertCircle, Plus, RefreshCw } from 'lucide-react-native';
import { generateDietPlan, STANDARD_FOODS } from '../../../lib/dietEngine';

export default function NutritionScreen() {
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [setupStep, setSetupStep] = useState(1);

  // User macros targets
  const [customCalories, setCustomCalories] = useState(2200);
  const [proteinPct, setProteinPct] = useState(30);
  const [carbsPct, setCarbsPct] = useState(45);
  const [fatPct, setFatPct] = useState(25);

  const [dietType, setDietType] = useState('STANDARD');
  const [culinaryStyle, setCulinaryStyle] = useState('CLASSIC');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [mealPlan, setMealPlan] = useState<any[] | null>(null);

  function handleGenerateDiet() {
    const targetProtein = Math.round((customCalories * (proteinPct / 100)) / 4);
    const targetCarbs = Math.round((customCalories * (carbsPct / 100)) / 4);
    const targetFat = Math.round((customCalories * (fatPct / 100)) / 9);

    const plan = generateDietPlan(
      customCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      dietType,
      allergens,
      culinaryStyle
    );

    setMealPlan(plan);
    setShowPlannerModal(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#ffffff' }}>Nutrición e IA</Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
              Planificación nutricional personalizada
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowPlannerModal(true)}
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

        {/* Macros Summary Banner */}
        <View
          style={{
            backgroundColor: '#1e293b',
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: '#334155',
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>Objetivo Diario</Text>
            <Text style={{ fontSize: 16, fontWeight: 'black', color: '#06b6d4' }}>{customCalories} kcal</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(244, 63, 94, 0.15)', padding: 10, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#f43f5e', textTransform: 'uppercase' }}>Proteínas</Text>
              <Text style={{ fontSize: 16, fontWeight: 'black', color: '#ffffff', marginTop: 2 }}>
                {Math.round((customCalories * (proteinPct / 100)) / 4)}g
              </Text>
              <Text style={{ fontSize: 10, color: '#94a3b8' }}>{proteinPct}%</Text>
            </View>

            <View style={{ flex: 1, backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: 10, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#f59e0b', textTransform: 'uppercase' }}>Carbos</Text>
              <Text style={{ fontSize: 16, fontWeight: 'black', color: '#ffffff', marginTop: 2 }}>
                {Math.round((customCalories * (carbsPct / 100)) / 4)}g
              </Text>
              <Text style={{ fontSize: 10, color: '#94a3b8' }}>{carbsPct}%</Text>
            </View>

            <View style={{ flex: 1, backgroundColor: 'rgba(14, 165, 233, 0.15)', padding: 10, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0ea5e9', textTransform: 'uppercase' }}>Grasas</Text>
              <Text style={{ fontSize: 16, fontWeight: 'black', color: '#ffffff', marginTop: 2 }}>
                {Math.round((customCalories * (fatPct / 100)) / 9)}g
              </Text>
              <Text style={{ fontSize: 10, color: '#94a3b8' }}>{fatPct}%</Text>
            </View>
          </View>
        </View>

        {/* Meal Plan Display */}
        {mealPlan ? (
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff' }}>Tu Menú Diario Generado</Text>
            {mealPlan.map((meal: any, idx: number) => (
              <View
                key={idx}
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: 20,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#334155',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#06b6d4' }}>{meal.mealLabel}</Text>
                  <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: '600' }}>{meal.calories} kcal</Text>
                </View>

                {meal.items.map((item: any, iIdx: number) => (
                  <View
                    key={iIdx}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 8,
                      borderTopWidth: iIdx === 0 ? 0 : 1,
                      borderTopColor: '#334155',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>{item.food.name}</Text>
                      <Text style={{ fontSize: 12, color: '#94a3b8' }}>{item.equivalentText}</Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#06b6d4' }}>
                      {item.quantityGrams}g
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <View
            style={{
              backgroundColor: '#1e293b',
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#334155',
            }}
          >
            <Utensils size={40} color="#64748b" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }}>
              No tienes ningún plan generado hoy
            </Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
              Configura tus preferencias nutricionales y dejas que la IA diseñe tu dieta personalizada.
            </Text>
            <TouchableOpacity
              onPress={() => setShowPlannerModal(true)}
              style={{
                backgroundColor: '#06b6d4',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Sparkles size={18} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>Generar Mi Dieta IA</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* AI Diet Setup Wizard Modal */}
      <Modal visible={showPlannerModal} animationType="slide" transparent>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.98)', padding: 20 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View
              style={{
                backgroundColor: '#1e293b',
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: '#334155',
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 6 }}>
                Planificador de Dieta IA
              </Text>
              <Text style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 20 }}>
                Ajustamos tus calorías, macros y restricciones de forma inteligente
              </Text>

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

              {/* Culinary Style */}
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
                Estilo Gastronómico
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
                {['CLASSIC', 'MEDITERRANEAN', 'QUICK'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setCulinaryStyle(s)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: culinaryStyle === s ? '#a855f7' : '#334155',
                      backgroundColor: culinaryStyle === s ? 'rgba(168, 85, 247, 0.2)' : '#0f172a',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: culinaryStyle === s ? '#a855f7' : '#ffffff' }}>
                      {s === 'CLASSIC' ? 'Fitness Clásico' : s === 'MEDITERRANEAN' ? 'Mediterráneo' : 'Rápido'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowPlannerModal(false)}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: '#334155',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#94a3b8', fontWeight: 'bold' }}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleGenerateDiet}
                  style={{
                    flex: 2,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: '#06b6d4',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                  }}
                >
                  <Sparkles size={18} color="#ffffff" />
                  <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Generar Menú</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
