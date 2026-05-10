const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

const STOP_WORDS = ["de", "con", "en", "a", "la", "el", "los", "las", "del", "al"];

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/\([^)]*\)/g, "") 
    .replace(/_/g, " ")
    .replace(/pullover/g, "pull over") 
    .replace(/tras nuca/g, "trasnuca") 
    .replace(/[^a-z0-9 ]/g, "")
    .split(" ")
    .filter(word => word.length > 0 && !STOP_WORDS.includes(word))
    .map(word => {
        if (word.length <= 4) return word;
        return word.replace(/es$/, "").replace(/s$/, "");
    })
    .join("_");
}

async function main() {
  const publicDir = path.join(process.cwd(), "public");
  const files = fs.readdirSync(publicDir);
  
  const imageExtensions = [".jpg", ".jpeg", ".png", ".svg", ".webp"];
  const imageFiles = files.filter(f => imageExtensions.includes(path.extname(f).toLowerCase()));

  const exercises = await prisma.exercise.findMany();
  console.log(`Procesando ${exercises.length} ejercicios...`);

  let updatedCount = 0;

  for (const exercise of exercises) {
    const normExercise = normalize(exercise.name);
    let matchFile = null;

    // 1. Intento: Coincidencia exacta de normalizados
    matchFile = imageFiles.find(f => normalize(path.parse(f).name) === normExercise);

    // 2. Intento: Contenido parcial
    if (!matchFile) {
        matchFile = imageFiles.find(f => {
          const normFile = normalize(path.parse(f).name);
          return normExercise.includes(normFile) || normFile.includes(normExercise);
        });
    }

    // 3. Intento: Intersección de palabras
    if (!matchFile) {
        const exerciseWords = normExercise.split("_");
        matchFile = imageFiles.find(f => {
            const normFile = normalize(path.parse(f).name);
            const fileWords = normFile.split("_");
            return fileWords.length > 0 && fileWords.every(word => exerciseWords.includes(word));
        });
    }

    // 4. Mapeos manuales (hardcoded fixes)
    if (!matchFile) {
        const fuzzyMappings = [
            { keywords: ["cruce", "polea", "bajo"], file: "cruces_polea_baja" },
            { keywords: ["cruce", "polea", "alto"], file: "cruce_polea_alta" },
            { keywords: ["curl", "polea", "baja"], file: "curl_biceps_polea" },
            { keywords: ["zancada", "camina"], file: "zancadas_movimiento" },
            { keywords: ["jalon", "triangulo"], file: "jalon_cerrado" },
            { keywords: ["remo", "gironda"], file: "remo_polea_cerrado" },
            { keywords: ["remo", "maquina"], file: "remo_cerrado_maquina" },
            { keywords: ["sentadilla", "libre"], file: "sentadilla_barra" },
            { keywords: ["sentadilla", "goblet"], file: "sentadilla_frontal_mancuerna" },
            { keywords: ["hombro", "sentado"], file: "press_hombro_mancuerna" },
            { keywords: ["encogimiento", "mancuerna"], file: "encogimientos_hombro_mancuerna" },
            { keywords: ["abduccion", "cadera"], file: "abducciones_maquina" },
            { keywords: ["extension", "cuadricep"], file: "extension_cuadriceps" },
            { keywords: ["patada", "tricep"], file: "fondos_triceps" } // Fallback
        ];

        for (const mapping of fuzzyMappings) {
            if (mapping.keywords.every(kw => normExercise.includes(kw))) {
                matchFile = imageFiles.find(f => f.includes(mapping.file));
                if (matchFile) break;
            }
        }
    }

    if (matchFile) {
      await prisma.exercise.update({
        where: { id: exercise.id },
        data: { imageUrl: `/${matchFile}` }
      });
      console.log(`✅ [OK] ${exercise.name} -> /${matchFile}`);
      updatedCount++;
    } else {
      console.log(`❌ [FAIL] ${exercise.name} (Buscado como: ${normExercise})`);
    }
  }

  console.log(`\nResumen final: ${updatedCount}/${exercises.length} ejercicios vinculados.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
