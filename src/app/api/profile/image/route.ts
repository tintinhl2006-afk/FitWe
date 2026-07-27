import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cloudinary, isConfigured } from "@/lib/cloudinary";
import { getRequestUserId } from "@/lib/apiAuth";

export async function POST(req: Request) {
  try {
    const userId = await getRequestUserId(req);

    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { image } = body; // Base64 string

    if (!image) {
      return NextResponse.json({ message: "No se proporcionó imagen" }, { status: 400 });
    }

    // Validar el tamaño del base64 (límite aprox 2MB = ~2.8MB en base64)
    if (image.length > 2.8 * 1024 * 1024) {
      return NextResponse.json({ message: "La imagen es demasiado grande (máximo 2MB)" }, { status: 413 });
    }

    let finalImageUrl = image;

    if (isConfigured) {
      try {
        console.log("Cloudinary está configurado. Subiendo imagen de perfil...");
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: "fitwe_profiles",
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face", quality: "auto" }
          ]
        });
        finalImageUrl = uploadResponse.secure_url;
        console.log("Imagen de perfil subida correctamente a Cloudinary:", finalImageUrl);
      } catch (uploadError) {
        console.error("Error al subir a Cloudinary, aplicando fallback local en base de datos:", uploadError);
        // Fallback: si falla Cloudinary por red/credenciales, guardar base64 para evitar fallo crítico.
      }
    } else {
      console.warn("Cloudinary no configurado en variables de entorno. Guardando como Base64 en base de datos.");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image: finalImageUrl },
      select: { image: true },
    });

    return NextResponse.json({ message: "Imagen actualizada correctamente", image: updatedUser.image });
  } catch (error) {
    console.error("Error updating profile image:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
