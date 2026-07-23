export interface WorkoutPreference {
  days: number;
  level: "principiante" | "intermedio" | "avanzado" | "muy_avanzado";
  split: "torso_pierna" | "ppl" | "full_body" | "auto";
  priorities: string[];
  injuries: string[];
  goal: "hipertrofia" | "fuerza" | "recomposicion" | "perdida_grasa" | "rendimiento";
  nutrition: string;
  repeats?: string[];
}

export interface GeneratedExercise {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  repsList: string;
  weight: number;
  rir: number;
  tempo: string;
  descanso: string;
  justificacion: string;
}

export interface GeneratedRoutine {
  name: string;
  exercises: GeneratedExercise[];
}

export interface DbExercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string | null;
  description: string | null;
}

// Hardcoded default fallback catalog in case DB query yields nothing
const FALLBACK_EXERCISES = [
  { id: "fb-bench", name: "Press de Banca", muscleGroup: "Pecho", equipment: "Barra" },
  { id: "fb-incbench", name: "Press de Banca Inclinado", muscleGroup: "Pecho", equipment: "Barra" },
  { id: "fb-dbpress", name: "Press con Mancuernas", muscleGroup: "Pecho", equipment: "Mancuernas" },
  { id: "fb-flys", name: "Aperturas con Mancuernas", muscleGroup: "Pecho", equipment: "Mancuernas" },
  { id: "fb-chestpress", name: "Press de Pecho en Máquina", muscleGroup: "Pecho", equipment: "Máquina" },
  { id: "fb-pullups", name: "Dominadas Pronas", muscleGroup: "Espalda", equipment: "Peso Corporal" },
  { id: "fb-latpulldown", name: "Jalón al Pecho", muscleGroup: "Espalda", equipment: "Polea" },
  { id: "fb-barbellrow", name: "Remo con Barra", muscleGroup: "Espalda", equipment: "Barra" },
  { id: "fb-onearmrow", name: "Remo con Mancuerna a 1 Mano", muscleGroup: "Espalda", equipment: "Mancuernas" },
  { id: "fb-girondarow", name: "Remo Gironda (Polea Baja)", muscleGroup: "Espalda", equipment: "Polea" },
  { id: "fb-deadlift", name: "Peso Muerto Clásico", muscleGroup: "Espalda", equipment: "Barra" },
  { id: "fb-overheadpress", name: "Press Militar de Pie", muscleGroup: "Hombro", equipment: "Barra" },
  { id: "fb-dboverheadpress", name: "Press de Hombro Sentado", muscleGroup: "Hombro", equipment: "Mancuernas" },
  { id: "fb-lateralraise", name: "Elevaciones Laterales", muscleGroup: "Hombro", equipment: "Mancuernas" },
  { id: "fb-facepull", name: "Face Pull", muscleGroup: "Hombro", equipment: "Polea" },
  { id: "fb-squat", name: "Sentadilla Libre", muscleGroup: "Pierna", equipment: "Barra" },
  { id: "fb-legpress", name: "Prensa de Piernas", muscleGroup: "Pierna", equipment: "Máquina" },
  { id: "fb-legextension", name: "Extensiones de Cuádriceps", muscleGroup: "Pierna", equipment: "Máquina" },
  { id: "fb-legcurl", name: "Curl Femoral Sentado", muscleGroup: "Pierna", equipment: "Máquina" },
  { id: "fb-hipthrust", name: "Hip Thrust (Empuje de Cadera)", muscleGroup: "Pierna", equipment: "Barra" },
  { id: "fb-ezcurl", name: "Curl con Barra EZ", muscleGroup: "Brazo", equipment: "Barra" },
  { id: "fb-dbcurl", name: "Curl de Bíceps Alterno", muscleGroup: "Brazo", equipment: "Mancuernas" },
  { id: "fb-hammercurl", name: "Curl Martillo", muscleGroup: "Brazo", equipment: "Mancuernas" },
  { id: "fb-frenchpress", name: "Press Francés", muscleGroup: "Brazo", equipment: "Barra" },
  { id: "fb-pushdowns", name: "Extensión de Tríceps con Cuerda", muscleGroup: "Brazo", equipment: "Polea" },
  { id: "fb-crunch", name: "Crunch Abdominal", muscleGroup: "Core", equipment: "Peso Corporal" },
  { id: "fb-plank", name: "Plancha Abdominal (Plank)", muscleGroup: "Core", equipment: "Peso Corporal" },
  { id: "fb-treadmill", name: "Cinta de Correr", muscleGroup: "Cardio", equipment: "Máquina" },
  { id: "fb-bike", name: "Bicicleta Estática", muscleGroup: "Cardio", equipment: "Máquina" }
];

const getEquipmentScore = (eq: string | null, level: string): number => {
  if (!eq) return 0;
  if (level === "principiante") {
    if (["Máquina", "Polea", "Peso Corporal"].includes(eq)) return 2;
    return 1;
  } else if (level === "avanzado" || level === "muy_avanzado") {
    if (["Barra", "Mancuernas"].includes(eq)) return 2;
    return 1;
  }
  return 1; // intermedio
};

function getTargetWeeklySets(muscleGroup: string, level: string, priorities: string[], goal: string): number {
  const isBig = ["Pecho", "Espalda", "Pierna"].includes(muscleGroup);
  let baseSets = 0;
  if (isBig) {
    if (level === "principiante") baseSets = 10;
    else if (level === "intermedio") baseSets = 14;
    else baseSets = 18; // avanzado o muy_avanzado
  } else {
    if (level === "principiante") baseSets = 8;
    else if (level === "intermedio") baseSets = 10;
    else baseSets = 14; // avanzado o muy_avanzado
  }

  // Adjust volume based on user goal (Science of volume regulation)
  if (goal === "fuerza") {
    baseSets = Math.round(baseSets * 0.7); // -30% for strength focus to allow higher intensity
  } else if (goal === "perdida_grasa") {
    baseSets = Math.round(baseSets * 0.85); // -15% for fat loss deficit recovery
  } else if (goal === "recomposicion") {
    baseSets = Math.round(baseSets * 0.9); // -10% for recomposition
  }

  // Priority adjustments
  if (priorities.includes(muscleGroup)) {
    baseSets += 4;
  } else if (priorities.length > 0) {
    baseSets -= 2;
  }

  return Math.max(4, baseSets); // Minimum 4 sets per week (MEV)
}

function getExerciseCountOuter(
  muscleGroup: string,
  frequency: number,
  level: string,
  priorities: string[],
  goal: string
): number {
  const targetWeeklySets = getTargetWeeklySets(muscleGroup, level, priorities, goal);
  // Cap at 10 sets/session to avoid junk volume
  const setsPerWorkout = Math.min(10, targetWeeklySets / frequency);

  if (setsPerWorkout <= 4) {
    return 1;
  } else if (setsPerWorkout <= 8) {
    return 2;
  } else {
    return 3;
  }
}

function getExerciseSetsOuter(
  muscleGroup: string,
  numExercises: number,
  frequency: number,
  level: string,
  priorities: string[],
  goal: string
): number[] {
  const targetWeeklySets = getTargetWeeklySets(muscleGroup, level, priorities, goal);
  // Cap at 10 sets/session to avoid junk volume
  const setsPerWorkout = Math.min(10, targetWeeklySets / frequency);

  let remainingSets = Math.round(setsPerWorkout);
  remainingSets = Math.max(numExercises * 2, remainingSets);

  const setsDistribution = Array(numExercises).fill(2);
  remainingSets -= numExercises * 2;

  for (let i = 0; i < numExercises && remainingSets > 0; i++) {
    const add = Math.min(2, remainingSets);
    setsDistribution[i] += add;
    remainingSets -= add;
  }

  for (let i = 0; i < numExercises && remainingSets > 0; i++) {
    setsDistribution[i] += 1;
    remainingSets -= 1;
  }

  return setsDistribution;
}

export function generateWorkoutPlan(
  pref: WorkoutPreference,
  dbExercises: DbExercise[]
): GeneratedRoutine[] {
  // Shadow helpers to inject goal parameter automatically
  const getExerciseCount = (muscleGroup: string, frequency: number, level: string, priorities: string[]) =>
    getExerciseCountOuter(muscleGroup, frequency, level, priorities, pref.goal);

  const getExerciseSets = (muscleGroup: string, numExercises: number, frequency: number, level: string, priorities: string[]) =>
    getExerciseSetsOuter(muscleGroup, numExercises, frequency, level, priorities, pref.goal);

  // Use DB exercises or fallback if none in DB
  const catalog: DbExercise[] = dbExercises.length > 0 
    ? dbExercises 
    : FALLBACK_EXERCISES.map(x => ({ id: x.id, name: x.name, muscleGroup: x.muscleGroup, equipment: x.equipment, description: null }));

  // 1. Resolve Split
  let selectedSplit: "full_body" | "torso_pierna" | "ppl" = "full_body";
  if (pref.split === "auto") {
    if (pref.days <= 2) selectedSplit = "full_body";
    else if (pref.days === 3) selectedSplit = "ppl";
    else selectedSplit = "torso_pierna";
  } else {
    selectedSplit = pref.split;
  }

  // 2. Resolve target sets/reps parameters
  let targetSets = 3;
  if (pref.level === "principiante") targetSets = 3;
  else if (pref.level === "intermedio") targetSets = 3; 
  else targetSets = 4;

  let targetRepsRange = "8-12";
  let targetReps = 10;
  if (pref.goal === "fuerza") {
    targetRepsRange = "5-6";
    targetReps = 6;
  } else if (pref.goal === "perdida_grasa") {
    targetRepsRange = "10-12";
    targetReps = 12;
  } else if (pref.goal === "rendimiento") {
    targetRepsRange = "8-10";
    targetReps = 8;
  }

  const rir = pref.goal === "fuerza" ? 2 : pref.level === "principiante" ? 2 : 1;

  // 3. Helper to pick an exercise with injury exclusions
  const pickExercise = (
    muscleGroup: string,
    isCompound: boolean,
    excludeList: string[],
    usedIds: Set<string>
  ): DbExercise | null => {
    // Determine strict exclusions based on user injuries
    const strictExcludedNames: string[] = [];
    if (pref.injuries.includes("hombro")) {
      strictExcludedNames.push("Press Militar de Pie", "Press de Banca");
    }
    if (pref.injuries.includes("rodilla")) {
      strictExcludedNames.push("Sentadilla Libre");
    }
    if (pref.injuries.includes("lumbar")) {
      strictExcludedNames.push("Peso Muerto Clásico", "Remo con Barra");
    }

    const candidates = catalog.filter(ex => {
      if (ex.muscleGroup !== muscleGroup) return false;
      if (usedIds.has(ex.id)) return false;
      if (excludeList.some(word => ex.name.toLowerCase().includes(word.toLowerCase()))) return false;
      if (strictExcludedNames.some(name => ex.name.toLowerCase().includes(name.toLowerCase()))) return false;
      return true;
    });

    if (candidates.length === 0) {
      // If all used, clear used for this muscle group
      const backupCandidates = catalog.filter(ex => {
        if (ex.muscleGroup !== muscleGroup) return false;
        if (strictExcludedNames.some(name => ex.name.toLowerCase().includes(name.toLowerCase()))) return false;
        return true;
      });
      return backupCandidates[0] || null;
    }

    // Sort candidates: compounds first/isolation first, and equipment based on user level
    candidates.sort((a, b) => {
      const isACompound = a.name.includes("Banca") || a.name.includes("Sentadilla") || a.name.includes("Remo") || a.name.includes("Militar") || a.name.includes("Jalón") || a.name.includes("Prensa") || a.name.includes("Thrust") || a.name.includes("Peso Muerto");
      const isBCompound = b.name.includes("Banca") || b.name.includes("Sentadilla") || b.name.includes("Remo") || b.name.includes("Militar") || b.name.includes("Jalón") || b.name.includes("Prensa") || b.name.includes("Thrust") || b.name.includes("Peso Muerto");
      
      const aCompMatch = isCompound ? isACompound : !isACompound;
      const bCompMatch = isCompound ? isBCompound : !isBCompound;

      if (aCompMatch !== bCompMatch) {
        return aCompMatch ? -1 : 1;
      }

      const scoreA = getEquipmentScore(a.equipment, pref.level);
      const scoreB = getEquipmentScore(b.equipment, pref.level);
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      return 0;
    });

    // Pick first matching
    return candidates[0] || null;
  };

  const generatedRoutines: GeneratedRoutine[] = [];
  const usedExerciseIds = new Set<string>();

  // Helper to compile a routine exercise
  const createExerciseEntry = (
    ex: DbExercise,
    customSets?: number,
    customRepsRange?: string,
    customRepsValue?: number,
    customRir?: number,
    customDescanso?: string
  ): GeneratedExercise => {
    const finalSets = customSets !== undefined ? customSets : targetSets;
    const finalRepsValue = customRepsValue || targetReps;
    const repsList = Array(finalSets).fill(finalRepsValue).join(",");
    const finalRir = customRir !== undefined ? customRir : rir;

    let justificacion = `Ejercicio óptimo para el desarrollo de ${ex.muscleGroup.toLowerCase()}.`;
    if (pref.priorities.includes(ex.muscleGroup)) {
      justificacion = `Añadido para dar prioridad a tu punto débil en ${ex.muscleGroup.toLowerCase()}.`;
    }
    if (pref.injuries.length > 0) {
      justificacion += ` Seleccionado por ser respetuoso con tus articulaciones declaradas.`;
    }

    return {
      exerciseId: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      sets: finalSets,
      reps: finalRepsValue,
      repsList,
      weight: 0,
      rir: finalRir,
      tempo: "3-0-1-0",
      descanso: customDescanso || "2 min",
      justificacion
    };
  };

  // 4. Generate routines based on Split & Days count
  if (selectedSplit === "full_body") {
    const routinesToGen = pref.days;

    const piernaCount = getExerciseCount("Pierna", routinesToGen, pref.level, pref.priorities);
    const piernaSets = getExerciseSets("Pierna", piernaCount, routinesToGen, pref.level, pref.priorities);

    const pechoCount = getExerciseCount("Pecho", routinesToGen, pref.level, pref.priorities);
    const pechoSets = getExerciseSets("Pecho", pechoCount, routinesToGen, pref.level, pref.priorities);

    const espaldaCount = getExerciseCount("Espalda", routinesToGen, pref.level, pref.priorities);
    const espaldaSets = getExerciseSets("Espalda", espaldaCount, routinesToGen, pref.level, pref.priorities);

    const hombroCount = getExerciseCount("Hombro", routinesToGen, pref.level, pref.priorities);
    const hombroSets = getExerciseSets("Hombro", hombroCount, routinesToGen, pref.level, pref.priorities);

    const brazoFreq = Math.max(1, Math.round(routinesToGen / 2));
    const brazoCount = getExerciseCount("Brazo", brazoFreq, pref.level, pref.priorities);
    const brazoSets = getExerciseSets("Brazo", brazoCount, brazoFreq, pref.level, pref.priorities);

    const coreFreq = Math.max(1, Math.round(routinesToGen / 2));
    const coreCount = getExerciseCount("Core", coreFreq, pref.level, pref.priorities);
    const coreSets = getExerciseSets("Core", coreCount, coreFreq, pref.level, pref.priorities);

    for (let day = 1; day <= routinesToGen; day++) {
      const routineExercises: GeneratedExercise[] = [];

      // Pierna
      for (let i = 0; i < piernaCount; i++) {
        const ex = pickExercise("Pierna", i === 0, [], usedExerciseIds);
        if (ex) {
          usedExerciseIds.add(ex.id);
          routineExercises.push(createExerciseEntry(ex, piernaSets[i], targetRepsRange, targetReps, rir, "3 min"));
        }
      }

      // Pecho
      for (let i = 0; i < pechoCount; i++) {
        const ex = pickExercise("Pecho", i === 0, [], usedExerciseIds);
        if (ex) {
          usedExerciseIds.add(ex.id);
          routineExercises.push(createExerciseEntry(ex, pechoSets[i], targetRepsRange, targetReps, rir, "2.5 min"));
        }
      }

      // Espalda
      for (let i = 0; i < espaldaCount; i++) {
        const ex = pickExercise("Espalda", i === 0, [], usedExerciseIds);
        if (ex) {
          usedExerciseIds.add(ex.id);
          routineExercises.push(createExerciseEntry(ex, espaldaSets[i], targetRepsRange, targetReps, rir, "2.5 min"));
        }
      }

      // Hombro
      for (let i = 0; i < hombroCount; i++) {
        const ex = pickExercise("Hombro", false, [], usedExerciseIds);
        if (ex) {
          usedExerciseIds.add(ex.id);
          routineExercises.push(createExerciseEntry(ex, hombroSets[i], "10-12", 10, rir + 1, "1.5 min"));
        }
      }

      // Alternate Brazo / Core
      if (day % 2 === 1) {
        for (let i = 0; i < brazoCount; i++) {
          const ex = pickExercise("Brazo", false, [], usedExerciseIds);
          if (ex) {
            usedExerciseIds.add(ex.id);
            routineExercises.push(createExerciseEntry(ex, brazoSets[i], "10-12", 12, rir, "1.5 min"));
          }
        }
      } else {
        for (let i = 0; i < coreCount; i++) {
          const ex = pickExercise("Core", false, [], usedExerciseIds);
          if (ex) {
            usedExerciseIds.add(ex.id);
            routineExercises.push(createExerciseEntry(ex, coreSets[i], "12-15", 15, rir + 1, "1 min"));
          }
        }
      }

      generatedRoutines.push({
        name: `Cuerpo Completo — Día ${day}`,
        exercises: routineExercises
      });
    }
  } else if (selectedSplit === "torso_pierna") {
    const routinesToGen = pref.days;
    
    const plannedDays: string[] = [];
    if (routinesToGen === 3) {
      const r1 = (pref.repeats && pref.repeats[0]) ? pref.repeats[0].toLowerCase() : "torso";
      plannedDays.push("torso", "pierna", r1);
    } else if (routinesToGen === 5) {
      const r1 = (pref.repeats && pref.repeats[0]) ? pref.repeats[0].toLowerCase() : "torso";
      plannedDays.push("torso", "pierna", "torso", "pierna", r1);
    } else {
      for (let i = 1; i <= routinesToGen; i++) {
        plannedDays.push(i % 2 === 1 ? "torso" : "pierna");
      }
    }

    const torsoFreq = plannedDays.filter(x => x === "torso").length;
    const piernaFreq = plannedDays.filter(x => x === "pierna").length;

    const pechoCount = getExerciseCount("Pecho", torsoFreq, pref.level, pref.priorities);
    const pechoSets = getExerciseSets("Pecho", pechoCount, torsoFreq, pref.level, pref.priorities);

    const espaldaCount = getExerciseCount("Espalda", torsoFreq, pref.level, pref.priorities);
    const espaldaSets = getExerciseSets("Espalda", espaldaCount, torsoFreq, pref.level, pref.priorities);

    const hombroCount = getExerciseCount("Hombro", torsoFreq, pref.level, pref.priorities);
    const hombroSets = getExerciseSets("Hombro", hombroCount, torsoFreq, pref.level, pref.priorities);

    const brazoCount = getExerciseCount("Brazo", torsoFreq, pref.level, pref.priorities);
    const brazoSets = getExerciseSets("Brazo", brazoCount, torsoFreq, pref.level, pref.priorities);

    const piernaCount = getExerciseCount("Pierna", piernaFreq, pref.level, pref.priorities);
    const piernaSets = getExerciseSets("Pierna", piernaCount, piernaFreq, pref.level, pref.priorities);

    const coreCount = getExerciseCount("Core", piernaFreq, pref.level, pref.priorities);
    const coreSets = getExerciseSets("Core", coreCount, piernaFreq, pref.level, pref.priorities);

    let torsoCountNum = 0;
    let piernaCountNum = 0;

    plannedDays.forEach((type) => {
      const isTorso = type === "torso";
      if (isTorso) torsoCountNum++;
      else piernaCountNum++;

      const routineExercises: GeneratedExercise[] = [];

      if (isTorso) {
        // Pecho
        for (let i = 0; i < pechoCount; i++) {
          const ex = pickExercise("Pecho", i === 0, [], usedExerciseIds);
          if (ex) {
            usedExerciseIds.add(ex.id);
            routineExercises.push(createExerciseEntry(ex, pechoSets[i], targetRepsRange, targetReps, rir, i === 0 ? "3 min" : "2 min"));
          }
        }
        // Espalda
        for (let i = 0; i < espaldaCount; i++) {
          const ex = pickExercise("Espalda", i === 0, [], usedExerciseIds);
          if (ex) {
            usedExerciseIds.add(ex.id);
            routineExercises.push(createExerciseEntry(ex, espaldaSets[i], targetRepsRange, targetReps, rir, i === 0 ? "2.5 min" : "1.5 min"));
          }
        }
        // Hombro
        for (let i = 0; i < hombroCount; i++) {
          const ex = pickExercise("Hombro", false, [], usedExerciseIds);
          if (ex) {
            usedExerciseIds.add(ex.id);
            routineExercises.push(createExerciseEntry(ex, hombroSets[i], "10-12", 10, rir, "2 min"));
          }
        }
        // Brazo
        for (let i = 0; i < brazoCount; i++) {
          const ex = pickExercise("Brazo", false, [], usedExerciseIds);
          if (ex) {
            usedExerciseIds.add(ex.id);
            routineExercises.push(createExerciseEntry(ex, brazoSets[i], "12-15", 12, rir, "1.5 min"));
          }
        }
      } else {
        // Pierna
        for (let i = 0; i < piernaCount; i++) {
          const ex = pickExercise("Pierna", i === 0, i === 0 ? [] : ["Sentadilla"], usedExerciseIds);
          if (ex) {
            usedExerciseIds.add(ex.id);
            routineExercises.push(createExerciseEntry(ex, piernaSets[i], targetRepsRange, targetReps, rir, i === 0 ? "3 min" : "2.5 min"));
          }
        }
        // Core
        for (let i = 0; i < coreCount; i++) {
          const ex = pickExercise("Core", false, [], usedExerciseIds);
          if (ex) {
            usedExerciseIds.add(ex.id);
            routineExercises.push(createExerciseEntry(ex, coreSets[i], "12-15", 15, rir + 1, "1 min"));
          }
        }
      }

      generatedRoutines.push({
        name: isTorso ? `Torso — Día ${torsoCountNum}` : `Pierna — Día ${piernaCountNum}`,
        exercises: routineExercises
      });
    });
  } else if (selectedSplit === "ppl") {
    const routinesToGen = pref.days;
    const pplNames = {
      empuje: "Empuje (Pecho/Hombro/Tríceps)",
      tiron: "Tirón (Espalda/Bíceps)",
      pierna: "Pierna y Core"
    };

    const plannedDays: string[] = [];
    if (routinesToGen === 4) {
      const r1 = (pref.repeats && pref.repeats[0]) ? pref.repeats[0].toLowerCase() : "empuje";
      plannedDays.push("empuje", "tiron", "pierna", r1);
    } else if (routinesToGen === 5) {
      const r1 = (pref.repeats && pref.repeats[0]) ? pref.repeats[0].toLowerCase() : "empuje";
      const r2 = (pref.repeats && pref.repeats[1]) ? pref.repeats[1].toLowerCase() : "tiron";
      plannedDays.push("empuje", "tiron", "pierna", r1, r2);
    } else {
      for (let i = 0; i < routinesToGen; i++) {
        plannedDays.push(i === 0 ? "empuje" : i === 1 ? "tiron" : "pierna");
      }
    }

    const empujeFreq = plannedDays.filter(x => x === "empuje").length;
    const tironFreq = plannedDays.filter(x => x === "tiron").length;
    const piernaFreq = plannedDays.filter(x => x === "pierna").length;

    // Empuje volumes
    const pechoCount = getExerciseCount("Pecho", empujeFreq, pref.level, pref.priorities);
    const pechoSets = getExerciseSets("Pecho", pechoCount, empujeFreq, pref.level, pref.priorities);
    const hombroEmpujeCount = getExerciseCount("Hombro", empujeFreq, pref.level, pref.priorities);
    const hombroEmpujeSets = getExerciseSets("Hombro", hombroEmpujeCount, empujeFreq, pref.level, pref.priorities);
    const brazoEmpujeCount = getExerciseCount("Brazo", empujeFreq, pref.level, pref.priorities);
    const brazoEmpujeSets = getExerciseSets("Brazo", brazoEmpujeCount, empujeFreq, pref.level, pref.priorities);

    // Tirón volumes
    const espaldaCount = getExerciseCount("Espalda", tironFreq, pref.level, pref.priorities);
    const espaldaSets = getExerciseSets("Espalda", espaldaCount, tironFreq, pref.level, pref.priorities);
    const hombroTironCount = Math.max(1, Math.round(getExerciseCount("Hombro", tironFreq, pref.level, pref.priorities) / 2));
    const hombroTironSets = getExerciseSets("Hombro", hombroTironCount, tironFreq, pref.level, pref.priorities);
    const brazoTironCount = getExerciseCount("Brazo", tironFreq, pref.level, pref.priorities);
    const brazoTironSets = getExerciseSets("Brazo", brazoTironCount, tironFreq, pref.level, pref.priorities);

    // Pierna volumes
    const piernaCount = getExerciseCount("Pierna", piernaFreq, pref.level, pref.priorities);
    const piernaSets = getExerciseSets("Pierna", piernaCount, piernaFreq, pref.level, pref.priorities);
    const coreCount = getExerciseCount("Core", piernaFreq, pref.level, pref.priorities);
    const coreSets = getExerciseSets("Core", coreCount, piernaFreq, pref.level, pref.priorities);

    const counts = { empuje: 0, tiron: 0, pierna: 0 };

    plannedDays.forEach((type) => {
      counts[type as "empuje" | "tiron" | "pierna"]++;
      const routineExercises: GeneratedExercise[] = [];

      if (type === "empuje") {
        // Pecho
        for (let i = 0; i < pechoCount; i++) {
          const ex = pickExercise("Pecho", i === 0, [], usedExerciseIds);
          if (ex) {
            usedExerciseIds.add(ex.id);
            routineExercises.push(createExerciseEntry(ex, pechoSets[i], targetRepsRange, targetReps, rir, i === 0 ? "3 min" : "1.5 min"));
          }
        }
        // Hombro (Push)
        for (let i = 0; i < hombroEmpujeCount; i++) {
          const ex = pickExercise("Hombro", i === 0, [], usedExerciseIds);
          if (ex) {
            usedExerciseIds.add(ex.id);
            routineExercises.push(createExerciseEntry(ex, hombroEmpujeSets[i], i === 0 ? "8-10" : "10-12", i === 0 ? 8 : 12, rir, i === 0 ? "2.5 min" : "1.5 min"));
          }
        }
        // Brazo (Tríceps) - Exclude Curl
        for (let i = 0; i < brazoEmpujeCount; i++) {
          const ex = pickExercise("Brazo", false, ["Curl"], usedExerciseIds);
          if (ex) {
            usedExerciseIds.add(ex.id);
            routineExercises.push(createExerciseEntry(ex, brazoEmpujeSets[i], "10-12", 12, rir, "1.5 min"));
          }
        }
      } else if (type === "tiron") {
        // Espalda
        for (let i = 0; i < espaldaCount; i++) {
          const ex = pickExercise("Espalda", true, [], usedExerciseIds);
          if (ex) {
            usedExerciseIds.add(ex.id);
            routineExercises.push(createExerciseEntry(ex, espaldaSets[i], targetRepsRange, targetReps, rir, i === 0 ? "3 min" : "2 min"));
          }
        }
        // Hombro (Posterior) - Exclude Press, Elevaciones
        for (let i = 0; i < hombroTironCount; i++) {
          const ex = pickExercise("Hombro", false, ["Press", "Elevaciones"], usedExerciseIds);
          if (ex) {
            usedExerciseIds.add(ex.id);
            routineExercises.push(createExerciseEntry(ex, hombroTironSets[i], "12-15", 12, rir + 1, "1.5 min"));
          }
        }
        // Brazo (Bíceps) - Exclude Press, Extensión
        for (let i = 0; i < brazoTironCount; i++) {
          const ex = pickExercise("Brazo", false, ["Press", "Extensión"], usedExerciseIds);
          if (ex) {
            usedExerciseIds.add(ex.id);
            routineExercises.push(createExerciseEntry(ex, brazoTironSets[i], "10-12", 10, rir, "1.5 min"));
          }
        }
      } else {
        // Pierna
        for (let i = 0; i < piernaCount; i++) {
          const ex = pickExercise("Pierna", i === 0, i === 0 ? [] : ["Sentadilla"], usedExerciseIds);
          if (ex) {
            usedExerciseIds.add(ex.id);
            routineExercises.push(createExerciseEntry(ex, piernaSets[i], targetRepsRange, targetReps, rir, i === 0 ? "3 min" : "2.5 min"));
          }
        }
        // Core
        for (let i = 0; i < coreCount; i++) {
          const ex = pickExercise("Core", false, [], usedExerciseIds);
          if (ex) {
            usedExerciseIds.add(ex.id);
            routineExercises.push(createExerciseEntry(ex, coreSets[i], "12-15", 15, rir + 1, "1 min"));
          }
        }
      }

      const cycle = counts[type as "empuje" | "tiron" | "pierna"];
      generatedRoutines.push({
        name: `${pplNames[type as "empuje" | "tiron" | "pierna"]}${routinesToGen > 3 ? ` — Sesión ${cycle}` : ""}`,
        exercises: routineExercises
      });
    });
  }

  return generatedRoutines;
}
