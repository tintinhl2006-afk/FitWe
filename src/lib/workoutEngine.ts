export interface WorkoutPreference {
  days: number;
  level: "principiante" | "intermedio" | "avanzado" | "muy_avanzado";
  split: "torso_pierna" | "ppl" | "full_body" | "auto";
  priorities: string[];
  injuries: string[];
  goal: "hipertrofia" | "fuerza" | "recomposicion" | "perdida_grasa" | "rendimiento";
  nutrition: string;
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

export function generateWorkoutPlan(
  pref: WorkoutPreference,
  dbExercises: DbExercise[]
): GeneratedRoutine[] {
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
  else if (pref.level === "intermedio") targetSets = 3; // some 4, some 3
  else targetSets = 4; // Avanzado / muy avanzado

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
      if (excludeList.includes(ex.name)) return false;
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

    // Sort compounds first or isolation first
    candidates.sort((a, b) => {
      const isACompound = a.name.includes("Banca") || a.name.includes("Sentadilla") || a.name.includes("Remo") || a.name.includes("Militar") || a.name.includes("Jalón") || a.name.includes("Prensa") || a.name.includes("Thrust");
      const isBCompound = b.name.includes("Banca") || b.name.includes("Sentadilla") || b.name.includes("Remo") || b.name.includes("Militar") || b.name.includes("Jalón") || b.name.includes("Prensa") || b.name.includes("Thrust");
      
      if (isCompound) {
        return isACompound === isBCompound ? 0 : isACompound ? -1 : 1;
      } else {
        return isACompound === isBCompound ? 0 : isACompound ? 1 : -1;
      }
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
    const finalSets = customSets || targetSets;
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
    // Maximum 3 routines
    const routinesToGen = Math.min(pref.days, 3);
    for (let day = 1; day <= routinesToGen; day++) {
      const routineExercises: GeneratedExercise[] = [];
      const ex1 = pickExercise("Pierna", true, [], usedExerciseIds);
      if (ex1) {
        usedExerciseIds.add(ex1.id);
        routineExercises.push(createExerciseEntry(ex1, targetSets, targetRepsRange, targetReps, rir, "3 min"));
      }

      const ex2 = pickExercise("Pecho", true, [], usedExerciseIds);
      if (ex2) {
        usedExerciseIds.add(ex2.id);
        routineExercises.push(createExerciseEntry(ex2, targetSets, targetRepsRange, targetReps, rir, "2.5 min"));
      }

      const ex3 = pickExercise("Espalda", true, [], usedExerciseIds);
      if (ex3) {
        usedExerciseIds.add(ex3.id);
        routineExercises.push(createExerciseEntry(ex3, targetSets, targetRepsRange, targetReps, rir, "2.5 min"));
      }

      const ex4 = pickExercise("Hombro", false, [], usedExerciseIds);
      if (ex4) {
        usedExerciseIds.add(ex4.id);
        routineExercises.push(createExerciseEntry(ex4, 3, "10-12", 10, rir + 1, "1.5 min"));
      }

      // Add Arms or Core alternately
      if (day % 2 === 1) {
        const exArm = pickExercise("Brazo", false, [], usedExerciseIds);
        if (exArm) {
          usedExerciseIds.add(exArm.id);
          routineExercises.push(createExerciseEntry(exArm, 3, "10-12", 12, rir, "1.5 min"));
        }
      } else {
        const exCore = pickExercise("Core", false, [], usedExerciseIds);
        if (exCore) {
          usedExerciseIds.add(exCore.id);
          routineExercises.push(createExerciseEntry(exCore, 3, "12-15", 15, rir + 1, "1 min"));
        }
      }

      generatedRoutines.push({
        name: `Cuerpo Completo — Día ${day}`,
        exercises: routineExercises
      });
    }
  } else if (selectedSplit === "torso_pierna") {
    // Generate Torso & Pierna alternately up to target days count (max 4)
    const routinesToGen = Math.min(pref.days, 4);
    for (let day = 1; day <= routinesToGen; day++) {
      const isTorso = day % 2 === 1;
      const routineExercises: GeneratedExercise[] = [];

      if (isTorso) {
        // Pecho compound
        const ex1 = pickExercise("Pecho", true, [], usedExerciseIds);
        if (ex1) {
          usedExerciseIds.add(ex1.id);
          routineExercises.push(createExerciseEntry(ex1, targetSets, targetRepsRange, targetReps, rir, "3 min"));
        }
        // Espalda compound
        const ex2 = pickExercise("Espalda", true, [], usedExerciseIds);
        if (ex2) {
          usedExerciseIds.add(ex2.id);
          routineExercises.push(createExerciseEntry(ex2, targetSets, targetRepsRange, targetReps, rir, "2.5 min"));
        }
        // Hombro compound or isolation
        const ex3 = pickExercise("Hombro", false, [], usedExerciseIds);
        if (ex3) {
          usedExerciseIds.add(ex3.id);
          routineExercises.push(createExerciseEntry(ex3, 3, "10-12", 10, rir, "2 min"));
        }
        // Pecho secondary
        const ex4 = pickExercise("Pecho", false, [], usedExerciseIds);
        if (ex4) {
          usedExerciseIds.add(ex4.id);
          routineExercises.push(createExerciseEntry(ex4, 3, "10-12", 12, rir + 1, "1.5 min"));
        }
        // Espalda pull
        const ex5 = pickExercise("Espalda", false, [], usedExerciseIds);
        if (ex5) {
          usedExerciseIds.add(ex5.id);
          routineExercises.push(createExerciseEntry(ex5, 3, "10-12", 10, rir + 1, "1.5 min"));
        }
        // Arm exercise
        const ex6 = pickExercise("Brazo", false, [], usedExerciseIds);
        if (ex6) {
          usedExerciseIds.add(ex6.id);
          routineExercises.push(createExerciseEntry(ex6, 3, "12-15", 12, rir, "1.5 min"));
        }
      } else {
        // Pierna quad compound
        const ex1 = pickExercise("Pierna", true, [], usedExerciseIds);
        if (ex1) {
          usedExerciseIds.add(ex1.id);
          routineExercises.push(createExerciseEntry(ex1, targetSets, targetRepsRange, targetReps, rir, "3 min"));
        }
        // Pierna glute / ham focus
        const ex2 = pickExercise("Pierna", true, ["Sentadilla"], usedExerciseIds);
        if (ex2) {
          usedExerciseIds.add(ex2.id);
          routineExercises.push(createExerciseEntry(ex2, targetSets, targetRepsRange, targetReps, rir, "2.5 min"));
        }
        // Leg isolation
        const ex3 = pickExercise("Pierna", false, [], usedExerciseIds);
        if (ex3) {
          usedExerciseIds.add(ex3.id);
          routineExercises.push(createExerciseEntry(ex3, 3, "10-12", 12, rir, "1.5 min"));
        }
        // Core exercise
        const ex4 = pickExercise("Core", false, [], usedExerciseIds);
        if (ex4) {
          usedExerciseIds.add(ex4.id);
          routineExercises.push(createExerciseEntry(ex4, 3, "12-15", 15, rir + 1, "1 min"));
        }
      }

      generatedRoutines.push({
        name: isTorso ? `Torso — Día ${Math.ceil(day / 2)}` : `Pierna — Día ${Math.ceil(day / 2)}`,
        exercises: routineExercises
      });
    }
  } else if (selectedSplit === "ppl") {
    // Generate Empuje, Tirón, Piernas sequentially
    const routinesToGen = Math.min(pref.days, 3);
    const pplNames = ["Empuje (Pecho/Hombro/Tríceps)", "Tirón (Espalda/Bíceps)", "Pierna y Core"];

    for (let day = 0; day < routinesToGen; day++) {
      const routineExercises: GeneratedExercise[] = [];

      if (day === 0) {
        // EMPUJE
        const exPecho1 = pickExercise("Pecho", true, [], usedExerciseIds);
        if (exPecho1) {
          usedExerciseIds.add(exPecho1.id);
          routineExercises.push(createExerciseEntry(exPecho1, targetSets, targetRepsRange, targetReps, rir, "3 min"));
        }
        const exPecho2 = pickExercise("Pecho", false, [], usedExerciseIds);
        if (exPecho2) {
          usedExerciseIds.add(exPecho2.id);
          routineExercises.push(createExerciseEntry(exPecho2, 3, "10-12", 12, rir + 1, "1.5 min"));
        }
        const exHombro1 = pickExercise("Hombro", true, [], usedExerciseIds);
        if (exHombro1) {
          usedExerciseIds.add(exHombro1.id);
          routineExercises.push(createExerciseEntry(exHombro1, 3, "8-10", 8, rir, "2.5 min"));
        }
        const exHombro2 = pickExercise("Hombro", false, [], usedExerciseIds);
        if (exHombro2) {
          usedExerciseIds.add(exHombro2.id);
          routineExercises.push(createExerciseEntry(exHombro2, 3, "10-12", 12, rir + 1, "1.5 min"));
        }
        const exArm = pickExercise("Brazo", false, ["Curl"], usedExerciseIds); // Tríceps
        if (exArm) {
          usedExerciseIds.add(exArm.id);
          routineExercises.push(createExerciseEntry(exArm, 3, "10-12", 12, rir, "1.5 min"));
        }
      } else if (day === 1) {
        // TIRÓN
        const exEspalda1 = pickExercise("Espalda", true, [], usedExerciseIds);
        if (exEspalda1) {
          usedExerciseIds.add(exEspalda1.id);
          routineExercises.push(createExerciseEntry(exEspalda1, targetSets, targetRepsRange, targetReps, rir, "3 min"));
        }
        const exEspalda2 = pickExercise("Espalda", true, [], usedExerciseIds);
        if (exEspalda2) {
          usedExerciseIds.add(exEspalda2.id);
          routineExercises.push(createExerciseEntry(exEspalda2, 3, "10-12", 10, rir + 1, "2 min"));
        }
        const exHombroPost = pickExercise("Hombro", false, ["Press", "Elevaciones"], usedExerciseIds); // Face Pull
        if (exHombroPost) {
          usedExerciseIds.add(exHombroPost.id);
          routineExercises.push(createExerciseEntry(exHombroPost, 3, "12-15", 12, rir + 1, "1.5 min"));
        }
        const exBiceps1 = pickExercise("Brazo", false, ["Press", "Extensión"], usedExerciseIds); // Bíceps
        if (exBiceps1) {
          usedExerciseIds.add(exBiceps1.id);
          routineExercises.push(createExerciseEntry(exBiceps1, 3, "10-12", 10, rir, "1.5 min"));
        }
        const exBiceps2 = pickExercise("Brazo", false, ["Press", "Extensión", exBiceps1 ? exBiceps1.name : ""], usedExerciseIds);
        if (exBiceps2) {
          usedExerciseIds.add(exBiceps2.id);
          routineExercises.push(createExerciseEntry(exBiceps2, 3, "12-15", 12, rir + 1, "1.5 min"));
        }
      } else {
        // PIERNA
        const ex1 = pickExercise("Pierna", true, [], usedExerciseIds);
        if (ex1) {
          usedExerciseIds.add(ex1.id);
          routineExercises.push(createExerciseEntry(ex1, targetSets, targetRepsRange, targetReps, rir, "3 min"));
        }
        const ex2 = pickExercise("Pierna", true, ["Sentadilla"], usedExerciseIds);
        if (ex2) {
          usedExerciseIds.add(ex2.id);
          routineExercises.push(createExerciseEntry(ex2, targetSets, targetRepsRange, targetReps, rir, "2.5 min"));
        }
        const ex3 = pickExercise("Pierna", false, [], usedExerciseIds);
        if (ex3) {
          usedExerciseIds.add(ex3.id);
          routineExercises.push(createExerciseEntry(ex3, 3, "12-15", 12, rir, "1.5 min"));
        }
        const exCore = pickExercise("Core", false, [], usedExerciseIds);
        if (exCore) {
          usedExerciseIds.add(exCore.id);
          routineExercises.push(createExerciseEntry(exCore, 3, "12-15", 15, rir + 1, "1 min"));
        }
      }

      generatedRoutines.push({
        name: pplNames[day],
        exercises: routineExercises
      });
    }
  }

  return generatedRoutines;
}
