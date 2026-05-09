import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Proteger rutas /admin-gym/* (solo GYM) ──
  if (pathname.startsWith("/admin-gym")) {
    const token = await getToken({ req: request });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (token.role !== "GYM") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  // ── Redirigir GYM fuera de rutas de usuario ──
  // Si un GYM accede a "/" o rutas B2C, lo enviamos a /admin-gym
  const userOnlyPaths = ["/", "/gimnasio", "/entrenamientos", "/nutricion", "/perfil", "/configuracion"];
  const isUserRoute = userOnlyPaths.some(p =>
    p === "/" ? pathname === "/" : pathname.startsWith(p)
  );

  if (isUserRoute) {
    const token = await getToken({ req: request });

    if (token && token.role === "GYM") {
      return NextResponse.redirect(new URL("/admin-gym", request.url));
    }

    // Rutas protegidas de usuario: requieren sesión
    const protectedUserPaths = ["/entrenamientos", "/nutricion", "/perfil", "/configuracion"];
    if (protectedUserPaths.some(p => pathname.startsWith(p))) {
      if (!token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/gimnasio/:path*",
    "/admin-gym/:path*",
    "/entrenamientos/:path*",
    "/nutricion/:path*",
    "/perfil/:path*",
    "/configuracion/:path*",
  ],
};
