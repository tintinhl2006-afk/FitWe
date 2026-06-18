import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import * as fs from "fs";
import * as path from "path";

// Cargar variables de entorno manualmente de .env si existe para evitar dependencias
try {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    envConfig.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        // Quitar comillas si las hay
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
    console.log("Variables de entorno cargadas correctamente desde .env");
  }
} catch (err) {
  console.warn("No se pudo cargar el archivo .env automáticamente:", err);
}

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error("ERROR: Las credenciales de Cloudinary no están definidas en el entorno o en el archivo .env");
  console.error("Asegúrate de definir CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET");
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando migración de imágenes de perfil a Cloudinary...");
  
  // Buscar usuarios con imágenes no nulas
  const users = await prisma.user.findMany({
    where: {
      image: {
        not: null,
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
    },
  });

  console.log(`Encontrados ${users.length} usuarios con imagen configurada.`);
  
  // Filtrar los que tienen imagen en Base64
  const base64Users = users.filter(user => user.image && user.image.startsWith("data:image/"));
  
  console.log(`De ellos, ${base64Users.length} tienen imágenes en formato Base64.`);

  if (base64Users.length === 0) {
    console.log("No hay usuarios que requieran migración. ¡Todo al día!");
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < base64Users.length; i++) {
    const user = base64Users[i];
    console.log(`[${i + 1}/${base64Users.length}] Migrando imagen de ${user.name} (${user.email})...`);
    
    try {
      // Subir a Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(user.image!, {
        folder: "fitwe_profiles",
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face", quality: "auto" }
        ]
      });

      const newUrl = uploadResponse.secure_url;

      // Actualizar en la base de datos
      await prisma.user.update({
        where: { id: user.id },
        data: { image: newUrl },
      });

      console.log(` -> Éxito. Nueva URL: ${newUrl}`);
      successCount++;
    } catch (error) {
      console.error(` -> Error al migrar la imagen de ${user.email}:`, error);
      errorCount++;
    }
  }

  console.log("\n--- Resumen de la Migración ---");
  console.log(`Total procesados: ${base64Users.length}`);
  console.log(`Migrados con éxito: ${successCount}`);
  console.log(`Errores: ${errorCount}`);
}

main()
  .catch((e) => {
    console.error("Error fatal durante la migración:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
