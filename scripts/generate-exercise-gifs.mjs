// Builds a simulated GIF per exercise from 3 frames: the original image (start) plus two frames
// generated from it with an image-editing model (middle and end of the movement).
// The GIF is assembled locally with crossfades: 1 -> 2 -> 3 -> 2 -> 1 (loops seamlessly).
//
//   npm run gifs -- --dry-run            list what would be generated, no API calls, no cost
//   npm run gifs -- --only press_banca   a single image (basename without extension)
//   npm run gifs -- --limit 3            the first 3 pending exercises (check quality before the rest)
//   npm run gifs -- --force              regenerate frames that already exist
//   npm run gifs -- --gif-only           rebuild the GIFs from existing frames, no API calls
//
// Frames:  frames/<image basename>/{1,2,3}.jpg  (review them, delete one and re-run to redo it)
// GIFs:    public/gifs/<image basename>.gif
// Needs REPLICATE_API_TOKEN in .env.local. REPLICATE_MODEL (default black-forest-labs/flux-kontext-pro)
// must take `prompt` and `input_image` (override the latter with REPLICATE_IMAGE_KEY) and return an image URL.
// Exercises that share one image share one set of frames and one GIF.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ffmpeg = require("ffmpeg-static");
const sharp = require("sharp");

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const FRAMES_DIR = path.join(ROOT, "frames");
const GIFS_DIR = path.join(PUBLIC_DIR, "gifs");
const MODEL = process.env.REPLICATE_MODEL || "black-forest-labs/flux-kontext-pro";
const IMAGE_KEY = process.env.REPLICATE_IMAGE_KEY || "input_image";
const TOKEN = process.env.REPLICATE_API_TOKEN;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-image";
// Gemini is used whenever GEMINI_API_KEY is set; remove it (or set PROVIDER=replicate) to use Replicate.
const USE_GEMINI = process.env.PROVIDER ? process.env.PROVIDER === "gemini" : Boolean(GEMINI_KEY);
const PROVIDER_NAME = USE_GEMINI ? `Gemini (${GEMINI_MODEL})` : `Replicate (${MODEL})`;
const SIZE = Number(process.env.FRAME_SIZE || 1024);
const GIF_WIDTH = Number(process.env.GIF_WIDTH || 400);
// Gemini's free tier has tight per-minute limits, so it runs one request at a time.
const CONCURRENCY = USE_GEMINI ? 1 : 2;

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const dryRun = flag("dry-run");
const force = flag("force");
const gifOnly = flag("gif-only");
const only = opt("only");
const limit = opt("limit") ? Number(opt("limit")) : Infinity;

const frameFile = (base, n) => path.join(FRAMES_DIR, base, `${n}.jpg`);
const gifFile = (base) => path.join(GIFS_DIR, `${base}.gif`);

const KEEP =
  "Keep exactly the same figure, body proportions, equipment, camera angle, background, lighting, rendering style and highlighted red muscles. Change only the body and equipment position. No text, no extra objects.";

function buildPrompt(ex, phase) {
  const execution = /Ejecución: (.*)/.exec(ex.description || "")?.[1] ?? "";
  const where =
    phase === 2
      ? "about halfway through the movement (midpoint of the range of motion)"
      : "at the end of the movement (the opposite extreme of the range of motion, peak contraction)";
  return `This image shows the exercise "${ex.name}" in its starting position. Edit it to show the same exercise ${where}, performed with correct technique. ${KEEP} Movement description (Spanish): ${execution}`;
}

function collectJobs() {
  const exercises = JSON.parse(fs.readFileSync(path.join(ROOT, "ejercicios.json"), "utf8"));
  const byImage = new Map();
  for (const ex of exercises) {
    if (!ex.imageUrl || !ex.imageUrl.startsWith("/")) continue;
    const base = path.basename(ex.imageUrl, path.extname(ex.imageUrl));
    if (!byImage.has(base)) byImage.set(base, { base, imagePath: path.join(PUBLIC_DIR, ex.imageUrl), ex, names: [ex.name] });
    else byImage.get(base).names.push(ex.name);
  }
  return [...byImage.values()].filter((j) => fs.existsSync(j.imagePath)).filter((j) => !only || j.base === only);
}

const api = async (url, init = {}) => {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...init.headers } });
  if (!res.ok) throw new Error(`Replicate ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class QuotaError extends Error {}

async function replicateFrame(source, prompt) {
  const dataUri = `data:image/jpeg;base64,${source.toString("base64")}`;
  let pred = await api(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
    method: "POST",
    body: JSON.stringify({ input: { prompt, [IMAGE_KEY]: dataUri, output_format: "jpg" } }),
  });
  while (pred.status === "starting" || pred.status === "processing") {
    await sleep(3000);
    pred = await api(pred.urls.get);
  }
  if (pred.status !== "succeeded") throw new Error(`prediction ${pred.status}: ${pred.error ?? ""}`);
  const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
  const img = await fetch(url);
  if (!img.ok) throw new Error(`download ${img.status}`);
  return Buffer.from(await img.arrayBuffer());
}

// Gemini API (Google AI Studio key). Retries per-minute limits; a daily quota stops the whole run
// cleanly so it can be resumed tomorrow (frames already written are kept).
async function geminiFrame(source, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: source.toString("base64") } }] }],
    generationConfig: { responseModalities: ["IMAGE"] },
  });
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body });
    if (res.status === 429 || res.status === 503) {
      const text = await res.text();
      if (/limit: 0/.test(text)) {
        throw new QuotaError(
          "Tu cuenta de Gemini tiene cuota 0 para este modelo de imagen (la capa gratuita no incluye generación de imágenes). Activa la facturación del proyecto en https://aistudio.google.com/apikey o usa PROVIDER=replicate."
        );
      }
      if (/PerDay|per day|daily/i.test(text)) throw new QuotaError("Cuota diaria de Gemini agotada. Vuelve a lanzar el comando mañana.");
      await sleep(15000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    const part = data.candidates?.[0]?.content?.parts?.find((p) => (p.inlineData ?? p.inline_data)?.data);
    if (!part) {
      const why = data.promptFeedback?.blockReason ?? data.candidates?.[0]?.finishReason ?? "sin imagen en la respuesta";
      throw new Error(`Gemini no devolvió imagen (${why})`);
    }
    return Buffer.from((part.inlineData ?? part.inline_data).data, "base64");
  }
  throw new Error("Gemini: demasiados reintentos por límite de peticiones");
}

async function generateFrame(job, phase) {
  const source = await sharp(job.imagePath).resize(SIZE, SIZE, { fit: "inside" }).jpeg({ quality: 90 }).toBuffer();
  const prompt = buildPrompt(job.ex, phase);
  const out = USE_GEMINI ? await geminiFrame(source, prompt) : await replicateFrame(source, prompt);
  await sharp(out).resize(SIZE, SIZE, { fit: "inside" }).jpeg({ quality: 88 }).toFile(frameFile(job.base, phase));
}

async function ensureFrames(job) {
  fs.mkdirSync(path.join(FRAMES_DIR, job.base), { recursive: true });
  if (force || !fs.existsSync(frameFile(job.base, 1))) {
    await sharp(job.imagePath).resize(SIZE, SIZE, { fit: "inside" }).jpeg({ quality: 88 }).toFile(frameFile(job.base, 1));
  }
  for (const phase of [2, 3]) {
    if (force || !fs.existsSync(frameFile(job.base, phase))) await generateFrame(job, phase);
  }
}

// 1 -> 2 -> 3 -> 2 -> 1 with crossfades, then a palette pass to keep the GIF small.
// Frames present for an exercise (1.jpg is the original, 2.jpg... the generated ones), in order.
function framesOf(base) {
  const dir = path.join(FRAMES_DIR, base);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).map((f) => /^([0-9]+).jpg$/.exec(f)?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b);
}

function buildGif(base) {
  const frames = framesOf(base);
  // Ping-pong so the loop is seamless: 1,2,...,N,...,2,1
  const order = [...frames, ...frames.slice(1, -1).reverse(), frames[0]];
  const D = frames.length > 3 ? 0.7 : 1.0; // seconds each frame is on screen, including the crossfade
  const F = D / 2; // crossfade length
  const inputs = order.flatMap((n) => ["-loop", "1", "-t", String(D), "-i", frameFile(base, n)]);
  const prep = order.map((_, i) => `[${i}:v]scale=${GIF_WIDTH}:-2:flags=lanczos,setsar=1,fps=10[s${i}]`);
  let chain = "s0";
  const fades = order.slice(1).map((_, k) => {
    const out = `x${k + 1}`;
    const f = `[${chain}][s${k + 1}]xfade=transition=fade:duration=${F}:offset=${((k + 1) * (D - F)).toFixed(2)}[${out}]`;
    chain = out;
    return f;
  });
  const filter = [...prep, ...fades, `[${chain}]split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4[out]`].join(";");
  fs.mkdirSync(GIFS_DIR, { recursive: true });
  const r = spawnSync(ffmpeg, ["-y", "-loglevel", "error", ...inputs, "-filter_complex", filter, "-map", "[out]", "-loop", "0", gifFile(base)], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffmpeg: ${r.stderr}`);
  return (fs.statSync(gifFile(base)).size / 1024 / 1024).toFixed(2);
}

// Manual workflow (Google Flow / Gemini app, no API): --prompts writes a checklist with the exact
// prompt and source image for each missing frame; --import picks up the downloaded images from
// frames-import/ named <image basename>_<n>.<ext> and builds the GIFs (_1, if present, replaces the original as first frame).
const IMPORT_DIR = path.join(ROOT, "frames-import");
const PROMPTS_FILE = path.join(ROOT, "frames-pendientes.md");

function writePrompts(jobs) {
  const pending = jobs.filter((j) => force || ![2, 3].every((n) => fs.existsSync(frameFile(j.base, n))));
  const lines = [
    "# Fotogramas pendientes",
    "",
    "Para cada ejercicio: sube la imagen original a Flow (o a la app de Gemini con Nano Banana), pega el prompt y descarga el resultado.",
    `Guarda cada imagen en \`frames-import/\` como \`<nombre>_2.jpg\` (mitad) y \`<nombre>_3.jpg\` (final) y ejecuta \`npm run gifs -- --import\`.`,
    "",
  ];
  for (const j of pending) {
    lines.push(`## ${j.base}  — ${j.names.join(", ")}`, "", `Imagen original: \`public/${path.basename(j.imagePath)}\``, "");
    for (const n of [2, 3]) {
      if (!force && fs.existsSync(frameFile(j.base, n))) continue;
      lines.push(`- [ ] \`${j.base}_${n}.jpg\` (${n === 2 ? "mitad" : "final"})`, "", "  ```", `  ${buildPrompt(j.ex, n)}`, "  ```", "");
    }
  }
  fs.writeFileSync(PROMPTS_FILE, lines.join("\n"));
  console.log(`${pending.length} ejercicio(s) en ${path.relative(ROOT, PROMPTS_FILE)}`);
}

async function importFrames(jobs) {
  if (!fs.existsSync(IMPORT_DIR)) {
    console.error(`No existe la carpeta ${path.relative(ROOT, IMPORT_DIR)}.`);
    process.exit(1);
  }
  const files = fs.readdirSync(IMPORT_DIR);
  let built = 0;
  for (const job of jobs) {
    // <base>_<n>.<ext>, n >= 2, any number of frames
    const mine = files
      .map((f) => {
        const ext = path.extname(f);
        const stem = path.basename(f, ext);
        const n = stem.startsWith(job.base + "_") ? stem.slice(job.base.length + 1) : "";
        return { f, n: /^[0-9]+$/.test(n) ? Number(n) : 0 };
      })
      .filter((x) => x.n >= 1)
      .sort((x, y) => x.n - y.n);
    if (mine.length === 0) continue;
    // Start from a clean folder so frames from a previous import never get mixed in.
    fs.rmSync(path.join(FRAMES_DIR, job.base), { recursive: true, force: true });
    fs.mkdirSync(path.join(FRAMES_DIR, job.base), { recursive: true });
    // A supplied <base>_1 is a whole new sequence (different angle/background): the original photo
    // is only the first frame when no _1 was supplied.
    if (mine[0].n !== 1) {
      await sharp(job.imagePath).resize(SIZE, SIZE, { fit: "inside" }).jpeg({ quality: 88 }).toFile(frameFile(job.base, 1));
    }
    for (const { f, n } of mine) {
      await sharp(path.join(IMPORT_DIR, f)).resize(SIZE, SIZE, { fit: "contain", background: "#ffffff" }).jpeg({ quality: 88 }).toFile(frameFile(job.base, n));
    }
    try {
      console.log(`✓ ${job.base}.gif (${framesOf(job.base).length} fotogramas, ${buildGif(job.base)} MB)`);
      built++;
    } catch (e) {
      console.error(`✗ ${job.base}: ${e.message}`);
    }
  }
  console.log(`${built} GIF(s) montados`);
}

async function main() {
  let jobs = collectJobs();
  if (flag("prompts")) return writePrompts(jobs);
  if (flag("import")) return importFrames(jobs);
  if (gifOnly) {
    jobs = jobs.filter((j) => framesOf(j.base).length >= 3);
    for (const j of jobs) console.log(`✓ ${j.base}.gif (${buildGif(j.base)} MB)`);
    console.log(`${jobs.length} GIF(s) montados desde los fotogramas existentes`);
    return;
  }
  jobs = jobs.filter((j) => force || ![2, 3].every((n) => fs.existsSync(frameFile(j.base, n)))).slice(0, limit);
  console.log(`${jobs.length} ejercicio(s) por generar con ${PROVIDER_NAME} (2 fotogramas nuevos cada uno)`);
  if (dryRun) {
    for (const j of jobs) console.log(`- ${j.base}  (${j.names.join(", ")})`);
    if (jobs[0]) console.log(`\nPrompt de ejemplo (fotograma intermedio):\n${buildPrompt(jobs[0].ex, 2)}`);
    return;
  }
  if (USE_GEMINI ? !GEMINI_KEY : !TOKEN) {
    console.error(USE_GEMINI ? "Falta GEMINI_API_KEY (añádela a .env.local)." : "Falta REPLICATE_API_TOKEN (añádelo a .env.local).");
    process.exit(1);
  }
  const queue = [...jobs];
  const failed = [];
  let quotaHit = false;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length && !quotaHit) {
        const job = queue.shift();
        try {
          await ensureFrames(job);
          console.log(`✓ ${job.base}.gif (${buildGif(job.base)} MB)`);
        } catch (e) {
          if (e instanceof QuotaError) {
            quotaHit = true;
            console.error(`\n${e.message}`);
          } else {
            failed.push(job.base);
            console.error(`✗ ${job.base}: ${e.message}`);
          }
        }
      }
    })
  );
  if (failed.length) console.log(`\nFallaron ${failed.length}: ${failed.join(", ")}. Vuelve a lanzar el comando para reintentarlos.`);
}

main();
