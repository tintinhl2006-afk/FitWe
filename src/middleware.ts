import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Payment gateway redirect targets (Stripe Checkout / Redsys TPV / mock fallback pages) are
  // reached by the gateway's own server-issued redirect and by the mobile app's WebView —
  // neither carries the NextAuth session cookie. The actual payment operations are already
  // protected at the API layer (Bearer-token aware via getRequestUserId), so these pages don't
  // need the cookie-based gate here; gating them just breaks the return trip from the gateway.
  if (pathname.startsWith("/dashboard/pago")) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  // ── Forzar cambio de contraseña provisional ──
  if (token) {
    if (token.mustChangePassword && pathname !== "/establecer-contrasena") {
      return NextResponse.redirect(new URL("/establecer-contrasena", request.url));
    }
    if (!token.mustChangePassword && pathname === "/establecer-contrasena") {
      if (token.role === "GYM") {
        return NextResponse.redirect(new URL("/admin-gym", request.url));
      }
      if (token.role === "EMPLOYEE") {
        return NextResponse.redirect(new URL("/admin-gym/clases", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } else {
    if (pathname === "/establecer-contrasena") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // ── Proteger rutas /admin-gym/* (GYM y EMPLOYEE) ──
  if (pathname.startsWith("/admin-gym")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (token.role !== "GYM" && token.role !== "EMPLOYEE") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Restricciones adicionales para empleados
    if (token.role === "EMPLOYEE") {
      const isClasesRoute = pathname === "/admin-gym/clases" || pathname.startsWith("/admin-gym/clases/");
      if (!isClasesRoute) {
        return NextResponse.redirect(new URL("/admin-gym/clases", request.url));
      }
    }

    return NextResponse.next();
  }

  // ── Redirigir GYM/EMPLOYEE fuera de rutas de usuario ──
  const userOnlyPaths = ["/dashboard", "/gimnasio", "/entrenamientos", "/nutricion", "/perfil", "/configuracion", "/clases"];
  const isUserRoute = userOnlyPaths.some(p => pathname.startsWith(p));

  if (isUserRoute) {
    if (token) {
      if (token.role === "GYM") {
        return NextResponse.redirect(new URL("/admin-gym", request.url));
      }
      if (token.role === "EMPLOYEE") {
        return NextResponse.redirect(new URL("/admin-gym/clases", request.url));
      }
    }

    // Todas las rutas de usuario requieren sesión
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/gimnasio/:path*",
    "/admin-gym/:path*",
    "/entrenamientos/:path*",
    "/nutricion/:path*",
    "/perfil/:path*",
    "/configuracion/:path*",
    "/clases/:path*",
    "/establecer-contrasena/:path*",
  ],
};
