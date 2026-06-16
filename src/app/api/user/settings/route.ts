import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        role: true,
        monthlyFee: true,
        stripeAccountId: true,
        stripeConnected: true,
        stripeEnabled: true,
        redsysFuc: true,
        redsysTerminal: true,
        redsysClave: true,
        redsysEnabled: true,
        documentType: true,
        documentNumber: true,
        documentLetter: true,
        phone: true,
        address: true,
        country: true,
        province: true,
        locality: true,
        postalCode: true,
        gymCode: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Self-healing: if role is GYM but has no gymCode, generate one automatically
    if (user.role === "GYM" && !user.gymCode) {
      let generatedCode = "";
      let isUnique = false;
      while (!isUnique) {
        generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const existing = await prisma.user.findFirst({
          where: { gymCode: generatedCode },
        });
        if (!existing) {
          isUnique = true;
        }
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { gymCode: generatedCode },
      });

      user.gymCode = generatedCode;
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { message: "Error en el servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      name,
      newPassword,
      monthlyFee,
      stripeEnabled,
      stripeDisconnect,
      redsysFuc,
      redsysTerminal,
      redsysClave,
      redsysEnabled,
      documentType,
      documentNumber,
      documentLetter,
      phone,
      address,
      country,
      province,
      locality,
      postalCode,
    } = body;

    // Build the update payload dynamically
    const updateData: any = {};

    if (name && typeof name === "string" && name.trim().length > 0) {
      updateData.name = name.trim();
    }

    if (newPassword && typeof newPassword === "string") {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { message: "La nueva contraseña debe tener al menos 6 caracteres" },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (session.user.role === "GYM") {
      if (monthlyFee !== undefined) {
        const parsedFee = parseFloat(monthlyFee);
        if (!isNaN(parsedFee) && parsedFee >= 0) {
          updateData.monthlyFee = parsedFee;
        }
      }

      if (stripeEnabled !== undefined) {
        updateData.stripeEnabled = !!stripeEnabled;
      }

      // Soporte para desconectar Stripe Connect
      if (stripeDisconnect === true) {
        updateData.stripeConnected = false;
        updateData.stripeAccountId = null;
      }

      // Soporte para TPV Virtual Redsys
      if (redsysFuc !== undefined) {
        updateData.redsysFuc = redsysFuc.trim() || null;
      }
      if (redsysTerminal !== undefined) {
        updateData.redsysTerminal = redsysTerminal.trim() || "001";
      }
      if (redsysClave !== undefined) {
        updateData.redsysClave = redsysClave.trim() || null;
      }
      if (redsysEnabled !== undefined) {
        updateData.redsysEnabled = !!redsysEnabled;
      }

      // Soporte para datos fiscales del gimnasio
      if (documentType !== undefined) updateData.documentType = documentType || null;
      if (documentNumber !== undefined) updateData.documentNumber = documentNumber || null;
      if (documentLetter !== undefined) updateData.documentLetter = documentLetter || null;
      if (phone !== undefined) updateData.phone = phone || null;
      if (address !== undefined) updateData.address = address || null;
      if (country !== undefined) updateData.country = country || "España";
      if (province !== undefined) updateData.province = province || null;
      if (locality !== undefined) updateData.locality = locality || null;
      if (postalCode !== undefined) updateData.postalCode = postalCode || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No se proporcionaron datos para actualizar" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({ message: "Perfil actualizado correctamente" });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { message: "Error en el servidor" },
      { status: 500 }
    );
  }
}
