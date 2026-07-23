import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Sparkles, Dumbbell, Play, CheckCircle2, Clock, Flame, Plus, ChevronRight } from 'lucide-react-native';
import { generateWorkoutPlan } from '../../../lib/workoutEngine';

export default function WorkoutScreen() {
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [experienceLevel, setExperienceLevel] = useState<'principiante' | 'intermedio' | 'avanzado'>('intermedio');
  const [focusArea, setFocusArea] = useState<'hipertrofia' | 'fuerza' | 'perdida_grasa'>('hipertrofia');
  const [routinePlan, setRoutinePlan] = useState<any[] | null>(null);

  function handleGenerateRoutine() {
    const routine = generateWorkoutPlan(
      {
        days: daysPerWeek,
        level: experienceLevel,
        split: 'auto',
        priorities: [],
        injuries: [],
        goal: focusArea,
        nutrition: 'normocalorica',
      },
      []
    );

    setRoutinePlan(routine);
    setShowPlannerModal(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#ffffff' }}>Entrenamientos e IA</Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
              Volumen óptimo basado en evidencia científica
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowPlannerModal(true)}
            style={{
              backgroundColor: '#a855f7',
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sparkles size={16} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}>Rutina IA</Text>
          </TouchableOpacity>
        </View>

        {/* Workout Routine Display */}
        {routinePlan ? (
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff' }}>
              Tu Rutina Semanal Optimizada ({routinePlan.length} Días)
            </Text>
            {routinePlan.map((day: any, idx: number) => (
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#a855f7' }}>{day.name}</Text>
                    <Text style={{ fontSize: 12, color: '#94a3b8' }}>{day.exercises.length} Ejercicios</Text>
                  </View>
                  <TouchableOpacity
                    style={{
                      backgroundColor: 'rgba(168, 85, 247, 0.2)',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Play size={12} color="#a855f7" />
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#a855f7' }}>Iniciar</Text>
                  </TouchableOpacity>
                </View>

                {day.exercises.map((ex: any, eIdx: number) => (
                  <View
                    key={eIdx}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 10,
                      borderTopWidth: eIdx === 0 ? 0 : 1,
                      borderTopColor: '#334155',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>{ex.name}</Text>
                      <Text style={{ fontSize: 12, color: '#94a3b8' }}>
                        {ex.sets} series x {ex.repsList || ex.reps} reps ({ex.descanso})
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#a855f7' }}>RIR {ex.rir}</Text>
                    </View>
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
            <Dumbbell size={40} color="#64748b" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }}>
              No tienes ninguna rutina activa
            </Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
              Genera tu rutina con algoritmos basados en ciencia para maximizar tu hipertrofia o fuerza.
            </Text>
            <TouchableOpacity
              onPress={() => setShowPlannerModal(true)}
              style={{
                backgroundColor: '#a855f7',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Sparkles size={18} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>Diseñar Rutina IA</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* AI Workout Planner Modal */}
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
                Generador Científico de Rutinas
              </Text>
              <Text style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 20 }}>
                Calculamos el número de series semanales óptimas según la ciencia
              </Text>

              {/* Days per week */}
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
                Días de Entrenamiento por Semana
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {[3, 4, 5, 6].map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setDaysPerWeek(d)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: daysPerWeek === d ? '#a855f7' : '#334155',
                      backgroundColor: daysPerWeek === d ? 'rgba(168, 85, 247, 0.2)' : '#0f172a',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: daysPerWeek === d ? '#a855f7' : '#ffffff' }}>
                      {d} Días
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Experience Level */}
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
                Nivel de Experiencia
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
                {[
                  { id: 'principiante', label: 'Principiante' },
                  { id: 'intermedio', label: 'Intermedio' },
                  { id: 'avanzado', label: 'Avanzado' },
                ].map((l) => (
                  <TouchableOpacity
                    key={l.id}
                    onPress={() => setExperienceLevel(l.id as any)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: experienceLevel === l.id ? '#06b6d4' : '#334155',
                      backgroundColor: experienceLevel === l.id ? 'rgba(6, 182, 212, 0.2)' : '#0f172a',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: experienceLevel === l.id ? '#06b6d4' : '#ffffff' }}>
                      {l.label}
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
                  onPress={handleGenerateRoutine}
                  style={{
                    flex: 2,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: '#a855f7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                  }}
                >
                  <Sparkles size={18} color="#ffffff" />
                  <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Crear Rutina</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
