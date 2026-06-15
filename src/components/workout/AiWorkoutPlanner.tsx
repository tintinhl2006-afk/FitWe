"use client";

import { useState, useEffect } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { 
  Loader2, 
  X, 
  Check, 
  Sparkles, 
  Sliders, 
  Dumbbell, 
  CalendarDays,
  Target,
  Activity,
  HeartPulse,
  ArrowLeft,
  ArrowRight,
  Download,
  Clipboard
} from "lucide-react";
import { cn } from "@/lib/utils";

function sanitizeText(str: string): string {
  if (!str) return "";
  return str
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');
}

function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

class PDFWriter {
  private pdfDoc: any;
  private page: any;
  private fontRegular: any;
  private fontBold: any;
  private currentY: number = 0;
  private margin: number = 40;
  private width: number = 595.27;
  private height: number = 841.89;

  constructor(pdfDoc: any, fontRegular: any, fontBold: any) {
    this.pdfDoc = pdfDoc;
    this.fontRegular = fontRegular;
    this.fontBold = fontBold;
    this.addNewPage();
  }

  private addNewPage() {
    this.page = this.pdfDoc.addPage([this.width, this.height]);
    this.currentY = this.height - this.margin;
    this.drawFooter();
  }

  private drawFooter() {
    const pageNum = this.pdfDoc.getPageCount();
    const footerText = `Pagina ${pageNum} | FitWe - Plan de Entrenamiento Inteligente`;
    this.page.drawText(footerText, {
      x: this.margin,
      y: 20,
      size: 8,
      font: this.fontRegular,
      color: rgb(0.39, 0.45, 0.55),
    });
  }

  ensureSpace(neededHeight: number) {
    if (this.currentY - neededHeight < this.margin + 10) {
      this.addNewPage();
    }
  }

  getYPosition() {
    return this.currentY;
  }

  getPage() {
    return this.page;
  }

  subtractY(amount: number) {
    this.currentY -= amount;
  }

  drawHeading(text: string, level: 1 | 2 | 3) {
    const cleanText = sanitizeText(text);
    const sizes = { 1: 18, 2: 13, 3: 10 };
    const size = sizes[level];
    const spacing = level === 1 ? 20 : level === 2 ? 15 : 10;
    
    if (this.currentY < this.height - this.margin - 10) {
      this.currentY -= 12;
    }
    
    this.ensureSpace(size + spacing);

    if (level === 1) {
      this.page.drawRectangle({
        x: this.margin,
        y: this.currentY - size - 10,
        width: this.width - 2 * this.margin,
        height: size + 16,
        color: rgb(0.93, 0.98, 1.0),
      });
      this.page.drawText(cleanText.toUpperCase(), {
        x: this.margin + 10,
        y: this.currentY - size - 2,
        size,
        font: this.fontBold,
        color: rgb(0.03, 0.45, 0.54),
      });
      this.currentY -= (size + 24);
    } else if (level === 2) {
      this.page.drawLine({
        start: { x: this.margin, y: this.currentY },
        end: { x: this.margin, y: this.currentY - size - 4 },
        thickness: 3,
        color: rgb(0.03, 0.45, 0.54),
      });
      this.page.drawText(cleanText, {
        x: this.margin + 8,
        y: this.currentY - size,
        size,
        font: this.fontBold,
        color: rgb(0.06, 0.09, 0.16),
      });
      this.currentY -= (size + 12);
    } else {
      this.page.drawText(cleanText, {
        x: this.margin,
        y: this.currentY - size,
        size,
        font: this.fontBold,
        color: rgb(0.06, 0.09, 0.16),
      });
      this.currentY -= (size + 8);
    }
  }

  drawHorizontalLine(color?: any, thickness = 1) {
    this.ensureSpace(10);
    this.page.drawLine({
      start: { x: this.margin, y: this.currentY },
      end: { x: this.width - this.margin, y: this.currentY },
      thickness,
      color: color || rgb(0.88, 0.91, 0.94),
    });
    this.currentY -= 10;
  }

  drawSpacing(height: number) {
    this.currentY -= height;
  }

  drawTable(
    headers: string[],
    columnWidths: number[],
    rows: any[][]
  ) {
    const headerHeight = 25;
    this.ensureSpace(headerHeight + 35);

    const drawHeaders = (y: number) => {
      this.page.drawRectangle({
        x: this.margin,
        y: y - headerHeight,
        width: this.width - 2 * this.margin,
        height: headerHeight,
        color: rgb(0.94, 0.96, 0.98),
      });

      let currentX = this.margin;
      for (let i = 0; i < headers.length; i++) {
        this.page.drawText(sanitizeText(headers[i]), {
          x: currentX + 6,
          y: y - 16,
          size: 9,
          font: this.fontBold,
          color: rgb(0.28, 0.33, 0.41),
        });
        currentX += columnWidths[i];
      }

      this.page.drawLine({
        start: { x: this.margin, y: y - headerHeight },
        end: { x: this.width - this.margin, y: y - headerHeight },
        thickness: 1,
        color: rgb(0.88, 0.91, 0.94),
      });
    };

    drawHeaders(this.currentY);
    this.currentY -= headerHeight;

    for (const row of rows) {
      const exerciseCell = row[0];
      const cleanName = sanitizeText(exerciseCell.name);
      const cleanJust = exerciseCell.justificacion ? sanitizeText(exerciseCell.justificacion) : "";
      
      const nameLines = wrapText(cleanName, columnWidths[0] - 12, this.fontBold, 10);
      const justLines = cleanJust 
        ? wrapText(cleanJust, columnWidths[0] - 12, this.fontRegular, 8)
        : [];
      
      const cellHeight = (nameLines.length * 12) + (justLines.length * 10) + (justLines.length > 0 ? 6 : 0) + 12;

      // Wrap other columns dynamically
      const otherColLines: string[][] = [];
      let maxOtherColHeight = 0;
      for (let i = 1; i < row.length; i++) {
        const val = sanitizeText(String(row[i]));
        const lines = wrapText(val, columnWidths[i] - 12, this.fontRegular, 9);
        otherColLines.push(lines);
        const colHeight = (lines.length * 11) + 12;
        if (colHeight > maxOtherColHeight) {
          maxOtherColHeight = colHeight;
        }
      }

      const rowHeight = Math.max(cellHeight, maxOtherColHeight, 35);

      if (this.currentY - rowHeight < this.margin + 10) {
        this.addNewPage();
        drawHeaders(this.currentY);
        this.currentY -= headerHeight;
      }

      let currentX = this.margin;
      const yStart = this.currentY;

      let textY = yStart - 12;
      for (const nameLine of nameLines) {
        this.page.drawText(nameLine, {
          x: currentX + 6,
          y: textY,
          size: 10,
          font: this.fontBold,
          color: rgb(0.06, 0.09, 0.16),
        });
        textY -= 12;
      }
      if (justLines.length > 0) {
        textY -= 2;
        for (const justLine of justLines) {
          this.page.drawText(justLine, {
            x: currentX + 6,
            y: textY,
            size: 8,
            font: this.fontRegular,
            color: rgb(0.39, 0.45, 0.55),
          });
          textY -= 10;
        }
      }

      currentX += columnWidths[0];

      for (let i = 1; i < row.length; i++) {
        const lines = otherColLines[i - 1];
        let valY = yStart - 16;
        for (const line of lines) {
          this.page.drawText(line, {
            x: currentX + 6,
            y: valY,
            size: 9,
            font: this.fontRegular,
            color: rgb(0.18, 0.24, 0.35),
          });
          valY -= 11;
        }
        currentX += columnWidths[i];
      }

      this.page.drawLine({
        start: { x: this.margin, y: yStart - rowHeight },
        end: { x: this.width - this.margin, y: yStart - rowHeight },
        thickness: 1,
        color: rgb(0.94, 0.96, 0.98),
      });

      this.currentY -= rowHeight;
    }

    this.page.drawLine({
      start: { x: this.margin, y: this.currentY },
      end: { x: this.width - this.margin, y: this.currentY },
      thickness: 1.5,
      color: rgb(0.88, 0.91, 0.94),
    });
    this.currentY -= 15;
  }
}

interface AiWorkoutPlannerProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function AiWorkoutPlanner({ onClose, onSaved }: AiWorkoutPlannerProps) {
  const [setupStep, setSetupStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exercisesCatalog, setExercisesCatalog] = useState<any[]>([]);
  
  // Setup Form Preferences
  const [customDays, setCustomDays] = useState(3);
  const [customLevel, setCustomLevel] = useState<"principiante" | "intermedio" | "avanzado" | "muy_avanzado">("intermedio");
  const [customGoal, setCustomGoal] = useState<"hipertrofia" | "fuerza" | "recomposicion" | "perdida_grasa" | "rendimiento">("hipertrofia");
  const [customSplit, setCustomSplit] = useState<"auto" | "torso_pierna" | "ppl" | "full_body">("auto");
  const [customPriorities, setCustomPriorities] = useState<string[]>([]);
  const [customLesiones, setCustomLesiones] = useState<string[]>([]);
  const [customRepeats, setCustomRepeats] = useState<string[]>([]);

  // Load exercises catalog on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch("/api/exercises");
        if (res.ok) {
          const data = await res.json();
          setExercisesCatalog(data);
        }
      } catch (err) {
        console.error("Error loading exercises catalog:", err);
      }
    }
    loadCatalog();
  }, []);

  const getResolvedSplit = (days: number, split: string): "full_body" | "torso_pierna" | "ppl" => {
    if (split === "auto") {
      if (days <= 2) return "full_body";
      if (days === 3) return "ppl";
      return "torso_pierna";
    }
    return split as "full_body" | "torso_pierna" | "ppl";
  };

  const getRepeatsNeeded = (days: number, split: string): { count: number; options: string[] } => {
    const resolvedSplit = getResolvedSplit(days, split);
    if (resolvedSplit === "ppl") {
      if (days === 4) return { count: 1, options: ["empuje", "tiron", "pierna"] };
      if (days === 5) return { count: 2, options: ["empuje", "tiron", "pierna"] };
    }
    if (resolvedSplit === "torso_pierna") {
      if (days === 3) return { count: 1, options: ["torso", "pierna"] };
      if (days === 5) return { count: 1, options: ["torso", "pierna"] };
    }
    return { count: 0, options: [] };
  };

  const handleToggleRepeat = (option: string, max: number) => {
    if (max === 1) {
      setCustomRepeats([option]);
    } else {
      setCustomRepeats((prev) => {
        if (prev.includes(option)) {
          return prev.filter((o) => o !== option);
        }
        if (prev.length < max) {
          return [...prev, option];
        }
        return [prev[1], option];
      });
    }
  };

  useEffect(() => {
    const needed = getRepeatsNeeded(customDays, customSplit);
    if (needed.count === 0) {
      setCustomRepeats([]);
    } else {
      if (needed.count === 1) {
        setCustomRepeats([needed.options[0]]);
      } else if (needed.count === 2) {
        setCustomRepeats([needed.options[0], needed.options[1]]);
      }
    }
  }, [customDays, customSplit]);

  const [generatedPlan, setGeneratedPlan] = useState<any[] | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/routines/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days: customDays,
          level: customLevel,
          split: customSplit,
          priorities: customPriorities,
          lesiones: customLesiones,
          goal: customGoal,
          repeats: customRepeats,
        }),
      });
      
      if (!res.ok) {
        throw new Error("No se pudo generar el plan de entrenamiento.");
      }
      
      const data = await res.json();
      setGeneratedPlan(data.plan);
      setSetupStep(4);
    } catch (e: any) {
      setError(e.message || "Ocurrió un error al generar las rutinas");
    } finally {
      setIsLoading(false);
    }
  };

  // Editor Actions
  const handleUpdateSets = (routineIdx: number, exerciseIdx: number, increment: number) => {
    if (!generatedPlan) return;
    const nextPlan = [...generatedPlan];
    const routine = { ...nextPlan[routineIdx] };
    const exercises = [...routine.exercises];
    const ex = { ...exercises[exerciseIdx] };
    
    const nextSets = Math.max(1, ex.sets + increment);
    ex.sets = nextSets;
    ex.repsList = Array(nextSets).fill(ex.reps).join(",");
    
    exercises[exerciseIdx] = ex;
    routine.exercises = exercises;
    nextPlan[routineIdx] = routine;
    setGeneratedPlan(nextPlan);
  };

  const handleUpdateReps = (routineIdx: number, exerciseIdx: number, increment: number) => {
    if (!generatedPlan) return;
    const nextPlan = [...generatedPlan];
    const routine = { ...nextPlan[routineIdx] };
    const exercises = [...routine.exercises];
    const ex = { ...exercises[exerciseIdx] };
    
    const nextReps = Math.max(1, ex.reps + increment);
    ex.reps = nextReps;
    ex.repsList = Array(ex.sets).fill(nextReps).join(",");
    
    exercises[exerciseIdx] = ex;
    routine.exercises = exercises;
    nextPlan[routineIdx] = routine;
    setGeneratedPlan(nextPlan);
  };

  const handleDeleteExercise = (routineIdx: number, exerciseIdx: number) => {
    if (!generatedPlan) return;
    const nextPlan = [...generatedPlan];
    const routine = { ...nextPlan[routineIdx] };
    const exercises = routine.exercises.filter((_: any, idx: number) => idx !== exerciseIdx);
    
    routine.exercises = exercises;
    nextPlan[routineIdx] = routine;
    setGeneratedPlan(nextPlan);
  };

  const handleSwapExercise = (routineIdx: number, exerciseIdx: number, newExerciseId: string) => {
    if (!generatedPlan) return;
    const newExDetails = exercisesCatalog.find(e => e.id === newExerciseId);
    if (!newExDetails) return;

    const nextPlan = [...generatedPlan];
    const routine = { ...nextPlan[routineIdx] };
    const exercises = [...routine.exercises];
    const ex = { ...exercises[exerciseIdx] };
    
    ex.exerciseId = newExDetails.id;
    ex.name = newExDetails.name;
    ex.justificacion = `Ejercicio óptimo para el desarrollo de ${newExDetails.muscleGroup.toLowerCase()}.`;
    
    exercises[exerciseIdx] = ex;
    routine.exercises = exercises;
    nextPlan[routineIdx] = routine;
    setGeneratedPlan(nextPlan);
  };

  const handleSavePlan = async () => {
    if (!generatedPlan) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/routines/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          savePlan: generatedPlan
        }),
      });
      
      if (!res.ok) {
        throw new Error("No se pudo guardar el plan de entrenamiento.");
      }
      
      onSaved();
    } catch (e: any) {
      setError(e.message || "Ocurrió un error al guardar las rutinas");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintPDF = async () => {
    if (!generatedPlan) return;

    try {
      const goalMap = {
        hipertrofia: "Ganancia de Masa Muscular (Hipertrofia)",
        fuerza: "Ganancia de Fuerza Máxima",
        recomposicion: "Recomposición Corporal (Pérdida de grasa y ganancia muscular)",
        perdida_grasa: "Pérdida de Grasa / Definición Muscular",
        rendimiento: "Rendimiento y Acondicionamiento Físico General"
      };

      const levelMap = {
        principiante: "Principiante (menos de 1 año)",
        intermedio: "Intermedio (1 - 3 años)",
        avanzado: "Avanzado (3 - 6 años)",
        muy_avanzado: "Muy avanzado (más de 6 años)"
      };

      const splitMap = {
        full_body: "Cuerpo Completo (Full Body)",
        torso_pierna: "Torso / Pierna (Upper / Lower)",
        ppl: "Empuje / Tirón / Pierna (Push / Pull / Legs)",
        auto: "Selección Automática del Motor"
      };

      const lesionesMap = {
        hombro: "Hombro",
        lumbar: "Zona Lumbar",
        rodilla: "Rodilla",
        codo_muneca: "Codo / Muñeca",
        cadera: "Cadera",
        ninguna: "Ninguna"
      };

      const goalLabel = goalMap[customGoal] || customGoal;
      const levelLabel = levelMap[customLevel] || customLevel;
      const splitLabel = splitMap[customSplit === "auto" ? (customDays <= 2 ? "full_body" : customDays === 3 ? "ppl" : "torso_pierna") : customSplit] || customSplit;
      const prioritiesText = customPriorities.length > 0 ? customPriorities.join(", ") : "Ninguno en particular";
      const lesionesText = customLesiones.length > 0 && !customLesiones.includes("ninguna") 
        ? customLesiones.map(l => lesionesMap[l as keyof typeof lesionesMap] || l).join(", ") 
        : "Ninguna molestia declarada";

      const rirVal = customGoal === "fuerza" ? 2 : customLevel === "principiante" ? 2 : 1;

      // 1. Create PDF Document
      const pdfDoc = await PDFDocument.create();
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // 2. Instantiate helper layout drawer
      const writer = new PDFWriter(pdfDoc, fontRegular, fontBold);

      // 3. Draw Header
      writer.drawSpacing(10);
      writer.getPage().drawText("FitWe", {
        x: 40,
        y: writer.getYPosition() - 24,
        size: 28,
        font: fontBold,
        color: rgb(0.03, 0.45, 0.54), // cyan-600
      });
      writer.getPage().drawText("Plan de Entrenamiento Personalizado Inteligente", {
        x: 40,
        y: writer.getYPosition() - 42,
        size: 11,
        font: fontRegular,
        color: rgb(0.39, 0.45, 0.55),
      });
      writer.subtractY(52);
      writer.drawHorizontalLine(rgb(0.03, 0.45, 0.54), 2);
      writer.drawSpacing(15);

      // 4. Perfil del Plan
      writer.drawHeading("Perfil del Plan", 2);
      const startY = writer.getYPosition();
      writer.ensureSpace(70);
      writer.getPage().drawRectangle({
        x: 40,
        y: startY - 65,
        width: 515.27,
        height: 65,
        color: rgb(0.97, 0.98, 0.99),
        borderColor: rgb(0.91, 0.93, 0.95),
        borderWidth: 1,
      });

      const col1X = 50;
      const col2X = 300;

      writer.getPage().drawText(`Objetivo: ${goalLabel}`, { x: col1X, y: startY - 18, size: 9, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
      writer.getPage().drawText(`Nivel: ${levelLabel}`, { x: col2X, y: startY - 18, size: 9, font: fontBold, color: rgb(0.06, 0.09, 0.16) });

      writer.getPage().drawText(`Frecuencia: ${customDays} días a la semana`, { x: col1X, y: startY - 34, size: 9, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
      writer.getPage().drawText(`Rutina: ${splitLabel}`, { x: col2X, y: startY - 34, size: 9, font: fontBold, color: rgb(0.06, 0.09, 0.16) });

      writer.getPage().drawText(`Puntos a priorizar: ${prioritiesText}`, { x: col1X, y: startY - 50, size: 9, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
      writer.getPage().drawText(`Lesiones/Molestias: ${lesionesText}`, { x: col2X, y: startY - 50, size: 9, font: fontBold, color: rgb(0.06, 0.09, 0.16) });

      writer.subtractY(75);

      // Determine level focus tip
      let levelFocusTip = "";
      if (customLevel === "principiante") {
        levelFocusTip = "Enfoque en la técnica y aprendizaje del movimiento. Mantén un RIR 2 estable en todos tus ejercicios. Prioriza la estabilidad articular sobre el peso.";
      } else if (customLevel === "intermedio") {
        levelFocusTip = "Progresión moderada y consistencia. Trabaja a RIR 1-2 en tus series principales, manteniendo un buen control del tempo excéntrico.";
      } else {
        levelFocusTip = "Sobrecarga progresiva rigurosa. Exígete con RIR 1-0 en las series efectivas finales, registrando tus cargas para asegurar mejoras semanales.";
      }

      // Determine goal physiological tip
      let goalPhysiologicalTip = "";
      if (customGoal === "hipertrofia") {
        goalPhysiologicalTip = "Estímulo mecánico y tensión bajo tensión. Busca acumular series efectivas cerca del fallo técnico para maximizar el reclutamiento de fibras musculares.";
      } else if (customGoal === "fuerza") {
        goalPhysiologicalTip = "Eficiencia del sistema nervioso. Mantén descansos largos (3-5 min) en ejercicios multiarticulares pesados para maximizar la producción de fuerza por serie.";
      } else if (customGoal === "perdida_grasa") {
        goalPhysiologicalTip = "Preservación de masa magra. Mantén la intensidad alta a pesar del déficit calórico para indicarle a tu cuerpo que debe conservar el tejido muscular.";
      } else {
        goalPhysiologicalTip = "Adaptación metabólica y neuromuscular. Controla los tiempos de recuperación y prioriza la calidad técnica para optimizar la transferencia funcional.";
      }

      // 5. Metodología
      writer.drawHeading("Metodología y Pautas Clave", 2);
      const guidelines = [
        { title: "Doble Progresión: ", text: "Progresa en repeticiones antes de subir de peso. Cuando completes todas las series con la repetición máxima recomendada y excelente técnica, incrementa la carga en la siguiente sesión." },
        { title: "Repeticiones en Recámara (RIR): ", text: `Mantén la intensidad indicada en cada serie (generalmente RIR ${rirVal}). Termina cada serie sintiendo que te quedaban únicamente esas repeticiones antes de llegar al fallo técnico.` },
        { title: "Enfoque por Nivel: ", text: levelFocusTip },
        { title: "Estímulo Fisiológico: ", text: goalPhysiologicalTip },
        { title: "Seguridad Articular: ", text: `Se han evitado ejercicios potencialmente lesivos para las zonas que indicaste (${lesionesText}), sustituyéndolos por variantes estables que minimizan el estrés mecánico sobre las articulaciones.` },
      ];

      for (const gd of guidelines) {
        writer.ensureSpace(25);
        const bulletX = 45;
        writer.getPage().drawCircle({ x: bulletX + 2, y: writer.getYPosition() - 6, size: 4, color: rgb(0.03, 0.45, 0.54) });

        const firstLineTextLines = wrapText(gd.text, 495 - fontBold.widthOfTextAtSize(gd.title, 9), fontRegular, 9);
        if (firstLineTextLines.length > 0) {
          writer.getPage().drawText(gd.title, {
            x: bulletX + 12,
            y: writer.getYPosition() - 9,
            size: 9,
            font: fontBold,
            color: rgb(0.06, 0.09, 0.16),
          });
          writer.getPage().drawText(firstLineTextLines[0], {
            x: bulletX + 12 + fontBold.widthOfTextAtSize(gd.title, 9),
            y: writer.getYPosition() - 9,
            size: 9,
            font: fontRegular,
            color: rgb(0.18, 0.24, 0.35),
          });
          writer.subtractY(13);

          const otherLines = gd.text.slice(firstLineTextLines[0].length).trim();
          if (otherLines) {
            const restWrapped = wrapText(otherLines, 495, fontRegular, 9);
            for (const rl of restWrapped) {
              writer.ensureSpace(12);
              writer.getPage().drawText(rl, {
                x: bulletX + 12,
                y: writer.getYPosition() - 9,
                size: 9,
                font: fontRegular,
                color: rgb(0.18, 0.24, 0.35),
              });
              writer.subtractY(13);
            }
          }
        } else {
          writer.subtractY(13);
        }
        writer.subtractY(5);
      }
      writer.subtractY(10);

      // 6. Sesiones de entrenamiento
      writer.drawHeading("Sesiones de Entrenamiento", 1);

      for (const routine of generatedPlan) {
        writer.drawHeading(routine.name, 2);

        const headers = ["Ejercicio", "Series", "Repeticiones", "Intensidad", "Tempo", "Descanso"];
        const columnWidths = [200, 40, 65, 65, 65, 80];

        const rows = routine.exercises.map((ex: any) => [
          { name: ex.name, justificacion: ex.justificacion },
          ex.sets,
          ex.reps,
          `RIR ${ex.rir}`,
          ex.tempo,
          ex.descanso
        ]);

        writer.drawTable(headers, columnWidths, rows);
      }

      // 7. Calentamiento y Seguridad
      writer.drawHeading("Calentamiento y Seguridad", 2);
      const safetyPautas = [
        "Dedica 5-10 minutos de movilidad articular y activación aeróbica ligera antes de iniciar la rutina.",
        "Realiza 2-3 series de aproximación antes de tus series efectivas con pesos más ligeros.",
        "Controla la velocidad del movimiento: 3 segundos en la bajada (fase excéntrica) y 1 segundo en la subida (concéntrica).",
        "Si sientes dolor agudo en alguna articulación, detén el ejercicio de inmediato y consulta a un especialista."
      ];

      for (const pauta of safetyPautas) {
        writer.ensureSpace(20);
        writer.getPage().drawCircle({ x: 47, y: writer.getYPosition() - 6, size: 4, color: rgb(0.9, 0.3, 0.3) });

        const lines = wrapText(pauta, 495, fontRegular, 9);
        for (const line of lines) {
          writer.ensureSpace(12);
          writer.getPage().drawText(line, {
            x: 57,
            y: writer.getYPosition() - 9,
            size: 9,
            font: fontRegular,
            color: rgb(0.18, 0.24, 0.35),
          });
          writer.subtractY(13);
        }
        writer.subtractY(3);
      }

      // 8. Save and Download
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Plan_de_Entrenamiento_FitWe_${customGoal}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Error al generar el archivo PDF.");
    }
  };

  const handleCopyClipboard = () => {
    if (!generatedPlan) return;
    
    let text = `FITWE - PLAN DE ENTRENAMIENTO PERSONALIZADO\n\n`;
    text += `Objetivo: ${customGoal}\n`;
    text += `Días semanales: ${customDays}\n`;
    text += `Nivel: ${customLevel}\n\n`;
    
    generatedPlan.forEach((routine) => {
      text += `RUTINA: ${routine.name}\n`;
      routine.exercises.forEach((ex: any) => {
        text += `- ${ex.name}: ${ex.sets} series x ${ex.reps} repeticiones (RIR ${ex.rir}, descanso: ${ex.descanso})\n`;
      });
      text += `\n`;
    });
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePriority = (group: string) => {
    setCustomPriorities(prev => 
      prev.includes(group) ? prev.filter(x => x !== group) : [...prev, group]
    );
  };

  const handleToggleLesion = (lesion: string) => {
    if (lesion === "ninguna") {
      setCustomLesiones(prev => prev.includes("ninguna") ? [] : ["ninguna"]);
      return;
    }
    setCustomLesiones(prev => {
      const next = prev.includes(lesion) ? prev.filter(x => x !== lesion) : [...prev.filter(x => x !== "ninguna"), lesion];
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-cyan-50/40 via-transparent to-blue-50/20 dark:from-slate-950/40 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 rounded-2xl text-white shadow-md shadow-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                Generador de Rutina Automática
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configura tu perfil para generar rutinas de entrenamiento inteligentes de forma instantánea.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Diseñando tu plan de entrenamiento personalizado...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Error</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
            <div className="flex gap-2">
              <button 
                onClick={handleGenerate}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Volver a intentar
              </button>
              <button onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Setup Wizard View */}
        {!isLoading && !error && (
          <div className="flex-1 overflow-hidden p-6 flex flex-col min-h-0 space-y-6">
            {/* Stepper indicator */}
            <div className="relative mb-4 max-w-sm w-full mx-auto px-4 shrink-0">
              <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
              <div className="absolute top-5 left-10 right-10 h-0.5 -translate-y-1/2 z-0 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300" 
                  style={{ width: setupStep === 1 ? "0%" : setupStep === 2 ? "33.33%" : setupStep === 3 ? "66.66%" : "100%" }} 
                />
              </div>
              
              <div className="relative flex justify-between items-center z-10">
                {[
                  { step: 1, label: "Bases", icon: Sliders },
                  { step: 2, label: "Ajustes", icon: Target },
                  { step: 3, label: "Detalles", icon: Dumbbell },
                  { step: 4, label: "Resumen", icon: Sparkles }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = setupStep === item.step;
                  const isCompleted = setupStep > item.step;
                  
                  return (
                    <div key={item.step} className="flex flex-col items-center">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2",
                        isActive
                           ? "bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/25 scale-110"
                          : isCompleted
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400"
                      )}>
                        {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold mt-2",
                        isActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400"
                       )}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/40 rounded-3xl p-6 shadow-soft flex flex-col min-h-0 overflow-y-auto pr-1">
              
              {/* STEP 1: Basic Preferences (Days & Goal) */}
              {setupStep === 1 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {/* Days */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      ¿Cuántos días a la semana quieres entrenar?
                    </label>
                    <div className="flex gap-2">
                      {[2, 3, 4, 5].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setCustomDays(d)}
                          className={cn(
                            "px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all flex-1",
                            customDays === d
                              ? "bg-cyan-500 border-cyan-500 text-white shadow-md shadow-cyan-500/15"
                              : "bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50 dark:text-slate-300"
                          )}
                        >
                          {d} días
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Goal */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Objetivo Principal
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: "hipertrofia", label: "Ganar músculo", desc: "Hipertrofia" },
                        { id: "fuerza", label: "Ganar fuerza", desc: "Cargas pesadas" },
                        { id: "recomposicion", label: "Recomposición", desc: "Grasa y músculo" },
                        { id: "perdida_grasa", label: "Perder grasa", desc: "Déficit calórico" },
                      ].map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setCustomGoal(g.id as any)}
                          className={cn(
                            "p-3 rounded-2xl border text-left transition-all text-xs flex flex-col justify-between h-16 bg-white dark:bg-slate-900/60",
                            customGoal === g.id
                              ? "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/20 ring-1 ring-cyan-500"
                              : "border-slate-200 dark:border-slate-800 hover:border-cyan-200"
                          )}
                        >
                          <span className="font-bold text-slate-900 dark:text-white">{g.label}</span>
                          <span className="text-[10px] text-slate-550 dark:text-slate-455">{g.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* STEP 2: Basic Preferences (Level & Split) */}
              {setupStep === 2 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">

                  {/* Level */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Nivel de Experiencia
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: "principiante", label: "Principiante", desc: "Menos de 1 año" },
                        { id: "intermedio", label: "Intermedio", desc: "1 - 3 años" },
                        { id: "avanzado", label: "Avanzado", desc: "3 - 6 años" },
                        { id: "muy_avanzado", label: "Muy avanzado", desc: "Más de 6 años" },
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setCustomLevel(lvl.id as any)}
                          className={cn(
                            "p-3 rounded-2xl border text-left transition-all text-xs flex flex-col justify-between h-16 bg-white dark:bg-slate-900/60",
                            customLevel === lvl.id
                              ? "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/20 ring-1 ring-cyan-500"
                              : "border-slate-200 dark:border-slate-800 hover:border-cyan-200"
                          )}
                        >
                          <span className="font-bold text-slate-900 dark:text-white">{lvl.label}</span>
                          <span className="text-[10px] text-slate-550 dark:text-slate-455">{lvl.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Split */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Organización del Entrenamiento
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: "auto", label: "Auto", desc: "Decisión del plan" },
                        { id: "full_body", label: "Cuerpo Completo", desc: "Full Body" },
                        { id: "torso_pierna", label: "Torso / Pierna", desc: "Upper / Lower" },
                        { id: "ppl", label: "Empuje / Tirón / Pierna", desc: "PPL" },
                      ].map((spl) => (
                        <button
                          key={spl.id}
                          type="button"
                          onClick={() => setCustomSplit(spl.id as any)}
                          className={cn(
                            "p-3 rounded-2xl border text-left transition-all text-xs flex flex-col justify-between h-16 bg-white dark:bg-slate-900/60",
                            customSplit === spl.id
                              ? "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/20 ring-1 ring-cyan-500"
                              : "border-slate-200 dark:border-slate-800 hover:border-cyan-200"
                          )}
                        >
                          <span className="font-bold text-slate-900 dark:text-white">{spl.label}</span>
                          <span className="text-[10px] text-slate-550 dark:text-slate-455">{spl.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Split Repeats Choice */}
                  {(() => {
                    const needed = getRepeatsNeeded(customDays, customSplit);
                    if (needed.count === 0) return null;
                    return (
                      <div className="mt-4 p-4 bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-150 dark:border-cyan-800/40 rounded-2xl animate-in fade-in duration-300">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">
                          Elige qué sesión(es) quieres repetir ({needed.count} {needed.count === 1 ? "día" : "días"}):
                        </label>
                        <div className="flex gap-2">
                          {needed.options.map((option) => {
                            const isSelected = customRepeats.includes(option);
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => handleToggleRepeat(option, needed.count)}
                                className={cn(
                                  "px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all flex-1 cursor-pointer",
                                  isSelected
                                    ? "bg-cyan-500 border-cyan-500 text-white shadow-md shadow-cyan-500/15"
                                    : "bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50 dark:text-slate-300"
                                )}
                              >
                                {option === "empuje" ? "Empuje" : option === "tiron" ? "Tirón" : option === "pierna" ? "Pierna" : option === "torso" ? "Torso" : option}
                              </button>
                            );
                          })}
                        </div>
                        {needed.count === 2 && (
                          <p className="mt-2 text-[10px] text-slate-550 dark:text-slate-400 font-semibold">
                            Has seleccionado {customRepeats.length} de {needed.count} a repetir.
                          </p>
                        )}
                      </div>
                    );
                  })()}

                </div>
              )}

              {/* STEP 3: Custom details (Priorities & Injuries) */}
              {setupStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {/* Priorities */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Puntos a priorizar (Puntos débiles)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Cuádriceps", "Femoral", "Glúteo", "Abdomen"].map((g) => {
                        const isSelected = customPriorities.includes(g);
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => handleTogglePriority(g)}
                            className={cn(
                              "px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all",
                              isSelected 
                                ? "bg-cyan-500 text-white border-cyan-500 shadow-sm" 
                                : "bg-white text-slate-655 border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50"
                            )}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Injuries */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Molestias o Limitaciones Articulares
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "hombro", label: "Hombro" },
                        { id: "lumbar", label: "Zona Lumbar" },
                        { id: "rodilla", label: "Rodilla" },
                        { id: "codo_muneca", label: "Codo / Muñeca" },
                        { id: "cadera", label: "Cadera" },
                        { id: "ninguna", label: "Ninguna" },
                      ].map((l) => {
                        const isSelected = customLesiones.includes(l.id);
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => handleToggleLesion(l.id)}
                            className={cn(
                              "px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all",
                              isSelected 
                                ? "bg-red-500 text-white border-red-500 shadow-sm" 
                                : "bg-white text-slate-655 border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50"
                            )}
                          >
                            {l.label}
                          </button>
                        );
                      })}
                    </div>
                    {customLesiones.length > 0 && !customLesiones.includes("ninguna") && (
                      <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed font-semibold">
                        ⚠️ El motor excluirá ejercicios lesivos de esas zonas (ej: evitar sentadillas si te duele la rodilla, o press militar si te duele el hombro) y asignará alternativas articulares amigables.
                      </p>
                    )}
                  </div>

                </div>
              )}

              {/* STEP 4: Summary & Detailed explanation */}
              {setupStep === 4 && generatedPlan && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col flex-1 min-h-0">
                  <div className="flex flex-col items-center justify-center text-center p-4 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-2xl gap-2">
                    <div className="bg-emerald-500 text-white p-2 rounded-full">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">¡Plan de entrenamiento generado con éxito!</h4>
                      <p className="text-[11px] text-slate-550 dark:text-slate-400 mt-0.5 font-semibold">Se han creado {generatedPlan.length} rutinas de entrenamiento adaptadas a tu perfil.</p>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
                    <button
                      onClick={handlePrintPDF}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white px-4 py-3 text-xs font-bold hover:opacity-95 shadow-sm transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Imprimir / Guardar en PDF
                    </button>
                    <button
                      onClick={handleCopyClipboard}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-4 py-3 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-500" />
                          ¡Copiado!
                        </>
                      ) : (
                        <>
                          <Clipboard className="w-4 h-4" />
                          Copiar Resumen de Rutina
                        </>
                      )}
                    </button>
                  </div>

                  {/* Plan Summary List */}
                  <div className="space-y-3 overflow-y-auto pr-1 flex-1 max-h-[350px] scrollbar-thin">
                    <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Resumen de las Rutinas (puedes personalizar los ejercicios):</h5>
                    {generatedPlan.map((routine, rIdx) => (
                      <div key={rIdx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                        {/* Routine Name Inline Rename */}
                        <div className="border-b border-slate-100 dark:border-slate-800/80 pb-2 mb-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block animate-pulse shrink-0" />
                            <input
                              type="text"
                              value={routine.name}
                              onChange={(e) => {
                                const nextPlan = [...generatedPlan];
                                nextPlan[rIdx].name = e.target.value;
                                setGeneratedPlan(nextPlan);
                              }}
                              className="font-extrabold text-slate-900 dark:text-white text-sm bg-transparent border-b border-transparent hover:border-slate-200 focus:border-cyan-500 focus:outline-none py-0.5 px-1 rounded flex-1"
                            />
                          </div>
                        </div>
                        <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800/60">
                          {routine.exercises.map((ex: any, eIdx: number) => {
                            // Find candidates of the same muscle group
                            const candidates = exercisesCatalog.filter(
                              (c) => c.muscleGroup.toLowerCase() === ex.muscleGroup.toLowerCase()
                            );

                            return (
                              <div key={eIdx} className={cn("text-xs flex flex-col gap-1.5", eIdx > 0 && "pt-3")}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  {/* Exercise Swap Select */}
                                  <div className="flex-1 min-w-[200px]">
                                    <select
                                      value={ex.exerciseId}
                                      onChange={(e) => handleSwapExercise(rIdx, eIdx, e.target.value)}
                                      className="font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full"
                                    >
                                      <option value={ex.exerciseId}>{ex.name}</option>
                                      {candidates
                                        .filter((c) => c.id !== ex.exerciseId)
                                        .map((c) => (
                                          <option key={c.id} value={c.id}>
                                            {c.name}
                                          </option>
                                        ))}
                                    </select>
                                  </div>

                                  {/* Controls: Sets, Reps, Delete */}
                                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                                    {/* Sets Control */}
                                    <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-lg p-0.5">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateSets(rIdx, eIdx, -1)}
                                        className="w-5 h-5 flex items-center justify-center rounded bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 text-[10px] font-bold hover:bg-slate-50 text-slate-600 dark:text-slate-400"
                                      >
                                        -
                                      </button>
                                      <span className="text-[10px] font-bold px-1 text-slate-700 dark:text-slate-300">
                                        {ex.sets} Ser
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateSets(rIdx, eIdx, 1)}
                                        className="w-5 h-5 flex items-center justify-center rounded bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 text-[10px] font-bold hover:bg-slate-50 text-slate-600 dark:text-slate-400"
                                      >
                                        +
                                      </button>
                                    </div>

                                    {/* Reps Control */}
                                    <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-lg p-0.5">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateReps(rIdx, eIdx, -1)}
                                        className="w-5 h-5 flex items-center justify-center rounded bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 text-[10px] font-bold hover:bg-slate-50 text-slate-600 dark:text-slate-400"
                                      >
                                        -
                                      </button>
                                      <span className="text-[10px] font-bold px-1 text-slate-700 dark:text-slate-300">
                                        {ex.reps} Rep
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateReps(rIdx, eIdx, 1)}
                                        className="w-5 h-5 flex items-center justify-center rounded bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 text-[10px] font-bold hover:bg-slate-50 text-slate-600 dark:text-slate-400"
                                      >
                                        +
                                      </button>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteExercise(rIdx, eIdx)}
                                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-colors"
                                      title="Eliminar ejercicio"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-relaxed italic">
                                  {ex.justificacion}
                                </p>
                                <div className="flex gap-3 text-[9px] text-slate-450 dark:text-slate-500 font-semibold mt-0.5">
                                  <span>Tempo: {ex.tempo}</span>
                                  <span>·</span>
                                  <span>Descanso: {ex.descanso}</span>
                                  <span>·</span>
                                  <span>Intensidad: RIR {ex.rir}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer Navigation */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-3 mt-auto shrink-0">
              {setupStep === 1 ? (
                <button 
                  onClick={onClose} 
                  className="px-5 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl text-xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              ) : (setupStep === 2 || setupStep === 3) ? (
                <button
                  onClick={() => setSetupStep((s) => s - 1)}
                  className="px-5 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl text-xs hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
              ) : (
                <div />
              )}

              {(setupStep === 1 || setupStep === 2) ? (
                <button
                  onClick={() => setSetupStep((s) => s + 1)}
                  disabled={setupStep === 2 && getRepeatsNeeded(customDays, customSplit).count !== customRepeats.length}
                  className={cn(
                    "px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl text-xs hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer",
                    setupStep === 2 && getRepeatsNeeded(customDays, customSplit).count !== customRepeats.length && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : setupStep === 3 ? (
                <button
                  onClick={handleGenerate}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold rounded-2xl text-xs shadow-md shadow-cyan-500/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-200 fill-cyan-200" />
                  Generar Rutinas
                </button>
              ) : (
                <button
                  onClick={handleSavePlan}
                  disabled={isSaving}
                  className="px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold rounded-2xl text-xs shadow-md hover:opacity-95 cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirmar y Guardar Rutinas
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
