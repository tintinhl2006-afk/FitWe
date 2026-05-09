import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const curatedExercises = [
  // PECHO
  { name: 'Press de Banca', primaryMuscle: 'Pecho', equipment: 'Barra', description: 'Ejercicio básico para el pectoral. Acuéstate en el banco, agarra la barra a una anchura ligeramente superior a los hombros y bájala hasta rozar el pecho medio.' },
  { name: 'Press de Banca Inclinado', primaryMuscle: 'Pecho', equipment: 'Barra', description: 'Enfocado en el haz clavicular (pecho superior). Banco a 30-45 grados. Baja la barra hasta la parte alta del pecho.' },
  { name: 'Press de Banca Declinado', primaryMuscle: 'Pecho', equipment: 'Barra', description: 'Enfocado en la porción inferior del pectoral. Banco declinado. Baja la barra hasta la parte baja del esternón.' },
  { name: 'Press con Mancuernas', primaryMuscle: 'Pecho', equipment: 'Mancuernas', description: 'Permite mayor rango de recorrido que la barra. Junta las mancuernas arriba sin que lleguen a chocar.' },
  { name: 'Press Inclinado con Mancuernas', primaryMuscle: 'Pecho', equipment: 'Mancuernas', description: 'Ideal para hipertrofia del pecho superior. Controla la bajada para sentir el estiramiento.' },
  { name: 'Aperturas con Mancuernas', primaryMuscle: 'Pecho', equipment: 'Mancuernas', description: 'Movimiento de aislamiento. Mantén una ligera flexión de codo y abre los brazos como si fueras a dar un abrazo.' },
  { name: 'Aperturas Inclinadas', primaryMuscle: 'Pecho', equipment: 'Mancuernas', description: 'Aislamiento para el pecho superior. No bajes excesivamente para proteger el hombro.' },
  { name: 'Cruce de Poleas Alto', primaryMuscle: 'Pecho', equipment: 'Polea', description: 'Tira de las poleas desde arriba hacia el centro de tu cadera. Excelente para el pecho inferior.' },
  { name: 'Cruce de Poleas Medio', primaryMuscle: 'Pecho', equipment: 'Polea', description: 'Tira de las poleas a la altura de tu pecho. Gran contracción máxima.' },
  { name: 'Cruce de Poleas Bajo', primaryMuscle: 'Pecho', equipment: 'Polea', description: 'Desde las poleas bajas, eleva los brazos hacia el pecho superior.' },
  { name: 'Peck Deck (Contracción Pectoral)', primaryMuscle: 'Pecho', equipment: 'Máquina', description: 'Máquina guiada para aislar el pectoral sin requerir estabilización.' },
  { name: 'Press de Pecho en Máquina', primaryMuscle: 'Pecho', equipment: 'Máquina', description: 'Versión guiada del press. Ideal para llegar al fallo muscular con seguridad.' },
  { name: 'Fondos en Paralelas', primaryMuscle: 'Pecho', equipment: 'Peso Corporal', description: 'Inclina el torso hacia adelante para enfatizar el trabajo en el pectoral.' },
  { name: 'Flexiones (Push-ups)', primaryMuscle: 'Pecho', equipment: 'Peso Corporal', description: 'Ejercicio clásico de peso corporal. Mantén el core apretado y baja hasta rozar el suelo.' },
  { name: 'Pullover con Mancuerna', primaryMuscle: 'Pecho', equipment: 'Mancuernas', description: 'Trabaja el pecho y la espalda (dorsal). Cruza el banco perpendicularmente.' },

  // ESPALDA
  { name: 'Dominadas Prinas', primaryMuscle: 'Espalda', equipment: 'Peso Corporal', description: 'Agarre ancho. Sube hasta pasar la barbilla por encima de la barra.' },
  { name: 'Dominadas Supinas (Chin-ups)', primaryMuscle: 'Espalda', equipment: 'Peso Corporal', description: 'Agarre invertido (palmas hacia ti). Involucra más fuertemente el bíceps.' },
  { name: 'Jalón al Pecho', primaryMuscle: 'Espalda', equipment: 'Polea', description: 'Tira de la barra hacia la clavícula retrayendo las escápulas. No te balancees excesivamente.' },
  { name: 'Jalón con Triángulo', primaryMuscle: 'Espalda', equipment: 'Polea', description: 'Agarre estrecho y neutro. Mayor enfoque en el dorsal ancho inferior.' },
  { name: 'Remo con Barra', primaryMuscle: 'Espalda', equipment: 'Barra', description: 'Inclina el torso a unos 45 grados. Lleva la barra hacia tu ombligo.' },
  { name: 'Remo Pendlay', primaryMuscle: 'Espalda', equipment: 'Barra', description: 'Torso paralelo al suelo. La barra descansa en el suelo en cada repetición. Pura fuerza.' },
  { name: 'Remo en Punta (T-Bar)', primaryMuscle: 'Espalda', equipment: 'Barra', description: 'Usa una barra anclada en una esquina o máquina específica. Tira hacia el estómago.' },
  { name: 'Remo con Mancuerna a 1 Mano', primaryMuscle: 'Espalda', equipment: 'Mancuernas', description: 'Apoya una rodilla y mano en un banco. Tira de la mancuerna llevando el codo hacia la cadera.' },
  { name: 'Remo Gironda (Polea Baja)', primaryMuscle: 'Espalda', equipment: 'Polea', description: 'Sentado en el suelo, tira del triángulo hacia el estómago manteniendo la espalda neutra.' },
  { name: 'Remo en Máquina', primaryMuscle: 'Espalda', equipment: 'Máquina', description: 'Remo soportado en el pecho, aísla la espalda al eliminar el trabajo del lumbar.' },
  { name: 'Pullover en Polea Alta', primaryMuscle: 'Espalda', equipment: 'Polea', description: 'Brazos semiflexionados. Lleva la barra recta desde arriba hasta tus muslos aislando el dorsal.' },
  { name: 'Peso Muerto Clásico', primaryMuscle: 'Espalda', equipment: 'Barra', description: 'Levanta el peso desde el suelo con espalda recta. Trabaja cadena posterior completa.' },
  { name: 'Peso Muerto Sumo', primaryMuscle: 'Espalda', equipment: 'Barra', description: 'Postura abierta de piernas. Reduce la tensión lumbar comparado con el clásico.' },
  { name: 'Hiperextensiones', primaryMuscle: 'Espalda', equipment: 'Peso Corporal', description: 'En banco romano. Enfocado en los erectores espinales (zona lumbar).' },
  
  // HOMBRO
  { name: 'Press Militar de Pie', primaryMuscle: 'Hombro', equipment: 'Barra', description: 'Empuje vertical por excelencia. Aprieta glúteos y core para no arquear la espalda.' },
  { name: 'Press de Hombro Sentado', primaryMuscle: 'Hombro', equipment: 'Mancuernas', description: 'Sentado con banco a 90 grados. Empuja las mancuernas por encima de la cabeza.' },
  { name: 'Press Arnold', primaryMuscle: 'Hombro', equipment: 'Mancuernas', description: 'Variante que incluye rotación de muñeca. Involucra las tres cabezas del deltoides.' },
  { name: 'Elevaciones Laterales', primaryMuscle: 'Hombro', equipment: 'Mancuernas', description: 'Aislamiento clave para la anchura de hombros. Eleva los codos ligeramente por delante del torso.' },
  { name: 'Elevaciones Laterales en Polea', primaryMuscle: 'Hombro', equipment: 'Polea', description: 'Mantiene tensión constante en todo el recorrido. Cruza el cable por detrás o delante.' },
  { name: 'Elevaciones Frontales', primaryMuscle: 'Hombro', equipment: 'Mancuernas', description: 'Levanta el peso hacia el frente hasta la altura de los ojos.' },
  { name: 'Pájaros (Elevaciones Posteriores)', primaryMuscle: 'Hombro', equipment: 'Mancuernas', description: 'Torso inclinado hacia adelante. Abre los brazos para aislar el deltoides posterior.' },
  { name: 'Pájaros en Máquina (Peck Deck Inverso)', primaryMuscle: 'Hombro', equipment: 'Máquina', description: 'Siéntate al revés en la máquina de pecho y abre hacia atrás.' },
  { name: 'Face Pull', primaryMuscle: 'Hombro', equipment: 'Polea', description: 'Usa la cuerda en polea alta y tira hacia tu cara, separando las manos al final.' },
  { name: 'Remo al Cuello (Upright Row)', primaryMuscle: 'Hombro', equipment: 'Barra', description: 'Agarre a la anchura de los hombros, tira de la barra hacia la barbilla levantando los codos.' },
  { name: 'Encogimientos (Shrugs)', primaryMuscle: 'Hombro', equipment: 'Barra', description: 'Ejercicio para trapecios. Encoge los hombros hacia las orejas sin rotar.' },
  { name: 'Encogimientos con Mancuernas', primaryMuscle: 'Hombro', equipment: 'Mancuernas', description: 'Permite un agarre más natural a los lados del cuerpo.' },

  // PIERNA
  { name: 'Sentadilla Libre', primaryMuscle: 'Pierna', equipment: 'Barra', description: 'El rey de los ejercicios. Barra en la espalda alta, desciende hasta romper el paralelo.' },
  { name: 'Sentadilla Frontal', primaryMuscle: 'Pierna', equipment: 'Barra', description: 'Barra apoyada en clavículas. Exige más verticalidad y enfoca más los cuádriceps.' },
  { name: 'Sentadilla Búlgara', primaryMuscle: 'Pierna', equipment: 'Mancuernas', description: 'Unilateral. Apoya el pie trasero en un banco y baja el peso de forma controlada.' },
  { name: 'Sentadilla Goblet', primaryMuscle: 'Pierna', equipment: 'Mancuernas', description: 'Sostén una mancuerna o kettlebell pegada al pecho y haz sentadillas.' },
  { name: 'Sentadilla Hack', primaryMuscle: 'Pierna', equipment: 'Máquina', description: 'Sentadilla guiada. Ideal para enfatizar cuádriceps al permitir bajar muy profundo con seguridad.' },
  { name: 'Sentadilla en Máquina Smith', primaryMuscle: 'Pierna', equipment: 'Máquina', description: 'Sentadilla guiada con barra fija. Ajusta los pies ligeramente hacia adelante.' },
  { name: 'Prensa de Piernas', primaryMuscle: 'Pierna', equipment: 'Máquina', description: 'Ajusta los pies bajos y juntos para cuádriceps, o altos y separados para glúteos e isquios.' },
  { name: 'Extensiones de Cuádriceps', primaryMuscle: 'Pierna', equipment: 'Máquina', description: 'Aislamiento puro para cuádriceps. Aprieta fuerte un segundo arriba.' },
  { name: 'Peso Muerto Rumano', primaryMuscle: 'Pierna', equipment: 'Barra', description: 'Piernas semiflexionadas. Echa la cadera hacia atrás hasta sentir el estiramiento en isquiosurales.' },
  { name: 'Peso Muerto Piernas Rígidas', primaryMuscle: 'Pierna', equipment: 'Barra', description: 'Mayor tensión isométrica. Las rodillas no se flexionan durante la bajada.' },
  { name: 'Curl Femoral Tumbado', primaryMuscle: 'Pierna', equipment: 'Máquina', description: 'Aislamiento para isquiosurales recostado boca abajo.' },
  { name: 'Curl Femoral Sentado', primaryMuscle: 'Pierna', equipment: 'Máquina', description: 'Aislamiento para isquiosurales. Mantiene el músculo en mayor elongación inicial.' },
  { name: 'Zancadas Estáticas (Lunges)', primaryMuscle: 'Pierna', equipment: 'Mancuernas', description: 'Sube y baja en el sitio manteniendo el torso recto.' },
  { name: 'Zancadas Caminando', primaryMuscle: 'Pierna', equipment: 'Mancuernas', description: 'Avanza en cada repetición. Muy demandante cardiovascularmente.' },
  { name: 'Hip Thrust (Empuje de Cadera)', primaryMuscle: 'Pierna', equipment: 'Barra', description: 'El mejor ejercicio para aislar el glúteo. Empuja con fuerza usando los talones.' },
  { name: 'Abducción de Cadera', primaryMuscle: 'Pierna', equipment: 'Máquina', description: 'Máquina de abrir piernas. Trabaja glúteo medio.' },
  { name: 'Elevación de Gemelos de Pie', primaryMuscle: 'Pierna', equipment: 'Máquina', description: 'Rodillas estiradas. Enfatiza el gastrocnemio.' },
  { name: 'Elevación de Gemelos Sentado', primaryMuscle: 'Pierna', equipment: 'Máquina', description: 'Rodillas flexionadas. Enfatiza el músculo sóleo.' },

  // BÍCEPS
  { name: 'Curl con Barra', primaryMuscle: 'Brazo', equipment: 'Barra', description: 'Construcción de masa básica para bíceps. No balancees el cuerpo.' },
  { name: 'Curl con Barra EZ', primaryMuscle: 'Brazo', equipment: 'Barra', description: 'Versión más amigable con las muñecas gracias al agarre curvado.' },
  { name: 'Curl de Bíceps Alterno', primaryMuscle: 'Brazo', equipment: 'Mancuernas', description: 'Sube una mancuerna y luego la otra, supinando la muñeca.' },
  { name: 'Curl Martillo', primaryMuscle: 'Brazo', equipment: 'Mancuernas', description: 'Agarre neutro. Trabaja el bíceps braquial y braquiorradial (antebrazo).' },
  { name: 'Curl Concentrado', primaryMuscle: 'Brazo', equipment: 'Mancuernas', description: 'Apoya el codo en la cara interna del muslo para estricto aislamiento.' },
  { name: 'Curl Predicador (Banco Scott)', primaryMuscle: 'Brazo', equipment: 'Barra', description: 'Elimina todo impulso. Asegura la máxima contracción del bíceps.' },
  { name: 'Curl en Polea Baja', primaryMuscle: 'Brazo', equipment: 'Polea', description: 'Usa barra recta o cuerda. Tensión constante en todo momento.' },
  { name: 'Curl Bayesian', primaryMuscle: 'Brazo', equipment: 'Polea', description: 'De espaldas a la polea. Permite estirar el bíceps detrás de la línea del cuerpo.' },

  // TRÍCEPS
  { name: 'Press Francés', primaryMuscle: 'Brazo', equipment: 'Barra', description: 'Tumbado, lleva la barra hacia la frente o detrás de la cabeza flexionando los codos.' },
  { name: 'Press de Banca Agarre Cerrado', primaryMuscle: 'Brazo', equipment: 'Barra', description: 'Manos a la anchura de los hombros. Empuja priorizando la fuerza de los tríceps.' },
  { name: 'Extensión de Tríceps con Cuerda', primaryMuscle: 'Brazo', equipment: 'Polea', description: 'Abre la cuerda al final del movimiento para mayor contracción lateral.' },
  { name: 'Extensión de Tríceps con Barra', primaryMuscle: 'Brazo', equipment: 'Polea', description: 'Empuje hacia abajo manteniendo codos fijos pegados al torso.' },
  { name: 'Extensión Tras Nuca en Polea', primaryMuscle: 'Brazo', equipment: 'Polea', description: 'Codos arriba. Enfatiza la cabeza larga del tríceps.' },
  { name: 'Extensión Tras Nuca con Mancuerna', primaryMuscle: 'Brazo', equipment: 'Mancuernas', description: 'Sostiene la mancuerna por detrás del cuello y estira los brazos.' },
  { name: 'Patada de Tríceps', primaryMuscle: 'Brazo', equipment: 'Mancuernas', description: 'Torso paralelo al suelo. Extiende el codo hacia atrás.' },
  { name: 'Fondos de Tríceps', primaryMuscle: 'Brazo', equipment: 'Peso Corporal', description: 'Manos apoyadas detrás en un banco. Baja la cadera rectamente.' },

  // CORE
  { name: 'Crunch Abdominal', primaryMuscle: 'Core', equipment: 'Peso Corporal', description: 'Encogimiento clásico. Eleva solo los hombros del suelo apretando el abdomen.' },
  { name: 'Crunch en Polea', primaryMuscle: 'Core', equipment: 'Polea', description: 'De rodillas, sujeta la cuerda tras el cuello y enrolla tu torso hacia abajo.' },
  { name: 'Elevación de Piernas Colgado', primaryMuscle: 'Core', equipment: 'Peso Corporal', description: 'Colgado en barra, sube las rodillas o pies rectos hacia el pecho.' },
  { name: 'Elevación de Piernas Tumbado', primaryMuscle: 'Core', equipment: 'Peso Corporal', description: 'Trabajo de abdomen inferior. Controla el descenso de las piernas.' },
  { name: 'Plancha Abdominal (Plank)', primaryMuscle: 'Core', equipment: 'Peso Corporal', description: 'Isométrico apoyado en antebrazos. Mantén el cuerpo en línea recta.' },
  { name: 'Rueda Abdominal', primaryMuscle: 'Core', equipment: 'Peso Corporal', description: 'Gran estiramiento del core. Rueda hacia adelante desde las rodillas y vuelve.' },
  { name: 'Russian Twists', primaryMuscle: 'Core', equipment: 'Peso Corporal', description: 'Giro de torso sentado para oblicuos.' },
  { name: 'Woodchopper', primaryMuscle: 'Core', equipment: 'Polea', description: 'Movimiento diagonal de leñador para trabajar oblicuos rotando el torso.' },

  // CARDIO / OTROS
  { name: 'Paseo del Granjero', primaryMuscle: 'Core', equipment: 'Mancuernas', description: 'Agarra dos pesas pesadas y camina. Fortalece agarre, core y trapecios.' },
  { name: 'Cinta de Correr', primaryMuscle: 'Cardio', equipment: 'Máquina', description: 'Trabajo aeróbico o HIIT caminando, trotando o corriendo.' },
  { name: 'Bicicleta Estática', primaryMuscle: 'Cardio', equipment: 'Máquina', description: 'Cardio de bajo impacto articular.' },
  { name: 'Elíptica', primaryMuscle: 'Cardio', equipment: 'Máquina', description: 'Movimiento global de brazos y piernas sin impacto.' },
  { name: 'Remo Ergómetro', primaryMuscle: 'Cardio', equipment: 'Máquina', description: 'Cardio exigente de cuerpo completo, empuje de piernas y tirón de espalda.' },
  { name: 'Máquina de Escaleras', primaryMuscle: 'Cardio', equipment: 'Máquina', description: 'Quemagrasas muy exigente para glúteos y piernas.' },
  { name: 'Salto a la Comba', primaryMuscle: 'Cardio', equipment: 'Peso Corporal', description: 'Trabajo de resistencia, agilidad y coordinación.' }
];

async function main() {
  console.log('Iniciando reseteo y siembra del catálogo curado de ejercicios sin imágenes (UI minimalista)...');
  
  try {
    console.log('Limpiando base de datos de ejercicios sin uso...');
    const unusedExercises = await prisma.exercise.findMany({
      where: {
        routineExercises: { none: {} },
        workoutSets: { none: {} }
      },
      select: { id: true }
    });

    if (unusedExercises.length > 0) {
      const unusedIds = unusedExercises.map(e => e.id);
      const deleted = await prisma.exercise.deleteMany({
        where: { id: { in: unusedIds } }
      });
      console.log(`Borrados ${deleted.count} ejercicios.`);
    }

    console.log(`Insertando ${curatedExercises.length} ejercicios en español puro...`);
    
    const existing = await prisma.exercise.findMany({ select: { name: true } });
    const existingNames = new Set(existing.map(e => e.name));

    const toInsert = curatedExercises
      .filter(ex => !existingNames.has(ex.name))
      .map(ex => ({
          name: ex.name,
          muscleGroup: ex.primaryMuscle,
          equipment: ex.equipment,
          description: ex.description,
          imageUrl: null, // Minimalista, sin imagen de stock
      }));

    if (toInsert.length > 0) {
      const result = await prisma.exercise.createMany({
        data: toInsert,
        skipDuplicates: true
      });
      console.log(`✅ ¡Catálogo creado con éxito! Insertados ${result.count} ejercicios premium.`);
    } else {
      console.log('✅ El catálogo ya estaba instalado.');
    }

  } catch (error) {
    console.error('Error durante la inserción:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
