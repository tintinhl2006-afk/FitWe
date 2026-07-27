import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert, Modal, Share } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { X, Check, Sparkles, ArrowLeft, ArrowRight, Minus, Plus, Download, Share2 } from 'lucide-react-native';
import { useAppTheme } from '../../../context/ThemeContext';
import { api } from '../../../lib/apiClient';
import type { GeneratedRoutine, GeneratedExercise } from '../../../lib/workoutEngine';

interface ExerciseCatalogItem {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string | null;
}

type Level = 'principiante' | 'intermedio' | 'avanzado' | 'muy_avanzado';
type Goal = 'hipertrofia' | 'fuerza' | 'recomposicion' | 'perdida_grasa';
type Split = 'auto' | 'torso_pierna' | 'ppl' | 'full_body';

const GOALS: { id: Goal; label: string; desc: string }[] = [
  { id: 'hipertrofia', label: 'Ganar músculo', desc: 'Hipertrofia' },
  { id: 'fuerza', label: 'Ganar fuerza', desc: 'Cargas pesadas' },
  { id: 'recomposicion', label: 'Recomposición', desc: 'Grasa y músculo' },
  { id: 'perdida_grasa', label: 'Perder grasa', desc: 'Déficit calórico' },
];

const LEVELS: { id: Level; label: string; desc: string }[] = [
  { id: 'principiante', label: 'Principiante', desc: 'Menos de 1 año' },
  { id: 'intermedio', label: 'Intermedio', desc: '1 - 3 años' },
  { id: 'avanzado', label: 'Avanzado', desc: '3 - 6 años' },
  { id: 'muy_avanzado', label: 'Muy avanzado', desc: 'Más de 6 años' },
];

const SPLITS: { id: Split; label: string; desc: string }[] = [
  { id: 'auto', label: 'Auto', desc: 'Decisión del plan' },
  { id: 'full_body', label: 'Cuerpo Completo', desc: 'Full Body' },
  { id: 'torso_pierna', label: 'Torso / Pierna', desc: 'Upper / Lower' },
  { id: 'ppl', label: 'Empuje / Tirón / Pierna', desc: 'PPL' },
];

const PRIORITY_GROUPS = ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Cuádriceps', 'Femoral', 'Glúteo', 'Abdomen'];

const INJURIES: { id: string; label: string }[] = [
  { id: 'hombro', label: 'Hombro' },
  { id: 'lumbar', label: 'Zona Lumbar' },
  { id: 'rodilla', label: 'Rodilla' },
  { id: 'codo_muneca', label: 'Codo / Muñeca' },
  { id: 'cadera', label: 'Cadera' },
  { id: 'ninguna', label: 'Ninguna' },
];

function getResolvedSplit(days: number, split: Split): 'full_body' | 'torso_pierna' | 'ppl' {
  if (split === 'auto') {
    if (days <= 2) return 'full_body';
    if (days === 3) return 'ppl';
    return 'torso_pierna';
  }
  return split;
}

function getRepeatsNeeded(days: number, split: Split): { count: number; options: string[] } {
  const resolved = getResolvedSplit(days, split);
  if (resolved === 'ppl') {
    if (days === 4) return { count: 1, options: ['empuje', 'tiron', 'pierna'] };
    if (days === 5) return { count: 2, options: ['empuje', 'tiron', 'pierna'] };
  }
  if (resolved === 'torso_pierna') {
    if (days === 3 || days === 5) return { count: 1, options: ['torso', 'pierna'] };
  }
  return { count: 0, options: [] };
}

function repeatLabel(option: string) {
  switch (option) {
    case 'empuje':
      return 'Empuje';
    case 'tiron':
      return 'Tirón';
    case 'pierna':
      return 'Pierna';
    case 'torso':
      return 'Torso';
    default:
      return option;
  }
}

export default function GenerateRoutinesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  const [setupStep, setSetupStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<ExerciseCatalogItem[]>([]);

  const [days, setDays] = useState(3);
  const [goal, setGoal] = useState<Goal>('hipertrofia');
  const [level, setLevel] = useState<Level>('intermedio');
  const [split, setSplit] = useState<Split>('auto');
  const [priorities, setPriorities] = useState<string[]>([]);
  const [injuries, setInjuries] = useState<string[]>([]);
  const [repeats, setRepeats] = useState<string[]>([]);

  const [plan, setPlan] = useState<GeneratedRoutine[] | null>(null);
  const [swapTarget, setSwapTarget] = useState<{ routineIdx: number; exerciseIdx: number } | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    api
      .get('/api/exercises')
      .then((data) => setCatalog(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const repeatsNeeded = useMemo(() => getRepeatsNeeded(days, split), [days, split]);

  useEffect(() => {
    const needed = getRepeatsNeeded(days, split);
    if (needed.count === 0) setRepeats([]);
    else setRepeats(needed.options.slice(0, needed.count));
  }, [days, split]);

  function toggleRepeat(option: string, max: number) {
    if (max === 1) {
      setRepeats([option]);
      return;
    }
    setRepeats((prev) => {
      if (prev.includes(option)) return prev.filter((o) => o !== option);
      if (prev.length < max) return [...prev, option];
      return [prev[1], option];
    });
  }

  function togglePriority(group: string) {
    setPriorities((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]));
  }

  function toggleInjury(injury: string) {
    if (injury === 'ninguna') {
      setInjuries((prev) => (prev.includes('ninguna') ? [] : ['ninguna']));
      return;
    }
    setInjuries((prev) => (prev.includes(injury) ? prev.filter((x) => x !== injury) : [...prev.filter((x) => x !== 'ninguna'), injury]));
  }

  async function handleGenerate() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.post('/api/routines/generate', { days, level, split, priorities, lesiones: injuries, goal, repeats });
      setPlan(data.plan);
      setSetupStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error al generar las rutinas.');
    } finally {
      setIsLoading(false);
    }
  }

  function updateSets(routineIdx: number, exerciseIdx: number, delta: number) {
    setPlan((prev) => {
      if (!prev) return prev;
      const next = prev.map((r) => ({ ...r, exercises: [...r.exercises] }));
      const ex = { ...next[routineIdx].exercises[exerciseIdx] };
      ex.sets = Math.max(1, ex.sets + delta);
      ex.repsList = Array(ex.sets).fill(ex.reps).join(',');
      next[routineIdx].exercises[exerciseIdx] = ex;
      return next;
    });
  }

  function updateReps(routineIdx: number, exerciseIdx: number, delta: number) {
    setPlan((prev) => {
      if (!prev) return prev;
      const next = prev.map((r) => ({ ...r, exercises: [...r.exercises] }));
      const ex = { ...next[routineIdx].exercises[exerciseIdx] };
      ex.reps = Math.max(1, ex.reps + delta);
      ex.repsList = Array(ex.sets).fill(ex.reps).join(',');
      next[routineIdx].exercises[exerciseIdx] = ex;
      return next;
    });
  }

  function deleteExercise(routineIdx: number, exerciseIdx: number) {
    setPlan((prev) => {
      if (!prev) return prev;
      const next = prev.map((r) => ({ ...r, exercises: [...r.exercises] }));
      next[routineIdx].exercises.splice(exerciseIdx, 1);
      return next;
    });
  }

  function renameRoutine(routineIdx: number, name: string) {
    setPlan((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[routineIdx] = { ...next[routineIdx], name };
      return next;
    });
  }

  function swapExercise(newExercise: ExerciseCatalogItem) {
    if (!swapTarget) return;
    setPlan((prev) => {
      if (!prev) return prev;
      const next = prev.map((r) => ({ ...r, exercises: [...r.exercises] }));
      const ex = { ...next[swapTarget.routineIdx].exercises[swapTarget.exerciseIdx] };
      ex.exerciseId = newExercise.id;
      ex.name = newExercise.name;
      ex.justificacion = `Ejercicio óptimo para el desarrollo de ${newExercise.muscleGroup.toLowerCase()}.`;
      next[swapTarget.routineIdx].exercises[swapTarget.exerciseIdx] = ex;
      return next;
    });
    setSwapTarget(null);
  }

  async function handleSavePlan() {
    if (!plan) return;
    setIsSaving(true);
    try {
      await api.post('/api/routines/generate', { savePlan: plan });
      router.replace('/workout');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar el plan de entrenamiento.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleShareSummary() {
    if (!plan) return;
    let text = `FITWE - PLAN DE ENTRENAMIENTO PERSONALIZADO\n\nObjetivo: ${goal}\nDías semanales: ${days}\nNivel: ${level}\n\n`;
    plan.forEach((routine) => {
      text += `RUTINA: ${routine.name}\n`;
      routine.exercises.forEach((ex) => {
        text += `- ${ex.name}: ${ex.sets} series x ${ex.reps} repeticiones (RIR ${ex.rir}, descanso: ${ex.descanso})\n`;
      });
      text += '\n';
    });
    Share.share({ message: text });
  }

  async function handleExportPdf() {
    if (!plan) return;
    setIsExportingPdf(true);
    try {
      const routinesHtml = plan
        .map(
          (routine) => `
          <h2>${routine.name}</h2>
          <table>
            <thead><tr><th>Ejercicio</th><th>Series</th><th>Reps</th><th>RIR</th><th>Tempo</th><th>Descanso</th></tr></thead>
            <tbody>
              ${routine.exercises
                .map(
                  (ex) => `<tr><td>${ex.name}</td><td>${ex.sets}</td><td>${ex.reps}</td><td>${ex.rir}</td><td>${ex.tempo}</td><td>${ex.descanso}</td></tr>`
                )
                .join('')}
            </tbody>
          </table>`
        )
        .join('');

      const html = `
        <html><head><meta charset="utf-8" /><style>
          body { font-family: Helvetica, Arial, sans-serif; padding: 24px; color: #0f172a; }
          h1 { color: #0891b2; font-size: 22px; margin-bottom: 2px; }
          h2 { font-size: 14px; margin-top: 24px; border-left: 3px solid #0891b2; padding-left: 8px; }
          p.subtitle { color: #64748b; font-size: 11px; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f1f5f9; text-align: left; padding: 6px; font-size: 9px; text-transform: uppercase; color: #475569; }
          td { padding: 6px; border-bottom: 1px solid #f1f5f9; font-size: 10px; }
        </style></head>
        <body>
          <h1>FitWe</h1>
          <p class="subtitle">Plan de Entrenamiento Personalizado — ${days} días / semana</p>
          ${routinesHtml}
        </body></html>`;

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Plan de Entrenamiento FitWe' });
      }
    } catch {
      Alert.alert('Error', 'No se pudo exportar el PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  }

  const canAdvanceStep2 = repeatsNeeded.count === repeats.length;
  const swapCandidates = swapTarget
    ? catalog.filter((c) => c.muscleGroup.toLowerCase() === plan?.[swapTarget.routineIdx].exercises[swapTarget.exerciseIdx].muscleGroup.toLowerCase())
    : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
        <View style={{ height: 38, width: 38, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={18} color={colors.primaryAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>Generador de Rutina Automática</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>Configura tu perfil para generar rutinas al instante</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, backgroundColor: colors.surfaceAlt, borderRadius: 999 }}>
          <X size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Stepper */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
        {[1, 2, 3, 4].map((s) => (
          <View
            key={s}
            style={{
              height: 6,
              width: 32,
              borderRadius: 3,
              backgroundColor: setupStep >= s ? colors.primary : colors.surfaceAlt,
            }}
          />
        ))}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center' }}>Diseñando tu plan de entrenamiento personalizado...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
          <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.textPrimary }}>Error</Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center' }}>{error}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={handleGenerate} style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Volver a intentar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} style={{ borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 13 }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8 }}>
            {setupStep === 1 && (
              <View style={{ gap: 20 }}>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 10 }}>
                    ¿Cuántos días a la semana quieres entrenar?
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[2, 3, 4, 5].map((d) => (
                      <TouchableOpacity
                        key={d}
                        onPress={() => setDays(d)}
                        style={{ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: days === d ? colors.primary : colors.surface, borderWidth: 1, borderColor: days === d ? colors.primary : colors.border }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: days === d ? '#fff' : colors.textSecondary }}>{d} días</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 10 }}>Objetivo Principal</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {GOALS.map((g) => (
                      <OptionCard key={g.id} label={g.label} desc={g.desc} active={goal === g.id} onPress={() => setGoal(g.id)} colors={colors} />
                    ))}
                  </View>
                </View>
              </View>
            )}

            {setupStep === 2 && (
              <View style={{ gap: 20 }}>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 10 }}>Nivel de Experiencia</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {LEVELS.map((lvl) => (
                      <OptionCard key={lvl.id} label={lvl.label} desc={lvl.desc} active={level === lvl.id} onPress={() => setLevel(lvl.id)} colors={colors} />
                    ))}
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 10 }}>Organización del Entrenamiento</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {SPLITS.map((spl) => (
                      <OptionCard key={spl.id} label={spl.label} desc={spl.desc} active={split === spl.id} onPress={() => setSplit(spl.id)} colors={colors} />
                    ))}
                  </View>
                </View>

                {repeatsNeeded.count > 0 && (
                  <View style={{ backgroundColor: colors.primarySoft, borderRadius: 16, padding: 14 }}>
                    <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 10 }}>
                      Elige qué sesión(es) repetir ({repeatsNeeded.count} {repeatsNeeded.count === 1 ? 'día' : 'días'})
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {repeatsNeeded.options.map((option) => {
                        const selected = repeats.includes(option);
                        return (
                          <TouchableOpacity
                            key={option}
                            onPress={() => toggleRepeat(option, repeatsNeeded.count)}
                            style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: selected ? colors.primary : colors.surface, borderWidth: 1, borderColor: selected ? colors.primary : colors.border }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: selected ? '#fff' : colors.textSecondary }}>{repeatLabel(option)}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}

            {setupStep === 3 && (
              <View style={{ gap: 22 }}>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 10 }}>
                    Puntos a priorizar (puntos débiles)
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {PRIORITY_GROUPS.map((g) => {
                      const selected = priorities.includes(g);
                      return <Chip key={g} label={g} active={selected} activeColor={colors.primary} onPress={() => togglePriority(g)} colors={colors} />;
                    })}
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 10 }}>
                    Molestias o Limitaciones Articulares
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {INJURIES.map((l) => {
                      const selected = injuries.includes(l.id);
                      return <Chip key={l.id} label={l.label} active={selected} activeColor="#ef4444" onPress={() => toggleInjury(l.id)} colors={colors} />;
                    })}
                  </View>
                  {injuries.length > 0 && !injuries.includes('ninguna') && (
                    <Text style={{ fontSize: 11, color: '#d97706', marginTop: 10, lineHeight: 16 }}>
                      ⚠️ El motor excluirá ejercicios lesivos de esas zonas y asignará alternativas articulares amigables.
                    </Text>
                  )}
                </View>
              </View>
            )}

            {setupStep === 4 && plan && (
              <View style={{ gap: 16 }}>
                <View style={{ alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)', borderRadius: 18, padding: 16, gap: 6 }}>
                  <View style={{ backgroundColor: '#10b981', padding: 8, borderRadius: 999 }}>
                    <Check size={16} color="#fff" />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#10b981', textAlign: 'center' }}>¡Plan de entrenamiento generado con éxito!</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center' }}>Se han creado {plan.length} rutinas adaptadas a tu perfil.</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={handleExportPdf}
                    disabled={isExportingPdf}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}
                  >
                    {isExportingPdf ? <ActivityIndicator size="small" color={colors.textSecondary} /> : <Download size={14} color={colors.textSecondary} />}
                    <Text style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 12 }}>Exportar PDF</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleShareSummary}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}
                  >
                    <Share2 size={14} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 12 }}>Compartir</Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 10, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase' }}>
                  Resumen (puedes personalizar los ejercicios)
                </Text>

                {plan.map((routine, rIdx) => (
                  <View key={rIdx} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14 }}>
                    <TextInput
                      value={routine.name}
                      onChangeText={(v) => renameRoutine(rIdx, v)}
                      style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8, marginBottom: 10 }}
                    />
                    <View style={{ gap: 12 }}>
                      {routine.exercises.map((ex: GeneratedExercise, eIdx: number) => (
                        <View key={eIdx} style={{ borderTopWidth: eIdx > 0 ? 1 : 0, borderTopColor: colors.borderLight, paddingTop: eIdx > 0 ? 10 : 0 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                            <TouchableOpacity
                              onPress={() => setSwapTarget({ routineIdx: rIdx, exerciseIdx: eIdx })}
                              style={{ flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }}
                            >
                              <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textPrimary }} numberOfLines={1}>
                                {ex.name}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => deleteExercise(rIdx, eIdx)} style={{ padding: 6 }}>
                              <X size={15} color={colors.textMuted} />
                            </TouchableOpacity>
                          </View>

                          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                            <Stepper label={`${ex.sets} Ser`} onDecrement={() => updateSets(rIdx, eIdx, -1)} onIncrement={() => updateSets(rIdx, eIdx, 1)} colors={colors} />
                            <Stepper label={`${ex.reps} Rep`} onDecrement={() => updateReps(rIdx, eIdx, -1)} onIncrement={() => updateReps(rIdx, eIdx, 1)} colors={colors} />
                          </View>

                          <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 6, fontStyle: 'italic' }}>{ex.justificacion}</Text>
                          <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 4 }}>
                            Tempo: {ex.tempo} · Descanso: {ex.descanso} · RIR {ex.rir}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Footer Navigation */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderTopColor: colors.border }}>
            {setupStep === 1 ? (
              <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 12 }}>Cancelar</Text>
              </TouchableOpacity>
            ) : setupStep < 4 ? (
              <TouchableOpacity
                onPress={() => setSetupStep((s) => s - 1)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}
              >
                <ArrowLeft size={14} color={colors.textPrimary} />
                <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 12 }}>Atrás</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}

            {setupStep === 1 || setupStep === 2 ? (
              <TouchableOpacity
                onPress={() => setSetupStep((s) => s + 1)}
                disabled={setupStep === 2 && !canAdvanceStep2}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 14,
                  backgroundColor: colors.textPrimary,
                  opacity: setupStep === 2 && !canAdvanceStep2 ? 0.5 : 1,
                }}
              >
                <Text style={{ color: colors.background, fontWeight: 'bold', fontSize: 12 }}>Siguiente</Text>
                <ArrowRight size={14} color={colors.background} />
              </TouchableOpacity>
            ) : setupStep === 3 ? (
              <TouchableOpacity
                onPress={handleGenerate}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.primary }}
              >
                <Sparkles size={14} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Generar Rutinas</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSavePlan}
                disabled={isSaving}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.textPrimary, opacity: isSaving ? 0.7 : 1 }}
              >
                {isSaving && <ActivityIndicator size="small" color={colors.background} />}
                <Text style={{ color: colors.background, fontWeight: 'bold', fontSize: 12 }}>Confirmar y Guardar</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* Swap Exercise Modal */}
      <Modal visible={!!swapTarget} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '70%', borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary }}>Cambiar Ejercicio</Text>
              <TouchableOpacity onPress={() => setSwapTarget(null)} style={{ padding: 6, backgroundColor: colors.surfaceAlt, borderRadius: 999 }}>
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
              {swapCandidates.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => swapExercise(c)}
                  style={{ padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSunken }}
                >
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary }}>{c.name}</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                    {c.muscleGroup}
                    {c.equipment ? ` • ${c.equipment}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function OptionCard({ label, desc, active, onPress, colors }: { label: string; desc: string; active: boolean; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: '47%',
        padding: 12,
        borderRadius: 16,
        backgroundColor: active ? colors.primarySoft : colors.surface,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        minHeight: 64,
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary }}>{label}</Text>
      <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{desc}</Text>
    </TouchableOpacity>
  );
}

function Chip({ label, active, activeColor, onPress, colors }: { label: string; active: boolean; activeColor: string; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: active ? activeColor : colors.surface,
        borderWidth: 1,
        borderColor: active ? activeColor : colors.border,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: 'bold', color: active ? '#fff' : colors.textSecondary }}>{label}</Text>
    </TouchableOpacity>
  );
}

function Stepper({ label, onDecrement, onIncrement, colors }: { label: string; onDecrement: () => void; onIncrement: () => void; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surfaceAlt, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 4 }}>
      <TouchableOpacity onPress={onDecrement} style={{ padding: 4 }}>
        <Minus size={12} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.textPrimary, minWidth: 40, textAlign: 'center' }}>{label}</Text>
      <TouchableOpacity onPress={onIncrement} style={{ padding: 4 }}>
        <Plus size={12} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}
